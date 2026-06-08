import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { getPublishedBlogs, type PublishedBlog } from "@/lib/content.functions";
import { breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/blogs")({
  loader: () => getPublishedBlogs(),
  head: () => ({
    meta: [
      { title: "Journal — Mythmind AI" },
      { name: "description", content: "The Mythmind Journal: essays and field notes on agentic AI, AI employees, autonomous workflows, and the future of work." },
      { property: "og:title", content: "Journal — Mythmind AI" },
      { property: "og:description", content: "Essays on agentic AI, autonomous workflows and the future of work." },
      { property: "og:url", content: "/blogs" },
    ],
    links: [{ rel: "canonical", href: "/blogs" }],
    scripts: [breadcrumbLd([{ name: "Home", url: "/" }, { name: "Journal", url: "/blogs" }])],
  }),
  component: Blogs,
  errorComponent: () => <BlogsBody posts={defaultPosts} />,
  notFoundComponent: () => <BlogsBody posts={defaultPosts} />,
});

type Post = Omit<PublishedBlog, "id" | "content" | "created_at" | "updated_at" | "slug" | "featured"> & {
  slug?: string;
  featured?: boolean;
};

const defaultPosts: Post[] = [
  { kicker: "Essay", cover_color: "var(--sun)", title: "Why an AI workforce beats a single AI assistant.", read_minutes: 8, excerpt: "A single AI is a tool. Six coordinated AIs with shared memory are a company.", featured: true },
  { kicker: "Field note", cover_color: "var(--leaf)", title: "Posting to Instagram, hands-free — a 7-day experiment.", read_minutes: 5, excerpt: "What happens when Lumen runs your content engine for a week." },
  { kicker: "Essay", cover_color: "var(--ember)", title: "Action is the missing feature in every AI product.", read_minutes: 11, excerpt: "Why doing beats answering." },
  { kicker: "How-to", cover_color: "var(--sun)", title: "Launching a startup in a weekend, with six AI employees.", read_minutes: 9, excerpt: "From idea to live site, in 48 hours." },
  { kicker: "Essay", cover_color: "var(--leaf)", title: "What 'memory' really means for an AI teammate.", read_minutes: 7, excerpt: "Context that compounds." },
];

function Blogs() {
  const rows = Route.useLoaderData();
  return <BlogsBody posts={rows.length > 0 ? rows : defaultPosts} />;
}

function BlogsBody({ posts }: { posts: Post[] }) {
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <>
      <PageHeader
        eyebrow="/journal"
        accent="leaf"
        title={<>notes from <em className="italic font-light">the build.</em></>}
        lede="Essays and field notes on agentic AI, autonomous workflows, and what changes when your AI actually does the work."
      />

      <section className="mx-auto max-w-[1500px] px-5 lg:px-8 py-20">
        <Link to="/blogs" className="block group">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-end border-b-2 border-foreground pb-16">
            <div className="lg:col-span-7">
              <span className="sticker bg-[var(--sun)]">★ Featured essay</span>
              <h2 className="display-xl mt-6 group-hover:underline decoration-[6px] decoration-[var(--ember)] underline-offset-[10px]">
                {featured.title}
              </h2>
            </div>
            <div className="lg:col-span-5 text-foreground/75 leading-relaxed">
              <p>{featured.excerpt}</p>
              <div className="mt-6 font-mono text-xs uppercase tracking-widest text-foreground/70">Mythmind team · {featured.read_minutes ?? 5} min read →</div>
            </div>
          </div>
        </Link>

        <ul className="mt-12 grid lg:grid-cols-2 gap-5">
          {rest.map((p) => (
            <li key={p.title}>
              <Link
                to="/blogs"
                className="block p-8 rounded-2xl border-2 border-foreground bg-background group hover:-translate-y-1 transition-transform h-full"
                style={{ boxShadow: "5px 5px 0 var(--ink)" }}
              >
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: p.cover_color ?? "var(--sun)" }} /> {p.kicker}
                </div>
                <h3 className="font-display font-bold text-3xl lg:text-4xl mt-6 group-hover:underline underline-offset-4 decoration-2">{p.title}</h3>
                <div className="mt-10 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Mythmind</span>
                  <span>{p.read_minutes ?? 5} min read</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
