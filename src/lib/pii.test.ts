import { describe, expect, it } from "vitest";

import { detectPii } from "./pii";

describe("detectPii", () => {
  it.each([
    ["連絡先: taro.yamada@example.com", "email"],
    ["携帯 090-1234-5678", "phone"],
    ["電話 03(1234)5678", "phone"],
    ["〒100-0001 東京都", "postal"],
    ["生年月日：1990年1月1日", "birthdate"],
    ["1990年4月1日生まれ", "birthdate"],
    ["番号 1234 5678 9012", "mynumber"],
    ["全角でも検知 ０９０－１２３４－５６７８", "phone"],
  ])("%s → %s", (text, kind) => {
    expect(detectPii(text)).toContain(kind);
  });

  it("電話番号を郵便番号として二重に検知しない", () => {
    expect(detectPii("携帯 090-1234-5678")).toEqual(["phone"]);
  });

  it.each([
    "マイナンバー関連システムの開発を担当",
    "生年月日などの個人情報を扱う顧客管理システムを運用",
    "2019年4月〜2023年3月 株式会社サンプル",
    "サーバー約60台、月平均5件の障害対応、作業時間を月20時間削減",
    "売上を前年比120%に改善、チーム5名",
  ])("職務内容の記述には反応しない: %s", (text) => {
    expect(detectPii(text)).toEqual([]);
  });
});
