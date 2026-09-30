/**
 * 個人情報らしき文字列の簡易検知。送信はブロックせず、入力欄の下に警告を出すためだけに使う。
 * 誤検知・見逃しはありうる前提の「気づき」を与える仕組み。
 */

export type PiiKind = "email" | "phone" | "postal" | "birthdate" | "mynumber";

const PII_LABELS: Record<PiiKind, string> = {
  email: "メールアドレス",
  phone: "電話番号",
  postal: "郵便番号",
  birthdate: "生年月日",
  mynumber: "マイナンバー",
};

const PII_PATTERNS: Array<{ kind: PiiKind; pattern: RegExp }> = [
  { kind: "email", pattern: /[\w.+-]+@[\w-]+(\.[\w-]+)+/ },
  // 携帯・固定電話（ハイフンあり/なし）。例: 090-1234-5678, 03-1234-5678, 09012345678
  { kind: "phone", pattern: /(?<!\d)0\d{1,4}[-(（ ]?\d{1,4}[-)） ]?\d{3,4}(?!\d)/ },
  // 電話番号の一部（090-1234-5678 の 090-1234）に反応しないよう、前後のハイフンも除外する
  { kind: "postal", pattern: /〒\s?\d{3}-?\d{4}|(?<![\d-])\d{3}-\d{4}(?![\d-])/ },
  // 「生年月日を扱うシステム」のような職務内容には反応させない
  {
    kind: "birthdate",
    pattern: /生年月日\s*[:：]|(19|20)\d{2}\s*[年/.-]\s*\d{1,2}\s*[月/.-]\s*\d{1,2}\s*日?\s*生/,
  },
  // 12桁の数字のみ（「マイナンバー関連システム」等の語には反応させない）
  { kind: "mynumber", pattern: /(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/ },
];

export function detectPii(text: string): PiiKind[] {
  const normalized = text.normalize("NFKC");
  return PII_PATTERNS.filter(({ pattern }) => pattern.test(normalized)).map(
    ({ kind }) => kind,
  );
}

export function piiLabel(kind: PiiKind): string {
  return PII_LABELS[kind];
}
