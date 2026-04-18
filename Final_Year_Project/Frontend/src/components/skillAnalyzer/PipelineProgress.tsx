import React from 'react';
import { Check, Loader2, Circle, ArrowRight } from 'lucide-react';

interface PipelineProgressProps {
  currentStep: string;
  isComplete?: boolean;
}

const STEPS = [
  { key: 'parsing', label: 'Parsing resume', icon: '📄' },
  { key: 'analyzing', label: 'Analyzing profile', icon: '🔍' },
  { key: 'expanding', label: 'Expanding skills', icon: '🧩' },
  { key: 'matching', label: 'Matching jobs', icon: '🎯' },
  { key: 'finding', label: 'Finding gaps', icon: '🔎' },
  { key: 'validating', label: 'Validating gaps', icon: '✅' },
  { key: 'fetching', label: 'Fetching resources', icon: '📚' },
  { key: 'building', label: 'Building roadmap', icon: '🗺️' },
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  currentStep,
  isComplete = false,
}) => {
  const getStepIndex = (label: string): number => {
    return STEPS.findIndex(s => 
      label.toLowerCase().includes(s.key.toLowerCase())
    );
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-700" />
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ 
            width: isComplete 
              ? '100%' 
              : `${Math.min((currentIndex / (STEPS.length - 1)) * 100, 95)}%` 
          }}
        />

        {/* Steps */}
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex || isComplete;
          const isPending = index > currentIndex && !isComplete;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div 
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                  ${isCompleted 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : isActive
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                    {index + 1}
                  </span>
                )}
              </div>
              <span 
                className={`
                  absolute -bottom-8 w-24 text-center text-xs font-medium transition-colors duration-300
                  ${isCompleted 
                    ? 'text-green-600 dark:text-green-400' 
                    : isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Step Label */}
      <div className="mt-16 text-center">
        {isComplete ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">Analysis Complete!</span>
          </div>
        ) : currentStep ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">{currentStep}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Upload a resume to begin analysis
          </span>
        )}
      </div>

      {/* Time Estimate */}
      {!isComplete && !isComplete && (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          This may take 60-120 seconds for a comprehensive analysis
        </p>
      )}
    </div>
  );
};

export default PipelineProgress;