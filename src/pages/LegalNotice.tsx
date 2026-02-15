import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Scale } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function LegalNoticePage() {
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
              <Scale size={24} className="text-primary" />
              <h1 className="text-4xl font-black tracking-tight">Mentions légales</h1>
            </motion.div>
          </motion.section>

          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-xl font-bold mb-3">Éditeur du site</h2>
              <div className="text-muted-foreground leading-relaxed space-y-1">
                <p><strong className="text-foreground">Raison sociale :</strong> Blink AI SAS</p>
                <p><strong className="text-foreground">Forme juridique :</strong> Société par Actions Simplifiée</p>
                <p><strong className="text-foreground">Capital social :</strong> 10 000 €</p>
                <p><strong className="text-foreground">RCS :</strong> Paris 123 456 789</p>
                <p><strong className="text-foreground">N° TVA intracommunautaire :</strong> FR 12 123456789</p>
                <p><strong className="text-foreground">Siège social :</strong> 42 rue de l'Innovation, 75001 Paris, France</p>
                <p><strong className="text-foreground">Directeur de la publication :</strong> Le Président de Blink AI SAS</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-xl font-bold mb-3">Hébergement</h2>
              <div className="text-muted-foreground leading-relaxed space-y-1">
                <p><strong className="text-foreground">Hébergeur :</strong> Supabase Inc.</p>
                <p><strong className="text-foreground">Adresse :</strong> 970 Toa Payoh North, #07-04, Singapore 318992</p>
                <p><strong className="text-foreground">Infrastructure :</strong> Amazon Web Services (AWS) — Région EU (Irlande)</p>
                <p><strong className="text-foreground">CDN :</strong> Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, USA</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <h2 className="text-xl font-bold mb-3">Contact</h2>
              <div className="text-muted-foreground leading-relaxed space-y-1">
                <p><strong className="text-foreground">Email :</strong> contact@blink.ai</p>
                <p><strong className="text-foreground">Téléphone :</strong> +33 1 23 45 67 89</p>
                <p><strong className="text-foreground">Formulaire :</strong> <Link to="/contact" className="text-primary hover:underline">Page de contact</Link></p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <h2 className="text-xl font-bold mb-3">Propriété intellectuelle</h2>
              <p className="text-muted-foreground leading-relaxed">
                L'ensemble du contenu du site (textes, graphismes, logos, icônes, images, clips audio et vidéo,
                logiciels) est la propriété exclusive de Blink AI SAS ou de ses partenaires et est protégé par
                les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction,
                représentation, modification ou exploitation non autorisée de tout ou partie du site est interdite.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              <h2 className="text-xl font-bold mb-3">Protection des données personnelles</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
                et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité
                de vos données. Pour exercer ces droits, consultez notre{" "}
                <Link to="/privacy" className="text-primary hover:underline">Politique de confidentialité</Link>{" "}
                ou contactez notre DPO à dpo@blink.ai.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5}>
              <h2 className="text-xl font-bold mb-3">Médiation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conformément à l'article L.616-1 du Code de la consommation, en cas de litige non résolu,
                le consommateur peut recourir gratuitement au service de médiation. Le médiateur de la consommation
                est joignable via la plateforme européenne de résolution des litiges en ligne :{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  ec.europa.eu/consumers/odr
                </a>.
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
