import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/profile.functions";
import { PLANS, type PlanId } from "@/lib/plans";
import { Logo } from "@/components/site/Logo";
import { Check, Sparkles, ArrowRight, PartyPopper, Rocket, Star } from "lucide-react";

type Search = { plan?: string };

export const Route = createFileRoute("/_authenticated/checkout/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Welcome aboard — Mythmind" },
      { name: "description", content: "Your Mythmind plan is active." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuccessPage,
});

const ACCENT: Record<string, { from: string; to: string }> = {
  pro: { from: "var(--leaf)", to: "var(--sun)" },
  everest: { from: "var(--ember)", to: "var(--sun)" },
};

function SuccessPage() {
  const search = useSearch({ from: "/_authenticated/checkout/success" });
  const planId = (search.plan === "everest" ? "everest" : "pro") as PlanId;
  const plan = PLANS[planId];
  const accent = ACCENT[planId] ?? ACCENT.pro;
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });

  // Refresh profile a few times in case webhook hasn't landed yet
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      n += 1;
      if (n >= 6) clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
  }, [qc]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.4 + Math.random() * 2,
        color: [accent.from, accent.to, "var(--leaf)", "var(--ember)"][i % 4],
        rot: Math.random() * 360,
      })),
    [accent.from, accent.to],
  );

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden flex flex-col">
      {/* Confetti */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute -top-4 w-2 h-3 rounded-sm"
            style={{
              left: `${c.left}%`,
              background: c.color,
              transform: `rotate(${c.rot}deg)`,
              animation: `confetti-fall ${c.dur}s ${c.delay}s linear infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.8; }
        }
        @keyframes pop-in {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Ambient blobs */}
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

      <header className="relative z-10 flex items-center justify-center px-5 sm:px-8 py-4 border-b-2 border-foreground/10">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display font-bold text-lg">Mythmind</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl">
          <div
            className="border-2 border-foreground rounded-3xl p-6 sm:p-10 bg-card shadow-[6px_6px_0_0_var(--ink)] text-center"
            style={{ animation: "pop-in 0.6s cubic-bezier(.2,.9,.3,1.2) both" }}
          >
            <div
              className="mx-auto size-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
            >
              <Check className="size-10 text-[var(--ink)]" strokeWidth={3.5} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-foreground/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <Sparkles className="size-3" /> Plan activated
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl mt-4 leading-[1.05] tracking-tight">
              Welcome to{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(120deg, ${accent.from}, ${accent.to})` }}
              >
                Mythmind {plan.name}
              </span>
              .
            </h1>

            <p className="text-muted-foreground mt-3 text-base">
              {profileQ.data?.display_name ? `${profileQ.data.display_name}, your` : "Your"} workforce just leveled up.
              You're all set — let's ship something today.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left">
              {plan.features.slice(0, 4).map((f) => (
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

            <Link
              to="/app/chat"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold text-base border-2 border-foreground hover:opacity-90 transition-all active:translate-y-px shadow-[4px_4px_0_0_var(--ink)] hover:shadow-[2px_2px_0_0_var(--ink)]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                color: "var(--ink)",
              }}
            >
              <Rocket className="size-4" /> Open Mythmind
              <ArrowRight className="size-4" />
            </Link>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/app/profile" className="inline-flex items-center gap-1 hover:text-foreground">
                <Star className="size-3" /> Manage billing
              </Link>
              <span className="opacity-30">·</span>
              <a href="mailto:hello@mythmind.ai" className="hover:text-foreground">
                Need help?
              </a>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-5 inline-flex items-center justify-center gap-1.5 w-full">
            <PartyPopper className="size-3" /> A receipt is on its way to your inbox.
          </p>
        </div>
      </main>
    </div>
  );
}
