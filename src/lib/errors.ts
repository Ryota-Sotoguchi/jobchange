/**
 * APIが返すエラーコードと、ユーザー向けの日本語メッセージ・HTTPステータスの対応表。
 * client / server の両方から参照する。
 */

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "AI_BUSY",
  "AI_UNAVAILABLE",
  "AI_REFUSED",
  "AI_INCOMPLETE",
  "AI_INVALID_RESPONSE",
  "AI_ERROR",
  "CONFIG_ERROR",
  "NETWORK_ERROR",
  "TIMEOUT",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const ERROR_DEFINITIONS: Record<ErrorCode, { status: number; message: string }> = {
  VALIDATION_ERROR: {
    status: 400,
    message: "入力内容を確認してください。",
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "入力が長すぎます。文字数を減らしてから再度お試しください。",
  },
  RATE_LIMITED: {
    status: 429,
    message: "短時間に多くのリクエストがありました。少し時間をおいてから再度お試しください。",
  },
  AI_BUSY: {
    status: 503,
    message: "現在AIが混み合っています。1〜2分ほど待ってから再度お試しください。",
  },
  AI_UNAVAILABLE: {
    status: 503,
    message: "AIサービスに接続できませんでした。時間をおいて再度お試しください。",
  },
  AI_REFUSED: {
    status: 422,
    message:
      "この入力内容では分析を完了できませんでした。求人票と職務経歴の内容を見直して再度お試しください。",
  },
  AI_INCOMPLETE: {
    status: 502,
    message:
      "分析結果が途中で途切れました。入力を少し短くして再度お試しください。",
  },
  AI_INVALID_RESPONSE: {
    status: 502,
    message: "分析結果を正しく読み取れませんでした。お手数ですが再度お試しください。",
  },
  AI_ERROR: {
    status: 502,
    message: "分析中にエラーが発生しました。お手数ですが再度お試しください。",
  },
  CONFIG_ERROR: {
    status: 500,
    message: "サービスの設定に問題があり、現在分析できません。時間をおいて再度お試しください。",
  },
  NETWORK_ERROR: {
    status: 0,
    message: "通信に失敗しました。インターネット接続を確認して再度お試しください。",
  },
  TIMEOUT: {
    status: 0,
    message: "分析に時間がかかりすぎたため中断しました。再度お試しください。",
  },
};

export function errorStatus(code: ErrorCode): number {
  return ERROR_DEFINITIONS[code].status;
}

export function errorMessage(code: ErrorCode): string {
  return ERROR_DEFINITIONS[code].message;
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

/** サーバー内部で分析失敗を表す例外。code だけをクライアントに返す。 */
export class AnalysisError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "AnalysisError";
    this.code = code;
  }
}

export type ErrorResponseBody = {
  error: {
    code: ErrorCode;
    message: string;
    /** バリデーションエラー時の項目別メッセージ */
    fields?: Partial<Record<"jobDescription" | "candidateExperience", string>>;
  };
};
