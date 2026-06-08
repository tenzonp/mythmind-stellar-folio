import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { getPublishedNews, type PublishedNews } from "@/lib/content.functions";
import { breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/news")({
  loader: () => getPublishedNews(),
  head: () => ({
    meta: [
      { title: "News — Mythmind AI" },
      { name: "description", content: "Product updates, new AI employees, integrations and announcements from Mythmind AI." },
      { property: "og:title", content: "News — Mythmind AI" },
      { property: "og:description", content: "Product updates and announcements from Mythmind AI." },
      { property: "og:url", content: "/news" },
    ],
    links: [{ rel: "canonical", href: "/news" }],
    scripts: [breadcrumbLd([{ name: "Home", url: "/" }, { name: "News", url: "/news" }])],
  }),
  component: News,
  errorComponent: () => <NewsBody items={defaults} />,
  notFoundComponent: () => <NewsBody items={defaults} />,
});

type Item = Omit<PublishedNews, "id" | "body">;

const defaults: Item[] = [
  { published_at: "Latest", tag: "Product", color: "var(--sun)", title: "Sage, the executive assistant, joins the workforce", excerpt: "Long-term memory, briefings and priority management — Sage rounds out the six-employee team." },
  { published_at: "Recent", tag: "Integration", color: "var(--leaf)", title: "Lumen now publishes to Instagram, Facebook and email — natively", excerpt: "End-to-end content campaigns from a single instruction." },
  { published_at: "Recent", tag: "Product", color: "var(--ember)", title: "Forge ships PDFs, PPTX and full websites from one prompt", excerpt: "Plain-language briefs in, polished deliverables out." },
  { published_at: "Earlier", tag: "Milestone", color: "var(--sun)", title: "Shared memory across all six AI employees", excerpt: "Mythmind agents now share long-term context." },
  { published_at: "Earlier", tag: "Note", color: "var(--leaf)", title: "Closed alpha opens for founders, creators & operators", excerpt: "First wave of real businesses running on Mythmind." },
  { published_at: "Origin", tag: "Story", color: "var(--ember)", title: "Why we're building Mythmind — bootstrapped, action-first", excerpt: "The thesis: stop chatting, start executing." },
];

function News() {
  const rows = Route.useLoaderData();
  return <NewsBody items={rows.length > 0 ? rows : defaults} />;
}

function NewsBody({ items }: { items: Item[] }) {
  return (
    <>
      <PageHeader
        eyebrow="/news"
        accent="ember"
        title={<>updates from the <em className="italic font-light">build.</em></>}
        lede="New AI employees, new integrations, new milestones. We ship more than we post — but here's what's worth knowing."
      />

      <section className="mx-auto max-w-[1100px] px-5 lg:px-8 py-20">
        <ul className="space-y-6">
          {items.map((it: Item) => (
            <li key={it.title}>
              <Link to="/news" className="block p-7 rounded-2xl border-2 border-foreground bg-background group hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: it.color ?? "var(--sun)" }} />
                  {it.tag}
                  <span>·</span>
                  <span>{it.published_at}</span>
                </div>
                <h2 className="font-display font-bold text-3xl lg:text-4xl mt-4 max-w-3xl">{it.title}</h2>
                <p className="mt-4 text-foreground/75 max-w-2xl leading-relaxed">{it.excerpt}</p>
                <div className="mt-5 text-sm font-medium">Read more →</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
