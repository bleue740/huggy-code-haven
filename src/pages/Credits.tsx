import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Info } from "lucide-react";
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
  {
    prompt: "Rendez le bouton gris",
    work: "Modifie le style des boutons",
    cost: 0.5,
  },
  {
    prompt: "Supprimer le pied de page",
    work: "Supprime le composant de pied de page",
    cost: 0.9,
  },
  {
    prompt: "Ajouter l'authentification",
    work: "Ajoute une logique de connexion et d'authentification",
    cost: 1.2,
  },
  {
    prompt: "Créez une page de destination avec des images",
    work: "Crée une page d'accueil avec des images générées, un thème et des sections",
    cost: 2.0,
  },
];

/* ── Credit bar component ─────────────────────────────── */
function CreditBar() {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
        <span>Crédits cette période</span>
        <span className="font-semibold text-white">
          {(TOTAL_CREDITS - CREDIT_BAR_SEGMENTS[0].amount).toFixed(1)} restants
        </span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-white/5 border border-white/10">
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
              <TooltipContent
                side="top"
                className="bg-[#1a1a1a] border-white/10 text-white text-xs"
              >
                {seg.label}: {seg.amount} crédits
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      {/* Legend */}
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
          <Link
            to="/pricing"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/auth"
            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        {/* ── Section 1: Introduction ── */}
        <section>
          <h1 className="text-4xl font-black tracking-tight">Crédits</h1>
          <p className="mt-4 text-gray-400 leading-relaxed">
            L'envoi de messages pour générer un résultat dans Blink nécessite des crédits.
            Le coût dépend de la complexité du message. Votre espace de travail bénéficie
            de crédits provenant de votre forfait, d'allocations quotidiennes et de
            recharges ponctuelles facultatives. Cette section explique le fonctionnement
            des crédits, leur utilisation et comment en obtenir davantage en cas de besoin.
          </p>
        </section>

        {/* ── Section 2: Viewing credits ── */}
        <section>
          <h2 className="text-2xl font-bold">Affichage des crédits</h2>
          <p className="mt-3 text-gray-400 leading-relaxed">
            Pour consulter votre solde de crédits, sélectionnez le nom de votre espace de
            travail sur le tableau de bord principal ou le nom du projet dans l'éditeur.
            Vous verrez alors le nombre de crédits restants pour cette période de
            facturation, ainsi que la barre de crédits.
          </p>

          <CreditBar />

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="w-3 h-3 rounded-full bg-gray-600 mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Partie grise</p>
                <p className="text-sm text-gray-400">
                  Indique le nombre de crédits déjà utilisés durant cette période de facturation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Parties bleues</p>
                <p className="text-sm text-gray-400">
                  Indiquent les différents types de crédits restants. En survolant chaque
                  section colorée, une infobulle s'affiche indiquant le type de crédit et
                  le nombre exact de crédits disponibles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Credit usage ── */}
        <section>
          <h2 className="text-2xl font-bold">Utilisation des crédits</h2>
          <p className="mt-3 text-gray-400 leading-relaxed">
            Blink utilise un système de crédits basé sur l'utilisation : l'envoi de
            messages déduit des crédits. Le coût d'un message dépend de sa complexité afin
            que vous ne payiez que ce que vous consommez réellement.
          </p>
          <p className="mt-2 text-gray-400 leading-relaxed">
            De nombreux messages coûtent moins d'un crédit, tandis que les plus complexes
            peuvent coûter davantage. Cette approche permet des modifications plus précises
            et une plus grande efficacité par message, rendant ainsi Blink plus abordable.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">
                    Invite de l'utilisateur
                  </TableHead>
                  <TableHead className="text-gray-400 font-semibold">
                    Travail effectué
                  </TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">
                    Crédits utilisés
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COST_EXAMPLES.map((ex) => (
                  <TableRow key={ex.prompt} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="text-white font-medium">{ex.prompt}</TableCell>
                    <TableCell className="text-gray-400">{ex.work}</TableCell>
                    <TableCell className="text-right font-mono text-blue-400 font-semibold">
                      {ex.cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* ── Section 4: Credit sources ── */}
        <section>
          <h2 className="text-2xl font-bold">Sources de crédits</h2>
          <p className="mt-3 text-gray-400 leading-relaxed">
            Vos crédits proviennent de trois sources distinctes :
          </p>
          <div className="mt-6 grid gap-4">
            {[
              {
                title: "Crédits du forfait",
                desc: "Chaque forfait inclut un nombre mensuel de crédits. Le plan Pro offre 100 crédits/mois, avec la possibilité de passer à 200 ou 500.",
                color: "bg-blue-500",
              },
              {
                title: "Allocations quotidiennes",
                desc: "Tous les plans bénéficient de 5 crédits quotidiens gratuits, accumulables jusqu'à un plafond mensuel (30 pour Free, 150 pour Pro).",
                color: "bg-blue-400",
              },
              {
                title: "Recharges ponctuelles (Top-ups)",
                desc: "Besoin de plus de crédits ? Achetez des recharges à tout moment sans changer de forfait. Les crédits achetés n'expirent pas.",
                color: "bg-cyan-400",
              },
            ].map((source) => (
              <div
                key={source.title}
                className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/10"
              >
                <div className={`w-3 h-3 rounded-full ${source.color} mt-1.5 shrink-0`} />
                <div>
                  <h3 className="font-semibold text-white">{source.title}</h3>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                    {source.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center pb-8">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Voir les plans & tarifs
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
  );
}
