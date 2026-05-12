import "server-only";

import type { z } from "zod";

const gatewayUrl = "https://ai-gateway.vercel.sh/v1/responses";
const anthropicUrl = "https://api.anthropic.com/v1/messages";
const anthropicVersion = "2023-06-01";
const anthropicModelAliases: Record<string, string> = {
  "anthropic/claude-haiku-4.5": "claude-haiku-4-5",
  "anthropic/claude-sonnet-4.6": "claude-sonnet-4-6",
  "anthropic/claude-sonnet-4.5": "claude-sonnet-4-5"
};

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

type AiCredentialName =
  | "AI_GATEWAY_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "VERCEL_OIDC_TOKEN";

function readToken(name: AiCredentialName) {
  const token = process.env[name]?.trim();
  return token ? token : null;
}

function isAnthropicApiKey(token: string) {
  return token.startsWith("sk-ant-");
}

export function getAiGatewayToken() {
  const gatewayToken = readToken("AI_GATEWAY_API_KEY");
  if (gatewayToken && !isAnthropicApiKey(gatewayToken)) return gatewayToken;
  return readToken("VERCEL_OIDC_TOKEN");
}

export function getAnthropicApiKey() {
  const anthropicToken = readToken("ANTHROPIC_API_KEY");
  if (anthropicToken) return anthropicToken;

  const misplacedGatewayToken = readToken("AI_GATEWAY_API_KEY");
  if (misplacedGatewayToken && isAnthropicApiKey(misplacedGatewayToken)) {
    return misplacedGatewayToken;
  }

  return null;
}

export function hasAiGatewayCredentials() {
  return Boolean(getAnthropicApiKey() ?? getAiGatewayToken());
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  if (typeof obj.output_text === "string") return obj.output_text;
  const directContent = Array.isArray(obj.content) ? obj.content : [];
  const directChunks: string[] = [];

  for (const part of directContent) {
    if (!part || typeof part !== "object") continue;
    const text = (part as Record<string, unknown>).text;
    if (typeof text === "string") directChunks.push(text);
  }

  if (directChunks.length > 0) return directChunks.join("\n").trim();

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

function toAnthropicModel(model: string) {
  const mapped = anthropicModelAliases[model];
  if (mapped) return mapped;
  if (!model.startsWith("anthropic/")) return model;
  return model
    .slice("anthropic/".length)
    .replace(/(\d)\.(\d)/g, "$1-$2");
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

function schemaFailureReason(error: z.ZodError) {
  const issues = error.issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}:${issue.message}`;
    })
    .join("|");
  return issues
    ? `schema_validation_failed:${issues}`
    : "schema_validation_failed";
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
  const anthropicApiKey = getAnthropicApiKey();
  const startedAt = Date.now();

  if (!anthropicApiKey && !token) {
    return {
      ok: false,
      reason: "ai_provider_not_configured",
      model,
      latencyMs: 0
    };
  }

  try {
    if (anthropicApiKey) {
      const anthropicModel = toAnthropicModel(model);
      const response = await fetch(anthropicUrl, {
        method: "POST",
        headers: {
          "anthropic-version": anthropicVersion,
          "content-type": "application/json",
          "x-api-key": anthropicApiKey
        },
        body: JSON.stringify({
          model: anthropicModel,
          system,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: maxOutputTokens
        }),
        signal: AbortSignal.timeout(timeoutMs)
      });
      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        return {
          ok: false,
          reason: `anthropic_${response.status}`,
          model: anthropicModel,
          latencyMs
        };
      }

      const payload = await response.json();
      const rawText = extractResponseText(payload);
      const parsed = schema.safeParse(parseJsonText(rawText));

      if (!parsed.success) {
        return {
          ok: false,
          reason: schemaFailureReason(parsed.error),
          model: anthropicModel,
          latencyMs
        };
      }

      const usage = extractUsage(payload);

      return {
        ok: true,
        output: parsed.data,
        model: anthropicModel,
        latencyMs,
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        rawText
      };
    }

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
        reason: schemaFailureReason(parsed.error),
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
