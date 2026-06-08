import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: "Independent & Bootstrapped — Mythmind AI" },
      { name: "description", content: "Mythmind AI is fully bootstrapped, founder-led and independent. No external investors, no board seats — just users, product and outcomes." },
      { property: "og:title", content: "Independent & Bootstrapped — Mythmind AI" },
      { property: "og:description", content: "Fully bootstrapped, founder-led and independent. No external investors." },
      { property: "og:url", content: "/investors" },
    ],
    links: [{ rel: "canonical", href: "/investors" }],
  }),
  component: Investors,
});

function Investors() {
  return (
    <>
      <PageHeader
        eyebrow="/independent"
        accent="sun"
        title={<>bootstrapped on purpose. <em className="italic font-light">accountable to users.</em></>}
        lede="Mythmind AI is fully independent — founder-led, founder-funded, and built without external capital. Our only investors are the people who use the product."
      />

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
          <div>
            <span className="pill">why bootstrapped</span>
            <h2 className="display-lg mt-4">our cap table is <em className="italic font-light">empty on purpose.</em></h2>
          </div>
          <div className="space-y-5 text-lg text-foreground/85 leading-relaxed">
            <p>We've taken zero outside capital. No seed round, no Series A, no angels, no board seats. Mythmind is built and funded by its founders, on its own timeline.</p>
            <p>That isn't ideology — it's strategy. It lets us obsess over the product, ship for users instead of metrics, and build a company that's still ours in five years.</p>
            <p>If we ever raise, it'll be small, quiet, and aligned. Until then: heads down, building.</p>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-foreground bg-foreground text-background">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24 grid md:grid-cols-3 gap-12">
          <div>
            <div className="font-display font-bold text-8xl text-[var(--sun)]">$0</div>
            <p className="mt-3 text-sm text-background/70">External capital raised.</p>
          </div>
          <div>
            <div className="font-display font-bold text-8xl text-[var(--leaf)]">100%</div>
            <p className="mt-3 text-sm text-background/70">Founder-owned and operated.</p>
          </div>
          <div>
            <div className="font-display font-bold text-8xl text-[var(--ember)]">0</div>
            <p className="mt-3 text-sm text-background/70">External board seats. Ever.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-24">
        <div className="rounded-3xl border-2 border-foreground p-8 lg:p-12 bg-background" style={{ boxShadow: "8px 8px 0 var(--ink)" }}>
          <span className="pill">future partners</span>
          <h2 className="display-md mt-4 max-w-3xl">if we ever raise, here's the bar.</h2>
          <ul className="mt-8 grid md:grid-cols-2 gap-4 text-lg">
            {[
              ["var(--sun)", "Long horizon — decade-plus, not three years."],
              ["var(--leaf)", "Product-obsessed, not metrics-obsessed."],
              ["var(--ember)", "Aligned on independence and founder control."],
              ["var(--sun)", "Operator background, not just spreadsheets."],
            ].map(([c, t]) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-2 size-3 rounded-full shrink-0" style={{ background: c }} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link to="/contact" className="mt-10 inline-flex chunk-btn">Introduce yourself →</Link>
        </div>
      </section>
    </>
  );
}
