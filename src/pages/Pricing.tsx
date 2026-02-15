import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Zap, Loader2, GraduationCap, Shield, ChevronRight, Gift } from "lucide-react";
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

function PlanCard({
  plan,
  isAnnual,
  selectedCredits,
  isLoading,
  onToggleAnnual,
  onChangeCredits,
  onSelect,
}: {
  plan: (typeof PLANS)[0];
  isAnnual: boolean;
  selectedCredits: number;
  isLoading: boolean;
  onToggleAnnual: () => void;
  onChangeCredits: (v: number) => void;
  onSelect: () => void;
}) {
  const creditExtra = CREDIT_TIERS.find((t) => t.credits === selectedCredits)?.additionalPrice ?? 0;
  const monthlyTotal = (plan.monthlyPrice ?? 0) + creditExtra;
  const firstMonthTotal = (plan.annualFirstMonthPrice ?? 0) + creditExtra;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col">
      {/* Name & description */}
      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
      <p className="mt-1 text-sm text-gray-400 leading-relaxed min-h-[48px]">
        {plan.description}
      </p>

      {/* Price */}
      <div className="mt-5">
        {plan.monthlyPrice !== null ? (
          <>
            <div className="flex items-baseline gap-2">
              {isAnnual && (
                <span className="text-lg text-gray-500 line-through font-semibold">
                  ${monthlyTotal}
                </span>
              )}
              <span className="text-3xl font-black text-white">
                ${isAnnual ? firstMonthTotal : monthlyTotal}
              </span>
              <span className="text-sm text-gray-500 font-medium">/mo</span>
            </div>
            {isAnnual ? (
              <p className="text-xs text-gray-500 mt-1">
                First month, then ${monthlyTotal}/mo
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
            )}
          </>
        ) : (
          <>
            <span className="text-3xl font-black text-white">Custom</span>
            <p className="text-xs text-gray-500 mt-1">Flexible plans</p>
          </>
        )}
      </div>

      {/* Annual toggle */}
      {plan.hasAnnualToggle && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onToggleAnnual}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${
              isAnnual ? "bg-blue-600" : "bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isAnnual ? "translate-x-[18px]" : ""
              }`}
            />
          </button>
          <span className="text-sm text-gray-400">Annual</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`mt-5 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
          plan.ctaVariant === "primary"
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "border border-white/20 text-white hover:bg-white/5"
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
            onValueChange={(v) => onChangeCredits(Number(v))}
          >
            <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 z-50">
              {CREDIT_TIERS.map((tier) => (
                <SelectItem
                  key={tier.credits}
                  value={String(tier.credits)}
                  className="text-xs text-gray-300 focus:bg-white/10 focus:text-white"
                >
                  {tier.label}
                  {tier.additionalPrice > 0 && (
                    <span className="text-gray-500 ml-1">
                      (+${tier.additionalPrice}/mo)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Features */}
      <div className="mt-6 pt-5 border-t border-white/10 flex-1">
        {plan.featuresIntro && (
          <p className="text-xs font-medium text-gray-500 mb-3">
            {plan.featuresIntro}
          </p>
        )}
        <ul className="space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
              <Check size={15} className="mt-0.5 shrink-0 text-gray-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GiftCardsSection() {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
      <div>
        <h3 className="font-bold text-white text-lg">Gift cards</h3>
        <p className="text-sm text-gray-400 mt-1">
          Send a gift card to your friends.
        </p>
        <button className="mt-3 px-4 py-2 text-sm font-medium rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors">
          View all gift cards
        </button>
      </div>
      <div className="hidden sm:flex items-center justify-center w-24 h-20">
        <Gift size={48} className="text-purple-400" />
      </div>
    </div>
  );
}

function StudentDiscountSection() {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
      <div>
        <h3 className="font-bold text-white">Student discount</h3>
        <p className="text-sm text-gray-400 mt-1">
          Verify your student status and get up to 50% off Blink Pro.
        </p>
      </div>
      <a
        href="mailto:contact@blink.ai?subject=Student Discount"
        className="shrink-0 px-5 py-2.5 text-sm font-medium rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors flex items-center gap-1"
      >
        Learn more
      </a>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
      <div>
        <h3 className="font-bold text-white">Security & compliance</h3>
        <p className="text-sm text-gray-400 mt-1">
          Enterprise-level security and compliance certifications.
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex gap-1.5">
          {['ISO 27001', 'GDPR', 'SOC 2'].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1.5 text-[11px] font-bold bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      <a
        href="mailto:contact@blink.ai?subject=Security"
        className="shrink-0 ml-4 px-5 py-2.5 text-sm font-medium rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
      >
        Learn more
      </a>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const [planAnnual, setPlanAnnual] = useState<Record<string, boolean>>({
    pro: false,
    business: false,
  });
  const [planCredits, setPlanCredits] = useState<Record<string, number>>({
    pro: 100,
    business: 100,
  });

  const handleSelectPlan = async (planId: string, action: string) => {
    if (action === "auth") {
      navigate("/auth");
      return;
    }
    if (action === "contact") {
      window.location.href =
        "mailto:contact@blink.ai?subject=Blink Enterprise Demo";
      return;
    }

    setLoadingPlan(planId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    <main className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Blink
          </span>
        </Link>
        <Link
          to="/auth"
          className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
          Pricing that scales with you
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
          Start for free, upgrade when you're ready. No surprises, cancel
          anytime.
        </p>
      </section>

      {/* Plans grid — 3 columns */}
      <section className="max-w-5xl mx-auto px-6 pb-12 grid md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isAnnual={planAnnual[plan.id] ?? false}
            selectedCredits={planCredits[plan.id] ?? 100}
            isLoading={loadingPlan === plan.id}
            onToggleAnnual={() =>
              setPlanAnnual((prev) => ({
                ...prev,
                [plan.id]: !prev[plan.id],
              }))
            }
            onChangeCredits={(v) =>
              setPlanCredits((prev) => ({ ...prev, [plan.id]: v }))
            }
            onSelect={() => handleSelectPlan(plan.id, plan.ctaAction)}
          />
        ))}
      </section>

      {/* Bottom sections */}
      <section className="max-w-5xl mx-auto px-6 space-y-4 pb-16">
        <GiftCardsSection />
        <StudentDiscountSection />
        <SecuritySection />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-black text-center mb-4 text-white">
          Frequently asked questions
        </h2>
        <p className="text-center text-gray-400 mb-10">
          Want to know how credits work?{" "}
          <Link to="/credits" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
            Learn about credits
          </Link>
        </p>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-white/10"
            >
              <AccordionTrigger className="text-left text-white hover:no-underline font-semibold text-base py-5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
  );
}
