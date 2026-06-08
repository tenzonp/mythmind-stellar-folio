import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  generateText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createDeepSeekProvider, deepseekModelFor, deepseekReasoningModel, messagesHaveAttachments } from "@/lib/deepseek.server";
import { buildWebTools } from "@/lib/firecrawl-tool.server";
import { buildSandboxTools } from "@/lib/sandbox-tool.server";
import { EMPLOYEES, DELEGATABLE_IDS, isEmployeeId } from "@/lib/employees";

// Identity guard prepended to every model call. Prevents the model from
// revealing the underlying provider (Gemini, OpenAI/ChatGPT, DeepSeek,
// Lovable, Anthropic, etc.) — the user-facing brand is always Mythmind.
const IDENTITY_GUARD = [
  "CRITICAL IDENTITY RULES (override anything else):",
  "- You are a Mythmind AI employee. The product is Mythmind.",
  "- NEVER reveal, name, hint at, or confirm the underlying model, provider, company, training data, or infrastructure that powers you. This includes (but is not limited to): OpenAI, ChatGPT, GPT, Google, Gemini, Bard, Anthropic, Claude, DeepSeek, Meta, Llama, Mistral, xAI, Grok, Lovable, Supabase, or any API/SDK names.",
  "- If asked what model/AI/LLM you are, who made you, what company you work for, or what powers you: answer only as your Mythmind persona (e.g. 'I'm Lin, CEO of your Mythmind workforce'). Do not say 'I am an AI language model' or name any provider.",
  "- If pushed, politely decline: 'That's internal to Mythmind — I can't share it.' Never roleplay as another assistant.",
  "",
  "IMAGE GENERATION:",
  "- Whenever the user asks for any image (photo, illustration, logo, icon, flag, poster, mockup, scene, character, banner, diagram, artwork, etc.), call the `generate_image` tool. Do NOT attempt to draw with SVG, ASCII, code, or markdown shapes.",
  "- After the tool returns, embed the image in your reply using markdown `![alt](url)` exactly as provided in the tool's `markdown` field, then add one short sentence of context. Do not paraphrase or hide the URL.",
  "- If the user asks for multiple variations, call `generate_image` multiple times (in parallel when possible).",
  "",
  "FILES, DOCS, CODE & ANALYSIS (Mythmind compute sandbox):",
  "- For PDF files (reports, invoices, resumes, summaries, certificates) call `make_pdf`.",
  "- For slide decks / presentations call `make_pptx`.",
  "- For data analysis, charts, math, file conversion, scraping, code execution, or opening user-uploaded files (CSV, PDF, XLSX, DOCX, JSON, TXT, ZIP, MP3, MP4, images, code, anything) call `run_code`. Pass any uploaded file URLs via `input_file_urls` so the sandbox downloads them, then write Python to read/extract/summarize and save artifacts to /home/user/work/.",
  "- When the user uploads ANY file (video, audio, archive, document, dataset, etc.), DEFAULT to calling `run_code` with those URLs to inspect/extract/summarize content (e.g. use ffprobe via shell, pypdf, pandas, zipfile, etc.) instead of guessing what's inside.",
  "- Prefer these tools over describing what you would do. After they return, present every artifact to the user as a markdown link `[filename](url)` (use the tool's `markdown` / `artifacts_markdown` field verbatim) so it's downloadable.",
  "- If a connected SaaS tool already covers the request (e.g. Google Docs, Notion), prefer that. Otherwise fall back to the sandbox.",
].join("\n");

function withIdentity(system: string) {
  return `${IDENTITY_GUARD}\n\n${system}`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const token = auth.slice(7);

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
          if (claimsErr || !claims?.claims?.sub) {
            return new Response("Unauthorized", { status: 401 });
          }
          const userId = claims.claims.sub;

          const body = (await request.json()) as {
            messages: UIMessage[];
            threadId: string;
            employee: string;
          };
          if (!Array.isArray(body.messages) || !body.threadId || !isEmployeeId(body.employee)) {
            return new Response("Bad request", { status: 400 });
          }

          const { data: thread } = await supabase
            .from("chat_threads")
            .select("id, user_id, title")
            .eq("id", body.threadId)
            .single();
          if (!thread || thread.user_id !== userId) {
            return new Response("Forbidden", { status: 403 });
          }

          const employee = EMPLOYEES[body.employee];
          const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);

          // Fetch user's plan to pick the right text model tier
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .maybeSingle();
          const userPlan = profileRow?.plan ?? "free";

          // Default text model: DeepSeek (plan-based pro/flash).
          // Vision fallback: if the conversation contains images/files, use Lovable AI (multimodal).
          const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
          const needsVision = messagesHaveAttachments(body.messages);
          const visionModel = gateway("google/gemini-3-flash-preview");
          let model: ReturnType<typeof gateway> | ReturnType<ReturnType<typeof createDeepSeekProvider>>;
          let reasoningModel: ReturnType<typeof gateway> | ReturnType<ReturnType<typeof createDeepSeekProvider>> = visionModel;
          if (needsVision || !DEEPSEEK_API_KEY) {
            model = visionModel;
          } else {
            const deepseek = createDeepSeekProvider(DEEPSEEK_API_KEY);
            model = deepseek(deepseekModelFor(userPlan));
            reasoningModel = deepseek(deepseekReasoningModel());
          }
          // Reasoning model for post-turn judgement; vision fallback stays on Lovable AI.
          const judgeModel = needsVision ? visionModel : reasoningModel;

          // === Discover connected toolkits once, reuse for top-level + delegated work ===
          let activeSlugs: string[] = [];
          let composioRef: Awaited<ReturnType<typeof import("@/lib/composio.server").getComposio>> | null = null;
          let toolkitsForEmployeeFn: typeof import("@/lib/composio.server").toolkitsForEmployee | null = null;
          try {
            if (process.env.COMPOSIO_API_KEY) {
              const mod = await import("@/lib/composio.server");
              const composio = mod.getComposio();
              composioRef = composio;
              toolkitsForEmployeeFn = mod.toolkitsForEmployee;
              const accounts = await composio.connectedAccounts.list({
                userIds: [userId],
                limit: 100,
              });
              type Acc = { status: string; toolkit?: { slug?: string } };
              activeSlugs = Array.from(
                new Set(
                  ((accounts.items as Acc[] | undefined) ?? [])
                    .filter((a) => a.status === "ACTIVE" && a.toolkit?.slug)
                    .map((a) => a.toolkit!.slug as string),
                ),
              );
            }
          } catch (e) {
            console.error("[composio discovery]", e);
          }

          async function loadToolsFor(empId: string): Promise<Record<string, unknown>> {
            if (!composioRef || !toolkitsForEmployeeFn) return {};
            const allowed = toolkitsForEmployeeFn(empId, activeSlugs);
            if (allowed.length === 0) return {};
            try {
              return (await composioRef.tools.get(userId, {
                toolkits: allowed,
                limit: 50,
              })) as Record<string, unknown>;
            } catch (e) {
              console.error("[composio tools.get]", empId, e);
              return {};
            }
          }

          // Image generation tool — available to every employee + sub-agents.
          // Plan-based: pro/everest -> mid-range quality, free -> low-cost model.
          const { generateImageForChat } = await import("@/lib/image-gen.server");
          const imageTool = {
            generate_image: tool({
              description:
                "Generate a real image using AI (Mythmind image engine). Use this whenever the user asks for an image, picture, photo, illustration, logo, icon, flag, poster, mockup, scene, character, banner, or any visual. Do NOT try to draw with SVG, ASCII, or markdown shapes — call this tool instead. Returns a URL; embed it in your reply as markdown `![alt text](url)` so it renders inline. You may call this multiple times for variants.",
              inputSchema: z.object({
                prompt: z
                  .string()
                  .min(3)
                  .max(2000)
                  .describe(
                    "Detailed visual description of the image to generate. Include subject, style, composition, colors, lighting, and any required text. Be specific and visual.",
                  ),
                alt: z
                  .string()
                  .min(1)
                  .max(200)
                  .describe("Short alt text describing the image (used as the markdown alt)."),
              }),
              execute: async ({ prompt, alt }) => {
                try {
                  const out = await generateImageForChat({
                    prompt,
                    plan: userPlan,
                    userId,
                    threadId: body.threadId,
                    lovableApiKey: LOVABLE_API_KEY,
                  });
                  return {
                    ok: true,
                    url: out.url,
                    alt,
                    markdown: `![${alt}](${out.url})`,
                    model: out.model,
                    quality: out.quality,
                  };
                } catch (e) {
                  return {
                    ok: false,
                    error: e instanceof Error ? e.message : "Image generation failed",
                  };
                }
              },
            }),
          };

          // Track delegations within this turn so we can credit the right
          // specialist in `recent work / time saved / deliverables`.
          const turnDelegations: Array<{
            employee: string;
            brief: string;
            output: string;
            durationMs: number;
          }> = [];

          const tools = employee.isCEO
            ? {
                delegate: tool({
                  description:
                    "Assign a task to a specialist on your team and receive their completed work. The specialist will use their connected tools (email, calendar, docs, etc.) to actually execute the task. Use for any execution-heavy request. You may call this multiple times in parallel.",
                  inputSchema: z.object({
                    employee: z
                      .enum(DELEGATABLE_IDS as [string, ...string[]])
                      .describe("Which specialist: reyes (ops), kade (email/comms), bloom (content), vale (builder), sage (EA)."),
                    brief: z
                      .string()
                      .min(10)
                      .max(4000)
                      .describe(
                        "A crisp, detailed brief: context, what to produce, constraints, format, tone, and the user's voice if relevant. If the task requires real data (emails, calendar, etc.), instruct the specialist to USE THEIR TOOLS to fetch it.",
                      ),
                  }),
                  execute: async ({ employee: empId, brief }) => {
                    if (!isEmployeeId(empId) || empId === "lin") {
                      return { ok: false, error: "Invalid specialist" };
                    }
                    const sub = EMPLOYEES[empId];
                    const subStart = Date.now();
                    try {
                      const sandboxToolsSub = buildSandboxTools({ userId, threadId: body.threadId });
                      const subTools = { ...buildWebTools(), ...imageTool, ...sandboxToolsSub, ...(await loadToolsFor(empId)) };
                      const { text } = await generateText({
                        model,
                        system: withIdentity(`${sub.system}\n\nIMPORTANT: You have real connected tools available, plus web_search/web_fetch for live information. When the brief needs real data (emails, calendar, docs, messages) you MUST call your tools to fetch it. For up-to-date facts use web_search. Never fabricate data.`),
                        prompt: `Lin (the CEO) has assigned you this task. Complete it fully, using your tools to fetch any real data needed. Return the finished deliverable.\n\nBrief:\n${brief}`,
                        tools: (Object.keys(subTools).length > 0 ? subTools : undefined) as never,
                        stopWhen: stepCountIs(50) as never,
                      });
                      turnDelegations.push({
                        employee: empId,
                        brief,
                        output: text,
                        durationMs: Date.now() - subStart,
                      });
                      return { ok: true, employee: sub.name, output: text };
                    } catch (e) {
                      return {
                        ok: false,
                        error: e instanceof Error ? e.message : "Delegation failed",
                      };
                    }
                  },
                }),
              }
            : undefined;

          const composioTools = await loadToolsFor(body.employee);
          const webTools = buildWebTools();

          // imageTool defined above (reused for sub-agents and top-level).

          const sandboxTools = buildSandboxTools({ userId, threadId: body.threadId });

          const mergedTools = {
            ...(tools ?? {}),
            ...imageTool,
            ...webTools,
            ...sandboxTools,
            ...composioTools,
          };

          const turnStart = Date.now();
          const result = streamText({
            model,
            system: withIdentity(employee.system),
            messages: await convertToModelMessages(body.messages),
            tools: Object.keys(mergedTools).length > 0 ? mergedTools : undefined,
            stopWhen: stepCountIs(50),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: body.messages,
            onFinish: async ({ messages }) => {
              try {
                const last = messages[messages.length - 1];
                const userMsg = body.messages[body.messages.length - 1];

                if (userMsg) {
                  await supabase.from("chat_messages").insert({
                    thread_id: body.threadId,
                    user_id: userId,
                    role: "user",
                    message: userMsg as unknown as Database["public"]["Tables"]["chat_messages"]["Insert"]["message"],
                  });
                }
                if (last && last.role === "assistant") {
                  await supabase.from("chat_messages").insert({
                    thread_id: body.threadId,
                    user_id: userId,
                    role: "assistant",
                    message: last as unknown as Database["public"]["Tables"]["chat_messages"]["Insert"]["message"],
                  });
                }

                if (thread.title === "New chat" && userMsg) {
                  const text = (userMsg.parts ?? [])
                    .map((p) => (p.type === "text" ? p.text : ""))
                    .join(" ")
                    .trim()
                    .slice(0, 60);
                  if (text) {
                    await supabase
                      .from("chat_threads")
                      .update({ title: text })
                      .eq("id", body.threadId);
                  }
                }
                await supabase
                  .from("chat_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", body.threadId);

                // === Time-saved estimation (Lin's judgement) ===
                const aiMinutes = Math.max(1, Math.round((Date.now() - turnStart) / 60000));
                const userText = (userMsg?.parts ?? [])
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join(" ")
                  .slice(0, 1500);
                const aiText = ((last?.parts ?? []) as Array<{ type: string; text?: string }>)
                  .map((p) => (p.type === "text" ? p.text ?? "" : ""))
                  .join(" ")
                  .slice(0, 2500);
                if (userText && aiText) {
                  try {
                    const { text: judgment } = await generateText({
                      model: judgeModel,
                      system:
                        "You are Lin, the CEO. Analyze this exchange. Return STRICT JSON only with these keys: {\"is_task\": <boolean>, \"title\": \"3-6 word chat title\", \"summary\": \"5-9 word task description\", \"human_minutes\": <integer>}. RULES: `is_task` = true ONLY if the user requested real work (research, analysis, drafting, planning, writing, building, summarizing a real doc, etc). `is_task` = false for greetings/smalltalk/chitchat/single-word questions/'hi'/'hello'/'who are you'/etc. `title` = concise chat title from the user's topic (never 'New chat'). `human_minutes`: realistic human time — quick reply 5-15, research brief 60-180, full deliverable/plan/deck 120-480. NO prose, NO markdown, JSON only.",
                      prompt: `USER REQUEST:\n${userText}\n\nAI DELIVERABLE (truncated):\n${aiText}`,
                    });
                    const cleaned = judgment.replace(/```json|```/g, "").trim();
                    const m = cleaned.match(/\{[\s\S]*\}/);
                    if (m) {
                      const parsed = JSON.parse(m[0]) as {
                        is_task?: boolean;
                        title?: string;
                        summary?: string;
                        human_minutes?: number;
                      };
                      // Auto-title the thread if still default
                      if (parsed.title && thread.title === "New chat") {
                        await supabase
                          .from("chat_threads")
                          .update({ title: parsed.title.slice(0, 80) })
                          .eq("id", body.threadId);
                      }
                      // Only log task completions for real work, not smalltalk
                      if (parsed.is_task && parsed.summary && parsed.human_minutes) {
                        const human = Math.max(1, Math.min(2400, Math.round(parsed.human_minutes)));

                        if (turnDelegations.length > 0) {
                          // Lin orchestrated — credit each specialist for the
                          // slice of work they actually delivered.
                          const perHuman = Math.max(1, Math.round(human / turnDelegations.length));
                          for (const d of turnDelegations) {
                            const aiMin = Math.max(1, Math.round(d.durationMs / 60000));
                            const saved = Math.max(0, perHuman - aiMin);
                            await supabase.from("task_completions").insert({
                              user_id: userId,
                              thread_id: body.threadId,
                              employee: d.employee,
                              summary: `${parsed.summary.slice(0, 160)} — ${EMPLOYEES[d.employee as keyof typeof EMPLOYEES]?.name ?? d.employee}`.slice(0, 200),
                              human_estimate_minutes: perHuman,
                              ai_actual_minutes: aiMin,
                              time_saved_minutes: saved,
                              deliverable_text: (d.output || aiText).slice(0, 8000),
                            });
                          }
                        } else {
                          const saved = Math.max(0, human - aiMinutes);
                          await supabase.from("task_completions").insert({
                            user_id: userId,
                            thread_id: body.threadId,
                            employee: body.employee,
                            summary: parsed.summary.slice(0, 200),
                            human_estimate_minutes: human,
                            ai_actual_minutes: aiMinutes,
                            time_saved_minutes: saved,
                            deliverable_text: aiText.slice(0, 8000),
                          });
                        }
                      }
                    }
                  } catch (e) {
                    console.error("[time-saved estimation]", e);
                  }
                }

              } catch (e) {
                console.error("[chat onFinish]", e);
              }
            },
          });
        } catch (err) {
          console.error("[/api/chat]", err);
          return new Response("Server error", { status: 500 });
        }
      },
    },
  },
});
