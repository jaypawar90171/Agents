import React from 'react';
import { SkillContext, ImpliedSkill } from '../../types/api';
import { Lightbulb, Info } from 'lucide-react';

interface SkillsBreakdownProps {
  explicitSkills: SkillContext[];
  impliedSkills: ImpliedSkill[];
}

const LEVEL_STYLES: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'hsl(var(--tertiary) / 0.1)',  color: 'hsl(var(--on-surface))' },
  intermediate: { bg: 'hsl(var(--primary) / 0.08)',  color: 'hsl(var(--primary))' },
  advanced:     { bg: 'hsl(var(--primary) / 0.18)',  color: 'hsl(var(--primary))' },
};

const getLevelStyle = (level: string) =>
  LEVEL_STYLES[level.toLowerCase()] ?? { bg: 'hsl(var(--surface-container-high))', color: 'hsl(var(--on-surface-variant))' };

const cardStyle: React.CSSProperties = {
  borderRadius: '0.875rem',
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border) / 0.35)',
  padding: '1.5rem',
  boxShadow: '0 4px 16px hsl(var(--foreground) / 0.04)',
};

export const SkillsBreakdown: React.FC<SkillsBreakdownProps> = ({
  explicitSkills,
  impliedSkills,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
      {/* ── Your Skills ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'hsl(var(--primary) / 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            💼
          </div>
          <h3
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'hsl(var(--on-surface))',
              flex: 1,
            }}
          >
            Your Skills
          </h3>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'hsl(var(--primary))',
              background: 'hsl(var(--primary) / 0.08)',
              padding: '0.2rem 0.625rem',
              borderRadius: '999px',
            }}
          >
            {explicitSkills.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {explicitSkills.map((skill, index) => {
            const st = getLevelStyle(skill.level);
            return (
              <div
                key={index}
                title={skill.context}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border) / 0.4)',
                  padding: '0.375rem 0.75rem',
                  cursor: 'default',
                }}
              >
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {skill.name}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    background: st.bg,
                    color: st.color,
                  }}
                >
                  {skill.level.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>

        {explicitSkills.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--outline))' }}>
            No skills detected in your resume.
          </p>
        )}
      </div>

      {/* ── Inferred Skills ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'hsl(var(--tertiary) / 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lightbulb size={16} color="hsl(var(--tertiary))" />
          </div>
          <h3
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'hsl(var(--on-surface))',
              flex: 1,
            }}
          >
            Inferred Insights
          </h3>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'hsl(var(--tertiary))',
              background: 'hsl(var(--tertiary) / 0.1)',
              padding: '0.2rem 0.625rem',
              borderRadius: '999px',
            }}
          >
            {impliedSkills.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {impliedSkills.map((skill, index) => (
            <div
              key={index}
              title={skill.reasoning}
              style={{
                position: 'relative',
                borderRadius: '0.5rem',
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border) / 0.4)',
                padding: '0.625rem 0.875rem',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={13} color="hsl(var(--tertiary))" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {skill.name}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'hsl(var(--outline))',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                >
                  ← {skill.inferred_from}
                </span>
              </div>
            </div>
          ))}
        </div>

        {impliedSkills.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--outline))' }}>
            No additional skills inferred.
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillsBreakdown;