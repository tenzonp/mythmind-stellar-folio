// Server-only tools client. Never import from client code.
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

let cached: Composio<VercelProvider> | null = null;

export function getComposio(): Composio<VercelProvider> {
  if (cached) return cached;
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("Tools service is not configured");
  cached = new Composio({
    apiKey,
    provider: new VercelProvider(),
  });
  return cached;
}

// Toolkit allow-list per employee role
export const EMPLOYEE_TOOLKITS: Record<string, string[]> = {
  lin: [], // CEO: all connected toolkits
  reyes: ["googlecalendar", "slack", "asana", "notion", "zoom", "trello", "linear"],
  kade: ["gmail", "outlook", "slack", "discord", "intercom"],
  bloom: ["twitter", "linkedin", "instagram", "facebook", "tiktok", "notion", "googledocs", "youtube"],
  vale: ["googledocs", "googleslides", "googlesheets", "notion", "figma", "canva", "dropbox"],
  sage: ["notion", "googlecalendar", "gmail", "linear", "github", "todoist"],
};

export function toolkitsForEmployee(employeeId: string, allConnectedSlugs: string[]): string[] {
  if (employeeId === "lin") return allConnectedSlugs;
  const allow = new Set(EMPLOYEE_TOOLKITS[employeeId] ?? []);
  return allConnectedSlugs.filter((s) => allow.has(s));
}

// Fallback catalog used when the upstream toolkit index is missing entries
// (e.g. Instagram, TikTok). Logos are public brand assets served by Composio's CDN.
export const POPULAR_TOOLKITS: Array<{
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  categories: string[];
}> = [
  { slug: "gmail", name: "Gmail", description: "Read, draft & send email.", logo: "https://cdn.composio.dev/logos/gmail.png", categories: ["productivity"] },
  { slug: "googlecalendar", name: "Google Calendar", description: "Schedule events and find times.", logo: "https://cdn.composio.dev/logos/googlecalendar.png", categories: ["productivity"] },
  { slug: "googledocs", name: "Google Docs", description: "Create and edit documents.", logo: "https://cdn.composio.dev/logos/googledocs.png", categories: ["productivity"] },
  { slug: "googlesheets", name: "Google Sheets", description: "Spreadsheets & data.", logo: "https://cdn.composio.dev/logos/googlesheets.png", categories: ["productivity"] },
  { slug: "googleslides", name: "Google Slides", description: "Presentations & decks.", logo: "https://cdn.composio.dev/logos/googleslides.png", categories: ["productivity"] },
  { slug: "outlook", name: "Outlook", description: "Microsoft mail & calendar.", logo: "https://cdn.composio.dev/logos/outlook.png", categories: ["productivity"] },
  { slug: "slack", name: "Slack", description: "Team messaging.", logo: "https://cdn.composio.dev/logos/slack.png", categories: ["communication"] },
  { slug: "discord", name: "Discord", description: "Community chat.", logo: "https://cdn.composio.dev/logos/discord.png", categories: ["communication"] },
  { slug: "notion", name: "Notion", description: "Docs, wikis, databases.", logo: "https://cdn.composio.dev/logos/notion.png", categories: ["productivity"] },
  { slug: "linear", name: "Linear", description: "Issue tracking.", logo: "https://cdn.composio.dev/logos/linear.png", categories: ["dev"] },
  { slug: "github", name: "GitHub", description: "Repos, issues, PRs.", logo: "https://cdn.composio.dev/logos/github.png", categories: ["dev"] },
  { slug: "figma", name: "Figma", description: "Design files.", logo: "https://cdn.composio.dev/logos/figma.png", categories: ["design"] },
  { slug: "canva", name: "Canva", description: "Graphics & branding.", logo: "https://cdn.composio.dev/logos/canva.png", categories: ["design"] },
  { slug: "instagram", name: "Instagram", description: "Posts, reels, DMs.", logo: "https://cdn.composio.dev/logos/instagram.png", categories: ["social"] },
  { slug: "facebook", name: "Facebook", description: "Pages & ads.", logo: "https://cdn.composio.dev/logos/facebook.png", categories: ["social"] },
  { slug: "tiktok", name: "TikTok", description: "Short-form video.", logo: "https://cdn.composio.dev/logos/tiktok.png", categories: ["social"] },
  { slug: "twitter", name: "X / Twitter", description: "Posts and DMs.", logo: "https://cdn.composio.dev/logos/twitter.png", categories: ["social"] },
  { slug: "linkedin", name: "LinkedIn", description: "Professional network.", logo: "https://cdn.composio.dev/logos/linkedin.png", categories: ["social"] },
  { slug: "youtube", name: "YouTube", description: "Videos & channels.", logo: "https://cdn.composio.dev/logos/youtube.png", categories: ["social"] },
  { slug: "asana", name: "Asana", description: "Project management.", logo: "https://cdn.composio.dev/logos/asana.png", categories: ["productivity"] },
  { slug: "trello", name: "Trello", description: "Kanban boards.", logo: "https://cdn.composio.dev/logos/trello.png", categories: ["productivity"] },
  { slug: "zoom", name: "Zoom", description: "Meetings & recordings.", logo: "https://cdn.composio.dev/logos/zoom.png", categories: ["communication"] },
  { slug: "intercom", name: "Intercom", description: "Customer support.", logo: "https://cdn.composio.dev/logos/intercom.png", categories: ["communication"] },
  { slug: "dropbox", name: "Dropbox", description: "File storage.", logo: "https://cdn.composio.dev/logos/dropbox.png", categories: ["productivity"] },
  { slug: "todoist", name: "Todoist", description: "Tasks & to-dos.", logo: "https://cdn.composio.dev/logos/todoist.png", categories: ["productivity"] },
];
