import React, { useState } from 'react';
import { Plus, Zap, ArrowUp, Layout, Calendar, Briefcase, ChevronRight, Sparkles, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onStart: (prompt: string) => void;
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, isAuthenticated }) => {
  const [inputValue, setInputValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const suggestions = [
    { icon: <Layout size={14} className="text-blue-500" />, text: "AI Landing Page Builder" },
    { icon: <Zap size={14} className="text-orange-500" />, text: "SaaS Dashboard for Analytics" },
    { icon: <Calendar size={14} className="text-blue-600" />, text: "Booking System for Doctors" },
    { icon: <Briefcase size={14} className="text-emerald-500" />, text: "Project Management Tool" },
  ];

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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter',sans-serif] selection:bg-blue-600/30 overflow-x-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1000px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-gradient-to-b from-blue-900/20 via-transparent to-transparent blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50 border-b border-white/5">
        <div className="flex items-center gap-12">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2 cursor-pointer group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap size={20} fill="currentColor" />
            </div>
            Blink
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Features</button>
            <Link to="/pricing" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="hidden sm:inline-block text-sm font-semibold text-neutral-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <button
            onClick={() => onStart("")}
            className="bg-white text-black px-7 py-3 rounded-2xl text-[14px] font-[800] shadow-xl shadow-white/5 hover:bg-neutral-200 transition-all active:scale-95 flex items-center gap-2"
          >
            Get started for free <ChevronRight size={16} />
          </button>
          <button className="lg:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col pt-24 px-8 animate-in fade-in slide-in-from-top-4 duration-200">
          <button className="absolute top-6 right-6 text-neutral-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>
            <X size={28} />
          </button>
          <div className="space-y-6">
            <button onClick={() => scrollTo('features')} className="block text-2xl font-black text-white">Features</button>
            <Link to="/pricing" className="block text-2xl font-black text-white" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link to="/auth" className="block text-2xl font-black text-neutral-400" onClick={() => setIsMenuOpen(false)}>Sign in</Link>
          </div>
          <div className="mt-12">
            <button
              onClick={() => { setIsMenuOpen(false); onStart(""); }}
              className="w-full bg-white text-black py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2"
            >
              Get started for free <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="max-w-5xl mx-auto pt-20 pb-32 px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-[12px] font-black text-blue-400 uppercase tracking-[0.15em] mb-12 border border-blue-500/20 shadow-sm">
          <Sparkles size={14} /> AI-POWERED APP BUILDER
        </div>

        <h1 className="text-6xl md:text-[110px] font-black mb-12 tracking-tight leading-[0.85] text-white">
          Build any SaaS <br />
          <span className="italic text-blue-500 font-medium">instantly.</span>
        </h1>

        <p className="text-neutral-400 text-xl md:text-2xl max-w-3xl mb-16 leading-relaxed font-medium">
          Describe your project, Blink does the rest. AI-generated code, UI, dashboards, and data tables in seconds.
        </p>

        <div className="w-full max-w-4xl bg-[#111] border border-white/5 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.5)] p-8 md:p-10 mb-20 group transition-all hover:border-blue-500/30 focus-within:ring-8 focus-within:ring-blue-500/5">
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 text-2xl md:text-3xl text-white placeholder-neutral-700 resize-none h-40 scrollbar-none outline-none font-bold leading-tight"
            placeholder="Build a CRM for real estate with client tracking..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
          />
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center gap-6">
              <button className="text-neutral-500 hover:text-white transition-colors"><Plus size={28} /></button>
              <div className="hidden sm:flex items-center gap-3">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                 <span className="text-[13px] font-black text-neutral-500 uppercase tracking-widest">Advanced Model Active</span>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onStart(item.text)}
              className="flex flex-col items-center gap-4 px-6 py-8 bg-[#111] border border-white/5 rounded-[32px] hover:border-blue-500/50 hover:bg-[#161616] transition-all shadow-sm group"
            >
              <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform group-hover:bg-white/10">
                {item.icon}
              </div>
              <span className="text-[14px] font-black text-white">{item.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Features placeholder anchor */}
      <div id="features" />
    </div>
  );
};
