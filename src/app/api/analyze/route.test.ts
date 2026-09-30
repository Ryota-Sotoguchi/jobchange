import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_ANALYSIS } from "@/lib/analysis/mock";
import { SAMPLE_CANDIDATE_EXPERIENCE, SAMPLE_JOB_DESCRIPTION } from "@/lib/analysis/sample";
import { POST } from "./route";

const validBody = {
  jobDescription: SAMPLE_JOB_DESCRIPTION,
  candidateExperience: SAMPLE_CANDIDATE_EXPERIENCE,
};

function jsonRequest(body: unknown, init: { contentType?: string; raw?: string } = {}) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": init.contentType ?? "application/json" },
    body: init.raw ?? JSON.stringify(body),
  });
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ANALYSIS_MODE = "mock";
  process.env.MOCK_DELAY_MS = "0";
  delete process.env.MOCK_SCENARIO;
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("POST /api/analyze", () => {
  it("正常系: 分析結果（モック）を返し、キャッシュさせない", async () => {
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const data = await res.json();
    expect(data.mode).toBe("mock");
    expect(data.result).toEqual(MOCK_ANALYSIS);
  });

  it("空入力 → 400 と項目別エラー", async () => {
    const res = await POST(jsonRequest({ jobDescription: "", candidateExperience: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.fields.jobDescription).toBeDefined();
    expect(data.error.fields.candidateExperience).toBeDefined();
  });

  it("求人票なし → 400（求人票のみエラー）", async () => {
    const res = await POST(jsonRequest({ candidateExperience: validBody.candidateExperience }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(Object.keys(data.error.fields)).toEqual(["jobDescription"]);
  });

  it("職務経歴なし → 400（職務経歴のみエラー）", async () => {
    const res = await POST(jsonRequest({ jobDescription: validBody.jobDescription }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(Object.keys(data.error.fields)).toEqual(["candidateExperience"]);
  });

  it("極端に短い入力 → 400", async () => {
    const res = await POST(jsonRequest({ jobDescription: "営業募集", candidateExperience: "営業" }));
    expect(res.status).toBe(400);
  });

  it("文字数上限超過 → 400（AIに送らない）", async () => {
    const res = await POST(
      jsonRequest({ jobDescription: "あ".repeat(10_001), candidateExperience: validBody.candidateExperience }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.fields.jobDescription).toContain("10,000文字以内");
  });

  it("ボディが64KBを超える → 413", async () => {
    const res = await POST(
      jsonRequest({ jobDescription: "あ".repeat(30_000), candidateExperience: "い".repeat(30_000) }),
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("不正なJSON → 400", async () => {
    const res = await POST(jsonRequest(null, { raw: "{not json" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("JSON以外のContent-Type → 400", async () => {
    const res = await POST(jsonRequest(validBody, { contentType: "text/plain" }));
    expect(res.status).toBe(400);
  });

  it("AI APIエラー → 503 と分かりやすいメッセージ", async () => {
    process.env.MOCK_SCENARIO = "api_error";
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.code).toBe("AI_UNAVAILABLE");
    expect(data.error.message).toContain("時間をおいて");
  });

  it("不正なAIレスポンス → 502（500で落ちない）", async () => {
    process.env.MOCK_SCENARIO = "invalid_response";
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("AI_INVALID_RESPONSE");
  });
});
