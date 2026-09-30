/**
 * レート制限のフック。MVPでは常に許可する。
 *
 * 公開前に実装を差し替える想定（例：Upstash Redis や Vercel KV で IP ごとに
 * 「10分に5回まで」などを数える）。呼び出し側（API route）は変更不要。
 */

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  void key;
  return { allowed: true };
}

/** リクエストからレート制限用のキー（クライアントIP）を取り出す */
export function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
