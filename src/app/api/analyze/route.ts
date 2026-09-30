import { analyze } from "@/lib/analysis/analyze";
import type { AnalyzeSuccessResponse } from "@/lib/analysis/schema";
import {
  AnalysisError,
  errorMessage,
  errorStatus,
  type ErrorCode,
  type ErrorResponseBody,
} from "@/lib/errors";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { MAX_BODY_BYTES, validateAnalyzeInput } from "@/lib/validation";

// OpenAI SDK のタイムアウト（50秒 × 最大2回）より長くしておく
export const maxDuration = 120;

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(
  code: ErrorCode,
  extra: Partial<ErrorResponseBody["error"]> = {},
  headers: Record<string, string> = {},
) {
  const body: ErrorResponseBody = { error: { code, message: errorMessage(code), ...extra } };
  return Response.json(body, { status: errorStatus(code), headers: { ...NO_STORE, ...headers } });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse("VALIDATION_ERROR");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE");
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse("VALIDATION_ERROR");
  }

  const validation = validateAnalyzeInput(body);
  if (!validation.ok) {
    return errorResponse("VALIDATION_ERROR", { fields: validation.fields });
  }

  const rateLimit = await checkRateLimit(rateLimitKey(request));
  if (!rateLimit.allowed) {
    return errorResponse("RATE_LIMITED", {}, { "Retry-After": String(rateLimit.retryAfterSeconds) });
  }

  try {
    const { result, mode } = await analyze(validation.value);
    const payload: AnalyzeSuccessResponse = { result, mode };
    return Response.json(payload, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error instanceof AnalysisError ? error.code : "AI_ERROR");
  }
}
