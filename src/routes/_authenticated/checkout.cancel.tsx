import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { PLANS, type PlanId } from "@/lib/plans";
import { Logo } from "@/components/site/Logo";
import { ArrowLeft, RotateCcw, MessageCircle, ShieldCheck, XCircle } from "lucide-react";

type Search = { plan?: string };

export const Route = createFileRoute("/_authenticated/checkout/cancel")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout cancelled — Mythmind" },
      { name: "description", content: "Your checkout was cancelled. No charge was made." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CancelPage,
});

const ACCENT: Record<string, { from: string; to: string }> = {
  pro: { from: "var(--leaf)", to: "var(--sun)" },
  everest: { from: "var(--ember)", to: "var(--sun)" },
};

function CancelPage() {
  const search = useSearch({ from: "/_authenticated/checkout/cancel" });
  const planId = (search.plan === "everest" ? "everest" : "pro") as PlanId;
  const plan = PLANS[planId];
  const accent = ACCENT[planId] ?? ACCENT.pro;

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.from}, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 size-[520px] rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.to}, transparent 70%)` }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b-2 border-foreground/10">
        <Link to="/app/profile" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display font-bold text-lg">Mythmind</span>
        </div>
        <div className="w-9" />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl">
          <div className="border-2 border-foreground rounded-3xl p-6 sm:p-10 bg-card shadow-[6px_6px_0_0_var(--ink)] text-center animate-fade-in">
            <div className="mx-auto size-20 rounded-full flex items-center justify-center mb-5 border-2 border-foreground/15 bg-background">
              <XCircle className="size-10 text-muted-foreground" strokeWidth={2} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-foreground/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="size-3" /> No charge made
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl mt-4 leading-[1.05] tracking-tight">
              Checkout cancelled.
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              You stepped away from the {plan.name} plan checkout. Nothing was charged — your card is safe.
              Pick up right where you left off, or ping us if something blocked you.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                to="/checkout/$plan"
                params={{ plan: planId }}
                className="inline-flex w-full items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold text-base border-2 border-foreground hover:opacity-90 transition-all active:translate-y-px shadow-[4px_4px_0_0_var(--ink)] hover:shadow-[2px_2px_0_0_var(--ink)]"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  color: "var(--ink)",
                }}
              >
                <RotateCcw className="size-4" /> Retry {plan.name} checkout
              </Link>
              <Link
                to="/app/profile"
                className="inline-flex w-full items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold text-base border-2 border-foreground/30 bg-background hover:border-foreground/60 transition-all"
              >
                Back to app
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t border-foreground/10 text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full">
              <MessageCircle className="size-3.5" />
              Something go wrong?{" "}
              <a href="mailto:hello@mythmind.ai" className="underline hover:text-foreground ml-1">
                Tell us
              </a>
              .
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
