import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Zap, Loader2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANS, CREDIT_TIERS, FAQ_ITEMS } from "@/config/plans";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PricingPage() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Per-plan state
  const [planAnnual, setPlanAnnual] = useState<Record<string, boolean>>({
    pro: true,
    business: true,
  });
  const [planCredits, setPlanCredits] = useState<Record<string, number>>({
    pro: 100,
    business: 100,
  });

  const getPrice = (planId: string) => {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || plan.monthlyPrice === null) return null;

    const isAnnual = planAnnual[planId] ?? false;
    const basePrice = isAnnual ? plan.yearlyMonthlyPrice! : plan.monthlyPrice;
    const creditTier = CREDIT_TIERS.find((t) => t.credits === (planCredits[planId] ?? 100));
    const creditExtra = creditTier?.additionalPrice ?? 0;

    return basePrice + creditExtra;
  };

  const handleSelectPlan = async (planId: string, action: string) => {
    if (action === "auth") {
      navigate("/auth");
      return;
    }
    if (action === "contact") {
      window.location.href = "mailto:contact@blink.ai?subject=Blink Enterprise Demo";
      return;
    }

    setLoadingPlan(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      toast.info("Stripe checkout coming soon.", {
        description: `Selected: ${planId} — ${planCredits[planId] ?? 100} credits/mo — ${planAnnual[planId] ? "annual" : "monthly"}`,
        duration: 5000,
      });
    } catch {
      toast.error("Something went wrong");
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
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
          Plans for every ambition
        </h1>
        <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
          Start for free, upgrade when you're ready. No surprises, cancel anytime.
        </p>
      </section>

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const price = getPrice(plan.id);
          const isLoading = loadingPlan === plan.id;
          const isAnnual = planAnnual[plan.id] ?? false;
          const selectedCredits = planCredits[plan.id] ?? 100;

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

              {/* Price */}
              <div className="mt-5">
                {price !== null ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900">${price}</span>
                      <span className="text-sm text-gray-400 font-semibold">/mo</span>
                    </div>
                    {isAnnual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        <span className="line-through">${plan.monthlyPrice + (CREDIT_TIERS.find(t => t.credits === selectedCredits)?.additionalPrice ?? 0)}/mo</span>
                        {' · '}first month, then ${price}/mo
                      </p>
                    )}
                    {price === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Free forever</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-black text-gray-900">Custom</span>
                    <p className="text-xs text-gray-400 mt-1">Contact us</p>
                  </div>
                )}
              </div>

              {/* Annual toggle per plan */}
              {plan.hasAnnualToggle && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPlanAnnual((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))
                    }
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      isAnnual ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        isAnnual ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-gray-500">
                    Annual
                  </span>
                  {isAnnual && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      -20%
                    </span>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => handleSelectPlan(plan.id, plan.ctaAction)}
                disabled={isLoading}
                className={`mt-5 w-full py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
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

              {/* Credit selector */}
              {plan.hasCreditSelector && (
                <div className="mt-3">
                  <Select
                    value={String(selectedCredits)}
                    onValueChange={(v) =>
                      setPlanCredits((prev) => ({ ...prev, [plan.id]: Number(v) }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 z-50">
                      {CREDIT_TIERS.map((tier) => (
                        <SelectItem key={tier.credits} value={String(tier.credits)} className="text-xs">
                          {tier.label}
                          {tier.additionalPrice > 0 && (
                            <span className="text-gray-400 ml-1">(+${tier.additionalPrice}/mo)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Features */}
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
            <h3 className="font-bold text-gray-900">Student discount</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Students get 50% off the Pro plan.{' '}
              <a
                href="mailto:contact@blink.ai?subject=Student Discount"
                className="text-purple-600 font-semibold hover:underline"
              >
                Contact us →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black text-center mb-8 text-gray-900">
          Frequently asked questions
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
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
  );
}
