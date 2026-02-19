import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Map,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Globe,
  Users,
  Award,
  ChevronDown,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1800;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  gradient,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  gradient: string;
  delay: string;
}) {
  return (
    <div
      className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: delay }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${gradient} shadow-lg`}
      >
        <Icon className="text-white" size={22} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
        {desc}
      </p>
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-indigo-400/30 transition-all duration-300 pointer-events-none" />
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
function TestimonialCard({
  name,
  role,
  quote,
  avatar,
  stars,
}: {
  name: string;
  role: string;
  quote: string;
  avatar: string;
  stars: number;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow duration-300">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
        "{quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-500 to-purple-600">
          {avatar}
        </div>
        <div>
          <p className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
            {name}
          </p>
          <p className="text-slate-400 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: Briefcase,
      title: "Smart Job Discovery",
      desc: "Find tailored job opportunities powered by AI that match your skills, experience, and career goals.",
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-700",
      delay: "0ms",
    },
    {
      icon: Map,
      title: "AI Roadmap Generator",
      desc: "Get a personalized, step-by-step learning path for any company or role — generated in seconds.",
      gradient: "bg-gradient-to-br from-violet-500 to-purple-700",
      delay: "100ms",
    },
    {
      icon: MessageSquare,
      title: "Career AI Chat",
      desc: "Chat with your intelligent career coach anytime — get advice, mock interview prep, and guidance.",
      gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
      delay: "200ms",
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      desc: "Track your skill development, completed milestones, and job application journey in one place.",
      gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
      delay: "300ms",
    },
    {
      icon: Globe,
      title: "Industry Insights",
      desc: "Stay ahead with real-time trends, in-demand skills, and market intelligence for your domain.",
      gradient: "bg-gradient-to-br from-teal-400 to-cyan-600",
      delay: "400ms",
    },
    {
      icon: Award,
      title: "Skill Certification",
      desc: "Earn achievements and certifications as you complete roadmap milestones and upskill your profile.",
      gradient: "bg-gradient-to-br from-emerald-400 to-green-600",
      delay: "500ms",
    },
  ];

  const stats = [
    { value: 50000, suffix: "+", label: "Active Learners" },
    { value: 1200, suffix: "+", label: "Job Listings" },
    { value: 98, suffix: "%", label: "Success Rate" },
    { value: 300, suffix: "+", label: "Roadmaps Generated" },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "SDE @ Google",
      quote:
        "LearnLaunch's roadmap feature gave me a clear, actionable path. I went from confused to Google-hired in 6 months!",
      avatar: "PS",
      stars: 5,
    },
    {
      name: "Arjun Mehta",
      role: "Data Scientist @ Amazon",
      quote:
        "The AI chat coach helped me crack my data science interviews. It felt like having a personal mentor on demand.",
      avatar: "AM",
      stars: 5,
    },
    {
      name: "Aisha Patel",
      role: "Product Manager @ Flipkart",
      quote:
        "I love how quickly a roadmap was generated for my dream company. Saved me weeks of aimless browsing.",
      avatar: "AP",
      stars: 5,
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Sign Up Free",
      desc: "Create your account in seconds using your email or Google.",
    },
    {
      step: "02",
      title: "Explore Jobs",
      desc: "Browse AI-curated job listings matched to your profile and interests.",
    },
    {
      step: "03",
      title: "Generate Roadmap",
      desc: "Click 'Roadmap' on any job card and get a tailored learning plan instantly.",
    },
    {
      step: "04",
      title: "Land Your Dream Job",
      desc: "Follow your roadmap, chat with the AI coach, and ace your interviews.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
            ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-800"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Rocket size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              LearnLaunch
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Reviews</a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:opacity-90 shadow transition-opacity">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                to="/home"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:opacity-90 shadow transition-opacity"
              >
                Go to Dashboard →
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-400/20 dark:bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-pink-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6 border border-indigo-200 dark:border-indigo-700">
            <Sparkles size={14} />
            AI-Powered Career Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="text-slate-900 dark:text-white">Launch Your</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Dream Career
            </span>
            <br />
            <span className="text-slate-900 dark:text-white">with AI</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover jobs, generate personalized learning roadmaps, and chat with an AI career coach — all in one beautifully designed platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200">
                  Start for Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                to="/home"
                className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </SignedIn>
            <a
              href="#how"
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              See How It Works
              <ChevronDown size={18} />
            </a>
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            {[
              "No credit card required",
              "Free forever plan",
              "AI-generated roadmaps",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {stats.map(({ value, suffix, label }) => (
            <div key={label}>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                <AnimatedCounter end={value} suffix={suffix} />
              </p>
              <p className="text-indigo-100 text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4 border border-purple-200 dark:border-purple-800">
              <Zap size={14} />
              Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Supercharge Your{" "}
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Job Hunt
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Powerful AI tools crafted to take you from exploration to employment — faster than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────────────────────── */}
      <section id="how" className="py-24 px-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 text-sm font-medium mb-4 border border-pink-200 dark:border-pink-800">
              <Map size={14} />
              Step by Step
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              How{" "}
              <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                It Works
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Four simple steps to launch your career with LearnLaunch.
            </p>
          </div>

          <div className="relative">
            {/* connector line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 hidden md:block" />

            <div className="space-y-8">
              {steps.map(({ step, title, desc }, i) => {
                const colors = [
                  "from-indigo-500 to-indigo-700",
                  "from-violet-500 to-purple-700",
                  "from-pink-500 to-rose-600",
                  "from-amber-400 to-orange-500",
                ];
                return (
                  <div key={step} className="flex items-start gap-6 group">
                    <div
                      className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white font-extrabold text-lg shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      {step}
                    </div>
                    <div className="pt-3">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ──────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-medium mb-4 border border-amber-200 dark:border-amber-800">
              <Star size={14} />
              Loved by Learners
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Real{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Thousands of learners have launched their dream careers with LearnLaunch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 overflow-hidden shadow-2xl">
            {/* decorative circles */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <Users size={40} className="text-white/80 mx-auto mb-4" />
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Ready to Launch?
              </h2>
              <p className="text-indigo-100 mb-8 text-lg max-w-lg mx-auto">
                Join 50,000+ learners already accelerating their careers. It's free, it's fast, it's powerful.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-indigo-700 bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200">
                      Create Free Account
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    to="/home"
                    className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-indigo-700 bg-white rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    Open Dashboard
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Rocket size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200">LearnLaunch</span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} LearnLaunch. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-indigo-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
