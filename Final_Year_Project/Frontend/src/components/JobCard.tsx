import React, { useState } from "react";
import { MapPin, ArrowRight, Loader2, Briefcase, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Job } from "../types/api";
import { useRoadmap } from "../hooks/useRoadmap";

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const navigate = useNavigate();
  const { generateRoadmap } = useRoadmap();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getTagStyle = (color?: string) => {
    switch (color) {
      case "green":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50";
      case "blue":
        return "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50";
      case "orange":
        return "bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const handleApply = () => {
    if (job.jobUrl) {
      window.open(job.jobUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleRoadmapGeneration = async () => {
    if (!job.company || isGenerating) return;
    try {
      setIsGenerating(true);
      await generateRoadmap(job.company);
      navigate("/roadmap");
    } catch (error) {
      console.error("Error generating roadmap:", error);
      navigate("/roadmap");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col overflow-hidden group"
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all duration-500"
        style={{ opacity: isHovered ? 1 : 0.4 }}
      />

      <div className="p-6 flex flex-col h-full">
        {/* Header: Logo + Tags */}
        <div className="flex justify-between items-start mb-5">
          {/* Logo with ring effect */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 blur-sm transition-opacity duration-300"
              style={{ opacity: isHovered ? 0.35 : 0 }}
            />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={job.logo}
                alt={`${job.company} Logo`}
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff&bold=true`;
                }}
              />
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end max-w-[55%]">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${getTagStyle(job.tagColor)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Company + Location */}
        <div className="mb-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200">
            {job.company}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-5">
          <MapPin size={13} strokeWidth={2.5} />
          <span className="text-xs font-medium">{job.location}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />

        {/* Role Detail */}
        <div className="flex items-start gap-3 mb-6 flex-grow">
          <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Briefcase size={14} className="text-indigo-500 dark:text-indigo-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              Role
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
              {job.title}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Primary: Apply Now */}
          <button
            onClick={handleApply}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Apply Now
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>

          {/* Secondary: Roadmap */}
          <button
            onClick={handleRoadmapGeneration}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl border border-orange-200 dark:border-orange-700/50 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 disabled:opacity-50 disabled:cursor-not-allowed text-orange-600 dark:text-orange-400 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" strokeWidth={2.5} />
                Generating Roadmap...
              </>
            ) : (
              <>
                <Sparkles size={15} strokeWidth={2} />
                Generate Roadmap
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;