import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { PlanId } from "./plans";

/**
 * DeepSeek provider (OpenAI-compatible). Server-only.
 * - Free plan -> DeepSeek V4 Flash
 * - Pro / Everest plan -> DeepSeek V4 Pro
 * - Reasoning workflows -> DeepSeek reasoning model
 * Model IDs can still be overridden via env vars if DeepSeek updates names.
 */
export function createDeepSeekProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "deepseek",
    baseURL: "https://api.deepseek.com/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export function deepseekModelFor(plan: PlanId | string | null | undefined): string {
  const pro = process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro";
  const flash = process.env.DEEPSEEK_FLASH_MODEL || "deepseek-v4-flash";
  return plan === "pro" || plan === "everest" ? pro : flash;
}

export function deepseekReasoningModel(): string {
  return process.env.DEEPSEEK_REASONING_MODEL || "deepseek-reasoner";
}

/** True if any message part references a non-text attachment (image / file). */
export function messagesHaveAttachments(messages: unknown): boolean {
  if (!Array.isArray(messages)) return false;
  for (const m of messages as Array<{ parts?: Array<{ type?: string }> }>) {
    for (const p of m.parts ?? []) {
      if (p.type && p.type !== "text" && p.type !== "step-start" && !p.type.startsWith("tool-") && p.type !== "reasoning") {
        return true;
      }
    }
  }
  return false;
}
