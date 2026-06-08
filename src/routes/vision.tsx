import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/vision")({
  head: () => ({
    meta: [
      { title: "Vision — Mythmind AI" },
      { name: "description", content: "Mythmind's vision: replace fragmented software stacks with one intelligent AI workforce that executes work — not just answers questions." },
      { property: "og:title", content: "Vision — Mythmind AI" },
      { property: "og:description", content: "Replace fragmented software stacks with one intelligent AI workforce that executes." },
      { property: "og:url", content: "/vision" },
    ],
    links: [{ rel: "canonical", href: "/vision" }],
  }),
  component: Vision,
});

function Vision() {
  return (
    <>
      <PageHeader
        eyebrow="/vision"
        accent="leaf"
        title={<>the future of work is <em className="italic font-light">execution.</em></>}
        lede="A thesis in three movements: from chatbots to teammates, from tools to teams, from output to outcomes."
      />

      <section className="mx-auto max-w-[1100px] px-5 lg:px-8 py-24 space-y-24">
        {[
          {
            tag: "I",
            color: "var(--sun)",
            title: "From chatbots to teammates.",
            body: "Today's AI talks. Tomorrow's AI works. Mythmind's employees take real actions in real tools — they don't just suggest next steps, they take them. The next decade belongs to AI that executes.",
          },
          {
            tag: "II",
            color: "var(--leaf)",
            title: "From tools to teams.",
            body: "A single assistant can't run a business. A coordinated team can. Mythmind is built as six AI employees with shared memory and distinct roles, so the whole becomes greater than the prompts.",
          },
          {
            tag: "III",
            color: "var(--ember)",
            title: "From output to outcomes.",
            body: "Generating text is the easy part. Shipping a website, sending a campaign, booking a meeting, launching a business — that's the work. Mythmind is engineered to close the loop, every time.",
          },
        ].map((m) => (
          <article key={m.tag} className="grid gap-10 lg:grid-cols-[140px_1fr] items-start">
            <div>
              <div className="font-display font-bold text-8xl">{m.tag}</div>
              <span className="mt-4 inline-block size-4 rounded-full" style={{ background: m.color }} />
            </div>
            <div>
              <h2 className="font-display font-bold text-4xl lg:text-5xl tracking-tight">{m.title}</h2>
              <p className="mt-6 text-lg leading-relaxed text-foreground/80 max-w-2xl">{m.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="border-t-2 border-foreground bg-foreground text-background">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
          <p className="display-md max-w-5xl">
            "Most software makes you do the work. We're building the opposite — a workforce that already
            <span className="text-[var(--sun)]"> understands your business</span> and just gets it done."
          </p>
          <div className="mt-8 font-mono text-xs uppercase tracking-widest text-background/60">
            — the Mythmind team
          </div>
        </div>
      </section>
    </>
  );
}
