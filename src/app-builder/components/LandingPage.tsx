import React, { useState, useRef, useEffect } from 'react';
import { Plus, Zap, ArrowUp, Layout, Calendar, Briefcase, ChevronRight, Sparkles, Menu, X, Code, Monitor, Rocket, FolderTree, Shield, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LandingPageProps {
  onStart: (prompt: string) => void;
  isAuthenticated?: boolean;
}

interface Suggestion {
  icon: string;
  title: string;
  prompt: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Layout: <Layout size={14} className="text-blue-500" />,
  Zap: <Zap size={14} className="text-orange-500" />,
  Calendar: <Calendar size={14} className="text-blue-600" />,
  Briefcase: <Briefcase size={14} className="text-emerald-500" />,
  Code: <Code size={14} className="text-purple-500" />,
  Shield: <Shield size={14} className="text-cyan-500" />,
  Monitor: <Monitor size={14} className="text-pink-500" />,
  Rocket: <Rocket size={14} className="text-red-500" />,
};

const defaultSuggestions: Suggestion[] = [
  { icon: "Layout", title: "AI Landing Page Builder", prompt: "Build a modern AI-powered landing page with a hero section, feature grid, pricing cards, testimonials carousel, and a CTA with gradient effects. Use dark theme with blue accents." },
  { icon: "Zap", title: "SaaS Dashboard for Analytics", prompt: "Create a SaaS analytics dashboard with sidebar navigation, KPI cards, line/bar charts, a data table with filters, and a dark glassmorphism design." },
  { icon: "Calendar", title: "Booking System for Doctors", prompt: "Build a doctor appointment booking system with a calendar view, time slot picker, patient form, booking confirmation, and appointment list. Clean medical UI." },
  { icon: "Briefcase", title: "Project Management Tool", prompt: "Create a project management tool with kanban board, task cards with drag indicators, project sidebar, team avatars, and progress tracking. Modern dark UI." },
];

interface ShowcaseItem {
  id: string;
  title: string;
  description: string | null;
  deploy_url: string;
}

const mockShowcases: ShowcaseItem[] = [
  { id: '1', title: 'TaskFlow Pro', description: 'A beautiful project management app with kanban boards and team collaboration.', deploy_url: '#' },
  { id: '2', title: 'FitTrack AI', description: 'AI-powered fitness tracking with workout plans and nutrition insights.', deploy_url: '#' },
  { id: '3', title: 'InvoiceSnap', description: 'Smart invoicing tool with automatic payment reminders and analytics.', deploy_url: '#' },
  { id: '4', title: 'LearnHub', description: 'Online course platform with progress tracking and interactive quizzes.', deploy_url: '#' },
  { id: '5', title: 'BookMyDoc', description: 'Doctor appointment scheduler with real-time availability and reminders.', deploy_url: '#' },
  { id: '6', title: 'ShopDash', description: 'E-commerce analytics dashboard with sales trends and inventory alerts.', deploy_url: '#' },
];

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay: delay / 1000, ease: [0, 0, 0.2, 1] as const }}
    className={className}
  >
    {children}
  </motion.div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, isAuthenticated }) => {
  const [inputValue, setInputValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(defaultSuggestions);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [showcasesLoaded, setShowcasesLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Fetch community showcases
  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const { data, error } = await supabase
          .from('community_showcases')
          .select('id, title, description, deploy_url')
          .gt('expires_at', new Date().toISOString())
          .order('score', { ascending: false })
          .limit(6);
        if (!error && data && data.length > 0) {
          setShowcases(data);
        }
      } catch { /* fallback to mock */ }
      setShowcasesLoaded(true);
    };
    fetchShowcases();
  }, []);

  const handleSuggestionClick = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const refreshSuggestions = async () => {
    if (isRefreshing || refreshCooldown) return;
    setIsRefreshing(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // Keep current suggestions on error
    }
    setIsRefreshing(false);
    setRefreshCooldown(true);
    setTimeout(() => setRefreshCooldown(false), 10000);
  };

  const features = [
    { icon: <Code size={22} />, color: 'text-blue-400 bg-blue-500/10', title: 'AI Code Generation', desc: 'Describe what you want, get production-ready React code.' },
    { icon: <Monitor size={22} />, color: 'text-emerald-400 bg-emerald-500/10', title: 'Real-time Preview', desc: 'See your app update live as AI writes code.' },
    { icon: <Rocket size={22} />, color: 'text-orange-400 bg-orange-500/10', title: 'One-click Deploy', desc: 'Publish your app to the web instantly.' },
    { icon: <FolderTree size={22} />, color: 'text-purple-400 bg-purple-500/10', title: 'Multi-file Projects', desc: 'Full project structure with multiple components.' },
    { icon: <Shield size={22} />, color: 'text-cyan-400 bg-cyan-500/10', title: 'Security Scan', desc: 'Automated security analysis of your codebase.' },
    { icon: <RefreshCw size={22} />, color: 'text-pink-400 bg-pink-500/10', title: 'Smart Iterations', desc: 'Refine and iterate with natural language.' },
  ];

  const steps = [
    { num: 1, icon: <MessageSquare size={24} />, title: 'Describe your idea', desc: 'Type what you want to build in plain English.' },
    { num: 2, icon: <Sparkles size={24} />, title: 'AI builds it', desc: 'Watch as real React code is generated in seconds.' },
    { num: 3, icon: <Rocket size={24} />, title: 'Deploy instantly', desc: 'Publish your app live with one click.' },
  ];

  const [dynamicStats, setDynamicStats] = useState([
    { value: '—', label: 'Apps built' },
    { value: '—', label: 'Deployments' },
    { value: '100%', label: 'Open source' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ count: projectCount }, { count: deployCount }] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('deployments').select('id', { count: 'exact', head: true }),
        ]);
        setDynamicStats([
          { value: `${projectCount ?? 0}+`, label: 'Apps built' },
          { value: `${deployCount ?? 0}+`, label: 'Deployments' },
          { value: '100%', label: 'Open source' },
        ]);
      } catch { /* keep defaults */ }
    };
    fetchStats();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      onStart(inputValue);
    } else {
      onStart("Build a modern SaaS application with analytics");
    }
  };

  const scrollTo = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayedShowcases = showcases.length > 0 ? showcases : mockShowcases;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-['Inter',sans-serif] selection:bg-blue-600/30 overflow-x-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 h-[1000px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-gradient-to-b from-blue-500/10 dark:from-blue-900/20 via-transparent to-transparent blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 transition-colors">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2 cursor-pointer group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap size={20} fill="currentColor" />
            </div>
            Blink
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">How it works</button>
            <button onClick={() => scrollTo('community')} className="text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">Community</button>
            <Link to="/pricing" className="text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden sm:inline-block text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Sign in
          </Link>
          <button
            onClick={() => onStart("")}
            className="hidden sm:flex bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[13px] font-[800] shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 items-center gap-1.5 whitespace-nowrap"
          >
            Get started <ChevronRight size={14} />
          </button>
          <ThemeToggle />
          <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#050505] flex flex-col pt-24 px-8 animate-in fade-in slide-in-from-top-4 duration-200">
          <button className="absolute top-6 right-6 text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white" onClick={() => setIsMenuOpen(false)}>
            <X size={28} />
          </button>
          <div className="space-y-6">
            <button onClick={() => scrollTo('features')} className="block text-2xl font-black text-gray-900 dark:text-white">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="block text-2xl font-black text-gray-900 dark:text-white">How it works</button>
            <button onClick={() => scrollTo('community')} className="block text-2xl font-black text-gray-900 dark:text-white">Community</button>
            <Link to="/pricing" className="block text-2xl font-black text-gray-900 dark:text-white" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link to="/about" className="block text-2xl font-black text-gray-900 dark:text-white" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/auth" className="block text-2xl font-black text-gray-500 dark:text-neutral-400" onClick={() => setIsMenuOpen(false)}>Sign in</Link>
          </div>
          <div className="mt-12">
            <button
              onClick={() => { setIsMenuOpen(false); onStart(""); }}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2"
            >
              Get started for free <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="max-w-5xl mx-auto pt-20 pb-20 px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-[12px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.15em] mb-12 border border-blue-500/20 shadow-sm">
          <Sparkles size={14} /> AI-POWERED APP BUILDER
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-[110px] font-black mb-8 sm:mb-12 tracking-tight leading-[0.85] text-gray-900 dark:text-white">
          Build any SaaS <br />
          <span className="italic text-blue-500 font-medium">instantly.</span>
        </h1>

        <p className="text-gray-500 dark:text-neutral-400 text-lg sm:text-xl md:text-2xl max-w-3xl mb-10 sm:mb-16 leading-relaxed font-medium px-2">
          Describe your project, Blink does the rest. AI-generated code, UI, dashboards, and data tables in seconds.
        </p>

        <div className="w-full max-w-4xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-[24px] sm:rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)] p-5 sm:p-8 md:p-10 mb-12 sm:mb-20 group transition-all hover:border-blue-500/30 focus-within:ring-8 focus-within:ring-blue-500/5">
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none focus:ring-0 text-lg sm:text-2xl md:text-3xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-neutral-700 resize-none h-28 sm:h-40 scrollbar-none outline-none font-bold leading-tight"
            placeholder="Build a CRM for real estate with client tracking..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
          />
          <div className="flex items-center justify-between mt-5 sm:mt-8 pt-5 sm:pt-8 border-t border-gray-200 dark:border-white/5">
            <div className="flex items-center gap-6">
              <button className="text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors"><Plus size={28} /></button>
              <div className="hidden sm:flex items-center gap-3">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                 <span className="text-[13px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Advanced Model Active</span>
              </div>
            </div>
            <button
              onClick={() => handleSubmit()}
              className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:bg-blue-500 hover:scale-110 transition-all active:scale-95"
            >
              <ArrowUp size={32} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Suggestions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.title}-${idx}`}
              onClick={() => handleSuggestionClick(item.prompt)}
              className="flex flex-row sm:flex-col items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-8 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl sm:rounded-[32px] hover:border-blue-500/50 hover:bg-gray-100 dark:hover:bg-[#161616] transition-all shadow-sm group"
            >
              <div className="p-3 sm:p-4 bg-gray-100 dark:bg-white/5 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform group-hover:bg-gray-200 dark:group-hover:bg-white/10">
                {iconMap[item.icon] || <Sparkles size={14} className="text-blue-400" />}
              </div>
              <span className="text-[13px] sm:text-[14px] font-black text-gray-900 dark:text-white">{item.title}</span>
            </button>
          ))}
        </div>

        {/* Refresh suggestions button */}
        <button
          onClick={refreshSuggestions}
          disabled={isRefreshing || refreshCooldown}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Generating...' : 'More ideas'}
        </button>
      </section>

      {/* Stats / Social Proof */}
      <AnimatedSection>
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {dynamicStats.map((s, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-gray-400 dark:text-neutral-500 text-sm font-semibold mt-2 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">Everything you need</h2>
            <p className="text-gray-500 dark:text-neutral-400 text-lg max-w-2xl mx-auto">Powerful features to go from idea to production app in minutes, not months.</p>
          </div>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <AnimatedSection key={i} delay={i * 80}>
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-7 hover:border-blue-500/30 transition-all group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${f.color} animate-float`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">How it works</h2>
            <p className="text-gray-500 dark:text-neutral-400 text-lg max-w-2xl mx-auto">Three simple steps to build and ship your app.</p>
          </div>
        </AnimatedSection>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] border-t-2 border-dashed border-gray-200 dark:border-white/10" />
          {steps.map((s, i) => (
            <AnimatedSection key={i} delay={i * 120}>
              <div className="flex flex-col items-center text-center bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 relative">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-lg mb-6 shadow-lg shadow-blue-500/30 relative z-10">
                  {s.num}
                </div>
                <div className="text-gray-900 dark:text-white mb-4">{s.icon}</div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Community Showcase */}
      <section id="community" className="max-w-6xl mx-auto px-6 py-24">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">Community Showcase</h2>
            <p className="text-gray-500 dark:text-neutral-400 text-lg max-w-2xl mx-auto">
              Discover what makers are building with Blink AI. Featured projects rotate every 72 hours.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedShowcases.map((item, i) => (
            <AnimatedSection key={item.id} delay={i * 80}>
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600/10 dark:bg-blue-600/20 text-blue-500 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                    Built with Blink
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 mt-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm leading-relaxed line-clamp-2 mb-5">
                  {item.description || 'An awesome app built with Blink AI.'}
                </p>
                <a
                  href={item.deploy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Visit <ExternalLink size={12} />
                </a>
              </div>
            </AnimatedSection>
          ))}
        </div>
        {showcasesLoaded && showcases.length === 0 && (
          <AnimatedSection>
            <div className="text-center mt-10">
              <p className="text-gray-400 dark:text-neutral-500 text-sm">These are example projects. <span className="text-blue-500 dark:text-blue-400 font-bold">Be the first to showcase your app!</span></p>
            </div>
          </AnimatedSection>
        )}
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-gray-900 dark:text-white">Ready to build?</h2>
          <p className="text-gray-500 dark:text-neutral-400 text-lg mb-10 max-w-xl mx-auto">Join thousands of makers who ship faster with Blink AI.</p>
          <button
            onClick={() => onStart("")}
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-base font-black shadow-2xl shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            Start building for free <ChevronRight size={18} />
          </button>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Zap size={16} fill="currentColor" />
                </div>
                <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Blink AI</span>
              </div>
              <p className="text-gray-400 dark:text-neutral-500 text-sm leading-relaxed">Build production apps with AI in seconds.</p>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-neutral-400">
                <li><button onClick={() => scrollTo('features')} className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</button></li>
                <li><Link to="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/credits" className="hover:text-gray-900 dark:hover:text-white transition-colors">Credits</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-neutral-400">
                <li><Link to="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-neutral-400">
                <li><Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/legal" className="hover:text-gray-900 dark:hover:text-white transition-colors">Legal Notice</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-white/5 mt-12 pt-8 text-center text-gray-400 dark:text-neutral-600 text-sm">
            © 2026 Blink AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
