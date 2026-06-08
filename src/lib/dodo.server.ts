import process from "node:process";
import { createHmac, timingSafeEqual } from "node:crypto";

// Dodo Payments REST API. Test vs Live picked by DODO_ENV ("test" | "live").
function baseUrl() {
  const env = (process.env.DODO_ENV ?? "test").toLowerCase();
  return env === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

export function productIdFor(plan: "pro" | "everest"): string | null {
  const raw = plan === "pro" ? process.env.DODO_PRODUCT_ID_PRO : process.env.DODO_PRODUCT_ID_EVEREST;
  const trimmed = (raw ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type CreateSubscriptionInput = {
  productId: string;
  email: string;
  name: string;
  userId: string;
  plan: "pro" | "everest";
  returnUrl: string;
};

export async function createDodoSubscription(input: CreateSubscriptionInput): Promise<{
  payment_link: string;
  subscription_id?: string;
}> {
  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) throw new Error("DODO_API_KEY not configured");

  const body = {
    product_id: input.productId,
    quantity: 1,
    payment_link: true,
    return_url: input.returnUrl,
    customer: { email: input.email, name: input.name },
    billing: { city: "", country: "US", state: "", street: "", zipcode: "" },
    metadata: { user_id: input.userId, plan: input.plan },
  };

  const res = await fetch(`${baseUrl()}/subscriptions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Dodo subscription failed: ${res.status} ${text}`);
  }
  const json = JSON.parse(text) as { payment_link?: string; subscription_id?: string };
  if (!json.payment_link) {
    throw new Error("Dodo response missing payment_link");
  }
  return { payment_link: json.payment_link, subscription_id: json.subscription_id };
}

// Standard Webhooks verification (Dodo uses svix-compatible headers).
// Headers: webhook-id, webhook-timestamp, webhook-signature ("v1,<base64>" possibly space-separated multiple).
export function verifyDodoWebhook(opts: {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  body: string;
  secret: string;
}): boolean {
  const { id, timestamp, signature, body, secret } = opts;
  if (!id || !timestamp || !signature) return false;

  // Reject timestamps older than 5 min to prevent replay
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 300) return false;

  // Secret may be prefixed with "whsec_" — strip and base64-decode per Standard Webhooks
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    key = Buffer.from(raw, "utf8");
  }

  const signed = `${id}.${timestamp}.${body}`;
  const expected = createHmac("sha256", key).update(signed).digest("base64");

  // signature header may contain "v1,sig v1,sig2"
  const parts = signature.split(" ");
  for (const p of parts) {
    const [, sig] = p.split(",");
    if (!sig) continue;
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    } catch {
      // continue
    }
  }
  return false;
}
