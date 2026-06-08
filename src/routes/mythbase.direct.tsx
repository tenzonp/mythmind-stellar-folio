import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

type Tab = "blogs" | "news" | "faqs" | "content";

const REDIRECT_URL = "https://mythmind.co";
function bounce() {
  if (typeof window !== "undefined") window.location.replace(REDIRECT_URL);
}

export const Route = createFileRoute("/mythbase/direct")({
  head: () => ({
    meta: [
      { title: "Mythbase — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPanel,
});

function AdminPanel() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(null);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);

  if (loading) return null;
  if (!userId) return <AuthScreen />;
  if (isAdmin === null) return null;
  if (!isAdmin) { bounce(); return null; }

  return <Dashboard />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] grid place-items-center text-sm font-mono text-muted-foreground">
      {children}
    </div>
  );
}

/* ─────── AUTH ─────── */
function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/mythbase/direct" },
        });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-5 py-20">
      <div className="w-full max-w-md rounded-3xl border-2 border-foreground bg-background p-8 shadow-[8px_8px_0_var(--ink)]">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <span className="size-2 rounded-full bg-[var(--ember)]" /> /mythbase/direct
        </div>
        <h1 className="font-display font-bold text-4xl mt-3">admin access.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to manage content." : "Create an account, then ask an admin to elevate you."}
        </p>

        <form onSubmit={handle} className="mt-7 space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-foreground bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-foreground bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
          </Field>
          {err && <p className="text-sm text-[var(--ember)]">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full chunk-btn justify-center disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        <button
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-5 text-xs font-mono text-muted-foreground underline underline-offset-4"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function NotAuthorized({ userId }: { userId: string }) {
  return (
    <div className="min-h-[70vh] grid place-items-center px-5 py-20 text-center">
      <div className="max-w-lg">
        <span className="sticker bg-[var(--ember)] text-background">no admin role</span>
        <h1 className="display-md mt-6">you're signed in, but not an admin.</h1>
        <p className="mt-4 text-foreground/70">
          Your user ID is <code className="font-mono text-xs px-2 py-1 bg-foreground/5 rounded">{userId}</code>.
          Ask an existing admin to grant your account the admin role.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-8 chunk-btn-ghost"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ─────── DASHBOARD ─────── */
function Dashboard() {
  const [tab, setTab] = useState<Tab>("blogs");
  return (
    <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/mythbase/direct</div>
          <h1 className="display-md mt-2">control room.</h1>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="chunk-btn-ghost">
          Sign out
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {([
          ["blogs", "Blogs"],
          ["news", "News"],
          ["faqs", "FAQs"],
          ["content", "Founders & Content"],
        ] as [Tab, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-5 py-2 text-sm font-medium border-2 border-foreground transition-all ${
              tab === k ? "bg-foreground text-background" : "bg-background hover:bg-foreground/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "blogs" && <BlogsAdmin />}
      {tab === "news" && <NewsAdmin />}
      {tab === "faqs" && <FaqsAdmin />}
      {tab === "content" && <ContentAdmin />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}</span>
      {children}
    </label>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-foreground bg-background p-6 shadow-[4px_4px_0_var(--ink)]">
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border-2 border-foreground bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border-2 border-foreground bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 resize-y"
    />
  );
}

/* ─────── BLOGS ─────── */
type Blog = {
  id: string;
  slug: string;
  title: string;
  kicker: string | null;
  excerpt: string | null;
  content: string | null;
  cover_color: string | null;
  read_minutes: number | null;
  published: boolean;
  featured: boolean;
};

function BlogsAdmin() {
  const [rows, setRows] = useState<Blog[]>([]);
  const [draft, setDraft] = useState<Partial<Blog>>({ slug: "", title: "", excerpt: "", kicker: "Essay", cover_color: "var(--sun)", read_minutes: 5, published: true });
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as Blog[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.from("blogs").insert(draft as never);
    if (error) { setErr(error.message); return; }
    setDraft({ slug: "", title: "", excerpt: "", kicker: "Essay", cover_color: "var(--sun)", read_minutes: 5, published: true });
    load();
  }
  async function update(id: string, patch: Partial<Blog>) {
    setErr(null);
    const { error } = await supabase.from("blogs").update(patch).eq("id", id);
    if (error) { setErr(error.message); return; }
    load();
  }
  function editLocal(id: string, patch: Partial<Blog>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }
  function saveRow(row: Blog) {
    update(row.id, {
      slug: row.slug,
      title: row.title,
      kicker: row.kicker,
      excerpt: row.excerpt,
      content: row.content,
      cover_color: row.cover_color,
      read_minutes: row.read_minutes,
      published: row.published,
      featured: row.featured,
    });
  }
  async function remove(id: string) {
    if (!confirm("Delete this blog?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) { setErr(error.message); return; }
    load();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <Card>
        <h2 className="font-display font-bold text-2xl mb-5">New blog post</h2>
        <form onSubmit={add} className="space-y-3">
          <Field label="Slug"><Input required value={draft.slug ?? ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="why-ai-workforce" /></Field>
          <Field label="Title"><Input required value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="Kicker"><Input value={draft.kicker ?? ""} onChange={(e) => setDraft({ ...draft, kicker: e.target.value })} placeholder="Essay" /></Field>
          <Field label="Excerpt"><Textarea rows={3} value={draft.excerpt ?? ""} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></Field>
          <Field label="Content (markdown / plain)"><Textarea rows={6} value={draft.content ?? ""} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cover color">
              <select value={draft.cover_color ?? "var(--sun)"} onChange={(e) => setDraft({ ...draft, cover_color: e.target.value })} className="w-full rounded-xl border-2 border-foreground bg-transparent px-4 py-2.5 text-sm">
                <option value="var(--sun)">Sun</option>
                <option value="var(--leaf)">Leaf</option>
                <option value="var(--ember)">Ember</option>
              </select>
            </Field>
            <Field label="Read minutes"><Input type="number" min={1} value={draft.read_minutes ?? 5} onChange={(e) => setDraft({ ...draft, read_minutes: Number(e.target.value) })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured ?? false} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Published</label>
          {err && <p className="text-sm text-[var(--ember)]">{err}</p>}
          <button className="chunk-btn w-full justify-center">Publish post →</button>
        </form>
      </Card>

      <div className="space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No blogs yet.</div>}
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="grid gap-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Title"><Input value={r.title} onChange={(e) => editLocal(r.id, { title: e.target.value })} /></Field>
                <Field label="Slug"><Input value={r.slug} onChange={(e) => editLocal(r.id, { slug: e.target.value })} /></Field>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Kicker"><Input value={r.kicker ?? ""} onChange={(e) => editLocal(r.id, { kicker: e.target.value })} /></Field>
                <Field label="Read minutes"><Input type="number" min={1} value={r.read_minutes ?? 5} onChange={(e) => editLocal(r.id, { read_minutes: Number(e.target.value) })} /></Field>
                <Field label="Cover color"><Input value={r.cover_color ?? "var(--sun)"} onChange={(e) => editLocal(r.id, { cover_color: e.target.value })} /></Field>
              </div>
              <Field label="Excerpt"><Textarea rows={2} value={r.excerpt ?? ""} onChange={(e) => editLocal(r.id, { excerpt: e.target.value })} /></Field>
              <Field label="Content"><Textarea rows={4} value={r.content ?? ""} onChange={(e) => editLocal(r.id, { content: e.target.value })} /></Field>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => saveRow(r)} className="rounded-full bg-foreground text-background px-3 py-1 text-xs">Save changes</button>
                <button onClick={() => update(r.id, { published: !r.published })} className="rounded-full border border-foreground/30 px-3 py-1 text-xs">{r.published ? "Unpublish" : "Publish"}</button>
                <button onClick={() => update(r.id, { featured: !r.featured })} className="rounded-full border border-foreground/30 px-3 py-1 text-xs">{r.featured ? "Unfeature" : "Feature"}</button>
                <button onClick={() => remove(r.id)} className="rounded-full bg-[var(--ember)] text-background px-3 py-1 text-xs">Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────── NEWS ─────── */
type NewsItem = { id: string; title: string; tag: string; color: string; excerpt: string | null; body: string | null; published: boolean; published_at: string | null };

function NewsAdmin() {
  const [rows, setRows] = useState<NewsItem[]>([]);
  const [draft, setDraft] = useState<Partial<NewsItem>>({ title: "", tag: "Product", color: "var(--sun)", excerpt: "", published: true });
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as NewsItem[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.from("news").insert(draft as never);
    if (error) { setErr(error.message); return; }
    setDraft({ title: "", tag: "Product", color: "var(--sun)", excerpt: "", published: true });
    load();
  }
  async function update(id: string, patch: Partial<NewsItem>) { setErr(null); const { error } = await supabase.from("news").update(patch).eq("id", id); if (error) { setErr(error.message); return; } load(); }
  function editLocal(id: string, patch: Partial<NewsItem>) { setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row)); }
  function saveRow(row: NewsItem) { update(row.id, { title: row.title, tag: row.tag, color: row.color, excerpt: row.excerpt, body: row.body, published_at: row.published_at, published: row.published }); }
  async function remove(id: string) { if (!confirm("Delete?")) return; const { error } = await supabase.from("news").delete().eq("id", id); if (error) { setErr(error.message); return; } load(); }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <Card>
        <h2 className="font-display font-bold text-2xl mb-5">New news item</h2>
        <form onSubmit={add} className="space-y-3">
          <Field label="Title"><Input required value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tag"><Input value={draft.tag ?? ""} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} placeholder="Product / Update / Press" /></Field>
            <Field label="Color">
              <select value={draft.color ?? "var(--sun)"} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="w-full rounded-xl border-2 border-foreground bg-transparent px-4 py-2.5 text-sm">
                <option value="var(--sun)">Sun</option>
                <option value="var(--leaf)">Leaf</option>
                <option value="var(--ember)">Ember</option>
              </select>
            </Field>
          </div>
          <Field label="Excerpt"><Textarea rows={3} value={draft.excerpt ?? ""} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></Field>
          <Field label="Body (optional)"><Textarea rows={5} value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Published</label>
          {err && <p className="text-sm text-[var(--ember)]">{err}</p>}
          <button className="chunk-btn w-full justify-center">Add news →</button>
        </form>
      </Card>

      <div className="space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No news yet.</div>}
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="grid gap-3">
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Title"><Input value={r.title} onChange={(e) => editLocal(r.id, { title: e.target.value })} /></Field>
                <Field label="Tag"><Input value={r.tag ?? ""} onChange={(e) => editLocal(r.id, { tag: e.target.value })} /></Field>
                <Field label="Published date"><Input type="date" value={r.published_at ?? ""} onChange={(e) => editLocal(r.id, { published_at: e.target.value })} /></Field>
              </div>
              <Field label="Excerpt"><Textarea rows={2} value={r.excerpt ?? ""} onChange={(e) => editLocal(r.id, { excerpt: e.target.value })} /></Field>
              <Field label="Body"><Textarea rows={4} value={r.body ?? ""} onChange={(e) => editLocal(r.id, { body: e.target.value })} /></Field>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => saveRow(r)} className="rounded-full bg-foreground text-background px-3 py-1 text-xs">Save changes</button>
                <button onClick={() => update(r.id, { published: !r.published })} className="rounded-full border border-foreground/30 px-3 py-1 text-xs">{r.published ? "Unpublish" : "Publish"}</button>
                <button onClick={() => remove(r.id)} className="rounded-full bg-[var(--ember)] text-background px-3 py-1 text-xs">Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────── FAQS ─────── */
type FaqRow = { id: string; question: string; answer: string; category: string; sort_order: number; published: boolean };

function FaqsAdmin() {
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [draft, setDraft] = useState<Partial<FaqRow>>({ question: "", answer: "", category: "general", sort_order: 0, published: true });
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from("faqs").select("*").order("sort_order");
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as FaqRow[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.from("faqs").insert(draft as never);
    if (error) { setErr(error.message); return; }
    setDraft({ question: "", answer: "", category: "general", sort_order: (rows.length + 1) * 10, published: true });
    load();
  }
  async function update(id: string, patch: Partial<FaqRow>) { setErr(null); const { error } = await supabase.from("faqs").update(patch).eq("id", id); if (error) { setErr(error.message); return; } load(); }
  function editLocal(id: string, patch: Partial<FaqRow>) { setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row)); }
  function saveRow(row: FaqRow) { update(row.id, { question: row.question, answer: row.answer, category: row.category, sort_order: row.sort_order, published: row.published }); }
  async function remove(id: string) { if (!confirm("Delete?")) return; const { error } = await supabase.from("faqs").delete().eq("id", id); if (error) { setErr(error.message); return; } load(); }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <Card>
        <h2 className="font-display font-bold text-2xl mb-5">New FAQ</h2>
        <form onSubmit={add} className="space-y-3">
          <Field label="Question"><Input required value={draft.question ?? ""} onChange={(e) => setDraft({ ...draft, question: e.target.value })} /></Field>
          <Field label="Answer"><Textarea required rows={5} value={draft.answer ?? ""} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><Input value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
            <Field label="Sort order"><Input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Published</label>
          {err && <p className="text-sm text-[var(--ember)]">{err}</p>}
          <button className="chunk-btn w-full justify-center">Add FAQ →</button>
        </form>
      </Card>

      <div className="space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No FAQs yet — defaults are shown publicly.</div>}
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="grid gap-3">
              <Field label="Question"><Input value={r.question} onChange={(e) => editLocal(r.id, { question: e.target.value })} /></Field>
              <Field label="Answer"><Textarea rows={4} value={r.answer} onChange={(e) => editLocal(r.id, { answer: e.target.value })} /></Field>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Category"><Input value={r.category ?? ""} onChange={(e) => editLocal(r.id, { category: e.target.value })} /></Field>
                <Field label="Sort order"><Input type="number" value={r.sort_order} onChange={(e) => editLocal(r.id, { sort_order: Number(e.target.value) })} /></Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => saveRow(r)} className="rounded-full bg-foreground text-background px-3 py-1 text-xs">Save changes</button>
                <button onClick={() => update(r.id, { published: !r.published })} className="rounded-full border border-foreground/30 px-3 py-1 text-xs">{r.published ? "Hide" : "Show"}</button>
                <button onClick={() => remove(r.id)} className="rounded-full bg-[var(--ember)] text-background px-3 py-1 text-xs">Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────── SITE CONTENT (founders etc.) ─────── */
type ContentRow = { key: string; value: { heading?: string; body?: string } };
const CONTENT_KEYS: { key: string; label: string }[] = [
  { key: "founders", label: "Founders section" },
  { key: "vision_statement", label: "Vision statement" },
];

function ContentAdmin() {
  const [rows, setRows] = useState<Record<string, { heading: string; body: string }>>({});
  const [saved, setSaved] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("site_content").select("key,value").in("key", CONTENT_KEYS.map((k) => k.key));
    const map: Record<string, { heading: string; body: string }> = {};
    for (const k of CONTENT_KEYS) map[k.key] = { heading: "", body: "" };
    (data as ContentRow[] | null)?.forEach((r) => {
      map[r.key] = { heading: r.value?.heading ?? "", body: r.value?.body ?? "" };
    });
    setRows(map);
  }
  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setSaved(null);
    const { error } = await supabase.from("site_content").upsert({ key, value: rows[key] }, { onConflict: "key" });
    if (!error) { setSaved(key); setTimeout(() => setSaved(null), 2000); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {CONTENT_KEYS.map(({ key, label }) => {
        const row = rows[key] ?? { heading: "", body: "" };
        return (
          <Card key={key}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-xs text-muted-foreground">site_content / {key}</div>
                <h3 className="font-display font-bold text-2xl mt-1">{label}</h3>
              </div>
              {saved === key && <span className="sticker bg-[var(--leaf)]">saved ✓</span>}
            </div>
            <div className="space-y-3">
              <Field label="Heading"><Input value={row.heading} onChange={(e) => setRows({ ...rows, [key]: { ...row, heading: e.target.value } })} /></Field>
              <Field label="Body"><Textarea rows={5} value={row.body} onChange={(e) => setRows({ ...rows, [key]: { ...row, body: e.target.value } })} /></Field>
              <button onClick={() => save(key)} className="chunk-btn w-full justify-center">Save →</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
