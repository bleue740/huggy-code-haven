import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function AuthPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useSession();

  const from = (location.state as any)?.from || "/";
  const isRedirected = Boolean((location.state as any)?.from);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canSubmit = useMemo(() => email.length > 0 && password.length > 0, [email, password]);

  React.useEffect(() => {
    if (user) nav(from, { replace: true });
  }, [user, nav, from]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Email invalide ou mot de passe trop court (min 8 caractères).");
      return;
    }

    setIsBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav(from, { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        setError("Compte créé. Vérifie tes emails pour confirmer l'inscription.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Erreur d'authentification");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
        {isRedirected && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            <Info size={16} className="shrink-0" />
            <span className="font-medium">Connectez-vous pour continuer</span>
          </div>
        )}
        <header className="mb-6">
          <h1 className="text-xl font-black tracking-tight">Blink • Auth</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isRedirected
              ? "Vous devez être connecté pour accéder à cette fonctionnalité."
              : mode === "login"
                ? "Connecte-toi pour accéder au builder."
                : "Crée ton compte pour sauvegarder tes projets."}
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500">Email</label>
            <input
              type="email"
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500">Mot de passe</label>
            <input
              type="password"
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <button
            disabled={!canSubmit || isBusy}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-50"
          >
            {isBusy ? "…" : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>

          <div className="text-xs text-neutral-500 text-center">
            {mode === "login" ? (
              <button type="button" className="underline" onClick={() => setMode("signup")}>Créer un compte</button>
            ) : (
              <button type="button" className="underline" onClick={() => setMode("login")}>J'ai déjà un compte</button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
