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
  Globe,
  Award,
  ChevronDown,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import { TypewriterEffect } from "../components/ui/typewriter-effect";
import { TextGenerateEffect } from "../components/ui/text-generate-effect";
import { FlipWords } from "../components/ui/flip-words";
import { Button } from "../components/ui/moving-border";
import { HeroParallax } from "../components/ui/hero-parallax";
import { WobbleCard } from "../components/ui/wobble-card";
import Marquee from "react-fast-marquee";
import { EncryptedText } from "../components/ui/encrypted-text"
import { Timeline } from "../components/ui/timeline";

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({
  end,
  suffix = "",
}: {
  end: number;
  suffix?: string;
}) {
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
      { threshold: 0.5 },
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


  const parallaxProducts = [
    {
      title: "Google Careers",
      link: "https://careers.google.com",
      thumbnail: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=600&q=80",
    },
    {
      title: "AI Roadmap Generator",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    },
    {
      title: "Microsoft Jobs",
      link: "https://careers.microsoft.com",
      thumbnail: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80",
    },
    {
      title: "Career AI Coach",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1676618539987-12b8e5a2b9b4?w=600&q=80",
    },
    {
      title: "Amazon Careers",
      link: "https://amazon.jobs",
      thumbnail: "https://images.unsplash.com/photo-1523474438810-b04a2480633c?w=600&q=80",
    },
    {
      title: "Skill Roadmaps",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80",
    },
    {
      title: "Meta Careers",
      link: "https://www.metacareers.com",
      thumbnail: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=600&q=80",
    },
    {
      title: "Progress Tracker",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600&q=80",
    },
    {
      title: "Apple Careers",
      link: "https://jobs.apple.com",
      thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
    },
    {
      title: "Interview Prep",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80",
    },
    {
      title: "Netflix Careers",
      link: "https://jobs.netflix.com",
      thumbnail: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&q=80",
    },
    {
      title: "Data Science Path",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    },
    {
      title: "Spotify Jobs",
      link: "https://www.lifeatspotify.com",
      thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
    },
    {
      title: "DevOps Roadmap",
      link: "#features",
      thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    },
    {
      title: "Stripe Careers",
      link: "https://stripe.com/jobs",
      thumbnail: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
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
            <a
              href="#features"
              className="hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a href="#how" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-indigo-600 transition-colors"
            >
              Reviews
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="px-4 py-2 rounded-md border border-black bg-white text-black text-sm font-medium
      hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200"
                >
                  Login
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  className="px-4 py-2 rounded-md border border-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium
      hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200"
                >
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link to="/home">
                <button className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-black bg-white text-black text-sm font-medium hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200 hover:bg-gradient-to-r from-indigo-600 to-purple-600 hover:text-white">
                  Go to Dashboard
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-14 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-400/20 dark:bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-pink-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <TextGenerateEffect
            words="AI-Powered Career Platform"
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          />

          {/* Headline */}
          <TypewriterEffect
            words={[
              { text: "Launch", className: "text-slate-900 dark:text-white" },
              { text: "Your", className: "text-slate-900 dark:text-white" },
              {
                text: "Dream",
                className:
                  "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent",
              },
              {
                text: "Career",
                className:
                  "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent",
              },
              { text: "with", className: "text-slate-900 dark:text-white" },
              { text: "AI", className: "text-slate-900 dark:text-white" },
            ]}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          />

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover{" "}
            <FlipWords
              words={["Jobs", "Roadmaps", "AI Career Advice"]}
              className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight mb-6 "
            />{" "}
            and grow your career — all in one beautifully designed platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200">
                  Start for Free
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                to="/home"
                className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </SignedIn>
            <Button
              borderRadius="1rem"
              className="flex items-center gap-2 px-4 py-6 text-base font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <a href="#how" className="flex items-center gap-2 ">
                See How It Works
                <ChevronDown size={18} />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Hero Parallax Section ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-950">
        <HeroParallax
          products={parallaxProducts}
          headerContent={
            <div className="max-w-7xl relative mx-auto py-20 md:py-32 px-4 w-full left-0 top-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6 border border-indigo-200 dark:border-indigo-800">
                <Sparkles size={14} />
                Powered by AI
              </div>
              <h2 className="text-4xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-6">
                Your Career,{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Supercharged
                </span>
              </h2>
              <p className="max-w-2xl text-base md:text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                Explore jobs at top companies, generate personalized learning
                roadmaps, and chat with your AI career coach — all in one place.
                Join 50,000+ professionals who accelerated their careers with
                LearnLaunch.
              </p>
            </div>
          }
        />
      </div>

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
      {/* ── Features Section ──────────────────────────────────────────────── */}
<section id="features" className="py-24 px-4">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-14">
      <TextGenerateEffect
        words="Everything You Need"
        className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
      />
      <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
        Supercharge Your{" "}
        <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Job Hunt
        </span>
      </h2>
    </div>

    {/* Wobble Card Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      
      {/* 01. Smart Job Discovery - Spans 2 columns */}
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 h-full bg-indigo-800 min-h-[300px]"
        className=""
      >
        <div className="max-w-xs">
          <Briefcase className="text-white mb-4" size={40} />
          <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            {features[0].title}
          </h2>
          <p className="mt-4 text-left text-base/6 text-neutral-200">
            {features[0].desc}
          </p>
        </div>
        <Rocket className="absolute -right-4 lg:-right-[10%] grayscale filter -bottom-10 object-contain text-white/10" size={200} />
      </WobbleCard>

      {/* 02. AI Roadmap Generator - Spans 1 column */}
      <WobbleCard containerClassName="col-span-1 bg-violet-800 min-h-[300px]">
        <Map className="text-white mb-4" size={40} />
        <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
          {features[1].title}
        </h2>
        <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
          {features[1].desc}
        </p>
      </WobbleCard>

      {/* 03. Career AI Chat - Spans 1 column */}
      <WobbleCard containerClassName="col-span-1 bg-pink-800 min-h-[300px]">
        <MessageSquare className="text-white mb-4" size={40} />
        <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
          {features[2].title}
        </h2>
        <p className="mt-4 text-left text-base/6 text-neutral-200">
          {features[2].desc}
        </p>
      </WobbleCard>

      {/* 04. Progress Tracking & Insights - Spans 2 columns */}
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 bg-blue-900 min-h-[300px]"
      >
        <div className="max-w-sm">
          <TrendingUp className="text-white mb-4" size={40} />
          <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            {features[3].title} & {features[4].title}
          </h2>
          <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
            {features[3].desc} Stay ahead with real-time market intelligence.
          </p>
        </div>
        <Globe className="absolute -right-10 md:-right-[10%] -bottom-10 text-white/10" size={250} />
      </WobbleCard>

      {/* 05. Skill Certification - Spans 3 columns (Full Width) */}
      <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-emerald-800 min-h-[300px]">
        <div className="max-w-sm">
          <Award className="text-white mb-4" size={40} />
          <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            {features[5].title}
          </h2>
          <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
            {features[5].desc}
          </p>
        </div>
        <CheckCircle2 className="absolute -right-10 md:-right-[5%] -bottom-10 text-white/10" size={300} />
      </WobbleCard>

    </div>
  </div>
</section>

      {/* ── How It Works Section ──────────────────────────────────────────── */}
      <section
        id="how"
        className="py-24 bg-white dark:bg-slate-950"
      >
        {/* Section header */}
        <div className="max-w-4xl mx-auto px-4 text-center mb-4">
          <EncryptedText
            text="Step by Step"
            className="font-bold text-xl md:text-xl"
            encryptedClassName="text-neutral-500"
            revealedClassName="dark:text-white text-black"
            revealDelayMs={50}
          />
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 mt-2">
            How{" "}
            <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              It Works
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Four simple steps to launch your career with LearnLaunch.
          </p>
        </div>

        {/* Timeline */}
        <Timeline
          data={[
            {
              title: "Step 01",
              content: (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shrink-0">
                      <Rocket size={18} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Sign Up Free
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Create your account in seconds using your email or Google. No credit card required — you're on your way immediately.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Google OAuth", "Email Sign‑up", "Instant Access"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              title: "Step 02",
              content: (
                <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/50 dark:to-purple-900/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shrink-0">
                      <Briefcase size={18} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Explore Jobs
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Browse AI-curated job listings matched to your profile, skills, and interests. Filter by role, tech stack, location, and company culture.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["AI Matching", "Role Filters", "Company Insights"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-violet-200 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              title: "Step 03",
              content: (
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/50 dark:to-rose-900/30 border border-pink-200 dark:border-pink-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shrink-0">
                      <Map size={18} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Generate Roadmap
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Click "Roadmap" on any job card and instantly receive a personalized, step-by-step learning plan — resources, timelines, and milestones included.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Instant Generation", "Milestone Tracking", "Curated Resources"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-pink-200 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              title: "Step 04",
              content: (
                <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/50 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Land Your Dream Job
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Follow your roadmap, practice with the AI career coach, ace mock interviews, and apply with confidence. Your next chapter starts here.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["AI Coach", "Mock Interviews", "Application Tracker"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* ── Testimonials Section ──────────────────────────────────────────── */}
<section id="testimonials" className="py-24 px-4 overflow-hidden no-scrollbar">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-14">
      
      <EncryptedText
        text="Loved by Learners"
        className="font-bold text-xl md:text-xl"
        encryptedClassName="text-neutral-500"
        revealedClassName="dark:text-white text-black"
        revealDelayMs={50}
      />
      <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
        Real{" "}
        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Success Stories
        </span>
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
        Thousands of learners have launched their dream careers with
        LearnLaunch.
      </p>
    </div>

  </div>

  {/* Marquee — lives outside max-w-7xl so it can scroll full-width without causing a horizontal scrollbar */}
  <div className="w-full overflow-hidden">
    <Marquee
      pauseOnHover={true}
      speed={50}
      gradient={false}
      className="py-4"
    >
      {testimonials.map((t) => (
        <div key={t.name} className="mx-4 w-[350px]">
          <TestimonialCard {...t} />
        </div>
      ))}
    </Marquee>
  </div>
</section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Rocket size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              LearnLaunch
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} LearnLaunch. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-indigo-500 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-indigo-500 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-indigo-500 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
