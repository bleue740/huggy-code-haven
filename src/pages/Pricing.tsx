import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Zap, Loader2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANS, FAQ_ITEMS } from "@/config/plans";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PricingPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string, action: string) => {
    if (action === "auth") {
      navigate("/auth");
      return;
    }
    if (action === "contact") {
      window.location.href = "mailto:contact@blink.ai?subject=Blink Enterprise Demo";
      return;
    }

    // Stripe checkout (placeholder until Stripe is connected)
    setLoadingPlan(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      toast.info("Le paiement Stripe sera bientôt disponible.", {
        description: `Plan sélectionné : ${planId}`,
        duration: 5000,
      });
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight">Blink</span>
          </Link>
        </div>
        <Link
          to="/auth"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
          Des plans pour chaque ambition
        </h1>
        <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
          Commencez gratuitement, upgradez quand vous êtes prêt. Pas de surprise, annulez à tout moment.
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              !isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Annuel
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </section>

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isLoading = loadingPlan === plan.id;
          const showStrikethrough = isYearly && plan.monthlyPrice !== null && plan.monthlyPrice > 0;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                plan.highlight
                  ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className={`text-sm font-bold uppercase tracking-wider ${plan.highlight ? 'text-blue-600' : 'text-gray-400'}`}>
                {plan.name}
              </div>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

              <div className="mt-5">
                {price !== null ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900">${price}</span>
                      <span className="text-sm text-gray-400 font-semibold">/mois</span>
                    </div>
                    {showStrikethrough && (
                      <p className="text-xs text-gray-400 mt-1">
                        <span className="line-through">${plan.monthlyPrice}/mois</span>
                        {' · '}Facturé ${price! * 12}/an
                      </p>
                    )}
                    {!showStrikethrough && price === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Gratuit pour toujours</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-black text-gray-900">Sur devis</span>
                    <p className="text-xs text-gray-400 mt-1">Contactez-nous</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id, plan.ctaAction)}
                disabled={isLoading}
                className={`mt-6 w-full py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : plan.ctaAction === 'auth'
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {plan.cta}
              </button>

              <div className="mt-6 pt-5 border-t border-gray-100 flex-1">
                {plan.featuresIntro && (
                  <p className="text-xs font-semibold text-gray-400 mb-3">
                    {plan.featuresIntro}
                  </p>
                )}
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          plan.highlight ? "text-blue-500" : "text-gray-400"
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

      {/* Student Discount */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <GraduationCap size={24} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Réduction étudiante</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Les étudiants bénéficient de 50% de réduction sur le plan Pro.{' '}
              <a
                href="mailto:contact@blink.ai?subject=Student Discount"
                className="text-purple-600 font-semibold hover:underline"
              >
                Contactez-nous →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black text-center mb-8 text-gray-900">
          Questions fréquentes
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-gray-200">
              <AccordionTrigger className="text-left text-gray-900 hover:no-underline font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Blink. Tous droits réservés.
      </footer>
    </main>
  );
}
