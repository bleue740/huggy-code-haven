import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, FileText } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function TermsPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-background text-foreground font-['Inter',sans-serif]">
        <header className="border-b border-border px-6 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight">Blink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">About</Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
          <motion.section initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-4">
              <FileText size={24} className="text-primary" />
              <h1 className="text-4xl font-black tracking-tight">Conditions Générales d'Utilisation</h1>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground">Dernière mise à jour : 15 février 2026</motion.p>
          </motion.section>

          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-xl font-bold mb-3">1. Objet</h2>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation
                de la plateforme Blink AI (ci-après « le Service »), éditée par Blink AI SAS. En utilisant le Service,
                vous acceptez sans réserve les présentes CGU.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-xl font-bold mb-3">2. Description du Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blink AI est une plateforme de développement d'applications web alimentée par l'intelligence artificielle.
                Elle permet aux utilisateurs de créer, modifier et déployer des applications React full-stack à partir
                de descriptions en langage naturel. Le Service comprend : la génération de code par IA, l'hébergement
                et le déploiement d'applications, le stockage de données, l'authentification utilisateur, et les
                fonctionnalités de collaboration en temps réel.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <h2 className="text-xl font-bold mb-3">3. Inscription et compte</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>L'inscription est ouverte à toute personne physique majeure ou personne morale.</li>
                <li>Vous devez fournir des informations exactes et les maintenir à jour.</li>
                <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion.</li>
                <li>Un compte est strictement personnel et ne peut être partagé ou cédé.</li>
                <li>Blink AI se réserve le droit de suspendre ou supprimer tout compte en cas de violation des CGU.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <h2 className="text-xl font-bold mb-3">4. Crédits et facturation</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Le Service fonctionne sur un système de crédits. Chaque interaction avec l'IA consomme des crédits
                selon la complexité de la demande.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Les crédits journaliers sont renouvelés automatiquement à minuit UTC.</li>
                <li>Les crédits mensuels sont renouvelés au début de chaque période de facturation.</li>
                <li>Les crédits achetés en recharge (top-up) n'expirent pas tant que le compte est actif.</li>
                <li>Les crédits non utilisés du forfait mensuel ne sont pas reportés (sauf mention contraire du plan).</li>
                <li>En cas d'upgrade, le solde de crédits est ajusté au nouveau plafond, sans cumul.</li>
                <li>Aucun remboursement n'est accordé pour les crédits non consommés, sauf obligation légale.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              <h2 className="text-xl font-bold mb-3">5. Propriété intellectuelle</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Votre code :</strong> Tout code généré par Blink AI à partir de
                vos instructions vous appartient intégralement. Vous pouvez l'utiliser, le modifier, le distribuer
                et le commercialiser librement sans restriction.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong className="text-foreground">Notre plateforme :</strong> La plateforme Blink AI, son interface,
                ses algorithmes, sa documentation et sa marque restent la propriété exclusive de Blink AI SAS.
                Toute reproduction ou utilisation non autorisée est interdite.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5}>
              <h2 className="text-xl font-bold mb-3">6. Utilisation acceptable</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Il est interdit d'utiliser le Service pour :</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Générer du contenu illicite, diffamatoire, discriminatoire ou incitant à la haine</li>
                <li>Créer des applications malveillantes (malware, phishing, scam)</li>
                <li>Contourner les mécanismes de sécurité ou de limitation du Service</li>
                <li>Utiliser des bots ou scripts automatisés pour exploiter le Service</li>
                <li>Revendre ou redistribuer l'accès au Service sans autorisation</li>
                <li>Toute activité contraire aux lois et règlements en vigueur</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} custom={6}>
              <h2 className="text-xl font-bold mb-3">7. Disponibilité et garanties</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le Service est fourni « tel quel ». Blink AI s'efforce d'assurer une disponibilité maximale mais
                ne garantit pas un fonctionnement ininterrompu. Des maintenances programmées et des mises à jour
                peuvent entraîner des interruptions temporaires. Le code généré par l'IA peut contenir des erreurs
                et doit être vérifié avant mise en production.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={7}>
              <h2 className="text-xl font-bold mb-3">8. Limitation de responsabilité</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dans les limites autorisées par la loi, la responsabilité de Blink AI est limitée au montant des
                sommes versées par l'utilisateur au cours des 12 derniers mois. Blink AI ne saurait être tenue
                responsable des dommages indirects, pertes de données, manque à gagner ou interruption d'activité
                résultant de l'utilisation du Service.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={8}>
              <h2 className="text-xl font-bold mb-3">9. Résiliation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vous pouvez supprimer votre compte à tout moment depuis les paramètres. La suppression entraîne
                l'effacement de vos projets sous 30 jours. Blink AI peut résilier votre accès en cas de violation
                des CGU, avec un préavis de 7 jours sauf en cas d'urgence (activité illicite, faille de sécurité).
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={9}>
              <h2 className="text-xl font-bold mb-3">10. Droit applicable et litiges</h2>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents
                de Paris, France. Préalablement à toute action judiciaire, les parties s'engagent à rechercher une
                solution amiable pendant un délai de 30 jours.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={10}>
              <h2 className="text-xl font-bold mb-3">11. Modifications des CGU</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blink AI se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
                notifiés par email ou via la plateforme au moins 30 jours avant l'entrée en vigueur des nouvelles
                conditions. L'utilisation continue du Service après cette date vaut acceptation des nouvelles CGU.
              </p>
            </motion.div>
          </motion.section>
        </div>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Blink. All rights reserved.
        </footer>
      </main>
    </PageTransition>
  );
}
