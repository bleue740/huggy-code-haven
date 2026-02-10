import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    description: "Pour découvrir et expérimenter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Commencer gratuitement",
    ctaStyle: "border border-[#222] text-white hover:bg-white/5",
    highlight: false,
    features: [
      "1 projet actif",
      "100 crédits / mois",
      "Prévisualisation en temps réel",
      "Security scan basique",
      "Publish sur sous-domaine",
    ],
  },
  {
    name: "Pro",
    badge: "Populaire",
    description: "Pour les créateurs sérieux",
    monthlyPrice: 29,
    yearlyPrice: 19,
    cta: "Passer Pro",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-700",
    highlight: true,
    featuresIntro: "Tout le Free, plus :",
    features: [
      "Projets illimités",
      "2 000 crédits / mois",
      "Historique des déploiements",
      "Domaines personnalisés",
      "Security scan avancé",
      "Export ZIP du code",
      "Support prioritaire",
    ],
  },
  {
    name: "Business",
    description: "Pour les équipes en croissance",
    monthlyPrice: 79,
    yearlyPrice: 59,
    cta: "Choisir Business",
    ctaStyle: "border border-[#222] text-white hover:bg-white/5",
    highlight: false,
    featuresIntro: "Tout le Pro, plus :",
    features: [
      "10 000 crédits / mois",
      "Collaboration multi-utilisateurs",
      "Rôles et permissions",
      "Audit de sécurité complet",
      "Sync GitHub",
      "Analytics avancés",
      "SLA 99.9%",
    ],
  },
  {
    name: "Enterprise",
    description: "Solutions sur mesure",
    monthlyPrice: null,
    yearlyPrice: null,
    cta: "Nous contacter",
    ctaStyle: "border border-[#222] text-white hover:bg-white/5",
    highlight: false,
    featuresIntro: "Tout le Business, plus :",
    features: [
      "Crédits illimités",
      "SSO / SAML",
      "Environnements dédiés",
      "Account manager dédié",
      "Formation personnalisée",
      "Contrat & facturation sur mesure",
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-[#111] px-6 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/app")}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-neutral-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Blink</span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Des plans pour chaque ambition
        </h1>
        <p className="mt-4 text-neutral-400 text-lg max-w-xl mx-auto">
          Commencez gratuitement, upgradez quand vous êtes prêt. Pas de surprise, annulez à tout moment.
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 bg-[#111] rounded-full p-1 border border-[#1a1a1a]">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              !isYearly ? "bg-white text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              isYearly ? "bg-white text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Annuel
            <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              -35%
            </span>
          </button>
        </div>
      </section>

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                plan.highlight
                  ? "border-blue-500/50 bg-[#0a0f1a] shadow-[0_0_40px_-12px_rgba(59,130,246,0.3)]"
                  : "border-[#1a1a1a] bg-[#0a0a0a]"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                {plan.name}
              </div>
              <p className="mt-1 text-sm text-neutral-400">{plan.description}</p>

              <div className="mt-5">
                {price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">${price}</span>
                    <span className="text-sm text-neutral-500 font-semibold">/mois</span>
                  </div>
                ) : (
                  <span className="text-2xl font-black">Sur devis</span>
                )}
                {isYearly && price !== null && price > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Facturé ${price * 12}/an
                  </p>
                )}
              </div>

              <button
                className={`mt-6 w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>

              <div className="mt-6 pt-5 border-t border-[#1a1a1a] flex-1">
                {plan.featuresIntro && (
                  <p className="text-xs font-semibold text-neutral-500 mb-3">
                    {plan.featuresIntro}
                  </p>
                )}
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-300">
                      <Check
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          plan.highlight ? "text-blue-400" : "text-neutral-600"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
