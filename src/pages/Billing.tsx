import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, TrendingUp, Clock, CreditCard, Plus, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/hooks/useSession";
import { useCredits } from "@/app-builder/hooks/useCredits";
import { useSubscription } from "@/app-builder/hooks/useSubscription";
import { useCreditTransactions, type CreditTransaction } from "@/app-builder/hooks/useCreditTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TOP_UP_PACKS = [
  { amount: 10, price: 5 },
  { amount: 25, price: 10 },
  { amount: 50, price: 18 },
  { amount: 100, price: 30 },
  { amount: 250, price: 65 },
  { amount: 500, price: 110 },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function txTypeLabel(type: string) {
  switch (type) {
    case "deduction": return "Utilisation";
    case "daily_grant": return "Journalier";
    case "monthly_grant": return "Mensuel";
    case "topup": return "Recharge";
    default: return type;
  }
}

function txTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "deduction": return "destructive";
    case "daily_grant": return "secondary";
    case "monthly_grant": return "default";
    case "topup": return "outline";
    default: return "secondary";
  }
}

export default function BillingPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const credits = useCredits();
  const subscription = useSubscription();
  const { transactions, isLoading: txLoading } = useCreditTransactions(100);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const handleTopUp = async (pack: typeof TOP_UP_PACKS[0]) => {
    if (!user) return;
    setPurchasing(pack.amount);
    try {
      // For now without Stripe, we do a direct RPC top-up (demo mode)
      // In production, this would go through a Stripe checkout
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/topup-credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ amount: pack.amount }),
        }
      );
      const result = await resp.json();
      if (!resp.ok || !result.success) {
        throw new Error(result.error || "Échec de la recharge");
      }
      toast.success(`+${pack.amount} crédits ajoutés !`, {
        description: `Nouveau solde : ${result.new_balance} crédits`,
      });
      credits.refetch();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la recharge");
    } finally {
      setPurchasing(null);
      setTopUpOpen(false);
    }
  };

  if (sessionLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
          <p className="text-muted-foreground">Connectez-vous pour accéder à votre facturation.</p>
          <Button asChild><Link to="/auth">Se connecter</Link></Button>
        </div>
      </PageTransition>
    );
  }

  const totalCredits = credits.credits;
  const maxCredits = Math.max(totalCredits, credits.monthlyCredits || 100, 100);
  const usagePercent = Math.min(((maxCredits - totalCredits) / maxCredits) * 100, 100);

  return (
    <PageTransition>
      <main className="min-h-screen bg-background text-foreground font-['Inter',sans-serif]">
        {/* Header */}
        <header className="border-b border-border px-6 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight">Blink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> Retour
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black tracking-tight">Facturation & Crédits</h1>
            <p className="mt-2 text-muted-foreground">Gérez votre abonnement, consultez vos crédits et rechargez.</p>
          </motion.div>

          {/* ── Stats cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard size={14} /> Plan actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {subscription.isPaid ? `Tier ${subscription.creditTier} crédits/mois` : "5 crédits/jour"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap size={14} /> Crédits restants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Number(totalCredits).toFixed(1)}</p>
                <Progress value={100 - usagePercent} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp size={14} /> Total utilisé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Number(credits.lifetimeUsed).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">Depuis la création du compte</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Credit breakdown ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Détail des crédits
                <Button size="sm" variant="outline" onClick={() => setTopUpOpen(true)} className="gap-1">
                  <Plus size={14} /> Recharger
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Mensuels</p>
                  <p className="text-lg font-bold">{Number(credits.monthlyCredits).toFixed(0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Journaliers</p>
                  <p className="text-lg font-bold">{Number(credits.dailyCredits).toFixed(0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Top-up</p>
                  <p className="text-lg font-bold">{Number(credits.topupCredits).toFixed(0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Reset journalier</p>
                  <p className="text-sm font-medium mt-1">
                    {credits.dailyCreditsResetAt
                      ? new Date(credits.dailyCreditsResetAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Transaction history ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune transaction pour le moment.</p>
              ) : (
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Solde</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: CreditTransaction) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(tx.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={txTypeBadgeVariant(tx.type)} className="text-xs">
                              {txTypeLabel(tx.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {tx.description || "—"}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${tx.amount > 0 ? "text-green-500" : "text-destructive"}`}>
                            {tx.amount > 0 ? "+" : ""}{Number(tx.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {Number(tx.balance_after).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Top-up dialog ── */}
        <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Recharger des crédits</DialogTitle>
              <DialogDescription>
                Achetez des crédits supplémentaires. Ils n'expirent pas et s'ajoutent à votre solde.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {TOP_UP_PACKS.map((pack) => (
                <button
                  key={pack.amount}
                  disabled={purchasing !== null}
                  onClick={() => handleTopUp(pack)}
                  className="relative p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent transition-all text-left disabled:opacity-50"
                >
                  {purchasing === pack.amount && (
                    <Loader2 className="absolute top-3 right-3 animate-spin text-primary" size={16} />
                  )}
                  <p className="text-xl font-bold">{pack.amount}</p>
                  <p className="text-xs text-muted-foreground">crédits</p>
                  <p className="mt-2 text-sm font-semibold text-primary">${pack.price}</p>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Blink. All rights reserved.
        </footer>
      </main>
    </PageTransition>
  );
}
