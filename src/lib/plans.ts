export type PlanId = "free" | "pro" | "everest";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: string;
  fileLimit: number;
  maxFileMB: number;
  features: string[];
  accent: "ink" | "leaf" | "ember" | "sun";
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try the workforce. No card.",
    price: "$0",
    fileLimit: 2,
    maxFileMB: 10,
    accent: "ink",
    features: [
      "All 6 AI employees",
      "Lin (CEO) delegation",
      "Up to 2 attachments per message",
      "Vision on images",
      "Time-saved tracking",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For founders & operators.",
    price: "$29/mo",
    fileLimit: 5,
    maxFileMB: 25,
    accent: "leaf",
    features: [
      "Everything in Free",
      "Up to 5 attachments per message",
      "Priority models",
      "Larger file uploads (25 MB)",
      "Shareable profile",
    ],
  },
  everest: {
    id: "everest",
    name: "Everest",
    tagline: "For teams that ship daily.",
    price: "$99/mo",
    fileLimit: 10,
    maxFileMB: 100,
    accent: "ember",
    features: [
      "Everything in Pro",
      "Up to 10 attachments per message",
      "Largest uploads (100 MB)",
      "Early access to new employees",
      "Concierge onboarding",
    ],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.pro, PLANS.everest];

export function planFor(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.free;
}
