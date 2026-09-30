import OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";

import { AnalysisError, type ErrorCode } from "@/lib/errors";
import { MOCK_ANALYSIS } from "../mock";
import { analyzeWithOpenAI, classifyOpenAIError, type OpenAIResponsesClient } from "./openai";

const input = { jobDescription: "求人票の本文", candidateExperience: "職務経歴の本文" };

/** analyzeWithOpenAI が参照するフィールドだけを持つフェイクのレスポンス */
function fakeResponse(overrides: Record<string, unknown> = {}) {
  const text = JSON.stringify(MOCK_ANALYSIS);
  return {
    status: "completed",
    incomplete_details: null,
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
    output_text: text,
    usage: { input_tokens: 1200, output_tokens: 900 },
    ...overrides,
  };
}

function clientReturning(response: unknown): OpenAIResponsesClient {
  return {
    responses: { create: vi.fn().mockResolvedValue(response) },
  } as unknown as OpenAIResponsesClient;
}

function clientThrowing(error: unknown): OpenAIResponsesClient {
  return {
    responses: { create: vi.fn().mockRejectedValue(error) },
  } as unknown as OpenAIResponsesClient;
}

async function expectCode(promise: Promise<unknown>, code: ErrorCode) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AnalysisError);
  expect((error as AnalysisError).code).toBe(code);
}

const options = { apiKey: "test-key", model: "gpt-6-luna" };

describe("analyzeWithOpenAI", () => {
  it("成功時はパース済みJSONとトークン数を返す", async () => {
    const client = clientReturning(fakeResponse());
    const result = await analyzeWithOpenAI(input, { ...options, client });

    expect(result.raw).toEqual(MOCK_ANALYSIS);
    expect(result.usage).toEqual({ inputTokens: 1200, outputTokens: 900 });
  });

  it("構造化出力・保存しない設定でリクエストし、入力をタグで囲んで送る", async () => {
    const client = clientReturning(fakeResponse());
    await analyzeWithOpenAI(input, { ...options, client });

    const params = vi.mocked(client.responses.create).mock.calls[0][0] as unknown as Record<
      string,
      unknown
    >;
    expect(params.model).toBe("gpt-6-luna");
    expect(params.store).toBe(false);
    expect(params.input).toContain("<job_description>\n求人票の本文\n</job_description>");
    expect((params.text as { format: { type: string; strict: boolean } }).format).toMatchObject({
      type: "json_schema",
      strict: true,
    });
  });

  it("出力トークン上限で途切れたら AI_INCOMPLETE", async () => {
    const client = clientReturning(
      fakeResponse({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }),
    );
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_INCOMPLETE");
  });

  it("コンテンツフィルタで止まったら AI_REFUSED", async () => {
    const client = clientReturning(
      fakeResponse({ status: "incomplete", incomplete_details: { reason: "content_filter" } }),
    );
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_REFUSED");
  });

  it("モデルが拒否（refusal）したら AI_REFUSED", async () => {
    const client = clientReturning(
      fakeResponse({
        output: [{ type: "message", content: [{ type: "refusal", refusal: "対応できません" }] }],
        output_text: "",
      }),
    );
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_REFUSED");
  });

  it("failed ステータスは AI_ERROR", async () => {
    const client = clientReturning(fakeResponse({ status: "failed" }));
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_ERROR");
  });

  it("出力が空なら AI_INVALID_RESPONSE", async () => {
    const client = clientReturning(fakeResponse({ output: [], output_text: "" }));
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_INVALID_RESPONSE");
  });

  it("出力がJSONとして壊れていたら AI_INVALID_RESPONSE", async () => {
    const client = clientReturning(fakeResponse({ output_text: '{"summary": "途中で' }));
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_INVALID_RESPONSE");
  });

  it("APIエラーはエラーコードに変換して投げる", async () => {
    const client = clientThrowing(new OpenAI.RateLimitError(429, {}, "rate limited", new Headers()));
    await expectCode(analyzeWithOpenAI(input, { ...options, client }), "AI_BUSY");
  });
});

describe("classifyOpenAIError", () => {
  const headers = new Headers();

  it.each<[string, unknown, ErrorCode]>([
    ["429 レート制限", new OpenAI.RateLimitError(429, {}, "rate", headers), "AI_BUSY"],
    [
      "429 利用枠切れ",
      new OpenAI.RateLimitError(429, { code: "insufficient_quota" }, "quota", headers),
      "CONFIG_ERROR",
    ],
    ["401 認証エラー", new OpenAI.AuthenticationError(401, {}, "auth", headers), "CONFIG_ERROR"],
    ["403 権限エラー", new OpenAI.PermissionDeniedError(403, {}, "denied", headers), "CONFIG_ERROR"],
    ["404 モデルID誤り", new OpenAI.NotFoundError(404, {}, "model", headers), "CONFIG_ERROR"],
    ["500 サーバーエラー", new OpenAI.InternalServerError(500, {}, "server", headers), "AI_UNAVAILABLE"],
    ["接続エラー", new OpenAI.APIConnectionError({ message: "conn" }), "AI_UNAVAILABLE"],
    ["タイムアウト", new OpenAI.APIConnectionTimeoutError(), "AI_UNAVAILABLE"],
    ["400 不正リクエスト", new OpenAI.BadRequestError(400, {}, "bad", headers), "AI_ERROR"],
    ["想定外の例外", new Error("boom"), "AI_ERROR"],
  ])("%s → %s", (_label, error, expected) => {
    expect(classifyOpenAIError(error)).toBe(expected);
  });
});
