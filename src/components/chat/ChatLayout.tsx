import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/site/Logo";
import {
  EMPLOYEES,
  EMPLOYEE_LIST,
  type EmployeeId,
} from "@/lib/employees";
import {
  createThread,
  deleteThread,
  getThreadMessages,
  listThreads,
  renameThread,
  uploadAttachment,
} from "@/lib/chat.functions";

import { getMyProfile } from "@/lib/profile.functions";
import { PLANS, planFor } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowUp,
  Plus,
  Trash2,
  LogOut,
  Menu,
  X,
  Crown,
  Sparkles,
  CheckCircle2,
  Paperclip,
  User,
  FileText,
  Loader2,
  Pencil,
  Copy,
  Share2,
  Flag,
  Plug,
  Download,
  Mail,
} from "lucide-react";


type Props = { employee: EmployeeId; threadId: string };

type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  public_url: string;
};

export function ChatLayout({ employee, threadId }: Props) {
  const emp = EMPLOYEES[employee];
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [workforceStatus, setWorkforceStatus] = useState<Record<string, "working" | "worked" | undefined>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const threadsQ = useQuery({
    queryKey: ["threads", employee],
    queryFn: () => listThreads({ data: { employee } }),
  });

  const initialQ = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => getThreadMessages({ data: { threadId } }),
  });

  const profileQ = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const plan = planFor(profileQ.data?.plan);

  return (
    <div className="h-[100dvh] w-screen flex bg-background overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-40 inset-y-0 left-0 w-80 border-r-2 border-foreground bg-background flex flex-col transition-transform`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-foreground">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-display font-bold text-base">
              mythmind<span className="text-[var(--ember)]">.</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden size-8 rounded-full hover:bg-foreground/5 inline-flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3 py-3 border-b-2 border-foreground">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-2 mb-2">
            Your workforce
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {EMPLOYEE_LIST.map((e) => {
              const active = e.id === employee;
              const status = workforceStatus[e.id];
              return (
                <button
                  key={e.id}
                  onClick={() => navigate({ to: "/app/$employee", params: { employee: e.id } })}
                  className={`relative rounded-2xl border-2 p-2 flex flex-col items-center gap-1 transition-all ${
                    active
                      ? "border-foreground bg-foreground/[0.06]"
                      : "border-foreground/15 hover:border-foreground/40"
                  }`}
                  title={
                    status === "working"
                      ? `${e.name} is working on this chat`
                      : status === "worked"
                        ? `${e.name} contributed to this chat`
                        : `${e.name} — ${e.role}`
                  }
                >
                  {e.isCEO && (
                    <Crown className="absolute top-1 right-1 size-3 text-[var(--ember)]" />
                  )}
                  {status === "working" && (
                    <span className="absolute -top-1 -left-1 flex size-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--leaf)] opacity-75 animate-ping" />
                      <span className="relative inline-flex size-3 rounded-full bg-[var(--leaf)] border-2 border-background" />
                    </span>
                  )}
                  {status === "worked" && (
                    <span className="absolute -top-1 -left-1 size-3 rounded-full bg-[var(--leaf)] border-2 border-background" />
                  )}
                  <img
                    src={e.avatar}
                    alt={e.name}
                    width={48}
                    height={48}
                    loading="lazy"
                    className={`size-12 rounded-full object-cover border-2 ${
                      status === "working"
                        ? "border-[var(--leaf)] ring-2 ring-[var(--leaf)]/40"
                        : status === "worked"
                          ? "border-[var(--leaf)]/60"
                          : "border-foreground/15"
                    }`}
                    style={{ background: e.color }}
                  />
                  <span className="text-[10px] font-semibold">{e.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={async () => {
              const t = await createThread({ data: { employee } });
              await qc.invalidateQueries({ queryKey: ["threads", employee] });
              navigate({
                to: "/app/$employee/$threadId",
                params: { employee, threadId: t.id },
              });
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground py-2.5 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors"
          >
            <Plus className="size-4" />
            New chat with {emp.name}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-2 mb-1">
            History
          </div>
          {threadsQ.isLoading && (
            <div className="px-2 py-2 text-xs text-muted-foreground">Loading…</div>
          )}
          {threadsQ.data?.length === 0 && (
            <div className="px-2 py-2 text-xs text-muted-foreground">No chats yet.</div>
          )}
          {threadsQ.data?.map((t) => {
            const active = t.id === threadId;
            return (
              <ThreadItem
                key={t.id}
                id={t.id}
                title={t.title}
                active={active}
                onOpen={() =>
                  navigate({
                    to: "/app/$employee/$threadId",
                    params: { employee, threadId: t.id },
                  })
                }
                onRenamed={() => qc.invalidateQueries({ queryKey: ["threads", employee] })}
                onDeleted={() => {
                  const next = threadsQ.data?.find((x) => x.id !== t.id);
                  qc.invalidateQueries({ queryKey: ["threads", employee] });
                  if (active) {
                    if (next) {
                      navigate({
                        to: "/app/$employee/$threadId",
                        params: { employee, threadId: next.id },
                      });
                    } else {
                      navigate({ to: "/app/$employee", params: { employee } });
                    }
                  }
                }}
              />
            );
          })}

        </div>

        <div className="px-3 py-3 border-t-2 border-foreground space-y-1">
          <Link
            to="/app/integrations"
            className="w-full inline-flex items-center justify-between gap-2 rounded-2xl py-2 px-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Plug className="size-4" />
              Integrations
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              1024+ tools
            </span>
          </Link>
          <Link
            to="/app/profile"
            className="w-full inline-flex items-center justify-between gap-2 rounded-2xl py-2 px-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <User className="size-4" />
              {profileQ.data?.display_name ?? "Profile"}
            </span>
            <span
              className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${
                plan.id === "free"
                  ? "border-foreground/30 text-muted-foreground"
                  : plan.id === "pro"
                    ? "border-[var(--leaf)] text-[var(--leaf)]"
                    : "border-[var(--ember)] text-[var(--ember)]"
              }`}
            >
              {plan.name}
            </span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.navigate({ to: "/auth" });
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 lg:px-6 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden size-9 rounded-full border-2 border-foreground inline-flex items-center justify-center"
          >
            <Menu className="size-4" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={emp.avatar}
              alt={emp.name}
              width={36}
              height={36}
              loading="lazy"
              className="size-9 rounded-full object-cover border-2 border-foreground"
              style={{ background: emp.color }}
            />
            <div className="leading-tight">
              <div className="font-display font-bold flex items-center gap-1.5">
                {emp.name}
                {emp.isCEO && <Crown className="size-3.5 text-[var(--ember)]" />}
              </div>
              <div className="text-[11px] text-muted-foreground">{emp.role}</div>
            </div>
          </div>
          <div className="w-9 lg:w-0" />
        </div>

        {token && initialQ.data ? (
          <ChatStream
            key={threadId}
            employee={employee}
            threadId={threadId}
            initialMessages={(initialQ.data.messages ?? []) as unknown as UIMessage[]}
            token={token}
            planLimit={plan.fileLimit}
            planName={plan.name}
            onFirstMessage={() => qc.invalidateQueries({ queryKey: ["threads", employee] })}
            openLightbox={setLightbox}
            onWorkforce={setWorkforceStatus}
          />
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl shadow-2xl" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white inline-flex items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ChatStream({
  employee,
  threadId,
  initialMessages,
  token,
  planLimit,
  planName,
  onFirstMessage,
  openLightbox,
  onWorkforce,
}: {
  employee: EmployeeId;
  threadId: string;
  initialMessages: UIMessage[];
  token: string;
  planLimit: number;
  planName: string;
  onFirstMessage: () => void;
  openLightbox: (url: string) => void;
  onWorkforce: (m: Record<string, "working" | "worked" | undefined>) => void;
}) {
  const emp = EMPLOYEES[employee];
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentCountRef = useRef(initialMessages.length);
  const qc = useQueryClient();

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: { Authorization: `Bearer ${token}` },
      body: { threadId, employee },
    }),
    onError: (e) => toast.error(e.message || "Chat error"),
    onFinish: () => qc.invalidateQueries({ queryKey: ["my-stats"] }),
  });

  useEffect(() => {
    taRef.current?.focus();
  }, [threadId, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";

  // Derive live workforce status from delegate tool calls in the thread.
  useEffect(() => {
    const map: Record<string, "working" | "worked" | undefined> = {};
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const part of m.parts ?? []) {
        const t = (part as { type?: string }).type;
        if (t !== "tool-delegate") continue;
        const p = part as { state?: string; input?: { employee?: string }; output?: { ok?: boolean } };
        const emp = p.input?.employee;
        if (!emp) continue;
        const done = p.state === "output-available" || p.output !== undefined;
        if (!done) {
          map[emp] = "working";
        } else if (map[emp] !== "working") {
          map[emp] = "worked";
        }
      }
    }
    onWorkforce(map);
  }, [messages, onWorkforce]);

  // Reset workforce when leaving the thread.
  useEffect(() => () => onWorkforce({}), [onWorkforce]);


  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = planLimit - pending.length;
    if (room <= 0) {
      toast.error(`${planName} plan allows ${planLimit} files per message. Upgrade for more.`);
      return;
    }
    const list = Array.from(files).slice(0, room);
    if (files.length > room) {
      toast.warning(`Only first ${room} file(s) added — your ${planName} plan caps at ${planLimit}.`);
    }
    setUploading(true);
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("threadId", threadId);
        const att = await uploadAttachment({ data: fd });
        setPending((p) => [...p, att]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if ((!trimmed && pending.length === 0) || isLoading) return;
    setInput("");
    const attached = pending;
    setPending([]);
    const wasEmpty = sentCountRef.current === 0;
    const fileParts = attached.map((a) => ({
      type: "file" as const,
      url: a.public_url,
      mediaType: a.file_type,
      filename: a.file_name,
    }));
    const parts = [
      ...fileParts,
      ...(trimmed ? [{ type: "text" as const, text: trimmed }] : []),
    ];
    await sendMessage({ parts });
    if (wasEmpty) onFirstMessage();
    sentCountRef.current += 2;
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <div
        className="flex-1 overflow-y-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
          {isEmpty ? (
            <EmptyState employee={employee} onPick={(s) => handleSend(s)} />
          ) : (
            <div className="space-y-8">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  employee={employee}
                  openLightbox={openLightbox}
                />
              ))}
              {status === "submitted" && (
                <div className="flex gap-3">
                  <EmpAvatar id={employee} />
                  <div className="pt-2.5 text-sm text-muted-foreground inline-flex gap-1.5">
                    <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce" />
                    <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:120ms]" />
                    <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              )}
              {error && (
                <div className="text-sm text-[var(--ember)] border-2 border-[var(--ember)] rounded-2xl p-4">
                  {error.message}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t-2 border-foreground bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mx-auto max-w-3xl px-4 py-4"
        >
          {pending.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pending.map((a) => (
                <AttachmentChip
                  key={a.id}
                  att={a}
                  onRemove={() => setPending((p) => p.filter((x) => x.id !== a.id))}
                />
              ))}
            </div>
          )}
          <div className="rounded-3xl border-2 border-foreground bg-background flex items-end gap-2 p-2 pl-2 focus-within:shadow-[4px_4px_0_var(--ink)] transition-shadow">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || pending.length >= planLimit}
              title={`Attach files (${pending.length}/${planLimit} on ${planName})`}
              className="shrink-0 size-9 rounded-full inline-flex items-center justify-center hover:bg-foreground/5 disabled:opacity-30 border-2 border-foreground/20"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
            </button>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder={
                emp.isCEO
                  ? `Tell ${emp.name} what you need. She'll route the work.`
                  : `Message ${emp.name}…`
              }
              rows={1}
              className="flex-1 resize-none bg-transparent py-2.5 text-sm focus:outline-none max-h-40"
              style={{ minHeight: 24 }}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && pending.length === 0)}
              className="shrink-0 size-9 rounded-full inline-flex items-center justify-center disabled:opacity-30 hover:scale-105 transition-transform border-2 border-foreground"
              style={{ background: emp.color, color: "var(--ink)" }}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {pending.length > 0
              ? `${pending.length}/${planLimit} files attached`
              : `${planName} · up to ${planLimit} files per message`}
          </div>

        </form>
      </div>
    </>
  );
}

function InlineImage({
  url,
  filename,
  onOpen,
}: {
  url: string;
  filename?: string;
  onOpen?: () => void;
}) {
  const name = filename || url.split("/").pop()?.split("?")[0] || "image.png";

  async function download() {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      toast.success("Downloaded");
    } catch {
      window.open(url, "_blank");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Image link copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function copyImage() {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success("Image copied — paste into Gmail / docs / chat");
    } catch {
      copyLink();
    }
  }

  async function shareImage() {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const file = new File([blob], name, { type: blob.type });
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
        share?: (d: { files?: File[]; title?: string; url?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: name });
      } else {
        copyLink();
      }
    } catch {
      copyLink();
    }
  }

  function emailWith() {
    const body = `Image: ${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-foreground/15 hover:border-foreground transition-colors bg-foreground/[0.03]">
      <button onClick={onOpen} className="block size-full" aria-label="Open image">
        <img src={url} alt={filename ?? ""} className="size-full object-cover" />
      </button>
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <IconBtn title="Download" onClick={download}>
          <Download className="size-3.5" />
        </IconBtn>
        <IconBtn title="Copy image (paste into Gmail, docs, chat)" onClick={copyImage}>
          <Copy className="size-3.5" />
        </IconBtn>
        <IconBtn title="Share / attach" onClick={shareImage}>
          <Share2 className="size-3.5" />
        </IconBtn>
        <IconBtn title="Email this image" onClick={emailWith}>
          <Mail className="size-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="size-7 rounded-full bg-[var(--ink)]/85 text-[var(--paper)] inline-flex items-center justify-center backdrop-blur hover:bg-[var(--ink)] hover:scale-110 transition-transform"
    >
      {children}
    </button>
  );
}

function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const isImg = att.file_type.startsWith("image/");
  return (
    <div className="relative rounded-xl border-2 border-foreground/20 bg-background">
      {isImg ? (
        <img
          src={att.public_url}
          alt={att.file_name}
          className="size-16 object-cover rounded-[10px]"
        />
      ) : (
        <div className="size-16 flex flex-col items-center justify-center px-1 text-[9px] text-center bg-foreground/[0.04] rounded-[10px]">
          <FileText className="size-5 mb-0.5" />
          <span className="truncate w-full">{att.file_name}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${att.file_name}`}
        title="Remove"
        className="absolute -top-2 -right-2 size-6 rounded-full bg-[var(--ink)] text-[var(--paper)] inline-flex items-center justify-center border-2 border-background shadow-md hover:bg-[var(--ember)] hover:scale-110 transition-transform z-10"
      >
        <X className="size-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}

function FileChip({ url, filename, mediaType }: { url: string; filename?: string; mediaType?: string }) {
  const name = filename || url.split("/").pop()?.split("?")[0] || "file";
  const ext = name.split(".").pop()?.toUpperCase() ?? "";
  const kind = mediaType?.includes("zip") || ext === "ZIP" || ext === "RAR" || ext === "7Z" ? "ARCHIVE"
    : mediaType?.includes("pdf") || ext === "PDF" ? "PDF"
    : mediaType?.includes("sheet") || ext === "XLSX" || ext === "CSV" ? "SHEET"
    : mediaType?.includes("word") || ext === "DOCX" ? "DOC"
    : ext || "FILE";
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={name}
      className="inline-flex items-center gap-3 rounded-2xl border-2 border-foreground/15 px-3 py-2.5 text-xs hover:border-foreground bg-background min-w-[220px]"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-foreground/[0.06] font-mono text-[9px] font-bold tracking-wider">
        {kind.slice(0, 5)}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="truncate max-w-[220px] font-medium">{name}</span>
        <span className="text-[10px] text-muted-foreground">Tap to open · agent can analyze</span>
      </span>
      <Download className="size-3.5 ml-1 opacity-60" />
    </a>
  );
}

function EmpAvatar({ id, size = 36 }: { id: EmployeeId; size?: number }) {
  const e = EMPLOYEES[id];
  return (
    <img
      src={e.avatar}
      alt={e.name}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full object-cover border-2 border-foreground shrink-0"
      style={{ width: size, height: size, background: e.color }}
    />
  );
}

type DelegateInput = { employee?: string; brief?: string };
type DelegateOutput = { ok?: boolean; employee?: string; output?: string; error?: string };

function MessageBubble({
  message,
  employee,
  openLightbox,
}: {
  message: UIMessage;
  employee: EmployeeId;
  openLightbox: (url: string) => void;
}) {
  if (message.role === "user") {
    const text = (message.parts ?? [])
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("");
    const files = (message.parts ?? []).filter(
      (p) => (p as { type: string }).type === "file",
    ) as Array<{ url: string; mediaType?: string; filename?: string }>;
    const images = files.filter((f) => (f.mediaType ?? "").startsWith("image/"));
    const videos = files.filter((f) => (f.mediaType ?? "").startsWith("video/"));
    const audios = files.filter((f) => (f.mediaType ?? "").startsWith("audio/"));
    const docs = files.filter((f) => {
      const m = f.mediaType ?? "";
      return !m.startsWith("image/") && !m.startsWith("video/") && !m.startsWith("audio/");
    });
    return (
      <div className="flex flex-col items-end gap-2">
        {images.length > 0 && (
          <div
            className={`grid gap-1.5 max-w-[85%] ${
              images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {images.map((f, i) => (
              <InlineImage
                key={i}
                url={f.url}
                filename={f.filename}
                onOpen={() => openLightbox(f.url)}
              />
            ))}
          </div>
        )}
        {videos.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[85%] w-[min(420px,85vw)]">
            {videos.map((f, i) => (
              <video
                key={i}
                src={f.url}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-2xl border-2 border-foreground/15 bg-black"
              />
            ))}
          </div>
        )}
        {audios.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[85%]">
            {audios.map((f, i) => (
              <audio key={i} src={f.url} controls className="w-[280px]" />
            ))}
          </div>
        )}
        {docs.length > 0 && (
          <div className="flex flex-col gap-1.5 max-w-[85%]">
            {docs.map((f, i) => (
              <FileChip key={i} url={f.url} filename={f.filename} mediaType={f.mediaType} />
            ))}
          </div>
        )}
        {text && (
          <div
            className="max-w-[85%] rounded-3xl rounded-tr-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {text}
          </div>
        )}
      </div>
    );
  }

  const assistantText = (message.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("\n")
    .trim();

  return (
    <div className="flex gap-3 group/msg">
      <EmpAvatar id={employee} />
      <div className="flex-1 min-w-0 pt-1 space-y-3">
        <div className="font-display font-bold text-sm flex items-center gap-1.5">
          {EMPLOYEES[employee].name}
          {EMPLOYEES[employee].isCEO && <Crown className="size-3 text-[var(--ember)]" />}
        </div>
        {(message.parts ?? []).map((part, i) => {
          if (part.type === "text") {
            return (
              <div
                key={i}
                className="prose prose-sm max-w-none prose-headings:font-display prose-headings:font-bold prose-p:my-2 prose-pre:bg-foreground prose-pre:text-background prose-code:text-[var(--ember)] prose-a:text-foreground prose-a:underline prose-strong:text-foreground"
              >
                <ReactMarkdown
                  components={{
                    img: ({ src, alt }) =>
                      src ? (
                        <InlineImage url={String(src)} filename={alt || undefined} />
                      ) : null,
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }
          if ((part.type as string).startsWith("tool-")) {
            const p = part as unknown as {
              type: string;
              state?: string;
              input?: DelegateInput;
              output?: DelegateOutput;
            };
            const input = p.input ?? {};
            const output = p.output;
            const targetId = input.employee && (input.employee as EmployeeId);
            const target = targetId && targetId in EMPLOYEES ? EMPLOYEES[targetId as EmployeeId] : null;
            const isDone = p.state === "output-available" || !!output;
            return (
              <div
                key={i}
                className="rounded-2xl border-2 border-foreground/15 bg-foreground/[0.02] overflow-hidden"
              >
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-foreground/10">
                  {target && <EmpAvatar id={target.id} size={28} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      {isDone ? (
                        <CheckCircle2 className="size-3.5 text-[var(--leaf)]" />
                      ) : (
                        <Sparkles className="size-3.5 text-[var(--ember)] animate-pulse" />
                      )}
                      {target?.name
                        ? `Lin delegated to ${target.name}`
                        : input.employee
                          ? `Lin delegated to ${input.employee}`
                          : "Lin is choosing a specialist…"}
                    </div>
                    {target && (
                      <div className="text-[10px] text-muted-foreground">{target.role}</div>
                    )}
                  </div>
                </div>
                {input.brief && (
                  <details className="px-3 py-2 text-xs text-muted-foreground border-b border-foreground/10">
                    <summary className="cursor-pointer font-medium">Brief</summary>
                    <div className="mt-1.5 whitespace-pre-wrap">{input.brief}</div>
                  </details>
                )}
                {output?.ok === false && (
                  <div className="px-3 py-2 text-xs text-[var(--ember)]">
                    {output.error || "Delegation failed"}
                  </div>
                )}
                {output?.output && (
                  <details className="px-3 py-2 text-xs" open={false}>
                    <summary className="cursor-pointer font-medium">
                      {target?.name ?? "Specialist"}'s deliverable
                    </summary>
                    <div className="mt-2 prose prose-sm max-w-none prose-p:my-1.5">
                      <ReactMarkdown>{output.output}</ReactMarkdown>
                    </div>
                  </details>
                )}
              </div>
            );
          }
          return null;
        })}
        {assistantText && <MessageActions text={assistantText} employeeName={EMPLOYEES[employee].name} />}
      </div>
    </div>
  );
}

function MessageActions({ text, employeeName }: { text: string; employeeName: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }
  async function share() {
    const shareData = { title: `Message from ${employeeName}`, text };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied — paste anywhere to share");
    }
  }
  function report() {
    const reason = prompt("What's wrong with this reply? (your feedback helps us improve)");
    if (reason && reason.trim()) {
      toast.success("Report sent. Thanks for the feedback.");
    }
  }
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
      <button
        onClick={copy}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-foreground/5"
      >
        <Copy className="size-3" /> Copy
      </button>
      <button
        onClick={share}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-foreground/5"
      >
        <Share2 className="size-3" /> Share
      </button>
      <button
        onClick={report}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[var(--ember)] rounded-lg px-2 py-1 hover:bg-foreground/5"
      >
        <Flag className="size-3" /> Report
      </button>
    </div>
  );
}

function ThreadItem({
  id,
  title,
  active,
  onOpen,
  onRenamed,
  onDeleted,
}: {
  id: string;
  title: string;
  active: boolean;
  onOpen: () => void;
  onRenamed: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  async function save() {
    const t = value.trim();
    if (!t || t === title) {
      setEditing(false);
      return;
    }
    try {
      await renameThread({ data: { id, title: t.slice(0, 120) } });
      onRenamed();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setEditing(false);
    }
  }
  return (
    <div
      className={`group flex items-center gap-1 rounded-xl pr-1 ${
        active ? "bg-foreground/[0.07]" : "hover:bg-foreground/[0.04]"
      }`}
    >
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none border-b border-foreground/30"
        />
      ) : (
        <button onClick={onOpen} className="flex-1 text-left px-3 py-2 text-sm truncate">
          {title}
        </button>
      )}
      <button
        onClick={() => {
          setValue(title);
          setEditing(true);
        }}
        title="Rename"
        className="opacity-0 group-hover:opacity-100 size-7 rounded-lg inline-flex items-center justify-center hover:bg-foreground/10 transition-all"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        onClick={async () => {
          if (!confirm("Delete this chat?")) return;
          try {
            await deleteThread({ data: { id } });
            onDeleted();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
          }
        }}
        title="Delete"
        className="opacity-0 group-hover:opacity-100 size-7 rounded-lg inline-flex items-center justify-center hover:bg-[var(--ember)] hover:text-background transition-all"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}


function EmptyState({ employee, onPick }: { employee: EmployeeId; onPick: (s: string) => void }) {
  const e = EMPLOYEES[employee];
  return (
    <div className="text-center py-6">
      <div className="relative inline-block">
        <img
          src={e.avatar}
          alt={e.name}
          width={128}
          height={128}
          className="size-28 rounded-full object-cover border-2 border-foreground"
          style={{ background: e.color, boxShadow: "5px 5px 0 var(--ink)" }}
        />
        {e.isCEO && (
          <Crown className="absolute -top-2 -right-2 size-7 text-[var(--ember)] fill-[var(--ember)]" />
        )}
      </div>
      <h1 className="display-md mt-6">{e.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{e.role}</p>
      <p className="mt-4 max-w-md mx-auto text-base">{e.tagline}</p>

      {e.isCEO && (
        <div className="mt-6 mx-auto max-w-md rounded-2xl border-2 border-foreground/15 bg-foreground/[0.03] px-4 py-3 text-xs text-muted-foreground">
          Lin coordinates the team. Give her the goal — she briefs Reyes, Kade, Bloom, Vale, or
          Sage and brings back the finished work.
        </div>
      )}

      <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {e.starters.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left rounded-2xl border-2 border-foreground/15 p-4 text-sm hover:border-foreground hover:-translate-y-0.5 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// keep imports used elsewhere
export { PLANS };
