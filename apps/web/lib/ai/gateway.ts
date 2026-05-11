import "server-only";

import type { z } from "zod";

const gatewayUrl = "https://ai-gateway.vercel.sh/v1/responses";

export type GatewayJsonResult<T> =
  | {
      ok: true;
      output: T;
      model: string;
      latencyMs: number;
      tokensIn: number | null;
      tokensOut: number | null;
      rawText: string;
    }
  | {
      ok: false;
      reason: string;
      model: string;
      latencyMs: number;
    };

function readToken(name: "AI_GATEWAY_API_KEY" | "VERCEL_OIDC_TOKEN") {
  const token = process.env[name]?.trim();
  return token ? token : null;
}

export function getAiGatewayToken() {
  return readToken("AI_GATEWAY_API_KEY") ?? readToken("VERCEL_OIDC_TOKEN");
}

export function hasAiGatewayCredentials() {
  return Boolean(getAiGatewayToken());
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  if (typeof obj.output_text === "string") return obj.output_text;
  const output = Array.isArray(obj.output) ? obj.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") chunks.push(text);
    }
  }

  return chunks.join("\n").trim();
}

function extractUsage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { tokensIn: null, tokensOut: null };
  }
  const usage = (payload as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") {
    return { tokensIn: null, tokensOut: null };
  }
  const obj = usage as Record<string, unknown>;
  const tokensIn =
    typeof obj.input_tokens === "number"
      ? obj.input_tokens
      : typeof obj.prompt_tokens === "number"
        ? obj.prompt_tokens
        : null;
  const tokensOut =
    typeof obj.output_tokens === "number"
      ? obj.output_tokens
      : typeof obj.completion_tokens === "number"
        ? obj.completion_tokens
        : null;

  return { tokensIn, tokensOut };
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("empty_model_output");

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("invalid_json_model_output");
    return JSON.parse(match[0]);
  }
}

export async function generateJsonWithGateway<T>({
  model,
  system,
  prompt,
  schema,
  timeoutMs = 10_000,
  maxOutputTokens = 900
}: {
  model: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  timeoutMs?: number;
  maxOutputTokens?: number;
}): Promise<GatewayJsonResult<T>> {
  const token = getAiGatewayToken();
  const startedAt = Date.now();

  if (!token) {
    return {
      ok: false,
      reason: "ai_gateway_not_configured",
      model,
      latencyMs: 0
    };
  }

  try {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            type: "message",
            role: "system",
            content: system
          },
          {
            type: "message",
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_output_tokens: maxOutputTokens
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        ok: false,
        reason: `gateway_${response.status}`,
        model,
        latencyMs
      };
    }

    const payload = await response.json();
    const rawText = extractResponseText(payload);
    const parsed = schema.safeParse(parseJsonText(rawText));

    if (!parsed.success) {
      return {
        ok: false,
        reason: "schema_validation_failed",
        model,
        latencyMs
      };
    }

    const usage = extractUsage(payload);

    return {
      ok: true,
      output: parsed.data,
      model,
      latencyMs,
      tokensIn: usage.tokensIn,
      tokensOut: usage.tokensOut,
      rawText
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "gateway_error",
      model,
      latencyMs: Date.now() - startedAt
    };
  }
}
