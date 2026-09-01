import React, { useState, useMemo } from "react";
import {
  ChevronDown, ChevronRight,
  Sparkles, Target, Award, Calendar,
  Code, Rocket, Zap, Flame, Star,
  TrendingUp, CheckCircle, Lightbulb,
  Loader2, BookOpen, Save,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

/* ─── Alexandria design tokens ─── */
const t = {
  primary:   '#094cb2',
  container: '#3366cc',
  surface:   '#faf9fa',
  surfHigh:  '#efedee',
  surfLow:   '#f5f3f4',
  onSurface: '#1b1c1d',
  variant:   '#434653',
  outline:   '#737784',
  tertiary:  '#6d5e00',
  tertCont:  '#bfab49',
  error:     '#ba1a1a',
  white:     '#ffffff',
};

interface RoadmapDisplayProps {
  content: string;
  onAddToProfile?: () => void;
  isSaving?: boolean;
}

/* Map section index → a subtle accent tint (from Alexandria palette) */
const TINTS = [
  { bg: 'rgba(9,76,178,0.04)',   border: 'rgba(9,76,178,0.18)',   dot: t.primary,   label: '#00419d' },
  { bg: 'rgba(109,94,0,0.04)',   border: 'rgba(191,171,73,0.35)', dot: '#6d5e00',    label: '#4a3f00' },
  { bg: 'rgba(9,76,178,0.06)',   border: 'rgba(9,76,178,0.22)',   dot: t.container,  label: '#00419d' },
  { bg: 'rgba(109,94,0,0.06)',   border: 'rgba(191,171,73,0.40)', dot: '#524600',    label: '#4a3f00' },
  { bg: 'rgba(9,76,178,0.035)',  border: 'rgba(9,76,178,0.15)',   dot: t.primary,    label: '#00419d' },
];
const tint = (i: number) => TINTS[i % TINTS.length];

const getIcon = (index: number, title: string) => {
  const l = title.toLowerCase();
  const sz = 17;
  if (l.includes('summary') || l.includes('overview'))    return <Target size={sz} />;
  if (l.includes('skills') || l.includes('analysis'))     return <Zap size={sz} />;
  if (l.includes('week') || l.includes('breakdown'))      return <TrendingUp size={sz} />;
  if (l.includes('integration') || l.includes('project')) return <Rocket size={sz} />;
  if (l.includes('resources') || l.includes('learning'))  return <BookOpen size={sz} />;
  if (l.includes('progress') || l.includes('tracker'))    return <Award size={sz} />;
  const icons = [Target, Flame, Code, Star, Calendar, Rocket, Sparkles];
  const I = icons[index % icons.length];
  return <I size={sz} />;
};

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({
  content,
  onAddToProfile,
  isSaving = false,
}) => {
  const [expanded, setExpanded] = useState<{ [k: number]: boolean }>({ 0: true });

  const sections = useMemo(() => {
    const result: { title: string; content: string }[] = [];
    const lines = content.split('\n');
    let cur: string | null = null;
    let buf: string[] = [];
    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (cur) result.push({ title: cur, content: buf.join('\n').trim() });
        cur = line.replace(/^#{2,3}\s+/, '').trim();
        buf = [];
      } else if (cur) {
        buf.push(line);
      }
    }
    if (cur) result.push({ title: cur, content: buf.join('\n').trim() });
    return result;
  }, [content]);

  const toggle = (i: number) =>
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  if (sections.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: t.outline }}>
        No roadmap sections found. The content may be empty or in an unexpected format.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', }}>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: '0.625rem',
              letterSpacing: '0.1em',
              color: t.tertiary,
              marginBottom: '0.325rem',
            }}
          >
            ✦ PERSONALIZED PATH
          </p>
          <h2
            style={{
              fontWeight: 800,
              fontSize: '1.625rem',
              color: t.onSurface,
              lineHeight: 1.2,
            }}
          >
            Your Learning Roadmap
          </h2>
          <p style={{ fontSize: '0.9375rem', color: t.variant, marginTop: '0.375rem' }}>
            Your personalized path to career excellence
          </p>
        </div>

        {onAddToProfile && (
          <button
            onClick={onAddToProfile}
            disabled={isSaving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.75rem',
              background: `linear-gradient(135deg, ${t.primary}, ${t.container})`,
              border: 'none',
              color: t.white,
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.03em',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.75 : 1,
              boxShadow: '0 4px 16px rgba(9,76,178,0.28)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(9,76,178,0.36)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(9,76,178,0.28)';
            }}
          >
            {isSaving
              ? <><Loader2 size={16} style={{ animation: 'rm-spin 0.85s linear infinite' }} /> Saving…</>
              : <><Save size={16} /> Save to Profile</>
            }
          </button>
        )}
      </div>

      {/* ── Timeline ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
        {/* Vertical connector line */}
        <div
          style={{
            position: 'absolute',
            left: '1.375rem',
            top: '2.5rem',
            bottom: '2.5rem',
            width: '2px',
            background: 'linear-gradient(180deg, rgba(9,76,178,0.3) 0%, rgba(191,171,73,0.25) 50%, rgba(9,76,178,0.15) 100%)',
            borderRadius: '999px',
          }}
        />

        {sections.map((section, index) => {
          const tc = tint(index);
          const isOpen = !!expanded[index];

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                animation: `rm-slideIn 0.45s ease-out ${index * 0.08}s both`,
              }}
            >
              {/* Timeline dot */}
              <div
                style={{
                  width: '2.75rem', height: '2.75rem',
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: tc.dot,
                  border: `3px solid ${t.white}`,
                  boxShadow: `0 0 0 2px ${tc.dot}44, 0 4px 12px rgba(27,28,29,0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.white,
                  position: 'relative',
                  zIndex: 1,
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => toggle(index)}
              >
                <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                  {index + 1}
                </span>
              </div>

              {/* Content card */}
              <div
                style={{
                  flex: 1,
                  borderRadius: '1rem',
                  background: isOpen ? tc.bg : t.white,
                  border: isOpen ? `1px solid ${tc.border}` : '1px solid rgba(195,198,213,0.38)',
                  boxShadow: isOpen ? '0 4px 20px rgba(27,28,29,0.06)' : '0 2px 8px rgba(27,28,29,0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Card header button */}
                <button
                  onClick={() => toggle(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Section icon */}
                  <div
                    style={{
                      width: '2.25rem', height: '2.25rem',
                      borderRadius: '0.5rem',
                      background: tc.bg,
                      border: `1px solid ${tc.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tc.dot,
                      flexShrink: 0,
                    }}
                  >
                    {getIcon(index, section.title)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: t.onSurface,
                          lineHeight: 1.3,
                        }}
                      >
                        {section.title}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          letterSpacing: '0.06em',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: tc.bg,
                          color: tc.label,
                          border: `1px solid ${tc.border}`,
                        }}
                      >
                        STEP {index + 1}
                      </span>
                    </div>
                    {!isOpen && (
                      <p style={{ fontSize: '0.8125rem', color: t.variant, marginTop: '0.25rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '32rem' }}>
                        {section.content.replace(/[#\-\*\[\]]/g, '').substring(0, 100)}…
                      </p>
                    )}
                  </div>

                  {isOpen
                    ? <ChevronDown size={18} color={t.outline} style={{ flexShrink: 0 }} />
                    : <ChevronRight size={18} color={t.outline} style={{ flexShrink: 0 }} />
                  }
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: `1px solid ${tc.border}`,
                      padding: '1.25rem 1.5rem',
                      background: tc.bg,
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', color: t.onSurface, marginTop: '1.25rem', marginBottom: '0.625rem' }}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', color: t.onSurface, marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Star size={14} color={tc.dot} />
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.07em', color: t.outline, textTransform: 'uppercase', marginTop: '0.875rem', marginBottom: '0.375rem' }}>
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: t.onSurface, marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                            {children}
                          </h4>
                        ),
                        p: ({ children }) => (
                          <p style={{ fontSize: '0.875rem', color: t.variant, lineHeight: 1.7, marginBottom: '0.75rem' }}>
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ marginBottom: '0.875rem', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ marginBottom: '0.875rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <CheckCircle size={15} color={tc.dot} style={{ flexShrink: 0, marginTop: '0.25rem' }} />
                            <span style={{ fontSize: '0.875rem', color: t.variant, lineHeight: 1.65 }}>
                              {children}
                            </span>
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ fontWeight: 700, color: t.onSurface }}>
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em style={{ fontStyle: 'italic', color: t.variant }}>
                            {children}
                          </em>
                        ),
                        code: ({ children }) => (
                          <code style={{ padding: '0.2rem 0.5rem', borderRadius: '0.375rem', background: '#1b1c1d', color: '#bfab49', fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre style={{ background: '#1b1c1d', borderRadius: '0.75rem', padding: '1rem 1.25rem', overflowX: 'auto', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <code style={{ color: '#bfab49', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                              {children}
                            </code>
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: t.primary, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                          >
                            {children} ↗
                          </a>
                        ),
                        hr: () => (
                          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${tc.border}, transparent)`, margin: '1rem 0' }} />
                        ),
                        blockquote: ({ children }) => (
                          <blockquote
                            style={{
                              borderLeft: `3px solid ${tc.dot}`,
                              background: tc.bg,
                              borderRadius: '0 0.5rem 0.5rem 0',
                              padding: '0.875rem 1rem',
                              margin: '0.875rem 0',
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Lightbulb size={16} color={tc.dot} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                            <span style={{ fontSize: '0.875rem', color: t.variant, fontStyle: 'italic', lineHeight: 1.65 }}>
                              {children}
                            </span>
                          </blockquote>
                        ),
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Completion card ── */}
      <div
        style={{
          marginTop: '2.5rem',
          borderRadius: '1rem',
          background: t.white,
          border: '1px solid rgba(195,198,213,0.38)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(27,28,29,0.05)',
        }}
      >
        <div
          style={{
            width: '3rem', height: '3rem',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${t.primary}, ${t.container})`,
            margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(9,76,178,0.3)',
          }}
        >
          <Award size={20} color={t.white} />
        </div>

        <h3
          style={{
            fontWeight: 800,
            fontSize: '1.375rem',
            color: t.onSurface,
            marginBottom: '0.625rem',
          }}
        >
          Ready to Conquer Your Goals?
        </h3>
        <p style={{ fontSize: '0.9375rem', color: t.variant, lineHeight: 1.7, maxWidth: '36rem', margin: '0 auto 1.5rem' }}>
          Follow this personalized roadmap step by step and unlock your potential to land your dream role.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
          {['Master Skills', 'Build Projects', 'Land Job'].map((item, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                letterSpacing: '0.03em',
                background: i === 1 ? 'rgba(109,94,0,0.1)' : 'rgba(9,76,178,0.08)',
                border: i === 1 ? '1px solid rgba(191,171,73,0.35)' : '1px solid rgba(9,76,178,0.2)',
                color: i === 1 ? t.tertiary : t.primary,
              }}
            >
              <TrendingUp size={13} />
              {item}
            </span>
          ))}
        </div>

        {onAddToProfile && (
          <button
            onClick={onAddToProfile}
            disabled={isSaving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.875rem 2.25rem',
              borderRadius: '999px',
              background: `linear-gradient(135deg, ${t.primary}, ${t.container})`,
              border: 'none',
              color: t.white,
              fontWeight: 700,
              fontSize: '0.9375rem',
              letterSpacing: '0.04em',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.8 : 1,
              boxShadow: '0 6px 20px rgba(9,76,178,0.32)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(9,76,178,0.42)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(9,76,178,0.32)';
            }}
          >
            {isSaving
              ? <><Loader2 size={20} style={{ animation: 'rm-spin 0.85s linear infinite' }} /> Saving…</>
              : <><Sparkles size={20} /> Save This Roadmap</>
            }
          </button>
        )}
      </div>

      <style>{`
        @keyframes rm-spin    { to { transform: rotate(360deg); } }
        @keyframes rm-slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  );
};

export default RoadmapDisplay;
