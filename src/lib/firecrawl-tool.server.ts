import { tool } from "ai";
import { z } from "zod";

type SearchResult = {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
  content?: string;
  snippet?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function normalizeSearchResults(json: unknown): SearchResult[] {
  const root = asRecord(json);
  if (!root) return [];

  const candidates = [
    root.data,
    root.web,
    asRecord(root.data)?.web,
    asRecord(root.data)?.results,
    asRecord(root.data)?.searchResults,
    root.results,
  ];

  const arrayCandidate = candidates.find(Array.isArray) as unknown[] | undefined;
  if (!arrayCandidate) return [];

  return arrayCandidate
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      url: typeof item.url === "string" ? item.url : typeof item.link === "string" ? item.link : "",
      description:
        typeof item.description === "string"
          ? item.description
          : typeof item.snippet === "string"
            ? item.snippet
            : typeof item.content === "string"
              ? item.content.slice(0, 600)
              : "",
      markdown: typeof item.markdown === "string" ? item.markdown : undefined,
      content: typeof item.content === "string" ? item.content : undefined,
      snippet: typeof item.snippet === "string" ? item.snippet : undefined,
    }));
}

function extractMarkdown(json: unknown): { title: string; content: string } {
  const root = asRecord(json);
  const data = asRecord(root?.data);
  const metadata = asRecord(data?.metadata) ?? asRecord(root?.metadata);
  const content =
    (typeof data?.markdown === "string" && data.markdown) ||
    (typeof root?.markdown === "string" && root.markdown) ||
    (typeof data?.content === "string" && data.content) ||
    (typeof root?.content === "string" && root.content) ||
    "";
  const title = (typeof metadata?.title === "string" && metadata.title) || "";
  return { title, content };
}

/**
 * Live web search + scrape tool powered by Firecrawl.
 * Used by every employee for real-time information and up-to-date data.
 * The tool name is intentionally generic — no external branding is surfaced.
 */
export function buildWebTools() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return {};

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  return {
    web_search: tool({
      description:
        "Search the live web for real-time, up-to-date information (news, prices, latest events, current data). Returns top results with snippets. Use whenever the user asks about recent events, current data, or anything that requires fresh information.",
      inputSchema: z.object({
        query: z.string().min(2).max(400).describe("Search query"),
        limit: z.number().int().min(1).max(10).optional().describe("Max results (default 5)"),
      }),
      execute: async ({ query, limit }) => {
        try {
          const res = await fetch("https://api.firecrawl.dev/v2/search", {
            method: "POST",
            headers,
            body: JSON.stringify({ query, limit: limit ?? 5 }),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            return { ok: false, error: `web_search failed (${res.status}): ${txt.slice(0, 300)}` };
          }
          const json = await res.json();
          const items = normalizeSearchResults(json)
            .slice(0, limit ?? 5)
            .map((r) => ({
              title: r.title ?? "",
              url: r.url ?? "",
              description: r.description ?? r.snippet ?? r.content?.slice(0, 600) ?? "",
            }));
          return { ok: true, query, results: items };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "web_search error" };
        }
      },
    }),
    web_fetch: tool({
      description:
        "Fetch and read the contents of a specific URL as clean markdown. Use after web_search to read a result in detail, or when the user provides a URL.",
      inputSchema: z.object({
        url: z.string().url().describe("The URL to scrape"),
      }),
      execute: async ({ url }) => {
        try {
          const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
            method: "POST",
            headers,
            body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            return { ok: false, error: `web_fetch failed (${res.status}): ${txt.slice(0, 300)}` };
          }
          const json = await res.json();
          const { title, content } = extractMarkdown(json);
          return { ok: true, url, title, content: content.slice(0, 12000) };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "web_fetch error" };
        }
      },
    }),
  } as Record<string, unknown>;
}
