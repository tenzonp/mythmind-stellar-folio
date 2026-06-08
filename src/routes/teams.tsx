import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "The AI Workforce — Mythmind" },
      { name: "description", content: "Meet the six AI employees inside Mythmind — Atlas, Echo, Lumen, Quill, Forge and Sage — each with distinct roles, tools and memory." },
      { property: "og:title", content: "The AI Workforce — Mythmind" },
      { property: "og:description", content: "Meet the six AI employees inside Mythmind." },
      { property: "og:url", content: "/teams" },
    ],
    links: [{ rel: "canonical", href: "/teams" }],
  }),
  component: Teams,
});

const team = [
  { name: "Atlas", role: "Operations Manager", color: "var(--sun)", tools: ["Calendar", "Slack", "SMS", "Zoom"], body: "Atlas runs the day-to-day. Books meetings, generates links, sends reminders, coordinates your team across every channel. Your operations engine." },
  { name: "Echo", role: "Communications Lead", color: "var(--leaf)", tools: ["Gmail", "Outlook", "Support inbox"], body: "Echo lives in your inbox. Reads, prioritizes, drafts replies, summarizes long threads, sends outbound. Customer & internal comms, handled." },
  { name: "Lumen", role: "Content & Creative", color: "var(--ember)", tools: ["Instagram", "Facebook", "Email", "Image gen"], body: "Lumen is your content engine. Researches niche, writes captions, generates visuals, publishes posts and campaigns across socials and email — autonomously." },
  { name: "Quill", role: "Research Analyst", color: "var(--sun)", tools: ["Web", "Markets", "Competitors"], body: "Quill goes deep. Market research, competitor breakdowns, trend reports, customer insights, idea validation — structured into outputs you can actually use." },
  { name: "Forge", role: "Builder & Executor", color: "var(--leaf)", tools: ["PDF", "PPTX", "Website", "Logo"], body: "Forge turns ideas into shipping deliverables. Business plans, decks, PDFs, branding, logos, websites, launch kits. Your in‑house production team." },
  { name: "Sage", role: "Executive Assistant", color: "var(--ember)", tools: ["Memory", "Briefings", "Context"], body: "Sage is your second brain. Holds long-term context, manages priorities, briefs you on what matters, and quietly hides what doesn't." },
];

function Teams() {
  return (
    <>
      <PageHeader
        eyebrow="/teams"
        accent="leaf"
        title={<>six employees. <em className="italic font-light">one shared brain.</em></>}
        lede="Each Mythmind AI employee has its own role, tools and memory — but they share context, coordinate work, and act as one team inside your workspace."
      />

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-20">
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

              <div className="mt-12 flex items-baseline gap-3">
                <h3 className="font-display font-bold text-5xl">{m.name}</h3>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: m.color }}>AI</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground font-medium">{m.role}</div>

              <p className="mt-5 text-base leading-snug">{m.body}</p>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {m.tools.map((t) => (
                  <span key={t} className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-foreground/30">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-foreground bg-foreground text-background">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-20 flex flex-col lg:flex-row gap-10 lg:items-end justify-between">
          <div>
            <span className="pill !border-background !text-background">join the founding crew</span>
            <h2 className="display-lg mt-4 max-w-2xl">we're hiring <span className="italic font-light text-[var(--sun)]">a few humans, too.</span></h2>
            <p className="mt-6 text-background/70 max-w-xl">Engineers, designers, and prompt-architects who want to build the future of work. Bootstrapped. No nonsense.</p>
          </div>
          <Link to="/contact" className="chunk-btn-ghost !border-background !text-background !shadow-[4px_4px_0_var(--paper)]">
            Pitch yourself →
          </Link>
        </div>
      </section>
    </>
  );
}
