import { z } from "zod";

/**
 * AI分析結果のスキーマ。OpenAI Structured Outputs に渡す JSON Schema の元であり、
 * サーバー側での再検証とUIの型の唯一の定義でもある。
 *
 * - Structured Outputs の strict モードに合わせ、全フィールド必須・optional なし
 * - 採用確率やスコアのような数値フィールドは意図的に持たない
 */

export const importanceSchema = z.enum(["high", "medium", "low"]);
export const matchStatusSchema = z.enum(["strong", "related", "unclear"]);
export const gapTypeSchema = z.enum(["not_found", "lacks_detail", "indirect"]);

export const analysisSchema = z.object({
  input_check: z.object({
    sufficient: z
      .boolean()
      .describe("入力が分析に十分か。求人票でない・経歴が極端に薄い場合は false"),
    notes: z
      .array(z.string())
      .describe("入力内容に関する注意点。問題がなければ空配列"),
  }),
  summary: z
    .string()
    .describe("総合マッチ概要。2〜4文。確率・点数・%は書かない"),
  job_requirements: z
    .array(
      z.object({
        requirement: z.string().describe("求人側が重視していそうな要素"),
        importance: importanceSchema,
        source_quote: z
          .string()
          .describe("根拠となる求人票の記載（短い引用）"),
      }),
    )
    .describe("3〜7項目"),
  matches: z
    .array(
      z.object({
        requirement: z.string().describe("job_requirements の requirement と同じ文言"),
        status: matchStatusSchema,
        evidence: z
          .string()
          .describe("経歴から読み取れる根拠。確認できない場合は空文字"),
        reason: z.string().describe("その判定にした理由"),
      }),
    )
    .describe("job_requirements の各項目に1つずつ、同じ順序で"),
  strengths_to_emphasize: z.array(
    z.object({
      experience: z.string().describe("経歴に書かれている具体的な経験"),
      related_requirement: z.string().describe("関連する求人側の要素"),
      reason: z.string().describe("強調すべき理由"),
      how_to_write: z
        .string()
        .describe("応募書類での書き方の具体化ヒント（対象・範囲・規模・成果など）"),
    }),
  ),
  gaps_or_unclear_points: z.array(
    z.object({
      point: z.string().describe("弱い・確認できない要素"),
      type: gapTypeSchema,
      reason: z.string(),
      suggestion: z
        .string()
        .describe("補足できる経験があれば書き足す、面接でどう説明するか等の提案"),
    }),
  ),
  interview_points: z
    .array(
      z.object({
        question: z.string().describe("面接で確認・深掘りされそうな問い"),
        intent: z.string().describe("なぜ聞かれそうか"),
        preparation: z.string().describe("準備しておくとよいこと"),
      }),
    )
    .describe("3〜7項目"),
  self_pr_direction: z.array(
    z.object({
      axis: z.string().describe("自己PRの軸になる経験・強み"),
      detail: z.string().describe("組み立て方の方向性（完成文ではない）"),
    }),
  ),
  motivation_direction: z.array(
    z.object({
      job_element: z.string().describe("接続すると自然な求人票の要素"),
      your_connection: z.string().describe("それと結びつけられる自分の経験・関心"),
    }),
  ),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type Importance = z.infer<typeof importanceSchema>;
export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type GapType = z.infer<typeof gapTypeSchema>;

export type AnalysisMode = "ai" | "mock";

export type AnalyzeSuccessResponse = {
  result: Analysis;
  mode: AnalysisMode;
};
