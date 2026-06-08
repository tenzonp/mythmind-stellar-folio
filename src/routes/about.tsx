import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { useSiteContent } from "@/lib/site-content";
import { breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Mythmind AI" },
      { name: "description", content: "Mythmind AI is an agentic workforce platform — a digital company of six AI employees that take action, use tools, and finish real work. Bootstrapped and founder-led." },
      { property: "og:title", content: "About — Mythmind AI" },
      { property: "og:description", content: "A digital company of six AI employees that take action, use tools, and finish real work." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
    scripts: [breadcrumbLd([{ name: "Home", url: "/" }, { name: "About", url: "/about" }])],
  }),
  component: About,
});

function About() {
  const founders = useSiteContent("founders", {
    heading: "built by founders, for founders.",
    body: "Mythmind is bootstrapped, fully remote, and shipped by a small team who got tired of switching tabs. We're building the AI workforce we wanted to hire ourselves.",
  });
  return (
    <>
      <PageHeader
        eyebrow="/about"
        accent="sun"
        title={<>not an assistant. <em className="italic font-light">a workforce.</em></>}
        lede="Mythmind AI is an agentic AI workforce platform — a digital company of intelligent AI employees that work together to research, create, communicate and execute real business tasks."
      />

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24 grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="pill">what it is</span>
          <h2 className="display-lg mt-4">an AI business operating system.</h2>
        </div>
        <div className="lg:col-span-7 space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            Most AI products answer questions. Mythmind <em>does the work</em>. Six specialized AI employees — each with their own role, tools and memory — collaborate inside one workspace to operate your business like an in‑house team.
          </p>
          <p>
            Tell Mythmind, in plain language, what you want. It researches, decides, executes across the right tools, and ships the outcome. Posts go live. Emails get sent. Meetings get booked. Decks get built. Websites ship.
          </p>
          <p>
            We're building the layer that replaces fragmented software stacks with one intelligent workforce — for founders, creators, operators and small teams who want to move at the speed of thought.
          </p>
        </div>
      </section>

      <section className="border-y-2 border-foreground bg-background">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
          <span className="pill">how we're different</span>
          <h2 className="display-lg mt-4 mb-12">five things that make Mythmind, Mythmind.</h2>

          <div className="grid lg:grid-cols-2 gap-5">
            {[
              ["Action, not chat", "Mythmind takes real actions in real tools — not just words on a screen.", "var(--sun)"],
              ["A team, not a tool", "Six AI employees with shared memory, distinct roles, and the ability to coordinate.", "var(--leaf)"],
              ["Context that compounds", "Mythmind learns your business, brand, voice and team — and gets better the longer you use it.", "var(--ember)"],
              ["Outcomes, not outputs", "We ship PDFs, decks, websites, posts and campaigns — not raw text dumps.", "var(--sun)"],
              ["Bootstrapped, focused", "Independent, founder‑led, optimizing for users — not investors or hype cycles.", "var(--leaf)"],
            ].map(([h, p, c], i) => (
              <div key={h as string} className="rounded-2xl border-2 border-foreground p-7 bg-background" style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">/ 0{i + 1}</span>
                  <span className="size-3 rounded-full" style={{ background: c as string }} />
                </div>
                <h3 className="font-display font-bold text-3xl mt-8">{h}</h3>
                <p className="mt-3 text-foreground/75 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-20 grid gap-10 md:grid-cols-3">
          <div>
            <div className="font-display font-bold text-7xl">6</div>
            <p className="mt-3 text-sm text-background/60">specialized AI employees, working as one team.</p>
          </div>
          <div>
            <div className="font-display font-bold text-7xl">1</div>
            <p className="mt-3 text-sm text-background/60">unified workspace — no tab switching, no glue code.</p>
          </div>
          <div>
            <div className="font-display font-bold text-7xl">0</div>
            <p className="mt-3 text-sm text-background/60">external investors. Bootstrapped, independent, focused.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
        <span className="pill">the founders</span>
        <h2 className="display-lg mt-4 max-w-4xl">{founders.heading}</h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground/80 whitespace-pre-line">{founders.body}</p>
      </section>
    </>
  );
}
