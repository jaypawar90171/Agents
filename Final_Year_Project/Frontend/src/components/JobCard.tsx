import React, { useState } from "react";
import { Loader2 } from "lucide-react";
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
    <div className="group relative rounded-3xl flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-600 via-cyan-400 to-amber-400 grayscale group-hover:grayscale-0 transition-all duration-300" />
      <article className="relative m-[2px] flex-1 bg-surface-container-lowest p-8 rounded-[calc(1.5rem-2px)] overflow-hidden">
        <div className="flex justify-between items-start mb-8">
          <div className="h-14 w-14 rounded-lg bg-surface flex items-center justify-center p-2">
            <img 
              src={job.logo} 
              alt={`${job.company} Logo`}
              className="max-h-full max-w-full grayscale group-hover:grayscale-0 transition-all object-contain"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=094cb2&color=fff&bold=true`;
              }}
            />
          </div>
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-col gap-1 items-end">
              {job.tags.slice(0, 2).map(tag => (
                <span key={tag} className="font-label text-[10px] uppercase tracking-widest bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1 mb-8">
          <h2 className="font-headline text-xl text-on-surface group-hover:text-primary transition-colors line-clamp-2" title={job.title}>
            {job.title}
          </h2>
          <p className="font-body text-sm font-medium text-on-surface-variant">
            {job.company}
          </p>
          <div className="flex items-center gap-2 text-outline text-xs mt-3">
            <span className="font-label">📍 {job.location}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button 
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-primary to-primary-container text-on-primary py-3 rounded-lg font-label text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-all"
          >
            Apply Now
          </button>
          <button 
            onClick={handleRoadmapGeneration}
            disabled={isGenerating}
            className="flex-1 bg-surface-container-high text-primary py-3 rounded-lg font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-container-highest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating && <Loader2 size={14} className="animate-spin" />}
            Roadmap
          </button>
        </div>
      </article>
    </div>
  );
};

export default JobCard;