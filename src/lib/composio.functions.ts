import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// List the user's connected accounts (with toolkit info)
export const listMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getComposio } = await import("./composio.server");
    try {
      const composio = getComposio();
      const res = await composio.connectedAccounts.list({
        userIds: [context.userId],
        limit: 100,
      });
      type RawAccount = {
        id: string;
        status: string;
        toolkit?: { slug?: string; name?: string; logo?: string } | null;
        createdAt?: string;
      };
      const items = (res.items as RawAccount[] | undefined) ?? [];
      return {
        ok: true as const,
        items: items.map((a) => ({
          id: a.id,
          status: a.status,
          toolkit: a.toolkit?.slug ?? "",
          name: a.toolkit?.name ?? a.toolkit?.slug ?? "",
          logo: a.toolkit?.logo ?? null,
          createdAt: a.createdAt ?? null,
        })),
      };
    } catch (e) {
      console.error("[tools.listMyConnections]", e);
      return { ok: false as const, items: [], error: (e as Error).message };
    }
  });

// List browseable toolkits (merged with curated popular list)
export const listToolkits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; category?: string }) => d)
  .handler(async ({ data }) => {
    const { getComposio, POPULAR_TOOLKITS } = await import("./composio.server");
    type Item = {
      slug: string;
      name: string;
      logo: string | null;
      description: string;
      categories: string[];
      noAuth: boolean;
    };
    let upstream: Item[] = [];
    try {
      const composio = getComposio();
      const res = await composio.toolkits.get({
        managedBy: "composio",
        sortBy: "usage",
        limit: 300,
        ...(data.category ? { category: data.category } : {}),
      });
      type RawToolkit = {
        slug: string;
        name: string;
        meta?: { logo?: string; description?: string; categories?: Array<{ name: string }> };
        noAuth?: boolean;
      };
      const list = (res as unknown as RawToolkit[]) ?? [];
      upstream = list.map((t) => ({
        slug: t.slug,
        name: t.name,
        logo: t.meta?.logo ?? null,
        description: t.meta?.description ?? "",
        categories: (t.meta?.categories ?? []).map((c) => c.name),
        noAuth: !!t.noAuth,
      }));
    } catch (e) {
      console.error("[tools.listToolkits]", e);
    }

    const bySlug = new Map<string, Item>();
    for (const t of upstream) bySlug.set(t.slug.toLowerCase(), t);
    for (const p of POPULAR_TOOLKITS) {
      const key = p.slug.toLowerCase();
      if (!bySlug.has(key)) {
        bySlug.set(key, {
          slug: p.slug,
          name: p.name,
          logo: p.logo,
          description: p.description,
          categories: p.categories,
          noAuth: false,
        });
      }
    }
    const items = Array.from(bySlug.values());
    const q = (data.search ?? "").toLowerCase().trim();
    const filtered = q
      ? items.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.slug.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q),
        )
      : items;
    return { items: filtered.slice(0, 400) };
  });

// Begin OAuth flow for a toolkit. Auto-provisions a managed auth config if
// one doesn't exist for this toolkit yet.
export const initiateConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ toolkit: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { getComposio } = await import("./composio.server");
    const toolkit = data.toolkit.toLowerCase();
    try {
      const composio = getComposio();

      // 1) Find or create a managed auth config for this toolkit.
      let authConfigId: string | null = null;
      try {
        const existing = await composio.authConfigs.list({
          toolkit,
          isComposioManaged: true,
          limit: 1,
        } as never);
        type Item = { id: string };
        const items = ((existing as unknown as { items?: Item[] }).items) ?? [];
        if (items.length > 0) authConfigId = items[0].id;
      } catch (e) {
        console.warn("[tools] authConfigs.list failed", e);
      }

      if (!authConfigId) {
        try {
          const created = await composio.authConfigs.create(toolkit, {
            type: "use_composio_managed_auth",
          } as never);
          authConfigId = (created as unknown as { id: string }).id;
        } catch (e) {
          const msg = (e as Error).message ?? "";
          // Toolkit may genuinely not support managed auth — fall back to authorize().
          console.warn("[tools] authConfigs.create failed, trying authorize()", msg);
        }
      }

      // 2) Initiate connection using the new /link endpoint (managed OAuth).
      if (authConfigId) {
        const apiKey = process.env.COMPOSIO_API_KEY!;
        const resp = await fetch("https://backend.composio.dev/api/v3/connected_accounts/link", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_config_id: authConfigId,
            user_id: context.userId,
          }),
        });
        const json = (await resp.json()) as {
          id?: string;
          connected_account_id?: string;
          redirect_url?: string;
          redirectUrl?: string;
          status?: string;
          error?: { message?: string };
          message?: string;
        };
        if (!resp.ok) {
          throw new Error(json?.error?.message || json?.message || `Link failed (${resp.status})`);
        }
        return {
          ok: true as const,
          id: json.id ?? json.connected_account_id ?? "",
          redirectUrl: json.redirect_url ?? json.redirectUrl ?? null,
          status: json.status ?? "INITIATED",
        };
      }

      const conn = await composio.toolkits.authorize(context.userId, toolkit);
      return {
        ok: true as const,
        id: conn.id,
        redirectUrl: conn.redirectUrl ?? null,
        status: conn.status,
      };
    } catch (e) {
      const err = e as { message?: string; status?: number };
      console.error("[tools.initiateConnection]", toolkit, err);
      const msg = err?.message ?? "Could not start connection";
      let friendly = msg;
      if (/not.*managed|managed.*not|cannot.*manage/i.test(msg)) {
        friendly = `${toolkit} needs custom OAuth credentials and can't be connected with one click yet. Try another tool, or contact support to enable it.`;
      } else if (/not.*configured|auth.*config.*not.*found/i.test(msg)) {
        friendly = `We couldn't auto-configure ${toolkit}. Please retry in a moment, or try a different tool.`;
      } else if (/unauthor|invalid.*api/i.test(msg)) {
        friendly = "The tools service rejected the request. Please try again in a moment.";
      } else if (/network|fetch|timeout|ECONN/i.test(msg)) {
        friendly = "Network hiccup reaching the tools service. Please retry.";
      } else if (/not.*found|unknown.*toolkit/i.test(msg)) {
        friendly = `${toolkit} isn't available right now. Try another tool.`;
      }
      return { ok: false as const, error: friendly };
    }
  });

// Poll status for a pending connection
export const checkConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { getComposio } = await import("./composio.server");
    try {
      const composio = getComposio();
      const acc = await composio.connectedAccounts.get(data.id);
      return { status: acc.status };
    } catch {
      return { status: "FAILED" };
    }
  });

// Disconnect
export const disconnectAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { getComposio } = await import("./composio.server");
    try {
      const composio = getComposio();
      await composio.connectedAccounts.delete(data.id);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });
