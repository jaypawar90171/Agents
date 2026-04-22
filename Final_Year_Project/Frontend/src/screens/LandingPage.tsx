import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import React, { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    const link1 = document.createElement("link");
    link1.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link1.rel = "stylesheet";
    document.head.appendChild(link1);

    return () => {
      document.head.removeChild(link1);
    };
  }, []);

  return (
    <div className="bg-background text-foreground sans-body">
      <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .serif-anchor { font-family: 'Noto Serif', serif; }
        .sans-body { font-family: 'Inter', sans-serif; }
        .mono-label { font-family: 'Public Sans', sans-serif; }
      `}</style>

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 dark:bg-background/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-headline font-bold text-on-surface">SkillForge</div>
          <div className="hidden md:flex items-center space-gap-8 gap-x-10">
            <a className="text-primary font-bold border-b-2 border-primary mono-label text-xs uppercase tracking-widest" href="#">Discover</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 mono-label text-xs uppercase tracking-widest" href="#">Roadmaps</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 mono-label text-xs uppercase tracking-widest" href="#">AI Chat</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 mono-label text-xs uppercase tracking-widest" href="#">Success Stories</a>
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-on-surface-variant hover:text-primary transition-colors duration-200 mono-label text-xs uppercase tracking-widest">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2 rounded-full font-medium text-sm transition-all active:opacity-80">Get Started</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link to="/home">
                <button className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2 rounded-full font-medium text-sm transition-all active:opacity-80">
                  Dashboard
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="mono-label text-xs uppercase tracking-[0.2em] text-tertiary mb-6 block">Career Evolution Engine</span>
            <h1 className="font-headline text-6xl md:text-7xl leading-tight text-on-surface mb-8">
              Launch Your <span className="italic text-primary dark:text-blue-400">Dream Career</span> with AI
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-lg">
              Navigate the modern workforce with personalized roadmaps, AI-powered job matching, and real-time archival-quality career guidance.
            </p>
            <div className="flex flex-wrap gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 group">
                    Get Started Free
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link to="/home">
                  <button className="bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 group">
                    Go to Dashboard
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                  </button>
                </Link>
              </SignedIn>
              <button className="bg-surface-container-low text-primary px-8 py-4 rounded-xl font-medium hover:bg-surface-container transition-colors flex items-center gap-2">
                See How It Works
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img className="w-full h-full object-cover" data-alt="Sophisticated minimalist workspace with a laptop, fountain pen, and open notebook, bathed in soft morning window light." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp0pyMn_rh5wUzcfuAII7eNNIDSy-k1OtMD61EhARG90Gl3X2RQODzdHkRbvh-gqVvqd674TehyxlBfZ3Eiki2LdiEX1aDf4ke7ujRvph-IH9CalmrHhmNAMqCBDeOf2aXZl_eLgQD6R17WfHoctLd9-lkJo-gdiZB3jLBWTVaUK0maSrpMnfwAZBkghYxSWfB7U_7jW0qqDt-6T5fz2KffT3vAoVh7jaouDbDWHYdATC-lmA9GF5nuyKzI7MGjelLV-Y62h79P2E" />
            </div>
            {/* Floating Glass Card */}
            <div className="absolute -bottom-10 -left-10 bg-card/80 backdrop-blur-2xl p-6 rounded-2xl border border-outline-variant/20 shadow-xl max-w-xs">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
                </div>
                <div>
                  <p className="mono-label text-[10px] uppercase text-outline">AI Status</p>
                  <p className="font-headline text-sm font-bold text-on-surface">Roadmap Optimized</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed italic">"Your path to Senior Product Designer has been recalibrated based on new market trends."</p>
            </div>
          </div>
        </div>
      </section>
      {/* Value Props / Metrics */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <h3 className="font-headline text-4xl text-primary mb-2">50,000+</h3>
              <p className="mono-label text-[10px] uppercase tracking-widest text-on-surface-variant">Active Learners</p>
            </div>
            <div>
              <h3 className="font-headline text-4xl text-primary mb-2">1,200+</h3>
              <p className="mono-label text-[10px] uppercase tracking-widest text-on-surface-variant">Job Listings</p>
            </div>
            <div>
              <h3 className="font-headline text-4xl text-primary mb-2">85%</h3>
              <p className="mono-label text-[10px] uppercase tracking-widest text-on-surface-variant">Success Rate</p>
            </div>
            <div>
              <h3 className="font-headline text-4xl text-primary mb-2">24/7</h3>
              <p className="mono-label text-[10px] uppercase tracking-widest text-on-surface-variant">AI Career Support</p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="mono-label text-xs uppercase tracking-[0.2em] text-tertiary mb-4 block">Capabilities</span>
            <h2 className="font-headline text-5xl text-on-surface">Precision Tools for Modern Professionals</h2>
          </div>
          <p className="text-on-surface-variant max-w-sm mb-2">Curated features designed to eliminate the friction between your current skills and your next big role.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 bg-surface-container-low rounded-2xl transition-all hover:bg-card hover:shadow-lg group">
            <div className="mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl" data-icon="search_insights" style={{ fontVariationSettings: "\'FILL\' 0" }}>search_insights</span>
            </div>
            <h4 className="font-headline text-2xl mb-4">Smart Job Discovery</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">Advanced algorithms that match your unique DNA to roles that actually fit your long-term goals.</p>
          </div>
          {/* Feature 2 */}
          <div className="p-8 bg-surface-container-low rounded-2xl transition-all hover:bg-card hover:shadow-lg group">
            <div className="mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl" data-icon="route" style={{ fontVariationSettings: "\'FILL\' 0" }}>route</span>
            </div>
            <h4 className="font-headline text-2xl mb-4">AI Roadmap Generator</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">Dynamic learning paths that evolve as you progress, closing the gap between intent and mastery.</p>
          </div>
          {/* Feature 3 */}
          <div className="p-8 bg-surface-container-low rounded-2xl transition-all hover:bg-card hover:shadow-lg group">
            <div className="mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl" data-icon="forum" style={{ fontVariationSettings: "\'FILL\' 0" }}>forum</span>
            </div>
            <h4 className="font-headline text-2xl mb-4">Career AI Chat</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">Immediate, archival-quality responses to your complex professional questions and negotiations.</p>
          </div>
          {/* Feature 4 */}
          <div className="p-8 bg-surface-container-low rounded-2xl transition-all hover:bg-card hover:shadow-lg group">
            <div className="mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl" data-icon="analytics" style={{ fontVariationSettings: "\'FILL\' 0" }}>analytics</span>
            </div>
            <h4 className="font-headline text-2xl mb-4">Progress Tracking</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">Visual data mapping of your growth, milestones, and readiness for the global market.</p>
          </div>
          {/* Feature 5 */}
          <div className="p-8 bg-surface-container-low rounded-2xl transition-all hover:bg-card hover:shadow-lg group">
            <div className="mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl" data-icon="workspace_premium" style={{ fontVariationSettings: "\'FILL\' 0" }}>workspace_premium</span>
            </div>
            <h4 className="font-headline text-2xl mb-4">Skill Certification</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">Industry-recognized credentials that validate your expertise and boost your profile visibility.</p>
          </div>
          {/* CTA Card */}
          <div className="p-8 bg-primary rounded-2xl flex flex-col justify-between text-white">
            <h4 className="font-headline text-2xl">Ready to start your ascent?</h4>
            <a className="flex items-center gap-2 mono-label text-xs uppercase tracking-widest hover:underline mt-8" href="#">
              Open Dashboard <span className="material-symbols-outlined text-sm" data-icon="north_east">north_east</span>
            </a>
          </div>
        </div>
      </section>
      {/* How It Works (Editorial Step-by-Step) */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="font-headline text-5xl text-center mb-20">The Archival Process</h2>
          <div className="space-y-32">
            {/* Step 01 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
                  <img className="w-full h-full object-cover" data-alt="A clean, minimalist user interface showing a sign-up form on a high-resolution tablet screen, surrounding by professional stationery." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqayVwiDN2B7dHEfJtpWZrMgynzYoFKxLYHylgNcc2glOMzDmJ4UbmubMF9SBnnuUtjReCnvAbNoy5So5ia-IC7TTtlCRDGLh-dx2k-pv2_hvD1FM3dcbT9utjqhviU7DdMqlfVVY9xnJ-TBWgkLNSWznvBEn1phxGEdOupTqfIUoKY0CPPdopG27bzZkpeMA0sS82XRxzZ1nC7X8owQ0e3artuUNFp8w-GEzUd8L65rxELMZjAPVmBuAFO8S4gYVfGkk-_06lToE" />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="font-headline italic text-7xl text-primary/10 block mb-4">01</span>
                <h3 className="font-headline text-3xl mb-6">Sign Up &amp; Profile Sync</h3>
                <p className="text-on-surface-variant leading-relaxed mb-8">Begin your journey by creating a profile that captures your aspirations. Sync your existing portfolio and LinkedIn to provide the AI with a foundation of your current trajectory.</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-medium">
                    <span className="material-symbols-outlined text-primary text-xl" data-icon="check_circle" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>
                    One-click LinkedIn integration
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium">
                    <span className="material-symbols-outlined text-primary text-xl" data-icon="check_circle" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>
                    Goal assessment survey
                  </li>
                </ul>
              </div>
            </div>
            {/* Step 02 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
                  <img className="w-full h-full object-cover" data-alt="A macro shot of a sleek computer screen displaying a sophisticated job search interface with rich typography and soft blue highlights." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaND1D7TZhcDBmtwTfMsw7mOqOGiRtv024hJKGFb-gmq3RNrRj-tRVX42KQWKXWQtUnc64i9pUrUHXltpspohKvz3Fyj_goX-zaRhunXauU7AXxHFML01zRKnM66GKdzExgnvvtv-R9k7K3o5JIBWaN4afFv975zi2Kmx6SwGrEtelP8YV8but4fRhqhMRv6XGn3d1BmDYehYzOQ5cV3Ywe6_C6g4zqK_kgEbo0qZlGnXN554PnvUPRg0eXSMz7iUefbak8Hkm030" />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="font-headline italic text-7xl text-primary/10 block mb-4">02</span>
                <h3 className="font-headline text-3xl mb-6">Explore Jobs</h3>
                <p className="text-on-surface-variant leading-relaxed mb-8">Access our curated database of premium roles. Our AI filters out the noise, presenting only the opportunities that align with your growth potential and values.</p>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-card rounded-full text-xs mono-label text-outline uppercase">Tech</span>
                  <span className="px-4 py-2 bg-card rounded-full text-xs mono-label text-outline uppercase">Design</span>
                  <span className="px-4 py-2 bg-card rounded-full text-xs mono-label text-outline uppercase">Management</span>
                </div>
              </div>
            </div>
            {/* Step 03 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
                  <img className="w-full h-full object-cover" data-alt="A visual representation of a career roadmap shown on a laptop screen, with nodes connecting different skills and milestones in a clean grid." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB__qbGzyQ-fMKR0bIaVifxulL2FSsHdsLaP9UutEJnDtAKAVIDNr5JAzPmhJkdIRHfm4E2tIuoh_mXnm8i21Kuc4MdXbf5rAkfYt87aIpv04cbSaxzx79DuGYjMPSBTf8S8cpPb-iXAZasA6YbtLpL32HCfiJzTAJLtpjO_SKldUwxOxZc8CGMy_XXAdJIKQuiWAGMoa6zNdlK7eXYN-Nmcf17Lo-LLGTJljkppjX3LFcuAKBgEmGnbK_76lEktZU876t8QjXdNaQ" />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="font-headline italic text-7xl text-primary/10 block mb-4">03</span>
                <h3 className="font-headline text-3xl mb-6">Generate Roadmap</h3>
                <p className="text-on-surface-variant leading-relaxed mb-8">Once you find your target, LearnLaunch constructs a custom learning path. Every module, project, and certification is chosen to maximize your impact during the application process.</p>
                <button className="text-primary font-bold border-b border-primary/30 pb-1 hover:border-primary transition-all">View Sample Roadmap</button>
              </div>
            </div>
            {/* Step 04 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
                  <img className="w-full h-full object-cover" data-alt="An elegant, blurred background of a modern office lobby at sunset, conveying a sense of professional success and prestige." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLEvKmUuFO49OlK4wqlMdOiYUEvPmPng81LSCWEXjCOVPSiW02HedfuPBjhGWugEPS2IgOpkElkSzDIdowjV1zKbZ5oUmDNAyruHjYuKkttOlolaOxvaFYgcto9TCj_67E9ARX088uq2gZKxKyNx89BuLmWXdtb-30KWx2gYpsqyXZnYYUViRp6AmpHek5SVw1PS8Pr1GaHcStjvjhTEGIrlkAfV6QxbRJA7nc1yG0HC3pG6eTB7dBMhP-nkFvsICk3pEzWEzR4t8" />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="font-headline italic text-7xl text-primary/10 block mb-4">04</span>
                <h3 className="font-headline text-3xl mb-6">Land Your Dream Job</h3>
                <p className="text-on-surface-variant leading-relaxed mb-8">Execute your final interview with the backing of our AI negotiation assistant. Secure your position and begin the next chapter of your professional narrative.</p>
                <div className="flex items-center gap-4 p-4 bg-tertiary-fixed rounded-xl border border-tertiary/10">
                  <span className="material-symbols-outlined text-tertiary" data-icon="trophy">trophy</span>
                  <p className="text-sm font-semibold text-on-tertiary-fixed">Average 24% salary increase reported</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Success Stories */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-headline text-5xl mb-4">Real Success Stories</h2>
          <p className="text-on-surface-variant mono-label text-sm uppercase tracking-widest">Profiles in Professional Growth</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-surface-container-low p-10 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-primary mb-6">
                <span className="material-symbols-outlined text-4xl" data-icon="format_quote">format_quote</span>
              </div>
              <p className="font-headline text-xl leading-relaxed text-on-surface mb-8 italic">
                "The AI roadmap wasn't just a list of courses—it was a strategic playbook. I transitioned from Junior Developer to Senior Lead in 14 months."
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
                <img className="w-full h-full object-cover" data-alt="Professional headshot of a smiling young woman with glasses, neutral office background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4VJDOwKx4jdSzyOu4iWqY4Wy52I2xhyoFo2n4t5y56D8ggNHyrjmjfd4XiYP5GmcAG7z3E4WpJcZG3ev7T--Yyemcac2gCEk8d2yTelkqoMvok-jQvofmPQKbr6WHi1t8v4SydbRjbEMUV9xRoCCPZMOeL2oz1z50cNBH2-K53efj_FTyPvEHiHeG8-d1gwmAbeIpkiAYYz1Xm1aiJ1S_aJBFei4CsIp6DIuI5bI2i_8iq_ornexciDU8vansQpZ73FZpvqxYosw" />
              </div>
              <div>
                <p className="font-bold text-sm">Elena Rodriguez</p>
                <p className="text-[10px] mono-label text-outline uppercase tracking-tighter">Senior Lead @ Fintech</p>
              </div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div className="bg-surface-container-low p-10 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-primary mb-6">
                <span className="material-symbols-outlined text-4xl" data-icon="format_quote">format_quote</span>
              </div>
              <p className="font-headline text-xl leading-relaxed text-on-surface mb-8 italic">
                "LearnLaunch understood my career gaps better than I did. The AI Chat helped me navigate a difficult salary negotiation with total confidence."
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
                <img className="w-full h-full object-cover" data-alt="Headshot of a middle-aged man in a tailored navy suit, looking confident and professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiS9SKMbnUXSTevAOhUfY9RbGKPz6NnzhDdrzaTm6IqfWvJT6jK6E5idqf1IizmsyM21j15Dan-6agi-MXN373O1on3hWCF5gDrlb6C5h0Hm5SIJefrGv_LsHm4kaERit2CsrSpAnKvK7PygzVYGAMKg9MKdPyJAEAoO312YpD5dorutRnkyk-LrJdDqYImgND9ytJnhqTx1KLiyekmZXpa4h-xFBKy_uXKstjd_d-Iv66SdBOcnUKTJGvjBsHKE74-CvbZivmCA8" />
              </div>
              <div>
                <p className="font-bold text-sm">Marcus Chen</p>
                <p className="text-[10px] mono-label text-outline uppercase tracking-tighter">Director of Operations</p>
              </div>
            </div>
          </div>
          {/* Testimonial 3 */}
          <div className="bg-surface-container-low p-10 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-primary mb-6">
                <span className="material-symbols-outlined text-4xl" data-icon="format_quote">format_quote</span>
              </div>
              <p className="font-headline text-xl leading-relaxed text-on-surface mb-8 italic">
                "Finally, a career platform that feels premium. The interface is distraction-free, allowing me to focus on the work that actually matters."
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
                <img className="w-full h-full object-cover" data-alt="Portrait of a creative professional with a vibrant background, smiling warmly." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaYzzkPwjZM5isGGhRK63xMsMhEKuvN84N-3f7FJhA_TRtKgz8I3ujiDVbPmxcRD7EJ65kxLuhGC2JD-sAduo8Mu4bkrCI0ejhk8MUVVCExALh0EQFaJEg7QJDr_vW4W-PhR7Rh9gbip1f9RdCYwJdnTq8_P56OqOOoguYjgOzYAxNtqHB4WXrSEJY5pOwkXxf7uR7yPRUiX91ISVflHH9AQPb6a-xRwBnAa-33vOI0kKjGIEMXv_w5AvDVYmeZZ44TyqdtXUda0g" />
              </div>
              <div>
                <p className="font-bold text-sm">Sarah Jenkins</p>
                <p className="text-[10px] mono-label text-outline uppercase tracking-tighter">Freelance Art Director</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <section className="py-32 bg-primary overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-[100px] -ml-48 -mb-48"></div>
        </div>
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="font-headline text-5xl md:text-6xl text-white mb-10">Ready to Curate Your Future?</h2>
          <p className="text-on-primary-container text-lg mb-12 max-w-2xl mx-auto">Join thousands of professionals who have already redefined their professional narrative with LearnLaunch.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-on-primary-container transition-colors">Start Free Roadmap</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link to="/home">
                <button className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-on-primary-container transition-colors">Continue Your Roadmap</button>
              </Link>
            </SignedIn>
            <button className="border border-white/30 text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">Contact Enterprise</button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full border-t border-outline-variant/15">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 w-full max-w-7xl mx-auto">
          <div className="mb-8 md:mb-0">
            <div className="text-xl font-headline italic text-primary mb-4">LearnLaunch</div>
            <p className="text-outline text-sm max-w-xs">© 2024 LearnLaunch. Archival quality career curation.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6 justify-center">
            <a className="text-outline hover:underline decoration-primary/50 mono-label text-xs uppercase tracking-widest" href="#">Privacy Policy</a>
            <a className="text-outline hover:underline decoration-primary/50 mono-label text-xs uppercase tracking-widest" href="#">Terms of Service</a>
            <a className="text-outline hover:underline decoration-primary/50 mono-label text-xs uppercase tracking-widest" href="#">AI Ethics</a>
            <a className="text-outline hover:underline decoration-primary/50 mono-label text-xs uppercase tracking-widest" href="#">Contact Us</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
