import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface PipelineProgressProps {
  currentStep: string;
  isComplete?: boolean;
}

const STEPS = [
  { key: 'parsing',    label: 'Parsing resume',    detail: 'Extracting professional data from your document...' },
  { key: 'analyzing',  label: 'Analyzing profile',  detail: 'Benchmarking profile against industry standards...' },
  { key: 'expanding',  label: 'Expanding skills',   detail: 'Inferring related competencies from your background...' },
  { key: 'matching',   label: 'Matching jobs',      detail: 'Cross-referencing with current open roles...' },
  { key: 'finding',    label: 'Finding gaps',       detail: 'Identifying missing skills for your target roles...' },
  { key: 'validating', label: 'Validating gaps',    detail: 'Confirming gap priority with market frequency data...' },
  { key: 'fetching',   label: 'Fetching resources', detail: 'Sourcing curated learning materials for each gap...' },
  { key: 'building',   label: 'Building roadmap',   detail: 'Assembling your personalized week-by-week plan...' },
];

const getStepIndex = (label: string): number => {
  const lower = label.toLowerCase();
  return STEPS.findIndex(s => lower.includes(s.key));
};

// Pseudo-random log lines that scroll during analysis
const LOG_LINES = [
  'Connecting to Curator Logic Engine...',
  'Loaded resume document successfully.',
  'Extracting core competencies from academic & work history...',
  'Benchmarked profile against senior-tier role descriptions.',
  'Cross-referencing secondary skill sets with 2024 market trends...',
  'Queuing labor-market gap validation for identified skills...',
  'Simulating 400+ career trajectories for optimal path selection...',
  'Fetching learning resources from accredited curators...',
  'Generating week-by-week milestone roadmap...',
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  currentStep,
  isComplete = false,
}) => {
  const currentIndex = getStepIndex(currentStep);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [logIdx, setLogIdx] = useState(0);

  // Add a new log line every 3s during loading
  useEffect(() => {
    if (isComplete) return;
    if (logIdx >= LOG_LINES.length) return;
    const t = setTimeout(() => {
      setVisibleLogs(prev => [...prev, LOG_LINES[logIdx]]);
      setLogIdx(i => i + 1);
    }, 2800);
    return () => clearTimeout(t);
  }, [logIdx, isComplete]);

  const pct = isComplete
    ? 100
    : Math.max(5, Math.round(((currentIndex + 1) / STEPS.length) * 100));

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid rgba(195, 198, 213, 0.4)',
        background: '#ffffff',
        boxShadow: '0 8px 32px rgba(27, 28, 29, 0.06)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '1.25rem 1.75rem',
          background: isComplete
            ? 'linear-gradient(90deg, #094cb2, #3366cc)'
            : '#faf9fa',
          borderBottom: '1px solid rgba(195, 198, 213, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Spinner or check */}
        <div
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            background: isComplete ? 'rgba(255,255,255,0.2)' : '#efedee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isComplete ? (
            <Check size={18} color="#fff" />
          ) : (
            <div
              style={{
                width: '1.1rem',
                height: '1.1rem',
                border: '2.5px solid rgba(9, 76, 178, 0.2)',
                borderTopColor: '#094cb2',
                borderRadius: '50%',
                animation: 'sa-spin 0.9s linear infinite',
              }}
            />
          )}
        </div>

        <div>
          <p
            style={{
              fontFamily: "'Noto Serif', serif",
              fontWeight: 700,
              fontSize: '1.0625rem',
              color: isComplete ? '#ffffff' : '#1b1c1d',
              lineHeight: 1.3,
            }}
          >
            {isComplete ? 'Analysis Complete' : 'Analyzing...'}
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: '0.75rem',
              color: isComplete ? 'rgba(255,255,255,0.75)' : '#737784',
              letterSpacing: '0.02em',
              marginTop: '0.125rem',
            }}
          >
            {isComplete
              ? 'Curator AI has finished processing your profile.'
              : 'Our Curator AI is cross-referencing your profile with industry benchmarks.'}
          </p>
        </div>

        {/* Step badge */}
        <div style={{ marginLeft: 'auto' }}>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: isComplete ? 'rgba(255,255,255,0.8)' : '#094cb2',
              background: isComplete ? 'rgba(255,255,255,0.15)' : 'rgba(9,76,178,0.08)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
            }}
          >
            {isComplete
              ? 'DONE'
              : `STEP ${Math.max(1, currentIndex + 1)} / ${STEPS.length}`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '3px',
          background: '#efedee',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #094cb2, #3366cc)',
            transition: 'width 0.8s ease',
          }}
        />
      </div>

      {/* Steps list */}
      <div
        style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(195, 198, 213, 0.3)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex || isComplete;
            const isActive = index === currentIndex && !isComplete;
            const isPending = index > currentIndex && !isComplete;

            return (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  background: isActive ? 'rgba(9, 76, 178, 0.05)' : 'transparent',
                  transition: 'background 0.3s ease',
                }}
              >
                {/* Step indicator */}
                <div
                  style={{
                    width: '1.625rem',
                    height: '1.625rem',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted
                      ? '#094cb2'
                      : isActive
                      ? 'rgba(9, 76, 178, 0.1)'
                      : '#efedee',
                    border: isActive ? '2px solid #094cb2' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? (
                    <Check size={13} color="#fff" />
                  ) : isActive ? (
                    <div
                      style={{
                        width: '0.875rem',
                        height: '0.875rem',
                        border: '2px solid rgba(9, 76, 178, 0.3)',
                        borderTopColor: '#094cb2',
                        borderRadius: '50%',
                        animation: 'sa-spin 0.85s linear infinite',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#737784',
                      }}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isCompleted
                        ? '#094cb2'
                        : isActive
                        ? '#1b1c1d'
                        : '#737784',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: '0.7375rem',
                        color: '#434653',
                        marginTop: '0.125rem',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {step.detail}
                    </p>
                  )}
                </div>

                {/* Status tag */}
                {isCompleted && (
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#094cb2',
                      letterSpacing: '0.04em',
                    }}
                  >
                    DONE
                  </span>
                )}
                {isActive && (
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#094cb2',
                      background: 'rgba(9,76,178,0.08)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    IN PROGRESS
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrolling log terminal */}
      {!isComplete && visibleLogs.length > 0 && (
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#1b1c1d',
            fontFamily: "'Public Sans', monospace",
            fontSize: '0.75rem',
            color: '#c3c6d5',
            lineHeight: 1.8,
            maxHeight: '8rem',
            overflowY: 'auto',
          }}
        >
          {visibleLogs.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.625rem' }}>
              <span style={{ color: '#3366cc', flexShrink: 0 }}>›</span>
              <span
                style={{
                  color: i === visibleLogs.length - 1 ? '#ffffff' : '#737784',
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '0.875rem 1.75rem',
          background: '#faf9fa',
          borderTop: '1px solid rgba(195, 198, 213, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: '0.75rem',
            color: '#737784',
            letterSpacing: '0.01em',
          }}
        >
          {isComplete
            ? 'Curator AI processed at High Fidelity.'
            : 'Curator AI is currently processing at High Fidelity. Analysis takes 45–90 seconds.'}
        </p>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: isComplete ? '#094cb2' : '#6d5e00',
            background: isComplete ? 'rgba(9,76,178,0.08)' : 'rgba(109, 94, 0, 0.1)',
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            letterSpacing: '0.04em',
          }}
        >
          {isComplete ? 'COMPLETE' : `${pct}%`}
        </span>
      </div>

      <style>{`
        @keyframes sa-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PipelineProgress;