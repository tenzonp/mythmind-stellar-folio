// SEO JSON-LD helpers
const SITE_URL = "https://mythmind.ai";

export type Crumb = { name: string; url: string };

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.url.startsWith("http") ? c.url : `${SITE_URL}${c.url}`,
      })),
    }),
  };
}

export function faqLd(qs: { question: string; answer: string }[]) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: qs.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer },
      })),
    }),
  };
}

export function organizationLd() {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Mythmind AI",
      alternateName: "Mythmind",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      description:
        "Mythmind AI is an agentic workforce platform — six specialized AI employees that research, create, communicate and execute real business tasks autonomously.",
      foundingDate: "2024",
      slogan: "Hire an entire AI company.",
      sameAs: [],
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "hello@mythmind.ai",
          contactType: "customer support",
          availableLanguage: ["English"],
        },
      ],
    }),
  };
}

export function websiteLd() {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Mythmind AI",
      url: SITE_URL,
    }),
  };
}

export function articleLd(p: { title: string; description: string; url: string; date?: string }) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      description: p.description,
      url: `${SITE_URL}${p.url}`,
      author: { "@type": "Organization", name: "Mythmind AI" },
      publisher: { "@type": "Organization", name: "Mythmind AI" },
      datePublished: p.date ?? new Date().toISOString().slice(0, 10),
    }),
  };
}
