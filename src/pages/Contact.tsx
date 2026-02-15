import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, MapPin, Phone, Send, Loader2, MessageSquare } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSending(true);
    // Simulate sending — replace with edge function call when needed
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Message envoyé avec succès !", {
      description: "Nous vous répondrons dans les 24 à 48 heures.",
    });
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setSending(false);
  };

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

        <div className="max-w-4xl mx-auto px-6 py-16">
          <motion.section initial="hidden" animate="visible" variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-3 mb-4">
              <MessageSquare size={28} className="text-primary" />
              <h1 className="text-4xl font-black tracking-tight">Contactez-nous</h1>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-xl mx-auto">
              Une question, une suggestion ou besoin d'aide ? Notre équipe est là pour vous répondre
              dans les meilleurs délais.
            </motion.p>
          </motion.section>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact info cards */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
              {[
                { icon: <Mail size={20} />, title: "Email", info: "contact@blink.ai", sub: "Réponse sous 24-48h" },
                { icon: <Phone size={20} />, title: "Téléphone", info: "+33 1 23 45 67 89", sub: "Lun-Ven, 9h-18h (CET)" },
                { icon: <MapPin size={20} />, title: "Adresse", info: "42 rue de l'Innovation", sub: "75001 Paris, France" },
              ].map((item, i) => (
                <motion.div key={item.title} variants={fadeUp} custom={i}>
                  <Card className="border-border">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        <p className="text-sm text-foreground">{item.info}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} custom={3}>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-sm mb-2">Support technique</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pour les problèmes techniques liés à votre compte ou vos projets,
                      utilisez le chat intégré dans l'éditeur Blink ou contactez
                      support@blink.ai.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="md:col-span-2"
            >
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Nom *</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Votre nom complet"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email *</label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Sujet</label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Objet de votre message"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Message *</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Décrivez votre demande en détail..."
                        required
                        rows={6}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>

                    <Button type="submit" disabled={sending} className="w-full sm:w-auto gap-2">
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {sending ? "Envoi en cours…" : "Envoyer le message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Blink. All rights reserved.
        </footer>
      </main>
    </PageTransition>
  );
}
