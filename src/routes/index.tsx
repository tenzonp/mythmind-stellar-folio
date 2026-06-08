import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";
import { getPublicHomeContent, type PublishedBlog } from "@/lib/content.functions";

export const Route = createFileRoute("/")({
  loader: () => getPublicHomeContent(),
  head: () => ({
    meta: [
      { title: "Mythmind AI — Your AI Agentic Workforce Platform" },
      { name: "description", content: "Mythmind AI is an agentic workforce platform with six specialized AI employees that research, create, communicate and execute real business tasks — autonomously, from one workspace." },
      { name: "keywords", content: "Mythmind AI, AI workforce, AI agents, agentic AI, AI employees, AI business operating system, autonomous AI, AI for startups, AI assistant, AI automation platform" },
      { property: "og:title", content: "Mythmind AI — Your AI Agentic Workforce Platform" },
      { property: "og:description", content: "Six AI employees that think, coordinate and execute real work — research, content, communication, operations and full business launches." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
  errorComponent: () => <IndexBody blogs={[]} />,
  notFoundComponent: () => <IndexBody blogs={[]} />,
});

function Index() {
  const { blogs } = Route.useLoaderData();
  return <IndexBody blogs={blogs} />;
}

function IndexBody({ blogs }: { blogs: PublishedBlog[] }) {
  return (
    <>
      <Hero />
      <Marquee />
      <Manifesto />
      <Employees />
      <Capabilities />
      <Workflow />
      <Numbers />
      <Featured blogs={blogs} />
      <CTA />
    </>
  );
}

/* ───────── HERO ───────── */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob absolute -top-40 -left-32 size-[560px] rounded-full" style={{ background: "var(--sun)" }} />
        <div className="blob absolute top-20 right-[-100px] size-[640px] rounded-full" style={{ background: "var(--leaf)", animationDelay: "-4s" }} />
        <div className="blob absolute bottom-[-120px] left-1/3 size-[520px] rounded-full" style={{ background: "var(--ember)", animationDelay: "-9s" }} />
        <div className="absolute inset-0 paper-grid opacity-60" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-5 lg:px-8 pt-10 lg:pt-16 pb-20 lg:pb-28">
        <div className="flex flex-wrap items-center gap-3">
          <span className="sticker bg-[var(--sun)]">◆ AI Workforce Platform</span>
          <span className="sticker bg-background">Bootstrapped · Independent</span>
          <span className="sticker bg-[var(--leaf)] tilt-r">★ 6 AI employees, 1 workspace</span>
        </div>

        <h1 className="display-xl mt-10 font-display font-bold">
          hire an
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">entire</span>
            <span className="absolute inset-x-1 bottom-2 h-[0.45em] bg-[var(--sun)] -z-0 rounded-md" />
          </span>{" "}
          AI
          <br />
          <span className="italic font-light text-foreground/80">company.</span>
          <span className="inline-block align-middle ml-3 size-[0.65em] rounded-full bg-[var(--ember)] wiggle" />
        </h1>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr] items-end">
          <p className="text-2xl lg:text-3xl font-display font-medium leading-tight max-w-2xl">
            Not a chatbot. A team of <span className="bg-[var(--leaf)]/40 px-1 rounded">six AI employees</span> that
            <span className="bg-[var(--ember)]/30 px-1 rounded ml-1">take action</span>, use tools, and
            <span className="bg-[var(--sun)]/50 px-1 rounded ml-1">finish the work</span> — research, content, comms, launches.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/teams" className="chunk-btn">Meet the team →</Link>
            <Link to="/vision" className="chunk-btn-ghost">Why we exist</Link>
          </div>
        </div>

        <div className="absolute right-6 lg:right-12 top-24 lg:top-32 hidden md:block">
          <div className="relative size-32 lg:size-44">
            <svg viewBox="0 0 200 200" className="spin-slow w-full h-full">
              <defs>
                <path id="circle" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
              </defs>
              <text fill="currentColor" fontSize="14" fontFamily="Geist Mono" letterSpacing="6">
                <textPath href="#circle">★ MYTHMIND AI ★ AGENTIC WORKFORCE ★ EXECUTION ★ </textPath>
              </text>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <Logo className="size-12 lg:size-16 wiggle" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── MARQUEE ───────── */
function Marquee() {
  const items = ["RESEARCH", "CONTENT", "EMAILS", "MEETINGS", "BRANDING", "WEBSITES", "REPORTS", "LAUNCHES", "AUTOMATION", "EXECUTION"];
  const row = [...items, ...items, ...items];
  const colors = ["var(--sun)", "var(--leaf)", "var(--ember)"];
  return (
    <section className="bg-foreground text-background py-5 overflow-hidden border-b-2 border-foreground">
      <div className="flex marquee-track gap-8 whitespace-nowrap items-center">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-display font-bold text-4xl lg:text-6xl">
            {t}
            <span className="size-3.5 rounded-full shrink-0" style={{ background: colors[i % 3] }} />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ───────── MANIFESTO ───────── */
function Manifesto() {
  return (
    <section className="relative mx-auto max-w-[1500px] px-5 lg:px-8 py-28 lg:py-40">
      <div className="flex items-center gap-3 mb-12">
        <span className="size-3 rounded-full bg-[var(--ember)]" />
        <span className="eyebrow">manifesto / 01</span>
      </div>
      <p className="display-md max-w-5xl">
        Every other AI <span className="bg-[var(--ember)] text-background px-2 rounded">answers questions</span>.
        Mythmind <span className="bg-[var(--sun)] px-2 rounded">does the work</span>. Six AI employees that understand your business, share memory, use real tools, and
        <span className="bg-[var(--leaf)] text-background px-2 rounded ml-2">ship outcomes</span> — not chat logs.
      </p>

      <div className="mt-14 flex flex-wrap items-center gap-6">
        <Link to="/about" className="chunk-btn">What is Mythmind →</Link>
        <span className="font-mono text-sm text-muted-foreground">— one workspace, instead of fifteen tabs</span>
      </div>
    </section>
  );
}

/* ───────── AI EMPLOYEES ───────── */
function Employees() {
  const team = [
    { name: "Atlas", role: "Operations Manager", color: "var(--sun)", body: "Runs your day. Schedules meetings, generates links, coordinates the team, sends reminders, keeps logistics humming." },
    { name: "Echo", role: "Communications Lead", color: "var(--leaf)", body: "Lives in your inbox. Reads, drafts, replies, summarizes threads. Handles customer & internal comms end‑to‑end." },
    { name: "Lumen", role: "Content & Creative", color: "var(--ember)", body: "Writes captions, generates visuals, designs campaigns, and posts to Instagram, Facebook & email — autonomously." },
    { name: "Quill", role: "Research Analyst", color: "var(--sun)", body: "Deep market research, competitor analysis, trend reports, customer insights — structured into outputs you can use." },
    { name: "Forge", role: "Builder & Executor", color: "var(--leaf)", body: "Generates PDFs, decks, websites, business plans, logos, launch kits. Turns ideas into shippable deliverables." },
    { name: "Sage", role: "Executive Assistant", color: "var(--ember)", body: "Your second brain. Remembers context, manages priorities, briefs you on what matters, hides what doesn't." },
  ];
  return (
    <section className="border-y-2 border-foreground bg-background">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <span className="pill mb-4">the workforce / 02</span>
            <h2 className="display-lg mt-4">six AI employees.<br />one shared brain.</h2>
          </div>
          <Link to="/teams" className="chunk-btn-ghost">All employees →</Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((m, i) => (
            <article
              key={m.name}
              className="relative rounded-3xl border-2 border-foreground p-7 lg:p-8 overflow-hidden group hover:-translate-y-1 transition-transform bg-background"
              style={{ boxShadow: "6px 6px 0 var(--ink)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">EMP / 0{i + 1}</span>
                <span className="size-3 rounded-full" style={{ background: m.color }} />
              </div>
              <div className="mt-10 flex items-baseline gap-3">
                <h3 className="font-display font-bold text-5xl">{m.name}</h3>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: m.color }}>AI</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground font-medium">{m.role}</div>
              <p className="mt-5 text-base leading-snug">{m.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── CAPABILITIES ───────── */
function Capabilities() {
  const groups = [
    { color: "var(--sun)", title: "Action, not chat", items: ["Posts to Instagram & Facebook", "Sends email campaigns", "Books meetings & sends invites", "Messages your team on Slack"] },
    { color: "var(--leaf)", title: "Built‑in research", items: ["Market & competitor analysis", "Customer & trend insights", "Idea validation", "Business plan drafting"] },
    { color: "var(--ember)", title: "Real deliverables", items: ["PDFs & reports", "Pitch decks & PPTX", "Websites & landing pages", "Branding, logos, launch kits"] },
  ];
  return (
    <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-28">
      <div className="mb-12">
        <span className="pill">capabilities / 03</span>
        <h2 className="display-lg mt-4 max-w-3xl">one workspace, replaces <em className="italic font-light">your stack.</em></h2>
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        {groups.map((g) => (
          <div key={g.title} className="rounded-3xl border-2 border-foreground p-8 bg-background" style={{ boxShadow: "5px 5px 0 var(--ink)" }}>
            <span className="size-3 rounded-full block mb-6" style={{ background: g.color }} />
            <h3 className="font-display font-bold text-3xl">{g.title}</h3>
            <ul className="mt-6 space-y-3">
              {g.items.map((it) => (
                <li key={it} className="flex items-start gap-3 text-base">
                  <span className="mt-2 size-1.5 rounded-full bg-foreground shrink-0" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── WORKFLOW ───────── */
function Workflow() {
  const steps = [
    ["01", "var(--sun)", "Tell Mythmind, in plain language", "“Post about our launch on Instagram and email our list.”"],
    ["02", "var(--leaf)", "The team coordinates behind the scenes", "Quill researches, Lumen creates, Echo drafts, Atlas schedules."],
    ["03", "var(--ember)", "Real work ships, end to end", "Posts published. Emails sent. Reports in your inbox. Done."],
  ];
  return (
    <section className="border-y-2 border-foreground bg-foreground text-background overflow-hidden">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
        <span className="pill !border-background !text-background">how it works / 04</span>
        <h2 className="display-lg mt-4 max-w-3xl">say it once. <span className="italic font-light text-[var(--sun)]">it gets done.</span></h2>

        <div className="mt-14 grid md:grid-cols-3 gap-px bg-background/15 border border-background/15 rounded-2xl overflow-hidden">
          {steps.map(([n, c, t, b]) => (
            <div key={n} className="bg-foreground p-8 lg:p-10">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-6xl" style={{ color: c }}>{n}</span>
                <span className="size-3 rounded-full" style={{ background: c }} />
              </div>
              <h3 className="font-display font-bold text-2xl mt-8">{t}</h3>
              <p className="mt-4 text-base text-background/70 leading-snug">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── NUMBERS ───────── */
function Numbers() {
  const stats = [
    ["6", "AI employees, one team", "var(--sun)"],
    ["100%", "bootstrapped, founder‑led", "var(--leaf)"],
    ["50+", "tools replaced by one workspace", "var(--ember)"],
    ["∞", "tasks shipped by midnight", "var(--sun)"],
  ];
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
        <span className="pill">by the numbers</span>
        <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(([n, l, c]) => (
            <div key={l} className="border-t-2 border-foreground pt-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="size-3 rounded-full" style={{ background: c }} />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">stat</span>
              </div>
              <div className="font-display font-bold text-8xl leading-none">{n}</div>
              <div className="mt-4 text-base text-foreground/70">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FEATURED ───────── */
function Featured({ blogs }: { blogs: PublishedBlog[] }) {
  const items = blogs.length > 0 ? blogs : [
    { kicker: "Essay", created_at: "", title: "Why an AI workforce beats a single AI assistant.", excerpt: "A single AI is a tool. Six coordinated AIs with shared memory are a company.", cover_color: "var(--sun)", read_minutes: 8 },
    { kicker: "Strategy", created_at: "", title: "How agentic AI employees turn business context into shipped outcomes.", excerpt: "The operating model behind Mythmind: shared memory, specialized roles, and real execution across tools.", cover_color: "var(--leaf)", read_minutes: 7 },
    { kicker: "Guide", created_at: "", title: "What founders should automate first with an AI workforce.", excerpt: "Research, content, communication, scheduling, reports, launch assets — the highest-leverage workflows to delegate first.", cover_color: "var(--ember)", read_minutes: 6 },
  ];
  return (
    <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-28">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <span className="pill">journal / 05</span>
          <h2 className="display-lg mt-4">latest from the build.</h2>
        </div>
        <Link to="/blogs" className="chunk-btn-ghost">All blogs →</Link>
      </div>

      <ul className="space-y-4">
        {items.map((it) => (
          <li key={it.title}>
            <Link
              to="/blogs"
              className="block rounded-2xl border-2 border-foreground p-6 lg:p-8 bg-background hover:-translate-y-0.5 transition-transform"
              style={{ boxShadow: "5px 5px 0 var(--ink)" }}
            >
              <div className="grid grid-cols-12 gap-6 items-center">
                <span className="col-span-12 md:col-span-2 flex items-center gap-2">
                  <span className="sticker text-xs" style={{ background: it.cover_color ?? "var(--sun)" }}>{it.kicker ?? "Journal"}</span>
                </span>
                <span className="col-span-12 md:col-span-2 font-mono text-xs text-muted-foreground">{it.read_minutes ?? 5} min read</span>
                <span className="col-span-12 md:col-span-7">
                  <span className="block font-display font-bold text-2xl lg:text-3xl">{it.title}</span>
                  <span className="mt-2 block text-sm text-foreground/70 line-clamp-2">{it.excerpt}</span>
                </span>
                <span className="col-span-12 md:col-span-1 text-right text-3xl">→</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── CTA ───────── */
function CTA() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 lg:px-8 pb-32">
      <div
        className="relative rounded-[2.5rem] overflow-hidden border-2 border-foreground p-10 lg:p-20 bg-[var(--sun)]"
        style={{ boxShadow: "10px 10px 0 var(--ink)" }}
      >
        <div aria-hidden className="absolute inset-0 -z-0 paper-grid opacity-40" />
        <div aria-hidden className="absolute -top-16 -right-10 size-72 rounded-full blob" style={{ background: "var(--ember)" }} />
        <div aria-hidden className="absolute bottom-[-50px] left-[10%] size-80 rounded-full blob" style={{ background: "var(--leaf)", animationDelay: "-6s" }} />

        <div className="relative">
          <Logo className="h-14 w-14 wiggle" />
          <h2 className="display-lg mt-8 max-w-4xl">
            stop juggling tools.<br />
            <span className="underline decoration-[6px] decoration-[var(--ember)] underline-offset-[8px]">hire the team.</span>
          </h2>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="https://mythmind.co" className="chunk-btn">Get access →</a>
            <Link to="/teams" className="chunk-btn-ghost !bg-background">Meet the AI team</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
