import "server-only";

import { AnalysisError } from "@/lib/errors";
import type { AnalyzeInput } from "@/lib/validation";
import { MOCK_ANALYSIS, resolveMockScenario, type MockScenario } from "./mock";
import { PROMPT_VERSION } from "./prompt";
import {
  DEFAULT_OPENAI_MODEL,
  analyzeWithOpenAI,
  type OpenAIResponsesClient,
  type ProviderResult,
} from "./providers/openai";
import { analysisSchema, type Analysis, type AnalysisMode } from "./schema";

export type AnalyzeConfig = {
  mode: AnalysisMode;
  apiKey: string | undefined;
  model: string;
  mockScenario: MockScenario;
  /** モック時に「分析中」表示を確認できるよう入れる待ち時間 */
  mockDelayMs: number;
};

/** 環境変数から設定を決める。APIキーが無ければ自動でモックモードになる */
export function resolveConfig(
  env: Record<string, string | undefined> = process.env,
): AnalyzeConfig {
  const apiKey = env.OPENAI_API_KEY?.trim() || undefined;
  const forceMock = env.ANALYSIS_MODE === "mock";
  return {
    mode: forceMock || !apiKey ? "mock" : "ai",
    apiKey,
    model: env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    mockScenario: resolveMockScenario(env.MOCK_SCENARIO),
    mockDelayMs: parseDelay(env.MOCK_DELAY_MS, 1200),
  };
}

function parseDelay(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : fallback;
}

export async function analyze(
  input: AnalyzeInput,
  config: AnalyzeConfig = resolveConfig(),
  deps: { openaiClient?: OpenAIResponsesClient } = {},
): Promise<{ result: Analysis; mode: AnalysisMode }> {
  const startedAt = Date.now();
  try {
    const { raw, usage } =
      config.mode === "mock"
        ? await runMock(config)
        : await analyzeWithOpenAI(input, {
            apiKey: config.apiKey ?? "",
            model: config.model,
            client: deps.openaiClient,
          });

    const parsed = analysisSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AnalysisError("AI_INVALID_RESPONSE", "schema validation failed");
    }

    const flagged = findProhibitedClaims(parsed.data);
    log("info", {
      ok: true,
      mode: config.mode,
      model: config.mode === "ai" ? config.model : "mock",
      durationMs: Date.now() - startedAt,
      usage,
      prohibitedClaims: flagged.length > 0 ? flagged : undefined,
    });

    return { result: parsed.data, mode: config.mode };
  } catch (error) {
    const analysisError =
      error instanceof AnalysisError ? error : new AnalysisError("AI_ERROR", "unexpected error");
    log("error", {
      ok: false,
      mode: config.mode,
      model: config.mode === "ai" ? config.model : "mock",
      durationMs: Date.now() - startedAt,
      code: analysisError.code,
      detail: analysisError.message,
    });
    throw analysisError;
  }
}

async function runMock(config: AnalyzeConfig): Promise<ProviderResult> {
  const delay = config.mockScenario === "slow" ? config.mockDelayMs * 6 : config.mockDelayMs;
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

  switch (config.mockScenario) {
    case "api_error":
      throw new AnalysisError("AI_UNAVAILABLE", "mock api_error");
    case "invalid_response":
      return { raw: { summary: 123, matches: "broken" }, usage: null };
    default:
      return { raw: structuredClone(MOCK_ANALYSIS), usage: null };
  }
}

/**
 * 採用予測や断定に見える表現を検出する（警告ログ用）。
 * プロンプトとスキーマで防いでいるが、万一出力された場合に気づけるようにする。
 */
const PROHIBITED_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "probability", pattern: /確率|可能性は\s*\d+|マッチ度|適合度\s*\d+/ },
  { id: "pass_rate", pattern: /合格率|内定率|採用率|通過率/ },
  { id: "percentage_score", pattern: /(スコア|点数|評価)\s*[:：は]?\s*\d+\s*(点|[%％])/ },
  { id: "assertion", pattern: /採用されます|合格できます|内定できます|絶対に|必ず(採用|合格|受か)/ },
  { id: "aptitude", pattern: /向いています|適性があります|不採用になります/ },
];

export function findProhibitedClaims(analysis: Analysis): string[] {
  const text = JSON.stringify(analysis);
  return PROHIBITED_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ id }) => id);
}

/** 構造化ログ。入力内容（求人票・職務経歴）は絶対に含めない */
function log(level: "info" | "error", fields: Record<string, unknown>) {
  const entry = JSON.stringify({
    event: "analysis",
    promptVersion: PROMPT_VERSION,
    ...fields,
  });
  if (level === "error") console.error(entry);
  else console.info(entry);
}
