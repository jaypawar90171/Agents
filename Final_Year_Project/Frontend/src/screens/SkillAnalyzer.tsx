import React, { useState, useRef, useCallback } from 'react';
import Header from '../components/Header';
import { useUser } from '@clerk/clerk-react';
import { useSkillAnalyzer } from '../hooks/useSkillAnalyzer';
import {
  Loader2, Save, FileText, BarChart3, Target, BookOpen,
  CheckCircle, Upload, X, Shield, Lock, Eye,
  TrendingUp, Brain, Sparkles,
} from 'lucide-react';
import { PipelineProgress } from '../components/skillAnalyzer/PipelineProgress';
import { SkillsBreakdown } from '../components/skillAnalyzer/SkillsBreakdown';
import { GapAnalysisCard } from '../components/skillAnalyzer/GapAnalysisCard';
import { SkillRoadmapAccordion } from '../components/skillAnalyzer/SkillRoadmapAccordion';

/* ─── Alexandria Design Tokens ─── */
const t = {
  primary: 'hsl(var(--primary))',
  container: 'hsl(var(--primary-container))',
  surface: 'hsl(var(--background))',
  surfHigh: 'hsl(var(--surface-container-high))',
  surfLow: 'hsl(var(--surface-container-low))',
  onSurface: 'hsl(var(--on-surface))',
  variant: 'hsl(var(--on-surface-variant))',
  outline: 'hsl(var(--outline))',
  tertiary: 'hsl(var(--tertiary))',
  tertCont: 'hsl(var(--secondary-container))',
  error: 'hsl(var(--error))',
  errCont: 'hsl(var(--error-container))',
  white: 'hsl(var(--card))',
};

/* ─── Shared card style ─── */
const card: React.CSSProperties = {
  borderRadius: '1rem',
  background: t.white,
  border: '1px solid hsl(var(--border) / 0.38)',
  boxShadow: '0 4px 24px hsl(var(--foreground) / 0.06)',
};

/* ─── Section heading ─── */
const sh = (color = t.onSurface): React.CSSProperties => ({
  fontWeight: 800,
  fontSize: '1.125rem',
  color,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '1.25rem',
});

const ibadge = (bg: string): React.CSSProperties => ({
  width: '2.25rem', height: '2.25rem',
  borderRadius: '0.5625rem',
  background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
});

/* ══════════════════════════════════════════════════════════
   Inline upload zone (replaces the old SkillUploadZone
   import so we can style it exactly like the Stitch screen)
══════════════════════════════════════════════════════════ */
interface InlineUploadProps {
  onFileSelect: (f: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  disabled?: boolean;
}

const InlineUploadCard: React.FC<InlineUploadProps> = ({
  onFileSelect, selectedFile, onRemove, disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (f: File) => {
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type)) {
      setErr('Only PDF, DOCX or TXT files are accepted'); return false;
    }
    if (f.size > 10 * 1024 * 1024) { setErr('File size must be under 10 MB'); return false; }
    setErr(null); return true;
  };

  const pick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validate(f)) onFileSelect(f);
  }, [onFileSelect]);

  const drop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f && validate(f)) onFileSelect(f);
  }, [disabled, onFileSelect]);

  /* ── File selected state ── */
  if (selectedFile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '100%',
            borderRadius: '0.75rem',
            background: 'hsl(var(--primary) / 0.05)',
            border: '1px solid hsl(var(--primary) / 0.2)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
          }}
        >
          <div style={{ ...ibadge('hsl(var(--primary) / 0.1)') }}>
            <FileText size={18} color={t.primary} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: t.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: '0.7rem', color: t.outline, marginTop: '0.1rem' }}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <CheckCircle size={18} color={t.primary} />
          {!disabled && (
            <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0.25rem', borderRadius: '50%' }}>
              <X size={16} color={t.outline} />
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={drop}
        style={{
          width: '100%',
          borderRadius: '0.875rem',
          border: isDragging ? `2px dashed ${t.primary}` : '2px dashed rgba(115,119,132,0.3)',
          background: isDragging ? 'hsl(var(--primary) / 0.04)' : t.surfLow,
          padding: '2rem 1.5rem',
          textAlign: 'center',
          transition: 'all 0.22s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
        }}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={pick}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        {/* Cloud-upload icon with small + badge */}
        <div style={{ position: 'relative', width: '3.5rem', height: '3.5rem', margin: '0 auto 1rem' }}>
          <div
            style={{
              width: '3.5rem', height: '3.5rem',
              borderRadius: '50%',
              background: isDragging ? t.primary : 'hsl(var(--primary) / 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.22s',
            }}
          >
            <Upload size={22} color={isDragging ? t.white : t.primary} />
          </div>
          <div
            style={{
              position: 'absolute', bottom: 0, right: -4,
              width: '1.125rem', height: '1.125rem',
              borderRadius: '50%',
              background: t.tertCont,
              border: `2px solid ${t.white}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 800, color: t.white,
            }}
          >
            +
          </div>
        </div>

        <p style={{ fontWeight: 700, fontSize: '1rem', color: t.onSurface, marginBottom: '0.375rem' }}>
          Drag and drop your resume
        </p>
        <p style={{ fontSize: '0.8125rem', color: t.variant }}>
          Support for PDF
        </p>

        {err && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', fontWeight: 500, color: t.error }}>
            {err}
          </p>
        )}
      </div>

      {/* CHOOSE FILE button */}
      <button
        id="choose-file-btn"
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.875rem',
          borderRadius: '0.625rem',
          background: `linear-gradient(135deg, ${t.primary}, ${t.container})`,
          border: 'none',
          color: t.white,
          fontWeight: 700,
          fontSize: '0.875rem',
          letterSpacing: '0.06em',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 14px hsl(var(--primary) / 0.28)',
          opacity: disabled ? 0.6 : 1,
          transition: 'transform 0.18s, box-shadow 0.18s',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px hsl(var(--primary) / 0.36)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'none';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px hsl(var(--primary) / 0.28)';
        }}
      >
        <FileText size={16} />
        CHOOSE FILE
      </button>

      {/* Trust badges */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '0.875rem',
          borderTop: '1px solid hsl(var(--border) / 0.4)',
        }}
      >
        {[
          { icon: <Shield size={13} color={t.outline} />, label: 'VERIFIED SECURE' },
          { icon: <Lock size={13} color={t.outline} />, label: '256-BIT ENCRYPTION' },
          { icon: <Eye size={13} color={t.outline} />, label: 'PRIVACY FIRST' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {icon}
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: t.outline,
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Main Screen
══════════════════════════════════════════════════════════ */
const SkillAnalyzer: React.FC = () => {
  const { user } = useUser();
  const {
    skillAnalysis, loading, error, pipelineStep,
    analyzeResume, saveToProfile, clearAnalysis,
  } = useSkillAnalyzer();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleFileSelect = (f: File) => { setSelectedFile(f); setFileName(f.name); };
  const handleRemove = () => setSelectedFile(null);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await analyzeResume(selectedFile);
  };

  const handleSaveToProfile = async () => {
    if (!skillAnalysis || !user?.id) return;
    setSaveStatus('saving');
    try { await saveToProfile(skillAnalysis, user.id, fileName); setSaveStatus('success'); }
    catch { setSaveStatus('error'); }
  };

  const handleNewAnalysis = () => {
    setSelectedFile(null); setFileName('');
    setSaveStatus('idle'); clearAnalysis();
  };

  /* ── helpers ── */
  const showUpload = !skillAnalysis;
  const showProgress = (loading || pipelineStep) && !skillAnalysis;

  return (
    <>
      <div style={{ minHeight: '100vh', background: t.surface, display: 'flex', flexDirection: 'column', }}>
        <Header />

        <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem 4rem', width: '100%', flex: 1 }}>

          {/* ════════════════════════════════════════
              UPLOAD HERO — two-column layout
          ════════════════════════════════════════ */}
          {showUpload && !loading && (
            <>
              {/* ── Two-column hero ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3rem',
                  alignItems: 'start',
                  padding: '3rem 0 2.5rem',
                }}
              >
                {/* ── LEFT: Hero copy ── */}
                <div>
                  {/* Badge */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                        color: t.tertiary,
                        background: 'hsl(var(--tertiary) / 0.18)',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        border: '1px solid hsl(var(--tertiary) / 0.35)',
                      }}
                    >
                      ✦ AI-POWERED ANALYSIS
                    </span>
                  </div>

                  {/* Headline */}
                  <h1
                    style={{
                      lineHeight: 1.1,
                      marginBottom: '1rem',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '2.625rem', color: t.onSurface, display: 'block' }}>
                      Skill Gap
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '2.625rem', color: t.primary, fontStyle: 'italic', display: 'block' }}>
                      Analyzer
                    </span>
                  </h1>

                  <p style={{ fontSize: '0.9375rem', color: t.variant, lineHeight: 1.7, maxWidth: '22rem', marginBottom: '2rem' }}>
                    Upload your resume to identify skill gaps and get a personalized learning
                    roadmap curated for your next career milestone.
                  </p>

                  {/* Feature bullets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                    {[
                      {
                        icon: <Brain size={16} color={t.primary} />,
                        bg: 'hsl(var(--primary) / 0.08)',
                        title: 'Deep Parsing',
                        desc: 'Our engine extracts nuanced competencies beyond simple keywords.',
                      },
                      {
                        icon: <TrendingUp size={16} color={t.tertiary} />,
                        bg: 'hsl(var(--tertiary) / 0.1)',
                        title: 'Roadmap Generation',
                        desc: 'Receive a step-by-step educational plan tailored to market demands.',
                      },
                    ].map((f) => (
                      <div key={f.title} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '2rem', height: '2rem',
                            borderRadius: '0.5rem',
                            background: f.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: '0.1rem',
                          }}
                        >
                          {f.icon}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: t.onSurface, marginBottom: '0.25rem' }}>
                            {f.title}
                          </p>
                          <p style={{ fontSize: '0.8125rem', color: t.variant, lineHeight: 1.6 }}>
                            {f.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── RIGHT: Upload card ── */}
                <div>
                  <div style={{ ...card, padding: '2rem 1.75rem', position: 'relative' }}>
                    <InlineUploadCard
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      onRemove={handleRemove}
                      disabled={loading}
                    />

                    {/* Analyze button — shown after file selected */}
                    {selectedFile && (
                      <button
                        id="analyze-resume-btn"
                        onClick={handleAnalyze}
                        disabled={loading}
                        style={{
                          width: '100%',
                          marginTop: '1rem',
                          padding: '0.9375rem',
                          borderRadius: '0.625rem',
                          background: `linear-gradient(135deg, ${t.primary}, ${t.container})`,
                          border: 'none',
                          color: t.white,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          letterSpacing: '0.05em',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 16px hsl(var(--primary) / 0.3)',
                          opacity: loading ? 0.7 : 1,
                        }}
                      >
                        {loading
                          ? <><Loader2 size={17} style={{ animation: 'sa-spin 0.85s linear infinite' }} /> Analyzing...</>
                          : <><Sparkles size={17} /> ANALYZE RESUME</>
                        }
                      </button>
                    )}
                  </div>

                  {/* Floating system-status pill */}
                  <div
                    style={{
                      marginTop: '0.875rem',
                      borderRadius: '0.75rem',
                      background: t.white,
                      border: '1px solid hsl(var(--border) / 0.4)',
                      boxShadow: '0 4px 16px hsl(var(--foreground) / 0.08)',
                      padding: '0.875rem 1.125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#4caf50', flexShrink: 0, boxShadow: '0 0 0 2px rgba(76,175,80,0.25)' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.08em', color: t.outline }}>
                        SYSTEM STATUS
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: t.variant, lineHeight: 1.6 }}>
                      Curator AI is currently processing at{' '}
                      <span style={{ color: t.primary, fontWeight: 600 }}>High Fidelity</span>.
                      Resume analysis takes approximately{' '}
                      <span style={{ color: t.primary, fontWeight: 600 }}>2-3 Minutes</span>.
                    </p>
                    {/* thin progress bar */}
                    <div style={{ marginTop: '0.625rem', height: '3px', borderRadius: '999px', background: t.surfHigh, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '72%', borderRadius: '999px', background: `linear-gradient(90deg, ${t.primary}, ${t.container})` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Three bottom feature cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
                {[
                  {
                    icon: <Shield size={22} color={t.primary} />,
                    bg: 'hsl(var(--primary) / 0.07)',
                    title: 'Scholarly Accuracy',
                    desc: 'Our algorithms are trained on peer-reviewed career frameworks and industry standards.',
                  },
                  {
                    icon: <Brain size={22} color={t.primary} />,
                    bg: 'hsl(var(--primary) / 0.07)',
                    title: 'Cognitive Mapping',
                    desc: 'We map your existing knowledge to future skill requirements using semantic analysis.',
                  },
                  {
                    icon: <TrendingUp size={22} color={t.primary} />,
                    bg: 'hsl(var(--primary) / 0.07)',
                    title: 'Progressive Insight',
                    desc: 'Watch your skill profile evolve as you complete curated modules and upload new credentials.',
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    style={{
                      borderRadius: '0.875rem',
                      background: t.white,
                      border: '1px solid hsl(var(--border) / 0.38)',
                      padding: '1.5rem',
                      boxShadow: '0 2px 12px hsl(var(--foreground) / 0.04)',
                    }}
                  >
                    <div style={{ ...ibadge(f.bg), width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem', marginBottom: '1rem' }}>
                      {f.icon}
                    </div>
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: t.onSurface,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: t.variant, lineHeight: 1.65 }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ════════════════════════════════
              PIPELINE PROGRESS
          ════════════════════════════════ */}
          {showProgress && (
            <div style={{ padding: '2.5rem 0', maxWidth: '48rem', margin: '0 auto' }}>
              <PipelineProgress currentStep={pipelineStep} isComplete={!!skillAnalysis} />
            </div>
          )}

          {/* ════════════════════════════════
              ERROR STATE
          ════════════════════════════════ */}
          {error && (
            <div
              style={{
                margin: '2rem 0',
                padding: '1.5rem',
                borderRadius: '0.875rem',
                background: t.errCont,
                border: '1px solid hsl(var(--error) / 0.2)',
              }}
            >
              <p style={{ fontWeight: 700, fontSize: '1rem', color: t.error, marginBottom: '0.375rem' }}>
                Analysis Failed
              </p>
              <p style={{ fontSize: '0.875rem', color: t.error, marginBottom: '1rem', lineHeight: 1.6 }}>
                {error}
              </p>
              <button
                onClick={handleNewAnalysis}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', background: t.error, border: 'none', color: t.white, fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', letterSpacing: '0.03em' }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* ════════════════════════════════
              RESULTS DASHBOARD
          ════════════════════════════════ */}
          {skillAnalysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingTop: '2rem', animation: 'sa-fadeIn 0.5s ease-out' }}>

              {/* Action Bar */}
              <div style={{ ...card, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  id="new-analysis-btn"
                  onClick={handleNewAnalysis}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.125rem', borderRadius: '0.625rem', background: t.surface, border: '1px solid hsl(var(--border) / 0.5)', color: t.variant, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', letterSpacing: '0.02em' }}
                >
                  <FileText size={16} /> New Analysis
                </button>
                <button
                  id="save-to-profile-btn"
                  onClick={handleSaveToProfile}
                  disabled={saveStatus === 'saving' || saveStatus === 'success'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.625rem', background: saveStatus === 'success' ? 'hsl(142.1 70.6% 45.3%)' : `linear-gradient(135deg,${t.primary},${t.container})`, border: 'none', color: t.white, fontWeight: 700, fontSize: '0.875rem', cursor: saveStatus === 'saving' || saveStatus === 'success' ? 'default' : 'pointer', letterSpacing: '0.03em', boxShadow: '0 4px 12px hsl(var(--primary) / 0.25)', opacity: saveStatus === 'saving' ? 0.75 : 1 }}
                >
                  {saveStatus === 'saving' ? <Loader2 size={16} style={{ animation: 'sa-spin 0.9s linear infinite' }} /> :
                    saveStatus === 'success' ? <CheckCircle size={16} /> : <Save size={16} />}
                  {saveStatus === 'success' ? 'Saved!' : 'Save to Profile'}
                </button>
              </div>

              {/* Expertise Report */}
              <div style={{ ...card, padding: '1.75rem' }}>
                <div style={sh()}>
                  <div style={ibadge('hsl(var(--primary) / 0.08)')}><BarChart3 size={18} color={t.primary} /></div>
                  Your Expertise Report
                </div>
                <p style={{ fontSize: '0.9375rem', color: t.variant, lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  Your current trajectory suggests a high aptitude for architecture-heavy roles.
                  We've identified your key strengths and strategic growth opportunities.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'SENIORITY LEVEL', value: skillAnalysis.profile.seniority_level },
                    { label: 'TARGET ROLES', value: skillAnalysis.profile.target_roles.slice(0, 2).join(', ') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ borderRadius: '0.75rem', background: t.surface, border: '1px solid hsl(var(--border) / 0.35)', padding: '1rem 1.25rem' }}>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', color: t.outline, marginBottom: '0.375rem' }}>{label}</p>
                      <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: t.onSurface }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Proficiency */}
              <div style={{ ...card, padding: '1.75rem' }}>
                <div style={sh()}>
                  <div style={ibadge('hsl(var(--primary) / 0.08)')}><BookOpen size={18} color={t.primary} /></div>
                  Skills Proficiency
                </div>
                <SkillsBreakdown
                  explicitSkills={skillAnalysis.profile.skills}
                  impliedSkills={skillAnalysis.expanded_skills.implied_skills}
                />
              </div>

              {/* Matching Jobs */}
              {skillAnalysis.matches.length > 0 && (
                <div style={{ ...card, padding: '1.75rem' }}>
                  <div style={sh()}>
                    <div style={ibadge('hsl(var(--primary) / 0.08)')}><Target size={18} color={t.primary} /></div>
                    Best Match Opportunities
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
                    {skillAnalysis.matches.slice(0, 6).map((job, i) => (
                      <a
                        key={i}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.75rem', background: t.surface, border: '1px solid hsl(var(--border) / 0.4)', padding: '0.875rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'hsl(var(--primary) / 0.3)'; el.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.1)'; el.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'hsl(var(--border) / 0.4)'; el.style.boxShadow = 'none'; el.style.transform = 'none'; }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: t.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
                          <p style={{ fontSize: '0.7rem', color: t.outline, marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.required_skills.slice(0, 3).join(' · ')}</p>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: t.primary, flexShrink: 0, marginLeft: '0.75rem' }}>
                          {Math.round(job.score * 100)}%
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Gap Analysis */}
              {skillAnalysis.validated_gaps.length > 0 && (
                <div style={{ ...card, padding: '1.75rem' }}>
                  <div style={sh()}>
                    <div style={ibadge('#ffdad6')}><BarChart3 size={18} color={t.error} /></div>
                    The Gaps
                  </div>
                  <GapAnalysisCard gaps={skillAnalysis.validated_gaps} />
                </div>
              )}

              {/* Roadmap */}
              {skillAnalysis.roadmap.action_plan.length > 0 && (
                <div style={{ ...card, padding: '1.75rem' }}>
                  <div style={sh()}>
                    <div style={ibadge('hsl(var(--tertiary) / 0.1)')}><BookOpen size={18} color={t.tertiary} /></div>
                    Your Personalized Roadmap
                  </div>

                  <div style={{ borderRadius: '0.75rem', background: 'linear-gradient(135deg,hsl(var(--primary) / 0.05),hsl(var(--tertiary) / 0.08))', border: '1px solid hsl(var(--border) / 0.35)', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {[
                      { label: 'CURATED TIMELINE', value: skillAnalysis.roadmap.total_timeline },
                      { label: 'TARGET SENIORITY', value: skillAnalysis.roadmap.seniority_level },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', color: t.outline, marginBottom: '0.25rem' }}>{label}</p>
                        <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: t.onSurface }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {skillAnalysis.roadmap.market_outlook && (
                    <div style={{ borderRadius: '0.75rem', background: t.surface, border: '1px solid hsl(var(--border) / 0.4)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                      <p style={{ fontSize: '0.875rem', color: t.variant, lineHeight: 1.65 }}>{skillAnalysis.roadmap.market_outlook}</p>
                    </div>
                  )}

                  {skillAnalysis.roadmap.learning_sequence.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: t.outline, marginBottom: '0.625rem' }}>RECOMMENDED LEARNING SEQUENCE</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skillAnalysis.roadmap.learning_sequence.map((skill, index) => (
                          <span key={index} style={{ fontSize: '0.8125rem', fontWeight: 600, color: t.primary, background: 'hsl(var(--primary) / 0.07)', border: '1px solid hsl(var(--primary) / 0.15)', padding: '0.3rem 0.75rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ fontWeight: 800, color: t.tertiary }}>{index + 1}.</span>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <SkillRoadmapAccordion steps={skillAnalysis.roadmap.action_plan} />
                </div>
              )}

              {/* Sticky save */}
              <div style={{ position: 'sticky', bottom: '1.5rem', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
                <button
                  id="save-sticky-btn"
                  onClick={handleSaveToProfile}
                  disabled={saveStatus === 'saving' || saveStatus === 'success'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 2.25rem', borderRadius: '999px', background: saveStatus === 'success' ? 'hsl(142.1 70.6% 45.3%)' : `linear-gradient(135deg,${t.primary},${t.container})`, border: 'none', color: t.white, fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '0.03em', cursor: saveStatus === 'saving' || saveStatus === 'success' ? 'default' : 'pointer', boxShadow: '0 8px 28px hsl(var(--primary) / 0.35)', backdropFilter: 'blur(8px)', opacity: saveStatus === 'saving' ? 0.8 : 1 }}
                >
                  {saveStatus === 'saving' ? <Loader2 size={20} style={{ animation: 'sa-spin 0.9s linear infinite' }} /> :
                    saveStatus === 'success' ? <CheckCircle size={20} /> : <Save size={20} />}
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved to Profile!' : 'Save to Profile'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ background: t.white, borderTop: '1px solid hsl(var(--border) / 0.35)', padding: '2.5rem 1.5rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: t.outline }}>
              © 2026 ASQ Scholarly Systems — All Rights Reserved
            </p>
            <div style={{ display: 'flex', gap: '1.75rem' }}>
              {['Privacy', 'Terms', 'Support'].map((l) => (
                <a key={l} href="#" style={{ fontSize: '0.8125rem', color: t.outline, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.primary; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.outline; }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>

        <style>{`
          @keyframes sa-spin    { to { transform: rotate(360deg); } }
          @keyframes sa-fadeIn  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </div>
    </>
  );
};

export default SkillAnalyzer;