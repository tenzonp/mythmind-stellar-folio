import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const cols = "id, display_name, avatar_url, plan, share_slug, bio, created_at";
    const { data, error } = await context.supabase
      .from("profiles")
      .select(cols)
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;

    // Auto-provision a profile row on first sign-in (no auth.users trigger available).
    const claims = context.claims as
      | { email?: string; user_metadata?: Record<string, unknown> }
      | undefined;
    const meta = (claims?.user_metadata ?? {}) as Record<string, string | undefined>;
    const display_name =
      meta.full_name ??
      meta.name ??
      (claims?.email ? claims.email.split("@")[0] : "Friend");
    const avatar_url = meta.avatar_url ?? meta.picture ?? null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: context.userId, display_name, avatar_url }, { onConflict: "id" })
      .select(cols)
      .single();
    if (insertErr) throw new Error(insertErr.message);
    return created;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        display_name: z.string().min(1).max(80).optional(),
        bio: z.string().max(500).optional(),
        avatar_url: z.string().url().max(500).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ plan: z.enum(["free", "pro", "everest"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tasks } = await context.supabase
      .from("task_completions")
      .select("id, employee, summary, human_estimate_minutes, ai_actual_minutes, time_saved_minutes, deliverable_text, created_at, thread_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);



    const { data: files } = await context.supabase
      .from("chat_attachments")
      .select("id, file_name, file_type, file_size, public_url, created_at, thread_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(60);

    const list = tasks ?? [];
    const totalSavedMin = list.reduce((s, t) => s + (t.time_saved_minutes ?? 0), 0);
    const totalTasks = list.length;
    const byEmployee: Record<string, number> = {};
    for (const t of list) {
      byEmployee[t.employee] = (byEmployee[t.employee] ?? 0) + (t.time_saved_minutes ?? 0);
    }

    return {
      tasks: list,
      files: files ?? [],
      totalSavedMin,
      totalTasks,
      byEmployee,
    };
  });

export const getProfileBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(8).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, plan, bio, created_at")
      .eq("share_slug", data.slug)
      .maybeSingle();
    if (!profile) return null;
    const { data: tasks } = await supabaseAdmin
      .from("task_completions")
      .select("employee, summary, time_saved_minutes, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const list = tasks ?? [];
    const totalSavedMin = list.reduce((s, t) => s + (t.time_saved_minutes ?? 0), 0);
    return { profile, tasks: list, totalSavedMin, totalTasks: list.length };
  });
