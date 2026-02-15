import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  Sparkles,
  Target,
  BookOpen,
  Award,
  Calendar,
  Code,
  Rocket,
  Zap,
  Flame,
  Star,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface RoadmapDisplayProps {
  content: string;
  onAddToProfile?: () => void;
}

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({
  content,
  onAddToProfile,
}) => {
  // Initialize with first section expanded for better UX
  const [expandedSections, setExpandedSections] = useState<{
    [key: number]: boolean;
  }>({ 0: true });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parse markdown content into sections based on headings
  const parseSections = useMemo(() => {
    const sections = [];
    const lines = content.split("\n");
    let currentSection = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match ## or ### headings
      if (line.startsWith("## ") || line.startsWith("### ")) {
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.join("\n").trim(),
          });
        }
        currentSection = line.replace(/^#{2,3}\s+/, "").trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Push the last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.join("\n").trim(),
      });
    }

    return sections;
  }, [content]);

  const getIcon = (index: number, title: string) => {
    const lowerTitle = title.toLowerCase();
    const iconClass = "w-6 h-6";

    // Icon selection based on section title keywords
    if (lowerTitle.includes("summary") || lowerTitle.includes("overview")) {
      return <Target className={iconClass} />;
    } else if (
      lowerTitle.includes("skills") ||
      lowerTitle.includes("analysis")
    ) {
      return <Zap className={iconClass} />;
    } else if (
      lowerTitle.includes("week") ||
      lowerTitle.includes("breakdown")
    ) {
      return <TrendingUp className={iconClass} />;
    } else if (
      lowerTitle.includes("integration") ||
      lowerTitle.includes("project")
    ) {
      return <Rocket className={iconClass} />;
    } else if (
      lowerTitle.includes("resources") ||
      lowerTitle.includes("learning")
    ) {
      return <Lightbulb className={iconClass} />;
    } else if (
      lowerTitle.includes("progress") ||
      lowerTitle.includes("tracker")
    ) {
      return <Award className={iconClass} />;
    }

    // Default rotation through icons
    const icons = [Target, Flame, Code, Star, Calendar, Rocket, Sparkles];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className={iconClass} />;
  };

  const getColorScheme = (index: number) => {
    const schemes = [
      {
        bg: "from-blue-50 to-cyan-50",
        border: "border-blue-200",
        accent: "from-blue-500 to-cyan-500",
        text: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
      },
      {
        bg: "from-purple-50 to-pink-50",
        border: "border-purple-200",
        accent: "from-purple-500 to-pink-500",
        text: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
      },
      {
        bg: "from-emerald-50 to-teal-50",
        border: "border-emerald-200",
        accent: "from-emerald-500 to-teal-500",
        text: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-700",
      },
      {
        bg: "from-orange-50 to-rose-50",
        border: "border-orange-200",
        accent: "from-orange-500 to-rose-500",
        text: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
      },
      {
        bg: "from-indigo-50 to-blue-50",
        border: "border-indigo-200",
        accent: "from-indigo-500 to-blue-500",
        text: "text-indigo-600",
        badge: "bg-indigo-100 text-indigo-700",
      },
    ];
    return schemes[index % schemes.length];
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
        <p className="text-slate-500">
          No roadmap sections found. The roadmap may be empty or in an
          unexpected format.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 min-h-screen p-4 sm:p-6">
      {/* Header with add to profile button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              Your Learning Roadmap
            </h2>
          </div>
          <p className="text-slate-600 mt-3 text-lg font-medium">
            Your personalized path to career excellence
          </p>
        </div>
        {onAddToProfile && (
          <button
            onClick={onAddToProfile}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-700 text-white font-bold shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/60 transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            <Sparkles size={20} className="group-hover:animate-spin" />
            Save to Profile
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative">
        {/* Animated vertical line backdrop */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gradient-dynamic to-transparent ml-7 rounded-full opacity-60"></div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 via-purple-500 to-blue-400 ml-7 rounded-full blur-sm opacity-30 animate-pulse"></div>

        {parseSections.map((section, index) => {
          const colorScheme = getColorScheme(index);
          return (
            <div
              key={index}
              className="relative"
              style={{
                animation: `slideIn 0.6s ease-out ${index * 0.12}s both`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Animated timeline dot */}
              <div
                className={`absolute left-0 top-6 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${hoveredIndex === index ? "scale-125" : "scale-100"}`}
              >
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorScheme.accent} opacity-20 blur-lg animate-pulse`}
                ></div>
                <div
                  className={`relative w-full h-full rounded-full bg-gradient-to-br ${colorScheme.accent} border-4 border-white flex items-center justify-center shadow-xl`}
                >
                  <span className="text-white font-black text-lg">
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* Content card */}
              <div
                onClick={() => toggleSection(index)}
                className="ml-32 cursor-pointer group relative"
              >
                {/* Decorative background glow */}
                <div
                  className={`absolute -inset-2 bg-gradient-to-br ${colorScheme.accent} opacity-0 group-hover:opacity-10 rounded-3xl blur-xl transition-all duration-300`}
                ></div>

                <div
                  className={`relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl ${
                    expandedSections[index]
                      ? `border-transparent bg-gradient-to-br ${colorScheme.bg}`
                      : `border-slate-200 hover:border-transparent ${hoveredIndex === index ? `shadow-${colorScheme.text.split("-")[1]}` : ""}`
                  }`}
                >
                  {/* Gradient accent bar */}
                  <div
                    className={`h-1 bg-gradient-to-r ${colorScheme.accent}`}
                  ></div>

                  {/* Card Header */}
                  <div className="p-6 sm:p-7 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`mt-1 flex-shrink-0 p-3 rounded-lg bg-gradient-to-br ${colorScheme.accent} text-white transform transition-all duration-300 ${hoveredIndex === index ? "rotate-12 scale-110" : ""}`}
                      >
                        {getIcon(index, section.title)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-2xl font-black text-slate-900 break-words">
                            {section.title}
                          </h3>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorScheme.badge} uppercase tracking-widest`}
                          >
                            Step {index + 1}
                          </span>
                        </div>
                        {!expandedSections[index] && (
                          <p className="text-slate-600 text-sm mt-2 line-clamp-2 font-medium">
                            {section.content
                              .replace(/[#\-\*\[\]]/g, "")
                              .substring(0, 120)}
                            ...
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      size={28}
                      className={`flex-shrink-0 transition-all duration-300 transform ${colorScheme.text} ${
                        expandedSections[index] ? "rotate-180" : ""
                      } ${hoveredIndex === index ? "scale-125" : ""}`}
                    />
                  </div>

                  {/* Card Content */}
                  {expandedSections[index] && (
                    <div
                      className={`border-t-2 border-opacity-20 border-slate-300 px-6 sm:px-7 py-6 bg-gradient-to-b ${colorScheme.bg} backdrop-blur-sm`}
                    >
                      <div className="space-y-4">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-black text-slate-900 mt-5 mb-3 first:mt-0 flex items-center gap-2">
                                <span
                                  className={`inline-block w-1 h-6 rounded-full bg-gradient-to-b ${colorScheme.accent}`}
                                ></span>
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0 flex items-center gap-2">
                                <Star
                                  className={`w-4 h-4 ${colorScheme.text}`}
                                />
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-bold text-slate-800 mt-3 mb-2 first:mt-0 uppercase tracking-wide">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-base font-bold text-slate-800 mt-2 mb-1">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3 leading-relaxed text-slate-700 font-medium">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-4 space-y-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-4 space-y-2">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-3">
                                <CheckCircle2
                                  className={`w-5 h-5 ${colorScheme.text} flex-shrink-0 mt-0.5 animate-bounce`}
                                  style={{
                                    animationDelay: `${Math.random() * 0.5}s`,
                                  }}
                                />
                                <span className="text-slate-700 leading-relaxed font-medium">
                                  {children}
                                </span>
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-black text-slate-900 bg-gradient-to-r from-yellow-100 to-yellow-50 px-1 rounded">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic font-semibold text-slate-800 not-italic before:content-['←'] before:mr-2 after:content-['→'] after:ml-2 before:text-slate-400 after:text-slate-400">
                                {children}
                              </em>
                            ),
                            code: ({ children }) => (
                              <code className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 text-amber-300 text-sm font-mono font-bold shadow-md">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 overflow-x-auto mb-4 border border-slate-700 shadow-lg">
                                <code className="text-amber-300 font-mono text-sm">
                                  {children}
                                </code>
                              </pre>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-bold underline decoration-2 decoration-wavy transition-all duration-300 hover:scale-105 inline-block bg-gradient-to-r ${colorScheme.accent} bg-clip-text text-transparent`}
                              >
                                {children} ↗
                              </a>
                            ),
                            hr: () => (
                              <div
                                className={`my-5 h-1 bg-gradient-to-r ${colorScheme.accent} rounded-full opacity-30`}
                              />
                            ),
                            blockquote: ({ children }) => (
                              <blockquote
                                className={`border-l-4 bg-gradient-to-r ${colorScheme.bg} border-opacity-50 rounded-r-xl p-4 italic text-slate-700 my-4 font-semibold shadow-md`}
                              >
                                <Lightbulb
                                  className={`w-5 h-5 inline mr-2 mb-1 ${colorScheme.text}`}
                                />
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
          );
        })}
      </div>

      {/* Completion message */}
      <div className="mt-16 relative group">
        {/* Animated background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-20 blur-2xl rounded-3xl transition-all duration-500"></div>

        <div className="relative p-10 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-indigo-50 to-blue-50 border-2 border-gradient-to-r from-indigo-200 to-blue-200 text-center shadow-xl backdrop-blur-sm">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-0"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 shadow-2xl animate-pulse">
                <Award className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🚀 Ready to Conquer Your Goals?
            </h3>
            <p className="text-slate-700 mb-8 text-lg font-semibold max-w-2xl mx-auto leading-relaxed">
              Follow this personalized roadmap step by step and{" "}
              <span className="bg-yellow-100 px-2 rounded-lg">
                unlock your potential
              </span>{" "}
              to land your dream role!
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {["Master Skills", "Build Projects", "Land Job"].map(
                (item, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-md ${
                      i === 0
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        : i === 1
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    {item}
                  </span>
                ),
              )}
            </div>
            {onAddToProfile && (
              <button
                onClick={onAddToProfile}
                className="group/btn inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-700 text-white font-black text-lg shadow-2xl shadow-indigo-500/50 hover:shadow-3xl hover:shadow-indigo-500/70 transition-all duration-300 transform hover:scale-110 active:scale-95 uppercase tracking-wider"
              >
                <Sparkles size={22} className="group-hover/btn:animate-spin" />
                Save This Roadmap
                <Rocket
                  size={22}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-0 {
          animation-delay: 0s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .gradient-dynamic {
          background: linear-gradient(180deg, 
            rgba(99, 102, 241, 0.6) 0%, 
            rgba(139, 92, 246, 0.4) 25%,
            rgba(59, 130, 246, 0.4) 50%,
            rgba(139, 92, 246, 0.4) 75%,
            rgba(99, 102, 241, 0.6) 100%);
        }

        /* Smooth text selection */
        ::selection {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }

        /* Custom scrollbar for content */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
      `}</style>
    </div>
  );
};

export default RoadmapDisplay;
