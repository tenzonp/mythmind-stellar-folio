import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Mythmind AI" },
      { name: "description", content: "Get in touch with Mythmind AI for early access, partnerships, press, or careers. Bootstrapped, founder-led, fast to reply." },
      { property: "og:title", content: "Contact — Mythmind AI" },
      { property: "og:description", content: "Get in touch with Mythmind AI — early access, partnerships, press, careers." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHeader
        eyebrow="/contact"
        accent="ember"
        title={<>say hi to the <em className="italic font-light">workforce.</em></>}
        lede="Early access, partnerships, press, or just curious — we read every message and reply fast."
      />

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-20 grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-10">
          <Channel label="Early access" address="hello@mythmind.ai" note="Tell us what you'd put the workforce on first." color="var(--sun)" />
          <Channel label="Press & media" address="press@mythmind.ai" note="We reply within two working days." color="var(--leaf)" />
          <Channel label="Careers" address="careers@mythmind.ai" note="Engineers, designers, prompt-architects." color="var(--ember)" />
          <Channel label="Partnerships" address="partners@mythmind.ai" note="Integrations, distribution, ecosystem." color="var(--sun)" />

          <div className="pt-10 border-t-2 border-foreground">
            <span className="pill">the lab</span>
            <p className="mt-6 text-foreground/80 leading-relaxed max-w-md">
              Mythmind is a fully remote, bootstrapped team building in public. No HQ — just a shared workspace, six AI employees, and a lot of focus.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); }}
          className="relative rounded-3xl border-2 border-foreground p-8 lg:p-10 bg-background"
          style={{ boxShadow: "8px 8px 0 var(--ink)" }}
        >
          <span className="pill">send a note</span>
          <h2 className="font-display font-bold text-4xl mt-3">tell us what you're building.</h2>

          <div className="mt-8 grid gap-5">
            <Field label="Your name" type="text" placeholder="Ada Lovelace" />
            <Field label="Email" type="email" placeholder="ada@yourcompany.com" />
            <Field label="Reason" type="select" options={["Early access", "Partnership", "Press", "Careers", "Other"]} />
            <div>
              <label className="eyebrow block mb-2">Message</label>
              <textarea
                rows={5}
                placeholder="What would you put the AI workforce on first?"
                className="w-full bg-transparent border-2 border-foreground rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-foreground/30 resize-none"
              />
            </div>
            <button
              type="submit"
              className="mt-2 chunk-btn justify-center"
            >
              Send to Mythmind <span aria-hidden>→</span>
            </button>
            <p className="text-xs text-muted-foreground text-center">We'll get back to you within ~2 working days.</p>
          </div>
        </form>
      </section>
    </>
  );
}

function Channel({ label, address, note, color }: { label: string; address: string; note: string; color: string }) {
  return (
    <div className="group">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: color }} /> {label}
      </div>
      <a href={`mailto:${address}`} className="font-display font-bold text-3xl lg:text-4xl mt-2 block group-hover:underline underline-offset-4 decoration-2">{address}</a>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function Field({ label, type, placeholder, options }: { label: string; type: string; placeholder?: string; options?: string[] }) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      {type === "select" ? (
        <select className="w-full bg-transparent border-2 border-foreground rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-foreground/30">
          {options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} className="w-full bg-transparent border-2 border-foreground rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-foreground/30" />
      )}
    </div>
  );
}
