import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getMyProfile, getMyStats, updatePlan, updateProfile } from "@/lib/profile.functions";
import { createDodoCheckout } from "@/lib/billing.functions";
import { PLAN_LIST, PLANS, planFor, type PlanId } from "@/lib/plans";
import { EMPLOYEES, type EmployeeId } from "@/lib/employees";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clock,
  Crown,
  Download,
  Edit3,
  FileText,
  LogOut,
  Share2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfilePage,
});

function formatMin(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

type Task = {
  id: string;
  employee: string;
  summary: string;
  human_estimate_minutes: number | null;
  ai_actual_minutes: number | null;
  time_saved_minutes: number;
  deliverable_text: string | null;
  created_at: string;
};

function ProfilePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const profileQ = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const statsQ = useQuery({ queryKey: ["my-stats"], queryFn: () => getMyStats() });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [viewTask, setViewTask] = useState<Task | null>(null);

  const profile = profileQ.data;
  const plan = planFor(profile?.plan);
  const stats = statsQ.data;
  const tasks = (stats?.tasks ?? []) as Task[];

  const deliverables = useMemo(() => tasks.filter((t) => !!t.deliverable_text), [tasks]);

  async function startEdit() {
    setName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setEditing(true);
  }

  async function saveProfile() {
    try {
      await updateProfile({ data: { display_name: name, bio } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      setEditing(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function switchPlan(p: PlanId) {
    try {
      if (p === "free") {
        await updatePlan({ data: { plan: p } });
        await qc.invalidateQueries({ queryKey: ["my-profile"] });
        toast.success(`Switched to ${p} plan`);
        return;
      }
      // Send through our branded pre-checkout page (Dodo handoff happens from there).
      navigate({ to: "/checkout/$plan", params: { plan: p } });
    } catch (e) {
      console.error("[switchPlan] failed", e);
      toast.error(e instanceof Error ? e.message : "Checkout failed. Please try again.");
    }
  }


  function shareLink() {
    if (!profile) return;
    const url = `${window.location.origin}/profile/${profile.share_slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }

  function exportCSV() {
    if (!stats) return;
    const lines: string[] = [];
    lines.push(`Mythmind report for ${profile?.display_name ?? "you"}`);
    lines.push(`Plan,${plan.name}`);
    lines.push(`Total tasks,${stats.totalTasks}`);
    lines.push(`Total time saved (minutes),${stats.totalSavedMin}`);
    lines.push("");
    lines.push("Per-employee breakdown");
    lines.push("Employee,Minutes saved");
    Object.entries(stats.byEmployee).forEach(([id, mins]) => {
      const e = EMPLOYEES[id as EmployeeId];
      lines.push(`${e?.name ?? id},${mins}`);
    });
    lines.push("");
    lines.push("Per-plan limits");
    lines.push("Plan,Files per message,Max file MB");
    PLAN_LIST.forEach((p) => {
      lines.push(`${p.name},${PLANS[p.id].fileLimit},${PLANS[p.id].maxFileMB}`);
    });
    lines.push("");
    lines.push("Tasks");
    lines.push("Date,Employee,Summary,Human minutes,AI minutes,Saved minutes");
    tasks.forEach((t) => {
      const e = EMPLOYEES[t.employee as EmployeeId];
      const safe = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
      lines.push(
        [
          new Date(t.created_at).toISOString().slice(0, 10),
          e?.name ?? t.employee,
          safe(t.summary),
          t.human_estimate_minutes ?? "",
          t.ai_actual_minutes ?? "",
          t.time_saved_minutes,
        ].join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    download(blob, `mythmind-report-${Date.now()}.csv`);
  }

  function exportPDF() {
    if (!stats) return;
    const totalH = (stats.totalSavedMin / 60).toFixed(1);
    const empRows = Object.entries(stats.byEmployee)
      .map(([id, mins]) => {
        const e = EMPLOYEES[id as EmployeeId];
        return `<tr><td>${e?.name ?? id}</td><td>${e?.role ?? ""}</td><td style="text-align:right">${formatMin(mins)}</td></tr>`;
      })
      .join("");
    const planRows = PLAN_LIST.map(
      (p) =>
        `<tr><td>${p.name}${p.id === plan.id ? " <strong>(current)</strong>" : ""}</td><td>${p.price}</td><td>${PLANS[p.id].fileLimit} files</td><td>${PLANS[p.id].maxFileMB} MB</td></tr>`,
    ).join("");
    const taskRows = tasks
      .map((t) => {
        const e = EMPLOYEES[t.employee as EmployeeId];
        return `<tr><td>${new Date(t.created_at).toLocaleDateString()}</td><td>${e?.name ?? t.employee}</td><td>${escapeHtml(t.summary)}</td><td style="text-align:right">${formatMin(t.time_saved_minutes)}</td></tr>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Mythmind Report</title>
<style>
  *{box-sizing:border-box}body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;padding:32px;max-width:880px;margin:0 auto}
  h1{font-size:28px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px;border-bottom:2px solid #111;padding-bottom:4px}
  .meta{color:#666;font-size:12px;margin-bottom:24px}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
  .stat{border:2px solid #111;border-radius:12px;padding:12px}.stat .v{font-size:22px;font-weight:700}.stat .l{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd}th{background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
  @media print{body{padding:0}}
</style></head><body>
<h1>Mythmind — Work & Time Saved</h1>
<div class="meta">${profile?.display_name ?? "You"} · ${plan.name} plan · Generated ${new Date().toLocaleString()}</div>
<div class="stats">
  <div class="stat"><div class="l">Hours saved</div><div class="v">${totalH}h</div></div>
  <div class="stat"><div class="l">Tasks completed</div><div class="v">${stats.totalTasks}</div></div>
  <div class="stat"><div class="l">Current plan</div><div class="v">${plan.name}</div></div>
</div>
<h2>Per-employee breakdown</h2>
<table><thead><tr><th>Employee</th><th>Role</th><th style="text-align:right">Time saved</th></tr></thead><tbody>${empRows || '<tr><td colspan="3">No data yet.</td></tr>'}</tbody></table>
<h2>Per-plan breakdown</h2>
<table><thead><tr><th>Plan</th><th>Price</th><th>Files / message</th><th>Max size</th></tr></thead><tbody>${planRows}</tbody></table>
<h2>Tasks (${tasks.length})</h2>
<table><thead><tr><th>Date</th><th>Employee</th><th>Summary</th><th style="text-align:right">Saved</th></tr></thead><tbody>${taskRows || '<tr><td colspan="4">No tasks yet.</td></tr>'}</tbody></table>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Allow pop-ups to export PDF");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  if (!profile) {
    return <div className="h-[100dvh] grid place-items-center text-muted-foreground">Loading…</div>;
  }

  const totalHours = (stats?.totalSavedMin ?? 0) / 60;
  const initials = (profile.display_name ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-[100dvh] w-screen bg-background">
      <div className="border-b-2 border-foreground sticky top-0 bg-background z-10">
        <div className="mx-auto max-w-5xl px-4 lg:px-6 py-3 flex items-center justify-between">
          <Link
            to="/app/$employee"
            params={{ employee: "lin" }}
            className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to workforce
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.navigate({ to: "/auth" });
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 lg:px-6 py-8 lg:py-12 space-y-8">
        {/* Header card */}
        <div className="rounded-3xl border-2 border-foreground bg-background p-6 lg:p-8 shadow-[6px_6px_0_var(--ink)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div
              className="size-20 rounded-full border-2 border-foreground inline-flex items-center justify-center font-display font-bold text-2xl"
              style={{ background: "var(--sun)" }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border-2 border-foreground px-3 py-2 text-lg font-bold"
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="One line about you"
                    rows={2}
                    className="w-full rounded-xl border-2 border-foreground px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveProfile}
                      className="rounded-xl border-2 border-foreground px-4 py-1.5 text-sm font-semibold bg-foreground text-background"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded-xl border-2 border-foreground/20 px-4 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="display-sm">{profile.display_name ?? "You"}</h1>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border-2 ${
                        plan.id === "free"
                          ? "border-foreground/30 text-muted-foreground"
                          : plan.id === "pro"
                            ? "border-[var(--leaf)] text-[var(--leaf)] bg-[var(--leaf)]/10"
                            : "border-[var(--ember)] text-[var(--ember)] bg-[var(--ember)]/10"
                      }`}
                    >
                      {plan.name}
                    </span>
                  </div>
                  {profile.bio && (
                    <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={startEdit}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl border-2 border-foreground/20 px-3 py-1.5 hover:border-foreground"
                    >
                      <Edit3 className="size-3.5" /> Edit profile
                    </button>
                    <button
                      onClick={shareLink}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl border-2 border-foreground/20 px-3 py-1.5 hover:border-foreground"
                    >
                      <Share2 className="size-3.5" /> Share profile
                    </button>
                    <button
                      onClick={exportCSV}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl border-2 border-foreground/20 px-3 py-1.5 hover:border-foreground"
                    >
                      <Download className="size-3.5" /> Export CSV
                    </button>
                    <button
                      onClick={exportPDF}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl border-2 border-foreground px-3 py-1.5 bg-foreground text-background hover:opacity-90"
                    >
                      <Download className="size-3.5" /> Export PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Clock className="size-5" />}
            label="Hours saved"
            value={totalHours < 1 ? formatMin(stats?.totalSavedMin ?? 0) : `${totalHours.toFixed(1)}h`}
            sub="vs doing it yourself"
            color="var(--leaf)"
          />
          <StatCard
            icon={<Zap className="size-5" />}
            label="Tasks completed"
            value={String(stats?.totalTasks ?? 0)}
            sub="by your AI workforce"
            color="var(--sun)"
          />
          <StatCard
            icon={<FileText className="size-5" />}
            label="Deliverables"
            value={String(deliverables.length)}
            sub="generated by your team"
            color="var(--ember)"
          />
        </div>

        {/* By employee */}
        {stats && Object.keys(stats.byEmployee).length > 0 && (
          <Section title="Time saved per employee">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(stats.byEmployee).map(([id, mins]) => {
                const e = EMPLOYEES[id as EmployeeId];
                if (!e) return null;
                return (
                  <div
                    key={id}
                    className="rounded-2xl border-2 border-foreground/15 p-4 flex items-center gap-3"
                  >
                    <img
                      src={e.avatar}
                      alt={e.name}
                      className="size-12 rounded-full border-2 border-foreground/15"
                      style={{ background: e.color }}
                    />
                    <div>
                      <div className="font-display font-bold flex items-center gap-1">
                        {e.name}
                        {e.isCEO && <Crown className="size-3 text-[var(--ember)]" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatMin(mins)} saved</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Plans */}
        <Section title="Your plan">
          <div className="grid md:grid-cols-3 gap-4">
            {PLAN_LIST.map((p) => {
              const active = p.id === plan.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl border-2 p-5 flex flex-col ${
                    active
                      ? "border-foreground shadow-[4px_4px_0_var(--ink)]"
                      : "border-foreground/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display font-bold text-lg">{p.name}</div>
                    {active && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-foreground text-background">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="display-sm mt-1">{p.price}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.tagline}</div>
                  <ul className="mt-4 space-y-1.5 text-sm flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="size-4 mt-0.5 shrink-0 text-[var(--leaf)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={active}
                    onClick={() => switchPlan(p.id)}
                    className={`mt-5 rounded-2xl border-2 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-foreground/15 text-muted-foreground cursor-default"
                        : "border-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {active ? "Active" : `Switch to ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Recent tasks */}
        <Section title="Recent work">
          {!tasks.length ? (
            <div className="text-sm text-muted-foreground rounded-2xl border-2 border-dashed border-foreground/15 p-8 text-center">
              No completed tasks yet. Ask Lin for real work — research, drafts, planning — and it'll
              show up here. Casual chats don't count.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 12).map((t) => {
                const e = EMPLOYEES[t.employee as EmployeeId];
                return (
                  <button
                    key={t.id}
                    onClick={() => t.deliverable_text && setViewTask(t)}
                    className="w-full text-left rounded-2xl border-2 border-foreground/15 p-4 flex items-center gap-3 hover:border-foreground transition-colors"
                  >
                    {e && (
                      <img
                        src={e.avatar}
                        alt={e.name}
                        className="size-10 rounded-full border-2 border-foreground/15 shrink-0"
                        style={{ background: e.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{t.summary}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {e?.name ?? t.employee} · {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[var(--leaf)] inline-flex items-center gap-1">
                        <Sparkles className="size-3.5" />
                        {formatMin(t.time_saved_minutes)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">saved</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* AI-generated deliverables */}
        <Section title="Deliverables from your AI workforce">
          {!deliverables.length ? (
            <div className="text-sm text-muted-foreground rounded-2xl border-2 border-dashed border-foreground/15 p-8 text-center">
              Nothing yet. When your team produces drafts, plans, or research, they'll appear here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {deliverables.map((t) => {
                const e = EMPLOYEES[t.employee as EmployeeId];
                return (
                  <button
                    key={t.id}
                    onClick={() => setViewTask(t)}
                    className="aspect-[4/5] rounded-2xl border-2 border-foreground/15 p-3 flex flex-col text-left hover:border-foreground hover:-translate-y-0.5 transition-all bg-foreground/[0.02]"
                    title={t.summary}
                  >
                    <div className="flex items-center gap-1.5">
                      {e && (
                        <img
                          src={e.avatar}
                          alt={e.name}
                          className="size-6 rounded-full border border-foreground/15"
                          style={{ background: e.color }}
                        />
                      )}
                      <span className="text-[10px] font-semibold truncate">{e?.name ?? t.employee}</span>
                    </div>
                    <FileText className="size-5 mt-2 text-muted-foreground" />
                    <div className="mt-2 text-xs font-semibold leading-tight line-clamp-3">
                      {t.summary}
                    </div>
                    <div className="mt-auto text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {viewTask && (
        <DeliverableModal task={viewTask} onClose={() => setViewTask(null)} />
      )}
    </div>
  );
}

function DeliverableModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const e = EMPLOYEES[task.employee as EmployeeId];
  async function copy() {
    if (!task.deliverable_text) return;
    await navigator.clipboard.writeText(task.deliverable_text);
    toast.success("Copied to clipboard");
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl border-2 border-foreground w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[8px_8px_0_var(--ink)]"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b-2 border-foreground">
          {e && (
            <img
              src={e.avatar}
              alt={e.name}
              className="size-10 rounded-full border-2 border-foreground/15"
              style={{ background: e.color }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold truncate">{task.summary}</div>
            <div className="text-[11px] text-muted-foreground">
              {e?.name ?? task.employee} · {new Date(task.created_at).toLocaleString()} ·{" "}
              <span className="text-[var(--leaf)] font-semibold">
                {formatMin(task.time_saved_minutes)} saved
              </span>
            </div>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 text-xs font-semibold rounded-xl border-2 border-foreground/20 px-3 py-1.5 hover:border-foreground"
          >
            Copy
          </button>
          <button
            onClick={onClose}
            className="size-9 rounded-full border-2 border-foreground/20 inline-flex items-center justify-center hover:border-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 prose prose-sm max-w-none prose-headings:font-display prose-headings:font-bold">
          <ReactMarkdown>{task.deliverable_text ?? ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-foreground p-5 shadow-[4px_4px_0_var(--ink)]">
      <div
        className="size-10 rounded-2xl inline-flex items-center justify-center border-2 border-foreground"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="display-sm mt-3">{value}</div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display font-bold text-lg">{title}</h2>
      {children}
    </div>
  );
}
