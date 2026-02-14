import React, { useState, useMemo } from 'react';
import { ChevronDown, Sparkles, Target, BookOpen, Award, Calendar, Code, Rocket } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RoadmapDisplayProps {
  content: string;
  onAddToProfile?: () => void;
}

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ content, onAddToProfile }) => {
  // Initialize with first section expanded for better UX
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({ 0: true });

  // Parse markdown content into sections based on headings
  const parseSections = useMemo(() => {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match ## or ### headings
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.join('\n').trim(),
          });
        }
        currentSection = line.replace(/^#{2,3}\s+/, '').trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Push the last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.join('\n').trim(),
      });
    }

    return sections;
  }, [content]);

  const getIcon = (index: number, title: string) => {
    const lowerTitle = title.toLowerCase();
    
    // Icon selection based on section title keywords
    if (lowerTitle.includes('summary') || lowerTitle.includes('overview')) {
      return <Target className="w-5 h-5" />;
    } else if (lowerTitle.includes('skills') || lowerTitle.includes('analysis')) {
      return <Code className="w-5 h-5" />;
    } else if (lowerTitle.includes('week') || lowerTitle.includes('breakdown')) {
      return <Calendar className="w-5 h-5" />;
    } else if (lowerTitle.includes('integration') || lowerTitle.includes('project')) {
      return <Rocket className="w-5 h-5" />;
    } else if (lowerTitle.includes('resources') || lowerTitle.includes('learning')) {
      return <BookOpen className="w-5 h-5" />;
    } else if (lowerTitle.includes('progress') || lowerTitle.includes('tracker')) {
      return <Award className="w-5 h-5" />;
    }
    
    // Default rotation through icons
    const icons = [Target, BookOpen, Code, Award, Calendar, Rocket, Sparkles];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5" />;
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (parseSections.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-slate-500">No roadmap sections found. The roadmap may be empty or in an unexpected format.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with add to profile button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Your Learning Roadmap
          </h2>
          <p className="text-slate-600 mt-2">Structured path to master this role</p>
        </div>
        {onAddToProfile && (
          <button
            onClick={onAddToProfile}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles size={18} />
            Add to Profile
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-4 relative">
        {/* Vertical line backdrop */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/50 via-blue-500/50 to-indigo-500/50 ml-7 rounded-full"></div>

        {parseSections.map((section, index) => (
          <div
            key={index}
            className="relative"
            style={{ animation: `slideIn 0.6s ease-out ${index * 0.1}s both` }}
          >
            {/* Timeline dot */}
            <div className="absolute left-0 top-6 w-14 h-14 rounded-full bg-white border-4 border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-indigo-500 font-semibold text-sm">
              {index + 1}
            </div>

            {/* Content card */}
            <div
              onClick={() => toggleSection(index)}
              className="ml-28 cursor-pointer group"
            >
              <div
                className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-md hover:shadow-xl ${
                  expandedSections[index]
                    ? 'border-indigo-500 bg-gradient-to-br from-white to-indigo-50/30'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="mt-1 text-indigo-500 flex-shrink-0">
                      {getIcon(index, section.title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-slate-900 break-words">
                        {section.title}
                      </h3>
                      {!expandedSections[index] && (
                        <p className="text-slate-600 text-sm mt-2 line-clamp-2">
                          {section.content.replace(/[#\-\*\[\]]/g, '').substring(0, 120)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={24}
                    className={`flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                      expandedSections[index] ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Card Content */}
                {expandedSections[index] && (
                  <div className="border-t-2 border-indigo-200 px-5 sm:px-6 py-5 bg-gradient-to-b from-indigo-50/50 to-transparent">
                    <div className="prose prose-sm max-w-none text-slate-700">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-bold text-slate-900 mt-3 mb-2 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold text-slate-800 mt-2 mb-1">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-sm font-semibold text-slate-800 mt-2 mb-1">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 leading-relaxed text-slate-700">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-slate-700">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-slate-700">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-slate-700 leading-relaxed">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-slate-900">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-slate-800">{children}</em>
                          ),
                          code: ({ children }) => (
                            <code className="px-2 py-1 rounded bg-slate-100 text-slate-900 text-sm font-mono">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-slate-100 rounded-lg p-4 overflow-x-auto mb-3">
                              {children}
                            </pre>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-500 hover:text-indigo-600 underline break-words"
                            >
                              {children}
                            </a>
                          ),
                          hr: () => (
                            <hr className="my-4 border-t border-slate-200" />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-slate-600 my-3">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion message */}
      <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 text-center">
        <div className="flex justify-center mb-4">
          <Award className="w-12 h-12 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Get Started?</h3>
        <p className="text-slate-600 mb-6">
          Follow this roadmap step by step and you'll be well on your way to landing your dream role!
        </p>
        {onAddToProfile && (
          <button
            onClick={onAddToProfile}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles size={18} />
            Save This Roadmap
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RoadmapDisplay;