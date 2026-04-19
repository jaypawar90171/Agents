import React, { useState } from 'react';
import { SkillLearningStep } from '../../types/api';
import {
  ChevronDown, ChevronRight, BookOpen, Calendar, Award, ExternalLink,
  CheckCircle, Circle, Clock,
} from 'lucide-react';

interface SkillRoadmapAccordionProps {
  steps: SkillLearningStep[];
  completedSkills?: string[];
  onSkillToggle?: (skill: string, isCompleted: boolean) => void;
  readOnly?: boolean;
}

export const SkillRoadmapAccordion: React.FC<SkillRoadmapAccordionProps> = ({
  steps,
  completedSkills = [],
  onSkillToggle,
  readOnly = false,
}) => {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(
    steps.length > 0 ? steps[0].skill : null
  );

  const toggleSkill = (skill: string) => {
    setExpandedSkill(prev => (prev === skill ? null : skill));
  };

  const handleToggleComplete = (skill: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly && onSkillToggle) {
      onSkillToggle(skill, !completedSkills.includes(skill));
    }
  };

  const getImportanceBadge = (importance: string) => {
    if (importance === 'Critical') {
      return { bg: 'hsl(var(--error-container))', color: 'hsl(var(--error))', label: 'CRITICAL' };
    }
    return { bg: 'hsl(var(--tertiary) / 0.18)', color: 'hsl(var(--on-surface))', label: 'EDGE' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {steps.map((step, index) => {
        const isExpanded  = expandedSkill === step.skill;
        const isCompleted = completedSkills.includes(step.skill);
        const badge       = getImportanceBadge(step.importance);

        return (
          <div
            key={index}
            style={{
              borderRadius: '0.875rem',
              background: 'hsl(var(--card))',
              border: isExpanded
                ? '1px solid hsl(var(--primary) / 0.25)'
                : '1px solid hsl(var(--border) / 0.35)',
              boxShadow: isExpanded
                ? '0 4px 20px hsl(var(--primary) / 0.08)'
                : '0 2px 8px hsl(var(--foreground) / 0.04)',
              transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
              overflow: 'hidden',
            }}
          >
            {/* ── Header ── */}
            <button
              onClick={() => toggleSkill(step.skill)}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '1rem 1.25rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--background))';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              {/* Expand/Collapse chevron */}
              <div style={{ flexShrink: 0, color: 'hsl(var(--primary))' }}>
                {isExpanded
                  ? <ChevronDown size={18} />
                  : <ChevronRight size={18} color="hsl(var(--outline))" />
                }
              </div>

              {/* Completion toggle */}
              {!readOnly && (
                <button
                  onClick={(e) => handleToggleComplete(step.skill, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex' }}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isCompleted
                    ? <CheckCircle size={22} color="hsl(var(--primary))" />
                    : <Circle size={22} color="hsl(var(--border))" />
                  }
                </button>
              )}

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <h4
                    style={{
                      fontFamily: "'Noto Serif', serif",
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: isCompleted ? 'hsl(var(--outline))' : 'hsl(var(--on-surface))',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {step.skill}
                  </h4>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                  <Clock size={12} color="hsl(var(--outline))" />
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: '0.75rem',
                      color: 'hsl(var(--outline))',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {step.time_estimate}
                  </span>
                </div>
              </div>
            </button>

            {/* ── Expanded Content ── */}
            {isExpanded && (
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border) / 0.35)',
                  padding: '1.25rem 1.5rem',
                  background: 'hsl(var(--background))',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Why it matters */}
                  <div>
                    <h5
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface))',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Award size={14} color="hsl(var(--primary))" />
                      Why it matters
                    </h5>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: 'hsl(var(--on-surface-variant))', lineHeight: 1.65 }}>
                      {step.why_it_matters}
                    </p>
                  </div>

                  {/* Leverage */}
                  <div>
                    <h5
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface))',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Leverage from your background
                    </h5>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: 'hsl(var(--on-surface-variant))', lineHeight: 1.65 }}>
                      {step.leverage_from_background}
                    </p>
                  </div>

                  {/* Resources */}
                  <div>
                    <h5
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface))',
                        marginBottom: '0.625rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <BookOpen size={14} color="hsl(var(--primary))" />
                      Learning Resources
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {step.resources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            borderRadius: '0.625rem',
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border) / 0.4)',
                            padding: '0.625rem 1rem',
                            textDecoration: 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--primary) / 0.3)';
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px hsl(var(--primary) / 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border) / 0.4)';
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                          }}
                        >
                          <ExternalLink size={15} color="hsl(var(--primary))" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--on-surface))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {resource.title}
                            </p>
                            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: '0.6875rem', color: 'hsl(var(--outline))', marginTop: '0.1rem', letterSpacing: '0.02em' }}>
                              {resource.resource_type.toUpperCase()} · {resource.is_free ? 'FREE' : 'PAID'}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Breakdown */}
                  <div>
                    <h5
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface))',
                        marginBottom: '0.625rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Calendar size={14} color="hsl(var(--primary))" />
                      Weekly Breakdown
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {step.weekly_breakdown.map((week, i) => (
                        <div
                          key={i}
                          style={{
                            borderRadius: '0.625rem',
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border) / 0.4)',
                            padding: '0.875rem 1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                            <span style={{ fontFamily: "'Noto Serif', serif", fontWeight: 700, fontSize: '0.875rem', color: 'hsl(var(--on-surface))' }}>
                              {week.week_label}
                            </span>
                            <span
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                letterSpacing: '0.03em',
                                color: 'hsl(var(--primary))',
                                background: 'hsl(var(--primary) / 0.08)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                              }}
                            >
                              {week.topic}
                            </span>
                          </div>
                          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingLeft: 0, listStyle: 'none' }}>
                            {week.tasks.map((task, j) => (
                              <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'hsl(var(--primary))', flexShrink: 0, marginTop: '0.45rem' }} />
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: 'hsl(var(--on-surface-variant))', lineHeight: 1.55 }}>
                                  {task}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div
                            style={{
                              marginTop: '0.75rem',
                              borderRadius: '0.5rem',
                              background: 'hsl(var(--tertiary) / 0.08)',
                              padding: '0.375rem 0.75rem',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'hsl(var(--on-surface))',
                              letterSpacing: '0.02em',
                            }}
                          >
                            → Milestone: {week.milestone}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capstone Project */}
                  <div>
                    <h5
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface))',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Capstone Project
                    </h5>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface-variant))',
                        lineHeight: 1.65,
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border) / 0.4)',
                        borderRadius: '0.625rem',
                        padding: '0.875rem 1rem',
                      }}
                    >
                      {step.capstone_project}
                    </p>
                  </div>

                  {/* Resume Bullet */}
                  <div>
                    <h5
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'hsl(var(--on-surface))',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Resume Bullet
                    </h5>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        color: 'hsl(var(--primary))',
                        lineHeight: 1.65,
                        background: 'hsl(var(--primary) / 0.04)',
                        border: '1px solid hsl(var(--primary) / 0.15)',
                        borderRadius: '0.625rem',
                        padding: '0.875rem 1rem',
                      }}
                    >
                      {step.resume_bullet}
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SkillRoadmapAccordion;