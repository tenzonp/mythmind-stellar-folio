import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProfileBySlug } from "@/lib/profile.functions";
import { EMPLOYEES, type EmployeeId } from "@/lib/employees";
import { planFor } from "@/lib/plans";
import { Logo } from "@/components/site/Logo";
import { Clock, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/profile/$slug")({
  loader: async ({ params }) => {
    const data = await getProfileBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: PublicProfilePage,
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.profile.display_name ?? "Member"} · mythmind` },
          {
            name: "description",
            content: `${loaderData.profile.display_name ?? "A mythmind member"} has saved ${Math.round(loaderData.totalSavedMin / 60)} hours with their AI workforce.`,
          },
        ]
      : [],
  }),
});

function formatMin(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

function PublicProfilePage() {
  const { profile, tasks, totalSavedMin, totalTasks } = Route.useLoaderData();
  const plan = planFor(profile.plan);
  const initials = (profile.display_name ?? "U").slice(0, 2).toUpperCase();
  const hours = totalSavedMin / 60;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b-2 border-foreground">
        <div className="mx-auto max-w-3xl px-4 lg:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-display font-bold">
              mythmind<span className="text-[var(--ember)]">.</span>
            </span>
          </Link>
          <Link
            to="/auth"
            className="rounded-2xl border-2 border-foreground px-3 py-1.5 text-xs font-semibold hover:bg-foreground hover:text-background"
          >
            Get your workforce
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 lg:px-6 py-10 space-y-8">
        <div className="rounded-3xl border-2 border-foreground p-6 lg:p-8 shadow-[6px_6px_0_var(--ink)] text-center">
          <div
            className="size-20 mx-auto rounded-full border-2 border-foreground inline-flex items-center justify-center font-display font-bold text-2xl"
            style={{ background: "var(--sun)" }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="size-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <h1 className="display-md mt-4">{profile.display_name ?? "Member"}</h1>
          <div className="mt-2 inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border-2 border-foreground/30">
            {plan.name} member
          </div>
          {profile.bio && <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-3xl border-2 border-foreground p-5 shadow-[4px_4px_0_var(--ink)]">
            <Clock className="size-5" />
            <div className="display-sm mt-2">
              {hours < 1 ? formatMin(totalSavedMin) : `${hours.toFixed(1)}h`}
            </div>
            <div className="text-sm font-semibold">Hours saved</div>
            <div className="text-xs text-muted-foreground">with their AI workforce</div>
          </div>
          <div className="rounded-3xl border-2 border-foreground p-5 shadow-[4px_4px_0_var(--ink)]">
            <Zap className="size-5" />
            <div className="display-sm mt-2">{totalTasks}</div>
            <div className="text-sm font-semibold">Tasks shipped</div>
            <div className="text-xs text-muted-foreground">across the team</div>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg">Recent work</h2>
            <div className="space-y-2">
              {tasks.slice(0, 10).map((t: { employee: string; summary: string; time_saved_minutes: number }, i: number) => {
                const e = EMPLOYEES[t.employee as EmployeeId];
                return (
                  <div
                    key={i}
                    className="rounded-2xl border-2 border-foreground/15 p-4 flex items-center gap-3"
                  >
                    {e && (
                      <img
                        src={e.avatar}
                        alt={e.name}
                        className="size-9 rounded-full border-2 border-foreground/15 shrink-0"
                        style={{ background: e.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{t.summary}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {e?.name ?? t.employee}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[var(--leaf)] inline-flex items-center gap-1 shrink-0">
                      <Sparkles className="size-3.5" />
                      {formatMin(t.time_saved_minutes)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-3xl border-2 border-foreground bg-[var(--sun)]/30 p-6 text-center">
          <div className="font-display font-bold text-lg">Build your own AI workforce</div>
          <div className="text-sm text-muted-foreground mt-1">
            Six AI employees. One CEO. Time saved, tracked.
          </div>
          <Link
            to="/auth"
            className="inline-block mt-4 rounded-2xl border-2 border-foreground bg-foreground text-background px-4 py-2 text-sm font-semibold"
          >
            Get started free
          </Link>
        </div>
      </div>
    </div>
  );
}
