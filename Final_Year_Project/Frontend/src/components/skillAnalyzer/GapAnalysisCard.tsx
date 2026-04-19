import React from 'react';
import { ValidatedGap } from '../../types/api';
import { AlertTriangle, TrendingUp, Target, Users } from 'lucide-react';

interface GapAnalysisCardProps {
  gaps: ValidatedGap[];
}

const sectionCard: React.CSSProperties = {
  borderRadius: '0.875rem',
  background: '#ffffff',
  border: '1px solid rgba(195, 198, 213, 0.35)',
  padding: '1.5rem',
  boxShadow: '0 4px 16px rgba(27, 28, 29, 0.04)',
};

const statCard: React.CSSProperties = {
  borderRadius: '0.75rem',
  background: '#faf9fa',
  border: '1px solid rgba(195, 198, 213, 0.4)',
  padding: '1.25rem',
  textAlign: 'center',
};

export const GapAnalysisCard: React.FC<GapAnalysisCardProps> = ({ gaps }) => {
  const criticalGaps    = gaps.filter(g => g.importance === 'Critical');
  const competitiveGaps = gaps.filter(g => g.importance === 'Competitive Edge');
  const matchScore      = Math.max(0, 100 - (criticalGaps.length * 15 + competitiveGaps.length * 5));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        {[
          { value: gaps.length,                     label: 'Total Gaps',   color: '#094cb2' },
          { value: criticalGaps.length,              label: 'Critical',     color: '#ba1a1a' },
          { value: competitiveGaps.length,           label: 'Edge Gaps',    color: '#6d5e00' },
          { value: `${matchScore}%`,                 label: 'Match Score',  color: '#094cb2' },
        ].map((stat, i) => (
          <div key={i} style={statCard}>
            <p
              style={{
                fontFamily: "'Noto Serif', serif",
                fontWeight: 800,
                fontSize: '1.875rem',
                color: stat.color,
                lineHeight: 1.1,
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#737784',
                marginTop: '0.25rem',
              }}
            >
              {stat.label.toUpperCase()}
            </p>
          </div>
        ))}
      </div>

      {/* ── Critical Gaps ── */}
      <div style={{ ...sectionCard, borderLeft: '3px solid #ba1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.625rem',
              background: '#ffdad6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} color="#ba1a1a" />
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Noto Serif', serif",
                fontWeight: 700,
                fontSize: '1rem',
                color: '#1b1c1d',
              }}
            >
              Critical Skill Gaps
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8125rem',
                color: '#737784',
                marginTop: '0.125rem',
              }}
            >
              Missing from your profile but present in 94% of target role descriptions.
            </p>
          </div>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: "'Public Sans', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#ba1a1a',
              background: '#ffdad6',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            {criticalGaps.length}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {criticalGaps.map((gap, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#fff5f5',
                border: '1px solid rgba(186, 26, 26, 0.15)',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
              }}
            >
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  background: '#ffdad6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Target size={14} color="#ba1a1a" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.875rem', color: '#1b1c1d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gap.skill}
                </p>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: '0.7rem', color: '#737784', marginTop: '0.1rem' }}>
                  Found in {gap.frequency} jobs
                </p>
              </div>
            </div>
          ))}
        </div>

        {criticalGaps.length === 0 && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#737784' }}>
            No critical gaps identified — you have the core skills!
          </p>
        )}
      </div>

      {/* ── Competitive Edge Gaps ── */}
      <div style={{ ...sectionCard, borderLeft: '3px solid #bfab49' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.625rem',
              background: 'rgba(191, 171, 73, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} color="#6d5e00" />
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Noto Serif', serif",
                fontWeight: 700,
                fontSize: '1rem',
                color: '#1b1c1d',
              }}
            >
              Competitive Edge
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8125rem',
                color: '#737784',
                marginTop: '0.125rem',
              }}
            >
              Adding these would place you in the top 5% of candidates for lead positions.
            </p>
          </div>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: "'Public Sans', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#4a3f00',
              background: 'rgba(191, 171, 73, 0.18)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            {competitiveGaps.length}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {competitiveGaps.map((gap, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(249, 227, 122, 0.1)',
                border: '1px solid rgba(191, 171, 73, 0.25)',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
              }}
            >
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(191, 171, 73, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={14} color="#6d5e00" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.875rem', color: '#1b1c1d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gap.skill}
                </p>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: '0.7rem', color: '#737784', marginTop: '0.1rem' }}>
                  Found in {gap.frequency} jobs
                </p>
              </div>
            </div>
          ))}
        </div>

        {competitiveGaps.length === 0 && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#737784' }}>
            No competitive edge gaps — you're ahead of the curve!
          </p>
        )}
      </div>
    </div>
  );
};

export default GapAnalysisCard;