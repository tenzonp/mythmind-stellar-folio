import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMyConnections,
  listToolkits,
  initiateConnection,
  checkConnection,
  disconnectAccount,
} from "@/lib/composio.functions";
import { EMPLOYEE_LIST } from "@/lib/employees";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle2,
  Plug,
  ExternalLink,
  Trash2,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/integrations")({
  component: IntegrationsPage,
});

const ROLE_TOOLKITS: Record<string, string[]> = {
  reyes: ["googlecalendar", "slack", "asana", "notion", "zoom", "trello", "linear"],
  kade: ["gmail", "outlook", "slack", "discord", "intercom"],
  bloom: ["twitter", "linkedin", "instagram", "facebook", "tiktok", "notion", "googledocs", "youtube"],
  vale: ["googledocs", "googleslides", "googlesheets", "notion", "figma", "canva", "dropbox"],
  sage: ["notion", "googlecalendar", "gmail", "linear", "github", "todoist"],
};

type PendingState = {
  toolkit: string;
  name: string;
  id: string;
  redirectUrl: string | null;
  phase: "redirecting" | "waiting" | "success" | "failed";
  error?: string;
};

function ToolLogo({ logo, alt, size = 10 }: { logo: string | null; alt: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className={`size-${size} rounded-lg bg-foreground/10 inline-flex items-center justify-center`}>
        <Plug className="size-5" />
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={alt}
      onError={() => setErr(true)}
      className={`size-${size} rounded-lg object-contain bg-white p-1`}
    />
  );
}

function IntegrationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingState | null>(null);

  const connectionsQ = useQuery({
    queryKey: ["tools-connections"],
    queryFn: () => listMyConnections(),
    refetchOnWindowFocus: true,
  });

  const toolkitsQ = useQuery({
    queryKey: ["tools-toolkits"],
    queryFn: () => listToolkits({ data: {} }),
  });

  const connect = useMutation({
    mutationFn: async ({ toolkit, name }: { toolkit: string; name: string }) => {
      const res = await initiateConnection({ data: { toolkit } });
      return { res, toolkit, name };
    },
    onSuccess: ({ res, toolkit, name }) => {
      if (!res.ok) {
        setPending({
          toolkit,
          name,
          id: "",
          redirectUrl: null,
          phase: "failed",
          error: res.error,
        });
        return;
      }
      if (res.redirectUrl) {
        // Open auth in new tab; if blocked, the dialog gives a manual button.
        const win = window.open(res.redirectUrl, "_blank", "noopener,noreferrer");
        setPending({
          toolkit,
          name,
          id: res.id,
          redirectUrl: res.redirectUrl,
          phase: win ? "waiting" : "redirecting",
        });
      } else if (res.status === "ACTIVE") {
        toast.success(`${name} connected`);
        qc.invalidateQueries({ queryKey: ["tools-connections"] });
      } else {
        setPending({
          toolkit,
          name,
          id: res.id,
          redirectUrl: null,
          phase: "failed",
          error: "No authorization URL was returned. The tool may not be enabled yet.",
        });
      }
    },
    onError: (e) =>
      toast.error(
        `We couldn't start the connection: ${(e as Error).message}. Please try again.`,
      ),
  });

  const disconnect = useMutation({
    mutationFn: (id: string) => disconnectAccount({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Disconnected");
        qc.invalidateQueries({ queryKey: ["tools-connections"] });
      } else {
        toast.error(`Could not disconnect: ${r.error}`);
      }
    },
    onError: (e) => toast.error(`Disconnect failed: ${(e as Error).message}`),
  });

  // Poll pending connection
  useEffect(() => {
    if (!pending || (pending.phase !== "waiting" && pending.phase !== "redirecting")) return;
    if (!pending.id) return;
    let cancelled = false;
    let elapsed = 0;
    const t = setInterval(async () => {
      elapsed += 2500;
      try {
        const r = await checkConnection({ data: { id: pending.id } });
        if (cancelled) return;
        if (r.status === "ACTIVE") {
          setPending((p) => (p ? { ...p, phase: "success" } : p));
          qc.invalidateQueries({ queryKey: ["tools-connections"] });
          setTimeout(() => !cancelled && setPending(null), 1200);
        } else if (r.status === "FAILED" || r.status === "EXPIRED") {
          setPending((p) =>
            p ? { ...p, phase: "failed", error: "Authorization was cancelled or expired." } : p,
          );
        } else if (elapsed > 180_000) {
          setPending((p) =>
            p ? { ...p, phase: "failed", error: "Timed out waiting for authorization." } : p,
          );
        }
      } catch {
        // keep polling
      }
    }, 2500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pending, qc]);

  const connectedSlugs = useMemo(
    () =>
      new Set(
        (connectionsQ.data?.items ?? [])
          .filter((c) => c.status === "ACTIVE")
          .map((c) => c.toolkit),
      ),
    [connectionsQ.data],
  );

  const filteredToolkits = toolkitsQ.data?.items ?? [];
  const toolsServiceDown =
    connectionsQ.data && "ok" in connectionsQ.data && connectionsQ.data.ok === false;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground">
        <div className="flex items-center gap-3">
          <Link
            to="/app"
            className="size-9 rounded-full border-2 border-foreground inline-flex items-center justify-center hover:bg-foreground/5"
            aria-label="Back to chat"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Logo className="h-6 w-6" />
          <div>
            <h1 className="font-display font-bold text-lg leading-none">Connections</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect your tools — your team uses what you connect.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground hidden sm:flex items-center gap-2">
          <Plug className="size-3.5" />
          1000+ apps
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-6 space-y-8">
          {toolsServiceDown && (
            <div className="border-2 border-[var(--ember)]/40 bg-[var(--ember)]/5 rounded-2xl p-4 text-sm flex gap-3 items-start">
              <AlertTriangle className="size-4 text-[var(--ember)] mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Tools service is temporarily unreachable</div>
                <div className="text-muted-foreground text-xs mt-1">
                  We couldn't load your connections. Browsing still works — try connecting in a moment.
                </div>
              </div>
            </div>
          )}

          {/* Connected */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--leaf)]" />
                Your connections
                <span className="text-xs font-mono text-muted-foreground">
                  ({connectionsQ.data?.items.length ?? 0})
                </span>
              </h2>
            </div>
            {connectionsQ.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-2 border-foreground/15 rounded-2xl p-4 h-[76px] animate-pulse bg-foreground/[0.03]"
                  />
                ))}
              </div>
            ) : (connectionsQ.data?.items.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed border-foreground/20 rounded-2xl p-6 text-center">
                No tools connected yet. Pick one below and your team gets superpowers.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {connectionsQ.data?.items.map((c) => (
                  <div
                    key={c.id}
                    className="border-2 border-foreground rounded-2xl p-4 flex items-center gap-3"
                  >
                    <ToolLogo logo={c.logo} alt={c.name} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div
                        className={`text-[10px] font-mono uppercase tracking-widest ${
                          c.status === "ACTIVE" ? "text-[var(--leaf)]" : "text-muted-foreground"
                        }`}
                      >
                        {c.status === "ACTIVE" ? "Connected" : c.status}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Disconnect ${c.name}?`)) disconnect.mutate(c.id);
                      }}
                      disabled={disconnect.isPending}
                      className="size-8 inline-flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-[var(--ember)] transition-colors disabled:opacity-50"
                      title="Disconnect"
                    >
                      {disconnect.isPending && disconnect.variables === c.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Browse */}
          <section>
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--sun)]" />
                Browse tools
              </h2>
              <div className="relative flex-1 max-w-sm min-w-[220px]">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Gmail, Notion, Instagram…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-2 focus:ring-[var(--sun)]"
                />
              </div>
            </div>

            {toolkitsQ.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-2 border-foreground/15 rounded-2xl p-4 h-[140px] animate-pulse bg-foreground/[0.03]"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredToolkits
                  .filter((t) => {
                    const q = search.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.slug.toLowerCase().includes(q) ||
                      t.description.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 200)
                  .map((t) => {
                    const isConnected = connectedSlugs.has(t.slug);
                    const isConnecting =
                      connect.isPending && connect.variables?.toolkit === t.slug;
                    const employees = EMPLOYEE_LIST.filter(
                      (e) => e.id !== "lin" && (ROLE_TOOLKITS[e.id] ?? []).includes(t.slug),
                    );
                    return (
                      <div
                        key={t.slug}
                        className="border-2 border-foreground rounded-2xl p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <ToolLogo logo={t.logo} alt={t.name} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{t.name}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-2">
                              {t.description || t.slug}
                            </div>
                          </div>
                        </div>
                        {employees.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {employees.map((e) => (
                              <span
                                key={e.id}
                                className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-foreground/20 text-muted-foreground"
                              >
                                {e.name}
                              </span>
                            ))}
                            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-[var(--sun)]/40 text-[var(--sun)]">
                              Lin
                            </span>
                          </div>
                        )}
                        {isConnected ? (
                          <button
                            disabled
                            className="w-full text-xs font-medium py-2 rounded-2xl border-2 border-[var(--leaf)] text-[var(--leaf)] inline-flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5" /> Connected
                          </button>
                        ) : (
                          <button
                            onClick={() => connect.mutate({ toolkit: t.slug, name: t.name })}
                            disabled={isConnecting || pending !== null}
                            className="w-full text-xs font-medium py-2 rounded-2xl border-2 border-foreground hover:bg-foreground hover:text-background transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-foreground"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" /> Starting…
                              </>
                            ) : (
                              <>
                                <ExternalLink className="size-3.5" /> Connect
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>
      </div>

      {pending && (
        <ConnectDialog
          state={pending}
          onClose={() => setPending(null)}
          onRetry={() => {
            const { toolkit, name } = pending;
            setPending(null);
            connect.mutate({ toolkit, name });
          }}
        />
      )}
    </div>
  );
}

function ConnectDialog({
  state,
  onClose,
  onRetry,
}: {
  state: PendingState;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-background border-2 border-foreground rounded-3xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-8 rounded-full hover:bg-foreground/5 inline-flex items-center justify-center"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {state.phase === "success" ? (
          <div className="text-center py-4">
            <div className="size-14 rounded-full bg-[var(--leaf)]/10 inline-flex items-center justify-center mb-3">
              <CheckCircle2 className="size-7 text-[var(--leaf)]" />
            </div>
            <div className="font-display font-bold text-lg">{state.name} connected</div>
            <p className="text-sm text-muted-foreground mt-1">Your team can use it now.</p>
          </div>
        ) : state.phase === "failed" ? (
          <div className="py-2">
            <div className="size-12 rounded-full bg-[var(--ember)]/10 inline-flex items-center justify-center mb-3">
              <AlertTriangle className="size-6 text-[var(--ember)]" />
            </div>
            <div className="font-display font-bold text-lg">Couldn't connect {state.name}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {state.error ?? "Something went wrong during authorization."}
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={onRetry}
                className="flex-1 text-sm font-medium py-2.5 rounded-2xl border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="flex-1 text-sm font-medium py-2.5 rounded-2xl border-2 border-foreground/20 text-muted-foreground hover:bg-foreground/5"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="size-6 animate-spin text-[var(--sun)]" />
              <div>
                <div className="font-display font-bold text-base">Connecting {state.name}</div>
                <div className="text-xs text-muted-foreground">
                  {state.phase === "redirecting"
                    ? "Click the button below to authorize in a new tab."
                    : "Waiting for you to finish authorization…"}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-foreground/[0.03] rounded-2xl p-3 mb-4">
              <Step
                done
                label="Started secure authorization"
              />
              <Step
                done={state.phase !== "redirecting"}
                active={state.phase === "redirecting"}
                label="Sign in & approve access in the new tab"
              />
              <Step
                active={state.phase === "waiting"}
                label="We confirm the connection automatically"
              />
            </div>

            {state.redirectUrl && (
              <a
                href={state.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-sm font-medium py-2.5 rounded-2xl border-2 border-foreground hover:bg-foreground hover:text-background transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="size-4" />
                {state.phase === "redirecting" ? "Open authorization" : "Reopen authorization"}
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-3.5 text-[var(--leaf)] shrink-0" />
      ) : active ? (
        <Loader2 className="size-3.5 animate-spin text-[var(--sun)] shrink-0" />
      ) : (
        <div className="size-3.5 rounded-full border border-foreground/30 shrink-0" />
      )}
      <span className={done || active ? "text-foreground" : ""}>{label}</span>
    </div>
  );
}
