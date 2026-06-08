import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/phone-auth.functions";

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

type Channel = "email" | "phone";
type PhoneStep = "request" | "verify";

function AuthPage() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel>("phone");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone auth state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("request");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

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

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPhoneOtp({ data: { phone } });
      toast.success("Code sent. Check your SMS.");
      setPhoneStep("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: {
        phone: string;
        code: string;
        name?: string;
        username?: string;
        purpose: "login" | "reset";
      } = { phone, code, purpose: "login" };
      if (mode === "signup") {
        if (!name.trim() || !username.trim()) {
          throw new Error("Add your name and username to finish signup.");
        }
        payload.name = name.trim();
        payload.username = username.trim();
      }
      const { email: syntheticEmail, password: oneTimePassword } = await verifyPhoneOtp({
        data: payload,
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: oneTimePassword,
      });
      if (error) throw error;
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function resetPhoneFlow() {
    setPhoneStep("request");
    setCode("");
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

          {/* Channel tabs */}
          <div className="flex items-center gap-2 mb-4 p-1 rounded-full border-2 border-foreground/15 bg-foreground/[0.03]">
            {(["phone", "email"] as Channel[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setChannel(c);
                  resetPhoneFlow();
                }}
                className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  channel === c
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "phone" ? "Phone" : "Email"}
              </button>
            ))}
          </div>

          {channel === "email" && (
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
          )}

          {channel === "phone" && phoneStep === "request" && (
            <form onSubmit={handleSendCode} className="space-y-3">
              <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Nepali mobile number
              </label>
              <div className="flex items-stretch gap-2">
                <span className="inline-flex items-center px-3 rounded-2xl border-2 border-foreground/20 bg-foreground/[0.03] text-sm font-mono">
                  +977
                </span>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 rounded-2xl border-2 border-foreground/20 bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-[var(--ember)] hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send code"}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                We'll text a 6-digit code. Same code is used for sign in, sign up, and reset.
              </p>
            </form>
          )}

          {channel === "phone" && phoneStep === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Code sent to <span className="font-mono">+977 {phone}</span>
                </span>
                <button
                  type="button"
                  onClick={resetPhoneFlow}
                  className="underline hover:text-foreground"
                >
                  Change
                </button>
              </div>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-2xl border-2 border-foreground/20 bg-background px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:border-foreground focus:outline-none transition-colors"
              />

              {mode === "signup" && (
                <>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    className="w-full rounded-2xl border-2 border-foreground/20 bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())
                    }
                    minLength={3}
                    maxLength={24}
                    className="w-full rounded-2xl border-2 border-foreground/20 bg-background px-4 py-3 text-sm font-mono focus:border-foreground focus:outline-none transition-colors"
                  />
                </>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-[var(--ember)] hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Resend code
              </button>
            </form>
          )}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              resetPhoneFlow();
            }}
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
