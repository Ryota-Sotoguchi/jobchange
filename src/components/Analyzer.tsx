"use client";

import { useEffect, useRef, useState } from "react";

import type { AnalyzeSuccessResponse } from "@/lib/analysis/schema";
import { SAMPLE_CANDIDATE_EXPERIENCE, SAMPLE_JOB_DESCRIPTION } from "@/lib/analysis/sample";
import { errorMessage, isErrorCode, type ErrorCode } from "@/lib/errors";
import { validateAnalyzeInput, type AnalyzeInput, type InputField } from "@/lib/validation";
import { AnalysisResult } from "./AnalysisResult";
import { InputForm } from "./InputForm";
import { LoadingState } from "./LoadingState";

// サーバー側の上限（120秒）より少し長く待つ
const CLIENT_TIMEOUT_MS = 130_000;

type Status = "idle" | "loading" | "success" | "error";
type FieldErrors = Partial<Record<InputField, string>>;

export function Analyzer() {
  const [values, setValues] = useState<AnalyzeInput>({
    jobDescription: "",
    candidateExperience: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<AnalyzeSuccessResponse | null>(null);
  const [error, setError] = useState<{ code: ErrorCode; message: string } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // 分析開始・完了時に結果エリアへスクロール
  useEffect(() => {
    if (status === "idle") return;
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status]);

  function handleChange(field: InputField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleFillSample() {
    const hasInput = values.jobDescription.trim() || values.candidateExperience.trim();
    if (hasInput && !window.confirm("入力中の内容をサンプルで置き換えますか？")) return;
    setValues({
      jobDescription: SAMPLE_JOB_DESCRIPTION,
      candidateExperience: SAMPLE_CANDIDATE_EXPERIENCE,
    });
    setFieldErrors({});
  }

  function handleEdit() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit() {
    if (status === "loading") return;

    const validation = validateAnalyzeInput(values);
    if (!validation.ok) {
      setFieldErrors(validation.fields);
      const firstInvalid = (Object.keys(validation.fields) as InputField[])[0];
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }

    setFieldErrors({});
    setError(null);
    setResponse(null);
    setStatus("loading");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
        signal: controller.signal,
      });
      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const body = (data as { error?: { code?: unknown; message?: unknown; fields?: FieldErrors } })
          ?.error;
        const code: ErrorCode = isErrorCode(body?.code) ? body.code : "AI_ERROR";
        if (body?.fields) setFieldErrors(body.fields);
        setError({
          code,
          message: typeof body?.message === "string" ? body.message : errorMessage(code),
        });
        setStatus("error");
        return;
      }

      const success = data as AnalyzeSuccessResponse | null;
      if (!success || typeof success.result !== "object" || success.result === null) {
        setError({ code: "AI_INVALID_RESPONSE", message: errorMessage("AI_INVALID_RESPONSE") });
        setStatus("error");
        return;
      }

      setResponse(success);
      setStatus("success");
    } catch (e) {
      const code: ErrorCode =
        e instanceof DOMException && e.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
      setError({ code, message: errorMessage(code) });
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    <div className="space-y-10">
      <div ref={formRef} className="scroll-mt-4">
        <InputForm
          values={values}
          fieldErrors={fieldErrors}
          disabled={status === "loading"}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onFillSample={handleFillSample}
        />
      </div>

      <div ref={outputRef} className="scroll-mt-4" aria-live="polite">
        {status === "loading" && <LoadingState />}

        {status === "error" && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
          >
            <p className="font-semibold">分析できませんでした</p>
            <p className="mt-1 leading-relaxed">{error.message}</p>
            {error.code !== "VALIDATION_ERROR" && error.code !== "PAYLOAD_TOO_LARGE" && (
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 font-medium text-red-900 hover:bg-red-100"
              >
                もう一度試す
              </button>
            )}
          </div>
        )}

        {status === "success" && response && (
          <AnalysisResult result={response.result} mode={response.mode} onEdit={handleEdit} />
        )}
      </div>
    </div>
  );
}
