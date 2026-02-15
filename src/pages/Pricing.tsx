import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Loader2, GraduationCap, Shield, ChevronRight, Gift, Info } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANS, CREDIT_TIERS_PRO, CREDIT_TIERS_BUSINESS, FAQ_ITEMS, type CreditTier } from "@/config/plans";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getCreditTiers(planId: string): CreditTier[] {
  if (planId === 'pro') return CREDIT_TIERS_PRO;
  if (planId === 'business') return CREDIT_TIERS_BUSINESS;
  return [];
}

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
  const tiers = getCreditTiers(plan.id);
  const tier = tiers.find((t) => t.credits === selectedCredits);
  const displayPrice = plan.monthlyPrice === null
    ? null
    : tier
      ? (isAnnual ? tier.annualMonthly : tier.monthlyPrice)
      : plan.monthlyPrice;

  return (
    <div className={`rounded-2xl border p-6 flex flex-col transition-colors ${
      plan.highlight
        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5 ring-1 ring-blue-500/20'
        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]'
    }`}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        {plan.badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full">
            {plan.badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed min-h-[48px]">
        {plan.description}
      </p>

      {/* Price */}
      <div className="mt-5">
        {displayPrice !== null ? (
          <>
            <div className="flex items-baseline gap-2">
              {isAnnual && tier && (
                <span className="text-lg text-gray-400 dark:text-gray-500 line-through font-semibold">
                  ${tier.monthlyPrice}
                </span>
              )}
              <span className="text-3xl font-black">
                {displayPrice === 0 ? 'Free' : `$${displayPrice}`}
              </span>
              {displayPrice > 0 && (
                <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">/mo</span>
              )}
            </div>
            {isAnnual && tier ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Facturé ${tier.annualPrice}/an
              </p>
            ) : displayPrice === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pour toujours</p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">&nbsp;</p>
            )}
          </>
        ) : (
          <>
            <span className="text-3xl font-black">Custom</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Plans flexibles</p>
          </>
        )}
      </div>

      {/* Annual toggle */}
      {plan.hasAnnualToggle && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onToggleAnnual}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${
              isAnnual ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isAnnual ? "translate-x-[18px]" : ""
              }`}
            />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Annuel</span>
          {isAnnual && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Économisez ~17%</span>
          )}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`mt-5 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
          plan.ctaVariant === "primary"
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
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
            <SelectTrigger className="h-9 text-xs bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 z-50">
              {tiers.map((t) => (
                <SelectItem
                  key={t.credits}
                  value={String(t.credits)}
                  className="text-xs text-gray-600 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-white/10 focus:text-gray-900 dark:focus:text-white"
                >
                  {t.credits.toLocaleString()} crédits/mois — ${isAnnual ? t.annualMonthly : t.monthlyPrice}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Features */}
      <div className="mt-6 pt-5 border-t border-gray-200 dark:border-white/10 flex-1">
        {plan.featuresIntro && (
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-3">
            {plan.featuresIntro}
          </p>
        )}
        <ul className="space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <Check size={15} className="mt-0.5 shrink-0 text-blue-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Feature comparison table ─────────────────────── */
const COMPARISON_FEATURES = [
  { name: 'Crédits journaliers', free: '5 (max 30/mois)', pro: '5 (max 150/mois)', business: '5 (max 150/mois)' },
  { name: 'Crédits mensuels', free: '—', pro: '100 à 10 000', business: '100 à 10 000' },
  { name: 'Projets privés', free: '✓', pro: '✓', business: '✓' },
  { name: 'Workspace collaboratif illimité', free: '✓', pro: '✓', business: '✓' },
  { name: 'Cloud + AI à l\'usage', free: '✓', pro: '✓', business: '✓' },
  { name: 'Domaines personnalisés', free: '—', pro: '✓', business: '✓' },
  { name: 'Supprimer le badge Blink', free: '—', pro: '✓', business: '✓' },
  { name: 'Mode Code', free: '—', pro: '✓', business: '✓' },
  { name: 'Report de crédits', free: '—', pro: '✓', business: '✓' },
  { name: 'Recharges ponctuelles', free: '—', pro: '✓', business: '✓' },
  { name: 'Rôles et autorisations', free: '—', pro: '✓', business: '✓' },
  { name: 'SSO', free: '—', pro: '—', business: '✓' },
  { name: 'Projets restreints', free: '—', pro: '—', business: '✓' },
  { name: 'Refuser la formation aux données', free: '—', pro: '—', business: '✓' },
  { name: 'Modèles de conception', free: '—', pro: '—', business: '✓' },
];

function FeatureComparisonTable() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-x-auto transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200 dark:border-white/10 hover:bg-transparent">
            <TableHead className="text-gray-500 dark:text-gray-400 font-semibold w-[40%]">Fonctionnalité</TableHead>
            <TableHead className="text-gray-500 dark:text-gray-400 font-semibold text-center">Free</TableHead>
            <TableHead className="text-blue-600 dark:text-blue-400 font-semibold text-center">Pro</TableHead>
            <TableHead className="text-gray-500 dark:text-gray-400 font-semibold text-center">Business</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPARISON_FEATURES.map((f) => (
            <TableRow key={f.name} className="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
              <TableCell className="font-medium text-sm">{f.name}</TableCell>
              <TableCell className="text-center text-sm text-gray-500 dark:text-gray-400">{f.free}</TableCell>
              <TableCell className="text-center text-sm text-gray-500 dark:text-gray-400">{f.pro}</TableCell>
              <TableCell className="text-center text-sm text-gray-500 dark:text-gray-400">{f.business}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GiftCardsSection() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] transition-colors">
      <div>
        <h3 className="font-bold text-lg">Gift cards</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send a gift card to your friends.
        </p>
        <button className="mt-3 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          View all gift cards
        </button>
      </div>
      <div className="hidden sm:flex items-center justify-center w-24 h-20 shrink-0">
        <Gift size={48} className="text-purple-400" />
      </div>
    </div>
  );
}

function StudentDiscountSection() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] transition-colors">
      <div>
        <h3 className="font-bold">Student discount</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Verify your student status and get up to 50% off Blink Pro.
        </p>
      </div>
      <a
        href="mailto:contact@blink.ai?subject=Student Discount"
        className="shrink-0 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
      >
        Learn more
      </a>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] transition-colors">
      <div>
        <h3 className="font-bold">Security & compliance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Enterprise-level security and compliance certifications.
        </p>
        <div className="flex items-center gap-1.5 mt-3 sm:hidden">
          {['ISO 27001', 'GDPR', 'SOC 2'].map((badge) => (
            <span key={badge} className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-500/30">
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex gap-1.5">
          {['ISO 27001', 'GDPR', 'SOC 2'].map((badge) => (
            <span key={badge} className="px-3 py-1.5 text-[11px] font-bold bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-500/30">
              {badge}
            </span>
          ))}
        </div>
      </div>
      <a
        href="mailto:contact@blink.ai?subject=Security"
        className="shrink-0 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
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
      const tiers = getCreditTiers(planId);
      const tier = tiers.find(t => t.credits === (planCredits[planId] ?? 100));
      toast.info("Stripe checkout coming soon.", {
        description: `Selected: ${planId} — ${tier?.credits ?? 100} crédits/mois — $${planAnnual[planId] ? tier?.annualMonthly : tier?.monthlyPrice}/mo`,
        duration: 5000,
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <PageTransition>
    <main className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-['Inter',sans-serif] transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-white/10 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Blink</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/credits" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Credits
          </Link>
          <Link to="/about" className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            About
          </Link>
          <Link to="/auth" className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Sign in
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <motion.section
        className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Pricing that scales with you
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          Start for free, upgrade when you're ready. No surprises, cancel anytime.
        </p>
      </motion.section>

      {/* Plans grid — 4 columns */}
      <motion.section
        className="max-w-6xl mx-auto px-6 pb-12 grid md:grid-cols-4 gap-5"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          >
            <PlanCard
              plan={plan}
              isAnnual={planAnnual[plan.id] ?? false}
              selectedCredits={planCredits[plan.id] ?? 100}
              isLoading={loadingPlan === plan.id}
              onToggleAnnual={() =>
                setPlanAnnual((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))
              }
              onChangeCredits={(v) =>
                setPlanCredits((prev) => ({ ...prev, [plan.id]: v }))
              }
              onSelect={() => handleSelectPlan(plan.id, plan.ctaAction)}
            />
          </motion.div>
        ))}
      </motion.section>

      {/* Upgrade note */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="flex items-start gap-3 p-5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 transition-colors">
          <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong>Note sur les upgrades :</strong> Lorsque vous passez à un forfait supérieur (ex : de 100 à 200 crédits), 
            votre solde total est mis à jour au nouveau total. Vous ne recevez pas 200 crédits supplémentaires — 
            si vous aviez 100 crédits mensuels, le passage à 200 vous en donne 100 de plus.
          </p>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-2">Comparaison des fonctionnalités</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Trouvez le plan qui correspond à vos besoins.
        </p>
        <FeatureComparisonTable />
      </section>

      {/* Bottom sections */}
      <section className="max-w-5xl mx-auto px-6 space-y-4 pb-16">
        <GiftCardsSection />
        <StudentDiscountSection />
        <SecuritySection />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-black text-center mb-4">Questions fréquentes</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">
          Envie de comprendre le fonctionnement des crédits ?{" "}
          <Link to="/credits" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
            En savoir plus sur les crédits
          </Link>
        </p>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-gray-200 dark:border-white/10">
              <AccordionTrigger className="text-left hover:no-underline font-semibold text-base py-5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
    </PageTransition>
  );
}
