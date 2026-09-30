/**
 * 入力バリデーション。client（送信前チェック）と server（再検証）で同じ関数を使う。
 */

export const INPUT_LIMITS = {
  jobDescription: { min: 50, max: 10_000, label: "求人票" },
  candidateExperience: { min: 30, max: 10_000, label: "職務経歴・スキル" },
} as const;

/** JSONボディ全体の上限（バイト）。各10,000文字×UTF-8最大3バイト＋余裕 */
export const MAX_BODY_BYTES = 64 * 1024;

export type InputField = keyof typeof INPUT_LIMITS;

export type AnalyzeInput = {
  jobDescription: string;
  candidateExperience: string;
};

export type ValidationResult =
  | { ok: true; value: AnalyzeInput }
  | { ok: false; fields: Partial<Record<InputField, string>> };

/** 改行コードを統一し、前後の空白を除去する */
export function normalizeInput(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

/** 文字数（サロゲートペアを1文字として数える） */
export function countChars(text: string): number {
  return Array.from(text).length;
}

export function validateField(field: InputField, raw: unknown): string | null {
  const { min, max, label } = INPUT_LIMITS[field];
  if (typeof raw !== "string") {
    return `${label}を入力してください。`;
  }
  const length = countChars(normalizeInput(raw));
  if (length === 0) {
    return `${label}を入力してください。`;
  }
  if (length < min) {
    return `${label}が短すぎます。より正確に分析するため、${min}文字以上で入力してください。`;
  }
  if (length > max) {
    return `${label}は${max.toLocaleString("ja-JP")}文字以内で入力してください（現在${length.toLocaleString("ja-JP")}文字）。`;
  }
  return null;
}

export function validateAnalyzeInput(input: unknown): ValidationResult {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  const fields: Partial<Record<InputField, string>> = {};

  for (const field of Object.keys(INPUT_LIMITS) as InputField[]) {
    const error = validateField(field, body[field]);
    if (error) fields[field] = error;
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      jobDescription: normalizeInput(body.jobDescription as string),
      candidateExperience: normalizeInput(body.candidateExperience as string),
    },
  };
}
