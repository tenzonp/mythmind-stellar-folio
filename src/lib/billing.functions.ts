import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost, getRequestProtocol } from "@tanstack/react-start/server";
import { z } from "zod";

export const createDodoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ plan: z.enum(["pro", "everest"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createDodoSubscription, productIdFor } = await import("@/lib/dodo.server");

    if (!process.env.DODO_API_KEY) {
      throw new Error("Payments not configured: DODO_API_KEY missing");
    }
    const productId = productIdFor(data.plan);
    if (!productId) {
      throw new Error(
        `Payments not configured: DODO_PRODUCT_ID_${data.plan.toUpperCase()} missing`,
      );
    }

    // Resolve email/name from profile + auth claims
    const claims = context.claims as
      | { email?: string; user_metadata?: Record<string, unknown> }
      | undefined;
    const meta = (claims?.user_metadata ?? {}) as Record<string, string | undefined>;
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const email = claims?.email ?? "customer@example.com";
    const name =
      profile?.display_name ??
      meta.full_name ??
      meta.name ??
      (claims?.email ? claims.email.split("@")[0] : "Friend");

    // Build absolute return URL from request host (best effort) -> branded success page
    let returnUrl = `https://mythmind.ai/checkout/success?plan=${data.plan}`;
    try {
      const host = getRequestHost();
      const proto = getRequestProtocol?.() ?? (host.startsWith("localhost") ? "http" : "https");
      returnUrl = `${proto}://${host}/checkout/success?plan=${data.plan}`;
    } catch {
      // fall back to default
    }

    const { payment_link } = await createDodoSubscription({
      productId,
      email,
      name,
      userId: context.userId,
      plan: data.plan,
      returnUrl,
    });

    return { url: payment_link };
  });
