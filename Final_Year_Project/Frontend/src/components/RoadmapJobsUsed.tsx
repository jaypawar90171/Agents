import React from 'react';
import { MapPin, ExternalLink, Briefcase } from 'lucide-react';
import { RoadmapJobUsed } from '../types/api';

/* ─── Alexandria tokens ─── */
const t = {
  primary:   '#094cb2',
  container: '#3366cc',
  surface:   '#faf9fa',
  surfHigh:  '#efedee',
  onSurface: '#1b1c1d',
  variant:   '#434653',
  outline:   '#737784',
  tertiary:  '#6d5e00',
  tertCont:  'rgba(191,171,73,0.18)',
  white:     '#ffffff',
};

interface RoadmapJobsUsedProps {
  jobs: RoadmapJobUsed[];
}

const RoadmapJobsUsed: React.FC<RoadmapJobsUsedProps> = ({ jobs }) => {
  if (jobs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {jobs.map((job, index) => (
        <div
          key={`${job.company}-${job.job_title}-${index}`}
          style={{
            borderRadius: '0.875rem',
            background: t.white,
            border: '1px solid rgba(195,198,213,0.4)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 10px rgba(27,28,29,0.04)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(9,76,178,0.25)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(9,76,178,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(195,198,213,0.4)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(27,28,29,0.04)';
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              {/* Icon */}
              <div
                style={{
                  width: '2.5rem', height: '2.5rem',
                  borderRadius: '0.625rem',
                  background: 'rgba(9,76,178,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '0.1rem',
                }}
              >
                <Briefcase size={18} color={t.primary} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: t.onSurface,
                    marginBottom: '0.2rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {job.job_title}
                </h4>
                <p style={{ fontWeight: 500, fontSize: '0.875rem', color: t.variant, marginBottom: '0.25rem' }}>
                  {job.company}
                </p>
                {job.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={13} color={t.outline} />
                    <span style={{ fontSize: '0.75rem', color: t.outline, letterSpacing: '0.01em' }}>
                      {job.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(9,76,178,0.06)',
                  border: '1px solid rgba(9,76,178,0.18)',
                  color: t.primary,
                  fontWeight: 600, fontSize: '0.8125rem',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'background 0.2s, box-shadow 0.2s',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(9,76,178,0.12)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(9,76,178,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(9,76,178,0.06)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                }}
              >
                View Job
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Skills */}
          {job.skills_required && job.skills_required.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(195,198,213,0.35)' }}>
              <p
                style={{
                  fontSize: '0.625rem', fontWeight: 700,
                  letterSpacing: '0.08em', color: t.outline,
                  marginBottom: '0.5rem',
                }}
              >
                REQUIRED SKILLS ({job.skills_required.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {job.skills_required.map((skill, i) => (
                  <span
                    key={`${skill}-${i}`}
                    style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      padding: '0.2rem 0.625rem',
                      borderRadius: '999px',
                      background: 'rgba(9,76,178,0.07)',
                      border: '1px solid rgba(9,76,178,0.15)',
                      color: t.primary,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RoadmapJobsUsed;