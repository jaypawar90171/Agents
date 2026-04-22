import React, { useState } from "react";
import Header from "../components/Header";
import RoadmapDisplay from "../components/RoadMapDisplay";
import RoadmapJobsUsed from "../components/RoadmapJobsUsed";
import { useRoadmap } from "../hooks/useRoadmap";
import { useUser } from "@clerk/clerk-react";
import { Loader2, Sparkles, MapPin, Briefcase, TrendingUp, CheckCircle, Save } from "lucide-react";
import roadmapService from "../services/roadmapService";

/* ═══════════════════════════════════════════════════════
   Alexandria Design Tokens
═══════════════════════════════════════════════════════ */
const t = {
  primary:   'hsl(var(--primary))',
  container: 'hsl(var(--primary-container))',
  surface:   'hsl(var(--background))',
  surfHigh:  'hsl(var(--surface-container-high))',
  surfLow:   'hsl(var(--surface-container-low))',
  onSurface: 'hsl(var(--on-surface))',
  variant:   'hsl(var(--on-surface-variant))',
  outline:   'hsl(var(--outline))',
  tertiary:  'hsl(var(--tertiary))',
  tertCont:  'hsl(var(--secondary-container))',
  error:     'hsl(var(--error))',
  errCont:   'hsl(var(--error-container))',
  white:     'hsl(var(--card))',
};

const MIN_COMPANY_LENGTH = 3;

const Roadmap: React.FC = () => {
  const { user } = useUser();
  const { roadmap, loading, error, generateRoadmap } = useRoadmap();
  const [companyName, setCompanyName] = useState("");
  const [saveStatus, setSaveStatus]   = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (trimmed.length >= MIN_COMPANY_LENGTH) {
      await generateRoadmap(trimmed);
    }
  };

  const handleAddToProfile = async () => {
    if (!roadmap?.roadmap) return;
    const userId = user?.id ?? "guest";
    setSaveStatus("saving");
    setSaveMessage("");
    try {
      const jobDetails = {
        company:  companyName.trim() || undefined,
        role:     roadmap.jobs_used?.[0]?.job_title ?? undefined,
        location: roadmap.jobs_used?.[0]?.location  ?? undefined,
      };
      await roadmapService.parseAndSaveRoadmap(roadmap.roadmap, userId, jobDetails);
      setSaveStatus("success");
      setSaveMessage("Roadmap saved to your profile.");
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Failed to save roadmap.");
    }
  };

  const canSubmit = companyName.trim().length >= MIN_COMPANY_LENGTH;

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: t.surface,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <Header />

        <main
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            padding: '0 1.5rem 4rem',
            width: '100%',
            flex: 1,
          }}
        >

          {/* ═══════════════════════════════
              HERO
          ═══════════════════════════════ */}
          <div style={{ padding: '2.75rem 0 2.25rem' }}>
            <p
              style={{
                fontFamily: "'Public Sans',sans-serif",
                fontWeight: 700,
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                color: t.tertiary,
                marginBottom: '0.625rem',
              }}
            >
              ✦ CAREER DEVELOPMENT
            </p>
            <h1
              style={{
                fontFamily: "'Noto Serif',serif",
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '0.875rem',
              }}
            >
              <span style={{ fontSize: '2.625rem', color: t.onSurface, display: 'block' }}>
                Career Roadmap
              </span>
              <span style={{ fontSize: '2.625rem', color: t.primary, fontStyle: 'italic', display: 'block' }}>
                Generator
              </span>
            </h1>
            <p
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: '1rem',
                color: t.variant,
                lineHeight: 1.7,
                maxWidth: '38rem',
              }}
            >
              Enter a target company to generate a curated learning roadmap with
              essential skills, milestones, and resources tailored to land the role.
            </p>
          </div>

          {/* ═══════════════════════════════
              SEARCH FORM
          ═══════════════════════════════ */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                padding: '0.5rem',
                borderRadius: '1rem',
                background: t.white,
                border: inputFocused
                  ? `1.5px solid hsl(var(--primary) / 0.35)`
                  : '1.5px solid hsl(var(--border) / 0.45)',
                boxShadow: inputFocused
                  ? '0 4px 20px hsl(var(--primary) / 0.1)'
                  : '0 4px 16px hsl(var(--foreground) / 0.06)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <input
                id="company-name-input"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Enter company name — e.g. Google, Amazon, Microsoft, Tesla"
                minLength={MIN_COMPANY_LENGTH}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: '14rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.625rem',
                  border: 'none',
                  outline: 'none',
                  background: 'none',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: '0.9375rem',
                  color: t.onSurface,
                  cursor: loading ? 'not-allowed' : 'text',
                }}
              />

              <button
                id="generate-roadmap-btn"
                type="submit"
                disabled={loading || !canSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.75rem',
                  borderRadius: '0.75rem',
                  background: loading || !canSubmit
                    ? t.surfHigh
                    : `linear-gradient(135deg, ${t.primary}, ${t.container})`,
                  border: 'none',
                  color: loading || !canSubmit ? t.outline : t.white,
                  fontFamily: "'Public Sans',sans-serif",
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.04em',
                  cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !canSubmit ? 'none' : '0 4px 14px hsl(var(--primary) / 0.28)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!loading && canSubmit) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px hsl(var(--primary) / 0.36)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = loading || !canSubmit ? 'none' : '0 4px 14px hsl(var(--primary) / 0.28)';
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} style={{ animation: 'rm-spin 0.85s linear infinite' }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Generate Roadmap
                  </>
                )}
              </button>
            </div>

            {/* Validation hint */}
            {companyName.trim().length > 0 && companyName.trim().length < MIN_COMPANY_LENGTH && (
              <p
                style={{
                  fontFamily: "'Public Sans',sans-serif",
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: t.tertiary,
                  marginTop: '0.625rem',
                  paddingLeft: '0.5rem',
                }}
              >
                Company name must be at least {MIN_COMPANY_LENGTH} characters.
              </p>
            )}
          </form>

          {/* ═══════════════════════════════
              LOADING STATE
          ═══════════════════════════════ */}
          {loading && (
            <div
              style={{
                borderRadius: '1rem',
                background: t.white,
                border: '1px solid hsl(var(--border) / 0.38)',
                padding: '3rem 2rem',
                textAlign: 'center',
                boxShadow: '0 4px 20px hsl(var(--foreground) / 0.05)',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  width: '3.5rem', height: '3.5rem',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.primary}, ${t.container})`,
                  margin: '0 auto 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)',
                  animation: 'rm-pulse 1.5s ease-in-out infinite',
                }}
              >
                <Sparkles size={22} color={t.white} />
              </div>
              <p style={{ fontFamily: "'Noto Serif',serif", fontWeight: 700, fontSize: '1.125rem', color: t.onSurface, marginBottom: '0.375rem' }}>
                Curating your roadmap…
              </p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.875rem', color: t.outline }}>
                Analyzing job data and generating your personalized path for{' '}
                <span style={{ color: t.primary, fontWeight: 600 }}>{companyName}</span>
              </p>
              {/* Thin progress bar */}
              <div style={{ marginTop: '1.25rem', height: '3px', borderRadius: '999px', background: t.surfHigh, overflow: 'hidden', maxWidth: '20rem', margin: '1.25rem auto 0' }}>
                <div style={{ height: '100%', background: `linear-gradient(90deg, ${t.primary}, ${t.tertCont})`, borderRadius: '999px', animation: 'rm-loading 1.8s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════
              ERROR STATE
          ═══════════════════════════════ */}
          {error && (
            <div
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                borderRadius: '0.875rem',
                background: t.errCont,
                border: '1px solid hsl(var(--error) / 0.2)',
              }}
            >
              <p style={{ fontFamily: "'Noto Serif',serif", fontWeight: 700, fontSize: '1rem', color: t.error, marginBottom: '0.375rem' }}>
                ⚠ Error generating roadmap
              </p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.875rem', color: t.error, lineHeight: 1.6 }}>
                {error}
              </p>
            </div>
          )}

          {/* ═══════════════════════════════
              SAVE STATUS TOASTS
          ═══════════════════════════════ */}
          {saveStatus === "success" && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                background: 'hsl(142.1 70.6% 45.3% / 0.08)',
                border: '1px solid hsl(142.1 70.6% 45.3% / 0.25)',
                display: 'flex', alignItems: 'center', gap: '0.625rem',
              }}
            >
              <CheckCircle size={18} color="#2e7d32" />
              <p style={{ fontFamily: "'Public Sans',sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'hsl(142.1 70.6% 25.3%)' }}>
                {saveMessage}
              </p>
            </div>
          )}
          {saveStatus === "error" && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                background: t.errCont,
                border: '1px solid hsl(var(--error) / 0.2)',
              }}
            >
              <p style={{ fontFamily: "'Public Sans',sans-serif", fontWeight: 600, fontSize: '0.875rem', color: t.error }}>
                {saveMessage}
              </p>
            </div>
          )}

          {/* ═══════════════════════════════
              ROADMAP RESULTS
          ═══════════════════════════════ */}
          {roadmap && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'rm-fadeIn 0.5s ease-out' }}>

              {/* Jobs used section */}
              {roadmap.jobs_used.length > 0 && (
                <div
                  style={{
                    borderRadius: '1rem',
                    background: t.white,
                    border: '1px solid hsl(var(--border) / 0.38)',
                    padding: '1.75rem',
                    boxShadow: '0 4px 20px hsl(var(--foreground) / 0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '2.25rem', height: '2.25rem',
                        borderRadius: '0.5625rem',
                        background: 'hsl(var(--primary) / 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Briefcase size={18} color={t.primary} />
                    </div>
                    <h2
                      style={{
                        fontFamily: "'Noto Serif',serif",
                        fontWeight: 800,
                        fontSize: '1.125rem',
                        color: t.onSurface,
                      }}
                    >
                      Jobs Used in This Roadmap
                    </h2>
                  </div>
                  <RoadmapJobsUsed jobs={roadmap.jobs_used} />
                </div>
              )}

              {/* Main roadmap display */}
              <div
                style={{
                  borderRadius: '1rem',
                  background: t.white,
                  border: '1px solid hsl(var(--border) / 0.38)',
                  padding: '1.75rem',
                  boxShadow: '0 4px 20px hsl(var(--foreground) / 0.05)',
                }}
              >
                <RoadmapDisplay
                  content={roadmap.roadmap}
                  onAddToProfile={handleAddToProfile}
                  isSaving={saveStatus === "saving"}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════
              EMPTY STATE
          ═══════════════════════════════ */}
          {!roadmap && !loading && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              {/* Icon */}
              <div
                style={{
                  width: '5.5rem', height: '5.5rem',
                  borderRadius: '1.25rem',
                  background: 'hsl(var(--primary) / 0.06)',
                  margin: '0 auto 1.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <TrendingUp size={38} color={t.primary} />
              </div>
              <h3
                style={{
                  fontFamily: "'Noto Serif',serif",
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: t.onSurface,
                  marginBottom: '0.625rem',
                }}
              >
                Ready to start your learning journey?
              </h3>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.9375rem', color: t.variant, maxWidth: '34rem', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
                Enter a target company above to generate a personalized roadmap with
                essential skills, milestones, and curated resources.
              </p>

              {/* Bottom feature cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', maxWidth: '44rem', margin: '0 auto' }}>
                {[
                  { icon: <Sparkles size={20} color={t.primary} />, title: 'AI-Curated', desc: 'Roadmaps built from real job postings at your target company' },
                  { icon: <MapPin size={20} color={t.primary} />, title: 'Location-Aware', desc: 'Tailored skill gaps based on regional roles and market demand' },
                  { icon: <Save size={20} color={t.primary} />, title: 'Save & Track', desc: 'Save any roadmap to your profile and track your progress' },
                ].map((f) => (
                  <div
                    key={f.title}
                    style={{
                      borderRadius: '0.875rem',
                      background: t.white,
                      border: '1px solid hsl(var(--border) / 0.38)',
                      padding: '1.375rem 1.125rem',
                      boxShadow: '0 2px 10px hsl(var(--foreground) / 0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: '2.5rem', height: '2.5rem',
                        borderRadius: '0.625rem',
                        background: 'hsl(var(--primary) / 0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.75rem',
                      }}
                    >
                      {f.icon}
                    </div>
                    <p style={{ fontFamily: "'Noto Serif',serif", fontWeight: 700, fontSize: '0.9375rem', color: t.onSurface, marginBottom: '0.375rem' }}>
                      {f.title}
                    </p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.8125rem', color: t.variant, lineHeight: 1.6 }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ═══ Footer ═══ */}
        <footer style={{ background: t.white, borderTop: '1px solid hsl(var(--border) / 0.35)', padding: '2.5rem 1.5rem' }}>
          <div
            style={{
              maxWidth: '64rem',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <p style={{ fontFamily: "'Public Sans',sans-serif", fontSize: '0.8125rem', color: t.outline }}>
              © 2026 LearnLaunch Scholarly Systems — All Rights Reserved
            </p>
            <div style={{ display: 'flex', gap: '1.75rem' }}>
              {['Privacy', 'Terms', 'Support'].map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{ fontFamily: "'Public Sans',sans-serif", fontSize: '0.8125rem', color: t.outline, textDecoration: 'none', transition: 'color 0.2s' }}
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
          @keyframes rm-spin    { to { transform: rotate(360deg); } }
          @keyframes rm-fadeIn  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          @keyframes rm-pulse   { 0%,100% { box-shadow: 0 4px 14px hsl(var(--primary) / 0.3); } 50% { box-shadow: 0 6px 24px hsl(var(--primary) / 0.5); } }
          @keyframes rm-loading { 0% { width:0%; margin-left:0; } 50% { width:70%; margin-left:15%; } 100% { width:0%; margin-left:100%; } }
        `}</style>
      </div>
    </>
  );
};

export default Roadmap;
