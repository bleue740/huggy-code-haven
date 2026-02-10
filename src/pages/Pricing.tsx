import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-[#1a1a1a] px-6 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/app')}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-neutral-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Pricing</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          { name: "Free", price: "$0", perks: ["1 projet", "Publish basique", "Security scan"], highlight: false },
          { name: "Pro", price: "$29", perks: ["Projets illimités", "Deploy history", "Domaines personnalisés"], highlight: true },
          { name: "Team", price: "$79", perks: ["Rôles", "Collaboration", "Audit avancé"], highlight: false },
        ].map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border p-6 bg-[#111] ${p.highlight ? "border-blue-500" : "border-[#1a1a1a]"}`}
          >
            <div className="text-sm font-bold text-neutral-500">{p.name}</div>
            <div className="mt-2 text-3xl font-black">
              {p.price}
              <span className="text-sm font-bold text-neutral-500">/mo</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-neutral-400">
              {p.perks.map((perk) => (
                <li key={perk}>• {perk}</li>
              ))}
            </ul>
            <button className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm">
              Choisir {p.name}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
