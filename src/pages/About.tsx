import React from "react";
import { Link } from "react-router-dom";
import {
  Zap, Rocket, Users, Code2, Shield, User, Palette, Wrench, Building2,
  LayoutDashboard, Globe, ShoppingCart, Settings, Megaphone, GraduationCap, Gamepad2,
  MessageSquare, GitBranch, CloudCog, CheckCircle2
} from "lucide-react";

const WHY_CARDS = [
  { icon: Rocket, title: "Faster iteration", desc: "Go from idea to working software using natural language instead of starting from a blank codebase." },
  { icon: Users, title: "Collaborate when needed", desc: "Work solo or with a team. Blink supports shared workspaces so people with varied roles can contribute in one place." },
  { icon: Code2, title: "Code ownership & flexibility", desc: "Keep full ownership of your code and integrate Blink into your existing workflows." },
  { icon: Shield, title: "Built for enterprise", desc: "Security, privacy, and governance features are built in from the ground up." },
];

const WHO_CARDS = [
  { icon: User, title: "Individual builders", items: ["Founders & entrepreneurs launching MVPs", "Students & educators working on projects", "Indie creators building side projects & prototypes"] },
  { icon: Palette, title: "Product, design & marketing teams", items: ["PMs creating realistic prototypes", "Designers going from mockups to production UI", "Marketers building landing pages & campaign sites"] },
  { icon: Wrench, title: "Technical teams & agencies", items: ["Developers scaffolding projects & internal tools", "Engineering teams reviewing & extending generated code via GitHub", "Agencies delivering client projects with code portability"] },
  { icon: Building2, title: "Enterprises", items: ["Teams building internal tools & business-critical apps", "Organizations with security, compliance & governance requirements", "Companies integrating AI-assisted development into established workflows"] },
];

const BUILD_ITEMS = [
  { icon: LayoutDashboard, label: "SaaS & business apps" },
  { icon: Globe, label: "Consumer web apps" },
  { icon: ShoppingCart, label: "Platforms & e-commerce" },
  { icon: Settings, label: "Internal tools" },
  { icon: Megaphone, label: "Marketing sites & landing pages" },
  { icon: GraduationCap, label: "Educational tools" },
  { icon: Gamepad2, label: "Games & interactive content" },
];

const WORKFLOW_STEPS = [
  { icon: MessageSquare, step: "1", title: "Describe what you want to build", desc: "Use natural language to explain your idea. Blink generates a working application." },
  { icon: CheckCircle2, step: "2", title: "Review and improve the generated app", desc: "Iterate on the result by chatting, editing code, or adjusting the design." },
  { icon: GitBranch, step: "3", title: "Sync code with GitHub", desc: "Push your code to GitHub and integrate with your existing engineering workflows." },
  { icon: CloudCog, step: "4", title: "Deploy, operate, and manage", desc: "Deploy your app and manage it according to your standards." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Blink</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link to="/auth" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Sign in</Link>
        </div>
      </header>

      {/* Section 1 — Introduction */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Blink</h1>
        <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Blink is a complete AI development platform for building, iterating, and deploying web applications using natural language, with real code, enhanced security, and enterprise governance.
        </p>
        <p className="mt-6 text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
          Blink lets individuals and teams create professional-quality web applications using natural language. You describe what you want to build, and Blink generates a working application — frontend, backend, database, authentication, and integrations — all built on editable code. The platform supports the entire modern product development lifecycle, from initial exploration and prototyping through to deployment and ongoing operations.
        </p>
      </section>

      {/* Section 2 — Why use Blink? */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-10">Why use Blink?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_CARDS.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <c.icon size={28} className="text-blue-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Who is Blink for? */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-10">Who is Blink for?</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {WHO_CARDS.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <c.icon size={28} className="text-blue-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-3">{c.title}</h3>
              <ul className="space-y-2">
                {c.items.map((item) => (
                  <li key={item} className="text-sm text-gray-400 leading-relaxed flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — What can you build? */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-10">What can you build?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {BUILD_ITEMS.map((b) => (
            <div key={b.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
              <b.icon size={22} className="text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-300">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5 — Workflow */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-10">How Blink fits your workflow</h2>
        <div className="space-y-5">
          {WORKFLOW_STEPS.map((s) => (
            <div key={s.step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex items-start gap-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
                <span className="text-blue-400 font-black text-lg">{s.step}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6 — Security */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-6">Security, privacy & compliance</h2>
        <p className="text-center text-gray-400 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
          Blink is designed to meet enterprise security and compliance requirements. The platform integrates security, privacy, and governance features from the ground up.
        </p>
        <div className="flex justify-center gap-3 mb-8">
          {["ISO 27001", "GDPR", "SOC 2"].map((badge) => (
            <span key={badge} className="px-4 py-2 text-xs font-bold bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              {badge}
            </span>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
          Blink adapts to your way of working, rather than requiring changes to your workflow.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
  );
}
