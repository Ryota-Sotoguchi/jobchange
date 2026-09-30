import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnalysisError } from "@/lib/errors";
import { analyze, findProhibitedClaims, resolveConfig, type AnalyzeConfig } from "./analyze";
import { MOCK_ANALYSIS } from "./mock";
import type { OpenAIResponsesClient } from "./providers/openai";
import { analysisSchema } from "./schema";

const input = { jobDescription: "求人票", candidateExperience: "職務経歴" };

const mockConfig = (overrides: Partial<AnalyzeConfig> = {}): AnalyzeConfig => ({
  mode: "mock",
  apiKey: undefined,
  model: "gpt-6-luna",
  mockScenario: "success",
  mockDelayMs: 0,
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveConfig", () => {
  it("APIキー未設定なら自動でモックモード", () => {
    expect(resolveConfig({}).mode).toBe("mock");
    expect(resolveConfig({ OPENAI_API_KEY: "  " }).mode).toBe("mock");
  });

  it("APIキーがあれば AI モード、既定モデルは gpt-6-luna", () => {
    const config = resolveConfig({ OPENAI_API_KEY: "sk-test" });
    expect(config.mode).toBe("ai");
    expect(config.model).toBe("gpt-6-luna");
  });

  it("ANALYSIS_MODE=mock はAPIキーがあってもモックを強制し、OPENAI_MODEL で差し替えできる", () => {
    const config = resolveConfig({
      OPENAI_API_KEY: "sk-test",
      ANALYSIS_MODE: "mock",
      OPENAI_MODEL: "gpt-6.1-sol",
      MOCK_SCENARIO: "api_error",
      MOCK_DELAY_MS: "0",
    });
    expect(config).toMatchObject({
      mode: "mock",
      model: "gpt-6.1-sol",
      mockScenario: "api_error",
      mockDelayMs: 0,
    });
  });

  it("不明な MOCK_SCENARIO や不正な MOCK_DELAY_MS は既定値に戻す", () => {
    const config = resolveConfig({ MOCK_SCENARIO: "???", MOCK_DELAY_MS: "-1" });
    expect(config.mockScenario).toBe("success");
    expect(config.mockDelayMs).toBe(1200);
  });
});

describe("analyze（モックモード）", () => {
  it("success: スキーマに適合したモック結果を返す", async () => {
    const { result, mode } = await analyze(input, mockConfig());
    expect(mode).toBe("mock");
    expect(result).toEqual(MOCK_ANALYSIS);
  });

  it("api_error: AI_UNAVAILABLE を投げる", async () => {
    await expect(analyze(input, mockConfig({ mockScenario: "api_error" }))).rejects.toMatchObject({
      code: "AI_UNAVAILABLE",
    });
  });

  it("invalid_response: スキーマ検証で弾いて AI_INVALID_RESPONSE を投げる", async () => {
    await expect(
      analyze(input, mockConfig({ mockScenario: "invalid_response" })),
    ).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE" });
  });

  it("ログに入力内容を含めない", async () => {
    const secretInput = {
      jobDescription: "SECRET_JOB_TEXT",
      candidateExperience: "SECRET_EXPERIENCE_TEXT",
    };
    await analyze(secretInput, mockConfig());
    await analyze(secretInput, mockConfig({ mockScenario: "api_error" })).catch(() => {});

    const logged = [
      ...vi.mocked(console.info).mock.calls,
      ...vi.mocked(console.error).mock.calls,
    ]
      .flat()
      .join("\n");
    expect(logged).not.toContain("SECRET_JOB_TEXT");
    expect(logged).not.toContain("SECRET_EXPERIENCE_TEXT");
  });
});

describe("analyze（AIモード）", () => {
  const aiConfig = mockConfig({ mode: "ai", apiKey: "sk-test" });

  it("プロバイダの出力がスキーマに合わなければ AI_INVALID_RESPONSE", async () => {
    const broken = { ...MOCK_ANALYSIS, matches: [{ requirement: "x", status: "maybe" }] };
    const text = JSON.stringify(broken);
    const client = {
      responses: {
        create: vi.fn().mockResolvedValue({
          status: "completed",
          output: [{ type: "message", content: [{ type: "output_text", text }] }],
          output_text: text,
          usage: null,
        }),
      },
    } as unknown as OpenAIResponsesClient;

    const error = await analyze(input, aiConfig, { openaiClient: client }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AnalysisError);
    expect((error as AnalysisError).code).toBe("AI_INVALID_RESPONSE");
  });

  it("プロバイダの出力が正しければそのまま返す", async () => {
    const text = JSON.stringify(MOCK_ANALYSIS);
    const client = {
      responses: {
        create: vi.fn().mockResolvedValue({
          status: "completed",
          output: [{ type: "message", content: [{ type: "output_text", text }] }],
          output_text: text,
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      },
    } as unknown as OpenAIResponsesClient;

    const { result, mode } = await analyze(input, aiConfig, { openaiClient: client });
    expect(mode).toBe("ai");
    expect(result).toEqual(MOCK_ANALYSIS);
  });
});

describe("出力内容のルール", () => {
  it("モック結果はスキーマに適合する", () => {
    expect(analysisSchema.safeParse(MOCK_ANALYSIS).success).toBe(true);
  });

  it("モック結果に採用予測・断定表現が含まれない", () => {
    expect(findProhibitedClaims(MOCK_ANALYSIS)).toEqual([]);
  });

  it("採用予測・断定表現を検出できる", () => {
    const bad = {
      ...MOCK_ANALYSIS,
      summary: "内定率は高く、合格確率は80%です。あなたはこの仕事に向いています。",
    };
    expect(findProhibitedClaims(bad)).toEqual(
      expect.arrayContaining(["probability", "pass_rate", "aptitude"]),
    );
  });
});
