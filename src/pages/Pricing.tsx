import React from "react";
import { Link } from "react-router-dom";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black tracking-tight">Pricing</h1>
        <p className="text-neutral-500 mt-3 max-w-2xl">
          Choisis un plan pour débloquer des builds illimités, des déploiements persistants et des options avancées.
        </p>
        <div className="mt-6">
          <Link to="/" className="text-blue-500 underline">← Retour au builder</Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-6">
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
