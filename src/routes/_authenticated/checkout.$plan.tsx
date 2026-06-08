import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createDodoCheckout } from "@/lib/billing.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { PLANS, type PlanId } from "@/lib/plans";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Sparkles,
  Check,
  CreditCard,
  Loader2,
  Zap,
  Clock,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout/$plan")({
  head: () => ({
    meta: [
      { title: "Checkout — Mythmind" },
      { name: "description", content: "Secure checkout for your Mythmind plan." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutPage,
});

const ACCENT: Record<string, { from: string; to: string; chip: string; ring: string }> = {
  pro: {
    from: "var(--leaf)",
    to: "var(--sun)",
    chip: "bg-[color:var(--leaf)]/12 text-[color:var(--leaf)] border-[color:var(--leaf)]/40",
    ring: "ring-[color:var(--leaf)]/30",
  },
  everest: {
    from: "var(--ember)",
    to: "var(--sun)",
    chip: "bg-[color:var(--ember)]/12 text-[color:var(--ember)] border-[color:var(--ember)]/40",
    ring: "ring-[color:var(--ember)]/30",
  },
};

function CheckoutPage() {
  const { plan: planParam } = useParams({ from: "/_authenticated/checkout/$plan" });
  const planId = (planParam === "everest" ? "everest" : "pro") as PlanId;
  const plan = PLANS[planId];
  const other = planId === "pro" ? PLANS.everest : PLANS.pro;
  const accent = ACCENT[planId] ?? ACCENT.pro;

  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState(true);

  // Marquee-of-trust ticker
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % 4), 3200);
    return () => clearInterval(t);
  }, []);

  const priceNum = useMemo(() => Number(plan.price.replace(/[^\d.]/g, "")) || 0, [plan]);
  const subtotal = priceNum;
  const tax = 0;
  const total = subtotal + tax;

  async function goToPayment() {
    if (!agree) {
      toast.error("Please agree to the terms to continue");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createDodoCheckout({ data: { plan: planId } });
      if (!res?.url) throw new Error("Payment link missing");
      toast.success("Opening secure card form…");
      window.location.assign(res.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  const trustItems = [
    { icon: ShieldCheck, label: "PCI-DSS compliant card processing" },
    { icon: Lock, label: "256-bit TLS — your card never touches our servers" },
    { icon: Star, label: "Cancel anytime in one click" },
    { icon: Clock, label: "Activated the moment payment clears" },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.from}, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 size-[520px] rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.to}, transparent 70%)` }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b-2 border-foreground/10">
        <Link
          to="/app/profile"
          className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display font-bold text-lg">Mythmind</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <Lock className="size-3" />
          Secure checkout
        </div>
        <div className="sm:hidden w-9" />
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8 lg:py-14 pb-32 lg:pb-14 animate-fade-in">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-14">
          {/* LEFT — product / summary */}
          <div className="space-y-6">
            <div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest ${accent.chip}`}
              >
                <Sparkles className="size-3" /> {plan.name} plan
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl mt-3 leading-[1.05] tracking-tight">
                You're one tap from{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(120deg, ${accent.from}, ${accent.to})`,
                  }}
                >
                  unstoppable.
                </span>
              </h1>
              <p className="text-muted-foreground mt-3 text-base max-w-md">
                {plan.tagline} Your workforce levels up the second this clears.
              </p>
            </div>

            {/* Product card */}
            <div
              className={`relative border-2 border-foreground rounded-3xl p-5 sm:p-6 bg-card shadow-[6px_6px_0_0_var(--ink)] ring-1 ${accent.ring}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="size-16 rounded-2xl flex items-center justify-center text-2xl font-display font-black shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    color: "var(--ink)",
                  }}
                >
                  {plan.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="font-display font-bold text-xl">Mythmind {plan.name}</h3>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      monthly · billed via Dodo
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-2xl">{plan.price.split("/")[0]}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    / month
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 pt-5 border-t border-foreground/10">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <span
                      className="mt-0.5 size-4 rounded-full inline-flex items-center justify-center shrink-0"
                      style={{ background: accent.from, color: "var(--ink)" }}
                    >
                      <Check className="size-2.5" strokeWidth={4} />
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan switch */}
            <Link
              to="/checkout/$plan"
              params={{ plan: other.id === "free" ? "pro" : other.id }}
              className="block border border-dashed border-foreground/25 rounded-2xl p-4 hover:bg-foreground/[0.03] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Want more?
                  </div>
                  <div className="font-display font-bold text-base mt-0.5">
                    Switch to {other.name} — {other.price}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{other.tagline}</div>
                </div>
                <Zap className="size-5 text-[color:var(--sun)]" />
              </div>
            </Link>

            {/* Order summary */}
            <div className="border-2 border-foreground/15 rounded-3xl p-5 sm:p-6 bg-card">
              <div className="font-display font-bold text-base mb-4">Order summary</div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales tax</span>
                  <span className="font-mono">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-mono">Monthly · auto-renew</span>
                </div>
                <div className="h-px bg-foreground/10 my-3" />
                <div className="flex justify-between items-baseline">
                  <span className="font-display font-bold text-base">Total today</span>
                  <span className="font-display font-black text-2xl">
                    ${total.toFixed(2)}
                    <span className="text-xs font-mono font-normal text-muted-foreground ml-1">
                      USD
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — pay CTA panel */}
          <div className="lg:sticky lg:top-8 self-start space-y-5">
            <div className="border-2 border-foreground rounded-3xl p-6 bg-card shadow-[6px_6px_0_0_var(--ink)] relative overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                }}
              />

              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                <CreditCard className="size-3.5" /> Payment method
              </div>

              {/* Mock card preview (visual only) */}
              <div
                className="mt-3 rounded-2xl p-5 text-[var(--ink)] relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                }}
              >
                <div className="flex items-start justify-between">
                  <Logo className="h-8 w-8" />
                  <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">
                    Mythmind · {plan.name}
                  </div>
                </div>
                <div className="mt-8 font-mono text-lg tracking-[0.25em] opacity-90">
                  •••• •••• •••• ••••
                </div>
                <div className="mt-3 flex items-end justify-between text-[10px] font-mono uppercase tracking-widest opacity-80">
                  <div>
                    <div className="opacity-70">Cardholder</div>
                    {profileQ.isLoading ? (
                      <div className="mt-1 h-4 w-24 rounded bg-[var(--ink)]/15 animate-pulse" />
                    ) : (
                      <div className="text-sm normal-case font-medium">
                        {profileQ.data?.display_name ?? "Your name"}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="opacity-70">Activates</div>
                    <div className="text-sm">Instantly</div>
                  </div>
                </div>
                <div
                  aria-hidden
                  className="absolute -right-6 -bottom-6 size-32 rounded-full opacity-25"
                  style={{ background: "var(--ink)" }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                We hand you off to our PCI-compliant payment partner to enter card details.
                Your card never touches Mythmind servers.
              </p>

              {/* Pay CTA */}
              <button
                onClick={goToPayment}
                disabled={submitting}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold text-base border-2 border-foreground bg-foreground text-background hover:opacity-90 transition-all active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed shadow-[4px_4px_0_0_var(--ink)] hover:shadow-[2px_2px_0_0_var(--ink)]"
                style={{
                  backgroundImage: submitting
                    ? undefined
                    : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  color: submitting ? undefined : "var(--ink)",
                  borderColor: "var(--ink)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Opening secure form…
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> Pay ${total.toFixed(2)} & activate
                  </>
                )}
              </button>

              {/* Agree */}
              <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 accent-[color:var(--sun)]"
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" className="underline hover:text-foreground">
                    Terms
                  </a>{" "}
                  &{" "}
                  <a href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </a>
                  . Subscription renews monthly. Cancel anytime.
                </span>
              </label>

              {/* Card brand strip */}
              <div className="mt-5 pt-4 border-t border-foreground/10 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[color:var(--leaf)]">
                  <ShieldCheck className="size-3.5" /> PCI · DSS
                </div>
                <div className="flex items-center gap-1 opacity-80">
                  {["VISA", "MC", "AMEX", "JCB"].map((b) => (
                    <span
                      key={b}
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-foreground/30 text-foreground/70"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust ticker */}
            <div className="border border-foreground/15 rounded-2xl p-4 bg-card overflow-hidden">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Why this is safe
              </div>
              <div className="relative h-5">
                {trustItems.map((t, i) => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={i}
                      className="absolute inset-0 flex items-center gap-2 text-sm transition-all duration-500"
                      style={{
                        opacity: tick === i ? 1 : 0,
                        transform: `translateY(${tick === i ? 0 : 8}px)`,
                      }}
                    >
                      <Icon className="size-4 text-[color:var(--leaf)]" />
                      <span>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Powered by Dodo Payments, our merchant of record. Questions?{" "}
              <a href="mailto:hello@mythmind.ai" className="underline hover:text-foreground">
                hello@mythmind.ai
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t-2 border-foreground/15 bg-background/95 backdrop-blur-md px-4 py-3 animate-slide-in-right"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {plan.name} · monthly
            </div>
            <div className="font-display font-black text-xl leading-none mt-0.5">
              ${total.toFixed(2)}
              <span className="text-[10px] font-mono font-normal text-muted-foreground ml-1">USD</span>
            </div>
          </div>
          <button
            onClick={goToPayment}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm border-2 border-foreground active:translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[3px_3px_0_0_var(--ink)]"
            style={{
              backgroundImage: submitting
                ? undefined
                : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              color: submitting ? undefined : "var(--ink)",
              borderColor: "var(--ink)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Opening…
              </>
            ) : (
              <>
                <Lock className="size-4" /> Pay & activate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
