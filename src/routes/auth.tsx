import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Mythmind" },
      { name: "description", content: "Sign in to access your Mythmind AI workforce." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 paper-grid">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <Logo className="h-8 w-8" />
          <span className="font-display font-bold text-xl">
            mythmind<span className="text-[var(--ember)]">.</span>
          </span>
        </Link>

        <div
          className="rounded-3xl border-2 border-foreground bg-background p-7"
          style={{ boxShadow: "6px 6px 0 var(--ink)" }}
        >
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-3xl">
              {mode === "signin" ? "Welcome back." : "Get access."}
            </h1>
            <span className="pill" style={{ background: "var(--sun)" }}>
              {mode === "signin" ? "sign in" : "sign up"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Enter your six AI employees."
              : "Create your account to meet the workforce."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-background py-3 text-sm font-semibold hover:bg-foreground/5 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.7 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.95 14.55 3 12 3 6.98 3 2.9 7.03 2.9 12s4.08 9 9.1 9c5.26 0 8.75-3.68 8.75-8.87 0-.6-.07-1.05-.16-1.53Z"
                fill="currentColor"
              />
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
            <span className="flex-1 h-px bg-foreground/15" />
            or
            <span className="flex-1 h-px bg-foreground/15" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border-2 border-foreground/20 bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none transition-colors"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border-2 border-foreground/20 bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-[var(--ember)] hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up →"
              : "Already have an account? Sign in →"}
          </button>
        </div>
      </div>
    </main>
  );
}
