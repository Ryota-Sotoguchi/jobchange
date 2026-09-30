import { describe, expect, it } from "vitest";

import { INPUT_LIMITS, countChars, normalizeInput, validateAnalyzeInput } from "./validation";

const validJob = "求".repeat(INPUT_LIMITS.jobDescription.min);
const validExperience = "経".repeat(INPUT_LIMITS.candidateExperience.min);

describe("validateAnalyzeInput", () => {
  it("正常な入力を受け付け、前後の空白と改行コードを正規化する", () => {
    const result = validateAnalyzeInput({
      jobDescription: `  ${validJob}\r\n`,
      candidateExperience: `${validExperience}\r\n2行目`,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.jobDescription).toBe(validJob);
      expect(result.value.candidateExperience).toBe(`${validExperience}\n2行目`);
    }
  });

  it("両方空ならそれぞれにエラーを返す", () => {
    const result = validateAnalyzeInput({ jobDescription: "", candidateExperience: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.jobDescription).toContain("求人票を入力してください");
      expect(result.fields.candidateExperience).toContain("職務経歴・スキルを入力してください");
    }
  });

  it("求人票なし → 求人票のみエラー", () => {
    const result = validateAnalyzeInput({ candidateExperience: validExperience });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.jobDescription).toBeDefined();
      expect(result.fields.candidateExperience).toBeUndefined();
    }
  });

  it("職務経歴なし → 職務経歴のみエラー", () => {
    const result = validateAnalyzeInput({ jobDescription: validJob, candidateExperience: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.jobDescription).toBeUndefined();
      expect(result.fields.candidateExperience).toBeDefined();
    }
  });

  it("空白・改行のみは未入力として扱う", () => {
    const result = validateAnalyzeInput({ jobDescription: " \n\t ", candidateExperience: "　\n" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.jobDescription).toContain("入力してください");
      expect(result.fields.candidateExperience).toContain("入力してください");
    }
  });

  it("極端に短い入力は最小文字数を案内する", () => {
    const result = validateAnalyzeInput({ jobDescription: "エンジニア募集", candidateExperience: "営業3年" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.jobDescription).toContain(`${INPUT_LIMITS.jobDescription.min}文字以上`);
      expect(result.fields.candidateExperience).toContain(
        `${INPUT_LIMITS.candidateExperience.min}文字以上`,
      );
    }
  });

  it("上限ちょうどは受け付け、1文字でも超えたらエラー", () => {
    const max = INPUT_LIMITS.jobDescription.max;
    expect(
      validateAnalyzeInput({ jobDescription: "あ".repeat(max), candidateExperience: validExperience }).ok,
    ).toBe(true);

    const over = validateAnalyzeInput({
      jobDescription: "あ".repeat(max + 1),
      candidateExperience: validExperience,
    });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.fields.jobDescription).toContain("10,000文字以内");
  });

  it("文字列以外や不正なボディを拒否する", () => {
    expect(validateAnalyzeInput(null).ok).toBe(false);
    expect(validateAnalyzeInput("text").ok).toBe(false);
    expect(validateAnalyzeInput({ jobDescription: 123, candidateExperience: ["a"] }).ok).toBe(false);
  });
});

describe("countChars / normalizeInput", () => {
  it("絵文字などのサロゲートペアを1文字として数える", () => {
    expect(countChars("😀a")).toBe(2);
  });

  it("CRLF/CR を LF に統一する", () => {
    expect(normalizeInput("a\r\nb\rc")).toBe("a\nb\nc");
  });
});
