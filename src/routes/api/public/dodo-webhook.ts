import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/public/dodo-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.DODO_WEBHOOK_SECRET;
        if (!secret) return new Response("not configured", { status: 500 });

        const body = await request.text();
        const id = request.headers.get("webhook-id");
        const ts = request.headers.get("webhook-timestamp");
        const sig = request.headers.get("webhook-signature");

        const { verifyDodoWebhook } = await import("@/lib/dodo.server");
        if (!verifyDodoWebhook({ id, timestamp: ts, signature: sig, body, secret })) {
          return new Response("invalid signature", { status: 401 });
        }

        type Payload = {
          type?: string;
          event_type?: string;
          data?: {
            metadata?: { user_id?: string; plan?: string };
            product_id?: string;
            status?: string;
            subscription_id?: string;
          };
        };
        let payload: Payload;
        try {
          payload = JSON.parse(body) as Payload;
        } catch {
          return new Response("bad json", { status: 400 });
        }

        const event = payload.type ?? payload.event_type ?? "";
        const meta = payload.data?.metadata ?? {};
        const userId = meta.user_id;
        const productId = payload.data?.product_id ?? "";
        const status = payload.data?.status ?? "";

        // Determine plan from metadata, falling back to product ID match
        let plan: "free" | "pro" | "everest" | null = null;
        if (meta.plan === "pro" || meta.plan === "everest") {
          plan = meta.plan;
        } else if (productId && productId === process.env.DODO_PRODUCT_ID_PRO) {
          plan = "pro";
        } else if (productId && productId === process.env.DODO_PRODUCT_ID_EVEREST) {
          plan = "everest";
        }

        if (!userId) return new Response("ok"); // nothing to do

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const isActivation =
          event.includes("active") ||
          event === "subscription.created" ||
          event === "payment.succeeded" ||
          status === "active";
        const isCancel =
          event.includes("cancel") ||
          event.includes("expired") ||
          event.includes("failed") ||
          status === "cancelled" ||
          status === "expired";

        if (isActivation && plan) {
          await supabaseAdmin.from("profiles").update({ plan }).eq("id", userId);
        } else if (isCancel) {
          await supabaseAdmin.from("profiles").update({ plan: "free" }).eq("id", userId);
        }

        return new Response("ok");
      },
      // Some providers ping with GET for health checks
      GET: async () => new Response("ok"),
    },
  },
});
