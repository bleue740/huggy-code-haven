import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Info } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0, 0, 0.2, 1] as const } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ── Credit bar demo data ─────────────────────────────── */
const CREDIT_BAR_SEGMENTS = [
  { label: "Used", amount: 15.6, color: "bg-gray-600" },
  { label: "Subscription credits", amount: 62.4, color: "bg-blue-500" },
  { label: "Daily allocation", amount: 12, color: "bg-blue-400" },
  { label: "Top-up credits", amount: 10, color: "bg-cyan-400" },
];

const TOTAL_CREDITS = CREDIT_BAR_SEGMENTS.reduce((s, seg) => s + seg.amount, 0);

/* ── Cost examples ────────────────────────────────────── */
const COST_EXAMPLES = [
  { prompt: "Rendez le bouton gris", work: "Modifie le style des boutons", cost: 0.5 },
  { prompt: "Supprimer le pied de page", work: "Supprime le composant de pied de page", cost: 0.9 },
  { prompt: "Ajouter l'authentification", work: "Ajoute une logique de connexion et d'authentification", cost: 1.2 },
  { prompt: "Créez une page de destination avec des images", work: "Crée une page d'accueil avec des images générées, un thème et des sections", cost: 2.0 },
];

/* ── Plan comparison for credits ──────────────────────── */
const PLAN_CREDIT_COMPARISON = [
  { feature: 'Crédits journaliers', free: '5', pro: '5', business: '5' },
  { feature: 'Plafond mensuel (journaliers)', free: '30', pro: '150', business: '150' },
  { feature: 'Crédits mensuels inclus', free: '—', pro: '100 à 10 000', business: '100 à 10 000' },
  { feature: 'Report de crédits', free: '—', pro: '✓', business: '✓' },
  { feature: 'Recharges ponctuelles', free: '—', pro: '✓', business: '✓' },
];

/* ── Credit bar component ─────────────────────────────── */
function CreditBar() {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
        <span>Crédits cette période</span>
        <span className="font-semibold">
          {(TOTAL_CREDITS - CREDIT_BAR_SEGMENTS[0].amount).toFixed(1)} restants
        </span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
        {CREDIT_BAR_SEGMENTS.map((seg) => {
          const pct = (seg.amount / TOTAL_CREDITS) * 100;
          if (pct <= 0) return null;
          return (
            <Tooltip key={seg.label}>
              <TooltipTrigger asChild>
                <div
                  className={`${seg.color} h-full transition-all cursor-default`}
                  style={{ width: `${pct}%` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#1a1a1a] border-white/10 text-white text-xs">
                {seg.label}: {seg.amount} crédits
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {CREDIT_BAR_SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function CreditsPage() {
  return (
    <PageTransition>
    <main className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-['Inter',sans-serif] overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-white/10 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Blink</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/about" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:inline-block">
            About
          </Link>
          <Link to="/auth" className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Sign in
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        {/* ── Section 1: Introduction ── */}
        <motion.section initial="hidden" animate="visible" variants={stagger}>
          <motion.h1 variants={fadeUp} custom={0} className="text-4xl font-black tracking-tight">Crédits</motion.h1>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-gray-400 leading-relaxed">
            L'envoi de messages pour générer un résultat dans Blink nécessite des crédits.
            Le coût dépend de la complexité du message. Votre espace de travail bénéficie
            de crédits provenant de votre forfait, d'allocations quotidiennes et de
            recharges ponctuelles facultatives.
          </motion.p>
        </motion.section>

        {/* ── Section 2: Viewing credits ── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold">Affichage des crédits</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-400 leading-relaxed">
            Pour consulter votre solde de crédits, sélectionnez le nom de votre espace de
            travail sur le tableau de bord principal ou le nom du projet dans l'éditeur.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}><CreditBar /></motion.div>
          <motion.div variants={fadeUp} custom={3} className="mt-6 space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 transition-colors">
              <div className="w-3 h-3 rounded-full bg-gray-600 mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Partie grise</p>
                <p className="text-sm text-gray-400">Crédits déjà utilisés durant cette période.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 transition-colors">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Parties bleues</p>
                <p className="text-sm text-gray-400">Les différents types de crédits restants. Survolez pour voir le détail.</p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Section 3: Credit usage ── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold">Utilisation des crédits</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-400 leading-relaxed">
            Blink utilise un système basé sur l'utilisation : l'envoi de messages déduit des crédits 
            selon la complexité, afin que vous ne payiez que ce que vous consommez réellement.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto transition-colors">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">Invite</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Travail effectué</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Crédits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COST_EXAMPLES.map((ex) => (
                  <TableRow key={ex.prompt} className="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <TableCell className="font-medium">{ex.prompt}</TableCell>
                    <TableCell className="text-gray-400">{ex.work}</TableCell>
                    <TableCell className="text-right font-mono text-blue-400 font-semibold">{ex.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </motion.section>

        {/* ── Section 4: Credit sources ── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold">Sources de crédits</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-400 leading-relaxed">
            Vos crédits proviennent de trois sources distinctes :
          </motion.p>
          <div className="mt-6 grid gap-4">
            {[
              { title: "Crédits du forfait", desc: "Chaque forfait payant inclut un nombre mensuel de crédits allant de 100 à 10 000 selon le palier choisi.", color: "bg-blue-500" },
              { title: "Allocations quotidiennes", desc: "Tous les plans bénéficient de 5 crédits quotidiens. Plafond mensuel : 30 pour Free, 150 pour Pro et Business.", color: "bg-blue-400" },
              { title: "Recharges ponctuelles (Top-ups)", desc: "Achetez des crédits supplémentaires à tout moment sans changer de forfait. Les crédits achetés n'expirent pas.", color: "bg-cyan-400" },
            ].map((source, i) => (
              <motion.div key={source.title} variants={fadeUp} custom={i + 2} whileHover={{ y: -3, transition: { duration: 0.2 } }} className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 transition-colors">
                <div className={`w-3 h-3 rounded-full ${source.color} mt-1.5 shrink-0`} />
                <div>
                  <h3 className="font-semibold">{source.title}</h3>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">{source.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Section 5: Plan comparison ── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold">Crédits par plan</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-400 leading-relaxed">
            Comparaison des crédits disponibles selon votre formule :
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto transition-colors">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold"></TableHead>
                  <TableHead className="text-gray-400 font-semibold text-center">Free</TableHead>
                  <TableHead className="text-blue-400 font-semibold text-center">Pro</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-center">Business</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLAN_CREDIT_COMPARISON.map((row) => (
                  <TableRow key={row.feature} className="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <TableCell className="font-medium text-sm">{row.feature}</TableCell>
                    <TableCell className="text-center text-sm text-gray-400">{row.free}</TableCell>
                    <TableCell className="text-center text-sm text-gray-400">{row.pro}</TableCell>
                    <TableCell className="text-center text-sm text-gray-400">{row.business}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </motion.section>

        {/* ── Section 6: Upgrade note ── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.div variants={fadeUp} custom={0} className="flex items-start gap-3 p-5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 transition-colors">
            <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Comportement lors d'un upgrade</h3>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Lorsque vous passez à un forfait supérieur (ex : de 100 à 200 crédits), 
                votre solde total est mis à jour au nouveau total. Vous ne recevez pas 200 crédits 
                supplémentaires — si vous aviez 100 crédits mensuels, le passage à 200 vous en donne 
                100 de plus, et non 200.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* ── CTA ── */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center pb-8">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Voir les plans & tarifs
          </Link>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
    </PageTransition>
  );
}
