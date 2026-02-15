import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Info, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";

const emailSchema = z.string().email("Adresse email invalide");
const passwordSchema = z.string().min(8, "Minimum 8 caractères requis");

export default function AuthPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useSession();

  const from = (location.state as any)?.from || "/";
  const isRedirected = Boolean((location.state as any)?.from);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailValidation = useMemo(() => {
    if (!touched.email || !email) return null;
    const result = emailSchema.safeParse(email);
    return result.success ? { valid: true, message: "Email valide" } : { valid: false, message: result.error.issues[0].message };
  }, [email, touched.email]);

  const passwordValidation = useMemo(() => {
    if (!touched.password || !password) return null;
    const result = passwordSchema.safeParse(password);
    return result.success ? { valid: true, message: "Mot de passe valide" } : { valid: false, message: result.error.issues[0].message };
  }, [password, touched.password]);

  const canSubmit = useMemo(
    () => emailSchema.safeParse(email).success && passwordSchema.safeParse(password).success,
    [email, password]
  );

  React.useEffect(() => {
    if (user) nav(from, { replace: true });
  }, [user, nav, from]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setTouched({ email: true, password: true });
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
        setSuccess("Compte créé ! Vérifie tes emails pour confirmer l'inscription.");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Erreur d'authentification";
      if (msg.includes("Invalid login")) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes("already registered")) {
        setError("Cet email est déjà utilisé. Essaie de te connecter.");
      } else {
        setError(msg);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message ?? "Erreur de connexion Google");
    } finally {
      setGoogleBusy(false);
    }
  };

  const ValidationIcon = ({ validation }: { validation: { valid: boolean; message: string } | null }) => {
    if (!validation) return null;
    return validation.valid ? (
      <CheckCircle2 size={14} className="text-emerald-400" />
    ) : (
      <XCircle size={14} className="text-red-400" />
    );
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Blink
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Build apps with AI</p>
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 shadow-2xl shadow-blue-500/5">
          {isRedirected && (
            <div className="flex items-center gap-2 px-4 py-3 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              <Info size={16} className="shrink-0" />
              <span className="font-medium">Connectez-vous pour continuer</span>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleBusy}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#151515] transition-colors text-sm font-medium disabled:opacity-50"
          >
            {googleBusy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continuer avec Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-xs text-neutral-600 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-xl bg-[#0a0a0a] p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === "login" ? "bg-[#1a1a1a] text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === "signup" ? "bg-[#1a1a1a] text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                className={`w-full bg-[#0a0a0a] border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                  emailValidation
                    ? emailValidation.valid
                      ? "border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20"
                      : "border-red-500/30 focus:ring-2 focus:ring-red-500/20"
                    : "border-[#1a1a1a] focus:ring-2 focus:ring-blue-500/30"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                placeholder="ton@email.com"
              />
              {emailValidation && (
                <div className={`flex items-center gap-1.5 text-xs ${emailValidation.valid ? "text-emerald-400" : "text-red-400"}`}>
                  <ValidationIcon validation={emailValidation} />
                  {emailValidation.message}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                <Lock size={12} /> Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full bg-[#0a0a0a] border rounded-xl px-3 py-2.5 pr-10 text-sm outline-none transition-colors ${
                    passwordValidation
                      ? passwordValidation.valid
                        ? "border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20"
                        : "border-red-500/30 focus:ring-2 focus:ring-red-500/20"
                      : "border-[#1a1a1a] focus:ring-2 focus:ring-blue-500/30"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordValidation && (
                <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.valid ? "text-emerald-400" : "text-red-400"}`}>
                  <ValidationIcon validation={passwordValidation} />
                  {passwordValidation.message}
                </div>
              )}
            </div>

            {/* Error / Success */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <XCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <button
              disabled={!canSubmit || isBusy}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {isBusy ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">
          En continuant, tu acceptes nos conditions d'utilisation.
        </p>
      </section>
    </main>
  );
}
