/**
 * AI image generation via Lovable AI Gateway, with plan-based model/quality.
 * Generated images are uploaded to the same `chat-attachments` bucket so
 * they render inline in the chat like any other attachment.
 *
 * Plan tiers:
 *   - everest / pro -> openai/gpt-image-2 @ high quality (best)
 *   - free          -> openai/gpt-image-2 @ low quality (mid-range, proper quality)
 */

type PlanId = "free" | "pro" | "everest" | string | null | undefined;

type GenOpts = {
  prompt: string;
  plan: PlanId;
  userId: string;
  threadId: string;
  lovableApiKey: string;
};

type GenResult = {
  url: string;
  storage_path: string;
  attachment_id: string;
  model: string;
  quality: string;
};

function pickModel(plan: PlanId): { model: string; quality: "low" | "medium" | "high" } {
  const p = (plan ?? "free").toLowerCase();
  if (p === "pro" || p === "everest") {
    return { model: "openai/gpt-image-2", quality: "high" };
  }
  // Free tier -> still gpt-image-2 but low quality (good fidelity, cheap).
  return { model: "openai/gpt-image-2", quality: "low" };
}

export async function generateImageForChat(opts: GenOpts): Promise<GenResult> {
  const { model, quality } = pickModel(opts.plan);

  // Build body per model family (OpenAI vs Gemini differ).
  const body: Record<string, unknown> = { model, stream: false };
  if (model.startsWith("openai/")) {
    body.prompt = opts.prompt;
    body.size = "1024x1024";
    body.n = 1;
    if (quality) body.quality = quality;
  } else {
    // Gemini image models use chat-completions-style body via OpenRouter shape.
    body.messages = [{ role: "user", content: opts.prompt }];
    body.modalities = ["image", "text"];
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.lovableApiKey}`,
      "Lovable-API-Key": opts.lovableApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Image gateway ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image gateway returned no image data");

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const filename = `ai-${Date.now()}.png`;
  const path = `${opts.userId}/${opts.threadId}/${crypto.randomUUID()}-${filename}`;

  const { error: upErr } = await supabaseAdmin.storage
    .from("chat-attachments")
    .upload(path, bytes, { contentType: "image/png", upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("chat-attachments")
    .createSignedUrl(path, 60 * 60 * 24 * 30);
  if (signErr || !signed) throw new Error(signErr?.message ?? "Could not sign URL");

  const { data: row, error: insErr } = await supabaseAdmin
    .from("chat_attachments")
    .insert({
      user_id: opts.userId,
      thread_id: opts.threadId,
      file_name: filename,
      file_type: "image/png",
      file_size: bytes.byteLength,
      storage_path: path,
      public_url: signed.signedUrl,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);

  return {
    url: signed.signedUrl,
    storage_path: path,
    attachment_id: row.id,
    model,
    quality: quality ?? "default",
  };
}
