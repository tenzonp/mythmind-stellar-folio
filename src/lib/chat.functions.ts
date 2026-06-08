import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const EmployeeIds = z.enum(["lin", "reyes", "kade", "bloom", "vale", "sage"]);

export const listThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ employee: EmployeeIds }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, employee, updated_at")
      .eq("employee", data.employee)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ employee: EmployeeIds, title: z.string().min(1).max(120).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        employee: data.employee,
        title: data.title ?? "New chat",
      })
      .select("id, title, employee, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("chat_threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ threadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("message")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: (rows ?? []).map((r) => r.message) };
  });

// === Attachments ===

export const uploadAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    const threadId = data.get("threadId");
    if (!(file instanceof File)) throw new Error("Missing file");
    if (typeof threadId !== "string") throw new Error("Missing threadId");
    return { file, threadId };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PLANS } = await import("@/lib/plans");

    // Plan-based size check
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    const planId = (profile?.plan ?? "free") as "free" | "pro" | "everest";
    const maxBytes = PLANS[planId].maxFileMB * 1024 * 1024;
    if (data.file.size > maxBytes) {
      throw new Error(`File too large for your ${PLANS[planId].name} plan (max ${PLANS[planId].maxFileMB}MB)`);
    }

    const safeName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${context.userId}/${data.threadId}/${crypto.randomUUID()}-${safeName}`;
    const buf = await data.file.arrayBuffer();

    const { error: upErr } = await supabaseAdmin.storage
      .from("chat-attachments")
      .upload(path, buf, { contentType: data.file.type, upsert: false });
    if (upErr) throw new Error(upErr.message);

    // 30-day signed URL
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("chat-attachments")
      .createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signErr || !signed) throw new Error(signErr?.message ?? "Could not sign URL");

    const { data: row, error: insErr } = await context.supabase
      .from("chat_attachments")
      .insert({
        user_id: context.userId,
        thread_id: data.threadId,
        file_name: data.file.name,
        file_type: data.file.type || "application/octet-stream",
        file_size: data.file.size,
        storage_path: path,
        public_url: signed.signedUrl,
      })
      .select("id, file_name, file_type, file_size, public_url")
      .single();
    if (insErr) throw new Error(insErr.message);
    return row;
  });
