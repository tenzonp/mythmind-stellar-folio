import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Error 404</div>
        <h1 className="display-lg mt-4">Lost in the myth.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This page wandered off the map. Let's take you back.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background hover:bg-foreground/85"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display-lg">Something fractured.</h1>
        <p className="mt-4 text-sm text-muted-foreground">A signal got lost in transit. Try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm text-background"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MythMind — Cognitive AI in Service of Human Story" },
      { name: "description", content: "MythMind is a research-led AI company building cognitive systems that reason, remember and create. Discover our vision, team, investors and journal." },
      { name: "author", content: "MythMind Labs" },
      { name: "keywords", content: "MythMind, AI company, artificial intelligence research, cognitive AI, generative intelligence, AI lab, machine learning, foundation models, AI startup, narrative AI" },
      { name: "theme-color", content: "#FDC411" },
      { property: "og:site_name", content: "MythMind" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "MythMind — Cognitive AI in Service of Human Story" },
      { property: "og:description", content: "Research-led AI company building cognitive systems that reason, remember and create." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@mythmind" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Mythmind AI",
          alternateName: "Mythmind",
          url: "https://mythmind.ai",
          logo: "https://mythmind.ai/favicon.ico",
          description: "Mythmind AI is an agentic workforce platform — six specialized AI employees that research, create, communicate and execute real business tasks autonomously.",
          slogan: "Hire an entire AI company.",
          foundingDate: "2024",
          sameAs: [],
          contactPoint: [{ "@type": "ContactPoint", email: "hello@mythmind.ai", contactType: "customer support", availableLanguage: ["English"] }],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Mythmind AI",
          url: "https://mythmind.ai",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFullscreen = pathname.startsWith("/app") || pathname.startsWith("/auth");
  return (
    <QueryClientProvider client={queryClient}>
      {isFullscreen ? (
        <Outlet />
      ) : (
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
      )}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
