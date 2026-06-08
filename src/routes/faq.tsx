import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/site/PageHeader";
import { getPublishedFaqs } from "@/lib/content.functions";
import { breadcrumbLd, faqLd } from "@/lib/seo";

const DEFAULT_FAQS = [
  { question: "What is Mythmind AI?", answer: "Mythmind AI is an agentic workforce platform — a coordinated team of six specialized AI employees that take action, use real tools, and ship real outcomes for your business." },
  { question: "How is Mythmind different from ChatGPT or other AI assistants?", answer: "Most AI products only answer questions. Mythmind does the work — it researches, drafts, decides, and executes across real tools (email, calendar, social, websites, decks). It's a workforce, not a chatbot." },
  { question: "Who are the six AI employees?", answer: "Atlas (Operations), Echo (Communications), Lumen (Content & Creative), Quill (Research), Forge (Builder), and Sage (Executive Assistant). Each has a distinct role, its own tools, and shared memory across the team." },
  { question: "Is Mythmind bootstrapped?", answer: "Yes — Mythmind is 100% bootstrapped, founder-led, and independent. We have raised zero external capital and have no board seats." },
  { question: "Can I get early access?", answer: "We're currently in closed alpha. You can request early access on the Contact page. We review every signup and onboard founders, creators and operators in batches." },
  { question: "What tools does Mythmind work with?", answer: "Mythmind integrates with Gmail, Outlook, Calendar, Slack, Instagram, Facebook, email platforms, and produces native PDFs, PPTX decks, websites and branding assets." },
  { question: "Is my data private and secure?", answer: "Yes. Your data is yours. Mythmind uses encrypted storage, scoped permissions per AI employee, and never trains on your private business content." },
  { question: "How much does Mythmind cost?", answer: "Pricing will be announced at public beta. Alpha access is free for early partners who actively share feedback." },
];

export const Route = createFileRoute("/faq")({
  loader: () => getPublishedFaqs(),
  head: () => ({
    meta: [
      { title: "FAQ — Mythmind AI" },
      { name: "description", content: "Frequently asked questions about Mythmind AI — the agentic AI workforce platform. Pricing, access, integrations, security and more." },
      { property: "og:title", content: "FAQ — Mythmind AI" },
      { property: "og:description", content: "Frequently asked questions about Mythmind AI." },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      faqLd(DEFAULT_FAQS),
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "FAQ", url: "/faq" },
      ]),
    ],
  }),
  component: FAQ,
  errorComponent: () => <FAQBody items={DEFAULT_FAQS} />,
  notFoundComponent: () => <FAQBody items={DEFAULT_FAQS} />,
});

function FAQ() {
  const rows = Route.useLoaderData();
  return <FAQBody items={rows.length > 0 ? rows : DEFAULT_FAQS} />;
}

function FAQBody({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <PageHeader
        eyebrow="/faq"
        accent="sun"
        title={<>questions, <em className="italic font-light">answered.</em></>}
        lede="Everything people ask about Mythmind — the workforce, the access, the tools, the philosophy."
      />

      <section className="mx-auto max-w-[1000px] px-5 lg:px-8 py-20">
        <ul className="space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <li
                key={i}
                className="rounded-2xl border-2 border-foreground bg-background overflow-hidden"
                style={{ boxShadow: isOpen ? "5px 5px 0 var(--ink)" : "3px 3px 0 var(--ink)" }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left px-6 lg:px-8 py-5 lg:py-6 flex items-center justify-between gap-6"
                >
                  <span className="font-display font-bold text-xl lg:text-2xl">{f.question}</span>
                  <span
                    className={`shrink-0 size-9 rounded-full border-2 border-foreground flex items-center justify-center text-xl font-bold transition-transform ${
                      isOpen ? "rotate-45 bg-[var(--ember)] text-background" : "bg-[var(--sun)]"
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 lg:px-8 pb-6 lg:pb-7 text-foreground/80 leading-relaxed max-w-3xl">
                    {f.answer}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
