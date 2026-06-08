import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Journey — Mythmind AI" },
      { name: "description", content: "The Mythmind journey: from a sketch on a notebook to a fully agentic AI workforce. Bootstrapped, founder-led, shipping in public." },
      { property: "og:title", content: "Journey — Mythmind AI" },
      { property: "og:description", content: "From a sketch on a notebook to a fully agentic AI workforce." },
      { property: "og:url", content: "/journey" },
    ],
    links: [{ rel: "canonical", href: "/journey" }],
  }),
  component: Journey,
});

const events = [
  { y: "Day 0", title: "An idea on a napkin.", body: "What if you could just tell an AI team what to do — and they'd actually do it, across real tools, without you babysitting?", color: "var(--sun)" },
  { y: "v0.1", title: "First AI employee: Quill, the researcher.", body: "We started with one role — deep research that produced structured, actually-useful outputs.", color: "var(--leaf)" },
  { y: "v0.3", title: "Shared memory, multi-agent coordination.", body: "Quill, Echo and Lumen learned to work together. Suddenly the whole became a team, not a stack.", color: "var(--ember)" },
  { y: "v0.6", title: "Action layer — Mythmind starts shipping.", body: "Posts publish. Emails send. Meetings book. The platform stops talking and starts doing.", color: "var(--sun)" },
  { y: "v0.9", title: "All six employees online.", body: "Atlas, Echo, Lumen, Quill, Forge and Sage — one workforce, one shared brain.", color: "var(--leaf)" },
  { y: "Now", title: "Closed alpha with founders, creators & operators.", body: "Real businesses running on Mythmind. Real feedback. Building toward public launch — bootstrapped, no hurry.", color: "var(--ember)" },
];

function Journey() {
  return (
    <>
      <PageHeader
        eyebrow="/journey"
        accent="ember"
        title={<>built quietly. <em className="italic font-light">shipped loudly.</em></>}
        lede="Mythmind is bootstrapped, founder‑led, and built in public. Here's the road so far."
      />

      <section className="mx-auto max-w-[1100px] px-5 lg:px-8 py-24">
        <ol className="relative">
          <span className="absolute left-[7.5rem] top-2 bottom-2 w-px bg-foreground/20 hidden md:block" />
          {events.map((e, i) => (
            <li key={i} className="relative grid md:grid-cols-[8rem_1fr] gap-6 md:gap-12 pb-14 last:pb-0">
              <div className="md:text-right">
                <div className="font-display font-bold text-3xl">{e.y}</div>
              </div>
              <div className="relative">
                <span className="hidden md:block absolute -left-[3.45rem] top-3 size-4 rounded-full ring-4 ring-background" style={{ background: e.color }} />
                <h3 className="font-display font-bold text-3xl lg:text-4xl">{e.title}</h3>
                <p className="mt-3 text-foreground/75 leading-relaxed max-w-xl">{e.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t-2 border-foreground bg-[var(--sun)]">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24 text-center">
          <span className="pill bg-background">what's next</span>
          <h2 className="display-lg mt-6 max-w-3xl mx-auto">
            public beta, new employees, and a much bigger workforce.
          </h2>
          <p className="mt-6 text-foreground/80 max-w-xl mx-auto">Get on the early‑access list and we'll let you know the second the doors open.</p>
        </div>
      </section>
    </>
  );
}
