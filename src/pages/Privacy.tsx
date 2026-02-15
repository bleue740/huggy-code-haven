import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Shield } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function PrivacyPage() {
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
              <Shield size={24} className="text-primary" />
              <h1 className="text-4xl font-black tracking-tight">Politique de confidentialité</h1>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground">Dernière mise à jour : 15 février 2026</motion.p>
          </motion.section>

          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-xl font-bold mb-3">1. Responsable du traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blink AI SAS, société par actions simplifiée au capital de 10 000 €, immatriculée au RCS de Paris
                sous le numéro 123 456 789, dont le siège social est situé au 42 rue de l'Innovation, 75001 Paris, France.
                Email : privacy@blink.ai — Téléphone : +33 1 23 45 67 89.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-xl font-bold mb-3">2. Données collectées</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Nous collectons les catégories de données suivantes :</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Données d'identification :</strong> nom, prénom, adresse email, photo de profil (via OAuth Google).</li>
                <li><strong className="text-foreground">Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation, pages visitées, horodatage.</li>
                <li><strong className="text-foreground">Données d'utilisation :</strong> projets créés, messages envoyés à l'IA, crédits consommés, historique de facturation.</li>
                <li><strong className="text-foreground">Données de paiement :</strong> traitées exclusivement par Stripe. Nous ne stockons jamais vos numéros de carte.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <h2 className="text-xl font-bold mb-3">3. Finalités du traitement</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Fourniture et amélioration du service Blink AI</li>
                <li>Gestion des comptes utilisateurs et de l'authentification</li>
                <li>Facturation, gestion des crédits et traitement des paiements</li>
                <li>Support technique et communication avec les utilisateurs</li>
                <li>Analyse statistique anonymisée pour améliorer la plateforme</li>
                <li>Respect des obligations légales et réglementaires</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <h2 className="text-xl font-bold mb-3">4. Base légale du traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le traitement de vos données repose sur : l'exécution du contrat (CGU acceptées lors de l'inscription),
                votre consentement (pour les cookies non essentiels), nos intérêts légitimes (amélioration du service,
                sécurité), et le respect de nos obligations légales.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              <h2 className="text-xl font-bold mb-3">5. Durée de conservation</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Données de compte : conservées pendant la durée de votre inscription + 3 ans après suppression</li>
                <li>Données de facturation : 10 ans (obligation légale comptable)</li>
                <li>Logs de connexion : 12 mois</li>
                <li>Projets et code généré : conservés tant que le compte est actif, supprimés 30 jours après la suppression du compte</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} custom={5}>
              <h2 className="text-xl font-bold mb-3">6. Partage des données</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vos données ne sont jamais vendues. Elles peuvent être partagées avec : nos sous-traitants techniques
                (hébergement cloud, services d'IA), Stripe pour le traitement des paiements, et les autorités
                compétentes si la loi l'exige. Tous nos sous-traitants sont soumis à des obligations de confidentialité
                conformes au RGPD.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={6}>
              <h2 className="text-xl font-bold mb-3">7. Transferts internationaux</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certaines données peuvent être transférées vers des pays tiers (États-Unis) dans le cadre de
                l'utilisation de services cloud. Ces transferts sont encadrés par des clauses contractuelles types
                approuvées par la Commission européenne ou par la décision d'adéquation UE-US Data Privacy Framework.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={7}>
              <h2 className="text-xl font-bold mb-3">8. Vos droits</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong className="text-foreground">Rectification :</strong> corriger vos données inexactes</li>
                <li><strong className="text-foreground">Suppression :</strong> demander l'effacement de vos données</li>
                <li><strong className="text-foreground">Portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong className="text-foreground">Opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong className="text-foreground">Limitation :</strong> demander la limitation du traitement</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Pour exercer vos droits, contactez-nous à privacy@blink.ai. Vous pouvez également introduire une
                réclamation auprès de la CNIL (www.cnil.fr).
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={8}>
              <h2 className="text-xl font-bold mb-3">9. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous utilisons des cookies strictement nécessaires au fonctionnement du service (authentification,
                préférences de session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
                Les cookies de session expirent à la fermeture du navigateur ou après 7 jours d'inactivité.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={9}>
              <h2 className="text-xl font-bold mb-3">10. Sécurité</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement TLS
                en transit, chiffrement au repos des données sensibles, authentification forte, contrôle d'accès
                basé sur les rôles (RLS), audits de sécurité réguliers, et sauvegardes automatiques quotidiennes.
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
