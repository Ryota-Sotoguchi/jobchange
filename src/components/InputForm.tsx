"use client";

import { useMemo } from "react";

import { detectPii, piiLabel } from "@/lib/pii";
import {
  INPUT_LIMITS,
  countChars,
  type AnalyzeInput,
  type InputField,
} from "@/lib/validation";

type Props = {
  values: AnalyzeInput;
  fieldErrors: Partial<Record<InputField, string>>;
  disabled: boolean;
  onChange: (field: InputField, value: string) => void;
  onSubmit: () => void;
  onFillSample: () => void;
};

const FIELDS: Array<{ field: InputField; placeholder: string; hint: string }> = [
  {
    field: "jobDescription",
    placeholder: "応募したい求人票を貼り付けてください",
    hint: "仕事内容・必須要件・歓迎要件・求める人物像などを、求人サイトからそのまま貼り付けてください。",
  },
  {
    field: "candidateExperience",
    placeholder: "これまでの仕事内容、経験、スキル、実績などを入力してください",
    hint: "職務経歴書の内容をそのまま貼り付けても構いません。担当範囲や規模、成果が書かれているほど具体的に分析できます。",
  },
];

export function InputForm({ values, fieldErrors, disabled, onChange, onSubmit, onFillSample }: Props) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <div
        role="note"
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
      >
        <p className="font-semibold">個人を特定できる情報は入力しないでください。</p>
        <p className="mt-1">
          {"氏名・住所・電話番号・メールアドレス・生年月日・マイナンバーなどは不要です。会社名やプロジェクト名も必要に応じて伏せて構いません。" +
            "入力内容は分析のためにOpenAIのAPIへ送信されますが、本サービスでは保存しません。"}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onFillSample}
          disabled={disabled}
          className="text-sm font-medium text-blue-700 underline-offset-4 hover:underline disabled:opacity-50"
        >
          サンプルを入力して試す
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {FIELDS.map(({ field, placeholder, hint }) => (
          <TextField
            key={field}
            field={field}
            value={values[field]}
            placeholder={placeholder}
            hint={hint}
            error={fieldErrors[field]}
            disabled={disabled}
            onChange={(value) => onChange(field, value)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto sm:min-w-80"
        >
          {disabled ? "分析中…" : "求人との相性を分析する"}
        </button>
        <p className="text-xs text-slate-500">登録不要・無料でお試しいただけます</p>
      </div>
    </form>
  );
}

type TextFieldProps = {
  field: InputField;
  value: string;
  placeholder: string;
  hint: string;
  error: string | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
};

function TextField({ field, value, placeholder, hint, error, disabled, onChange }: TextFieldProps) {
  const { label, max } = INPUT_LIMITS[field];
  const length = countChars(value);
  const overLimit = length > max;
  const pii = useMemo(() => detectPii(value), [value]);
  const id = `field-${field}`;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-base font-semibold text-slate-900">
        {label}
      </label>
      <p id={`${id}-hint`} className="mt-1 text-sm leading-relaxed text-slate-500">
        {hint}
      </p>
      <textarea
        id={id}
        name={field}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error) || overLimit}
        aria-describedby={`${id}-hint ${id}-count${error ? ` ${id}-error` : ""}`}
        className={`mt-3 min-h-64 w-full resize-y rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 lg:min-h-96 ${
          error || overLimit
            ? "border-red-400 focus:ring-red-200"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
        }`}
      />
      <div className="mt-2 flex items-start justify-between gap-3 text-sm">
        <div className="space-y-1">
          {error && (
            <p id={`${id}-error`} className="text-red-700">
              {error}
            </p>
          )}
          {pii.length > 0 && (
            <p className="text-amber-800">
              {pii.map(piiLabel).join("・")}らしき記載があります。個人を特定できる情報は削除してから分析してください。
            </p>
          )}
        </div>
        <p
          id={`${id}-count`}
          className={`shrink-0 tabular-nums ${overLimit ? "font-semibold text-red-700" : "text-slate-500"}`}
        >
          {length.toLocaleString("ja-JP")} / {max.toLocaleString("ja-JP")}文字
        </p>
      </div>
    </div>
  );
}
