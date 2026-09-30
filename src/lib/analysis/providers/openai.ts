import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { AnalysisError, type ErrorCode } from "@/lib/errors";
import { analysisSchema } from "../schema";
import { SYSTEM_PROMPT, buildUserMessage } from "../prompt";
import type { AnalyzeInput } from "@/lib/validation";

/**
 * OpenAI Responses API + Structured Outputs で分析を実行する。
 * OpenAI SDK に依存するコードはこのファイルに閉じ込めている（他社モデルへの差し替えはここだけ）。
 */

export const DEFAULT_OPENAI_MODEL = "gpt-6-luna";

const MAX_OUTPUT_TOKENS = 16_000;
const REQUEST_TIMEOUT_MS = 50_000;

/** テストでフェイクに差し替えられるよう、使うメソッドだけを型にしている */
export type OpenAIResponsesClient = {
  responses: Pick<OpenAI["responses"], "create">;
};

export type ProviderResult = {
  /** JSON.parse 済みだが未検証の出力。検証は呼び出し側で行う */
  raw: unknown;
  usage: { inputTokens: number; outputTokens: number } | null;
};

let cachedClient: OpenAI | null = null;

function getClient(apiKey: string): OpenAI {
  cachedClient ??= new OpenAI({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  });
  return cachedClient;
}

export async function analyzeWithOpenAI(
  input: AnalyzeInput,
  options: { apiKey: string; model: string; client?: OpenAIResponsesClient },
): Promise<ProviderResult> {
  const client = options.client ?? getClient(options.apiKey);

  let response: OpenAI.Responses.Response;
  try {
    response = await client.responses.create({
      model: options.model,
      instructions: SYSTEM_PROMPT,
      input: buildUserMessage(input.jobDescription, input.candidateExperience),
      text: { format: zodTextFormat(analysisSchema, "job_match_analysis") },
      max_output_tokens: MAX_OUTPUT_TOKENS,
      // 入力には個人の職務経歴が含まれるため、OpenAI 側にレスポンスを保存させない
      store: false,
      stream: false,
    });
  } catch (error) {
    throw new AnalysisError(classifyOpenAIError(error), describeError(error));
  }

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason;
    throw new AnalysisError(
      reason === "content_filter" ? "AI_REFUSED" : "AI_INCOMPLETE",
      `incomplete: ${reason ?? "unknown"}`,
    );
  }
  if (response.status && response.status !== "completed") {
    throw new AnalysisError("AI_ERROR", `status: ${response.status}`);
  }

  const hasRefusal = response.output.some(
    (item) =>
      item.type === "message" && item.content.some((content) => content.type === "refusal"),
  );
  if (hasRefusal) {
    throw new AnalysisError("AI_REFUSED", "model refused");
  }

  const text = response.output_text;
  if (!text) {
    throw new AnalysisError("AI_INVALID_RESPONSE", "empty output");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AnalysisError("AI_INVALID_RESPONSE", "output is not valid JSON");
  }

  return {
    raw,
    usage: response.usage
      ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        }
      : null,
  };
}

/** SDK の型付きエラーをアプリのエラーコードに分類する（具体的なクラスから順に判定） */
export function classifyOpenAIError(error: unknown): ErrorCode {
  if (error instanceof OpenAI.RateLimitError) {
    // 利用枠（課金）切れは待っても解消しないため設定エラー扱い
    return error.code === "insufficient_quota" ? "CONFIG_ERROR" : "AI_BUSY";
  }
  if (
    error instanceof OpenAI.AuthenticationError ||
    error instanceof OpenAI.PermissionDeniedError ||
    error instanceof OpenAI.NotFoundError
  ) {
    return "CONFIG_ERROR";
  }
  if (error instanceof OpenAI.InternalServerError) {
    return "AI_UNAVAILABLE";
  }
  // APIConnectionTimeoutError は APIConnectionError のサブクラス
  if (error instanceof OpenAI.APIConnectionError) {
    return "AI_UNAVAILABLE";
  }
  return "AI_ERROR";
}

/** ログ用の短い説明。入力内容は含めない */
function describeError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    return `${error.constructor.name} status=${error.status ?? "-"} code=${error.code ?? "-"}`;
  }
  return error instanceof Error ? error.name : "unknown error";
}
