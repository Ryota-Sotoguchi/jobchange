import type { ReactNode } from "react";

import type {
  Analysis,
  AnalysisMode,
  GapType,
  Importance,
  MatchStatus,
} from "@/lib/analysis/schema";
import { PricingNote } from "./PricingNote";

type Props = {
  result: Analysis;
  mode: AnalysisMode;
  onEdit: () => void;
};

const IMPORTANCE_LABEL: Record<Importance, { text: string; className: string }> = {
  high: { text: "重視度：高", className: "bg-slate-900 text-white" },
  medium: { text: "重視度：中", className: "bg-slate-200 text-slate-800" },
  low: { text: "重視度：低", className: "bg-slate-100 text-slate-600" },
};

const STATUS_LABEL: Record<MatchStatus, { text: string; className: string }> = {
  strong: { text: "強く関連", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  related: { text: "関連", className: "bg-blue-100 text-blue-800 ring-blue-200" },
  unclear: { text: "情報不足", className: "bg-slate-100 text-slate-700 ring-slate-200" },
};

const GAP_LABEL: Record<GapType, string> = {
  not_found: "経験が確認できない",
  lacks_detail: "具体性が不足",
  indirect: "直接は対応しない",
};

export function AnalysisResult({ result, mode, onEdit }: Props) {
  const statusCounts = result.matches.reduce<Record<MatchStatus, number>>(
    (acc, match) => ({ ...acc, [match.status]: acc[match.status] + 1 }),
    { strong: 0, related: 0, unclear: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">分析結果</h2>
        {mode === "mock" && (
          <p className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-900">
            開発モード：APIキーが未設定のため、サンプルのモック結果を表示しています（入力内容は反映されていません）。
          </p>
        )}
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
          本サービスの分析は、入力された情報と求人情報をもとにした情報整理・応募準備の支援を目的としています。採用結果を保証するものではありません。
        </p>
      </div>

      <Section number={1} title="総合マッチ概要">
        {(!result.input_check.sufficient || result.input_check.notes.length > 0) && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">入力内容についての注意</p>
            <BulletList
              items={
                result.input_check.notes.length > 0
                  ? result.input_check.notes
                  : ["入力された情報が少ないため、分析の精度が低い可能性があります。"]
              }
              className="mt-1"
            />
          </div>
        )}
        <p className="leading-relaxed text-slate-800">{result.summary}</p>
      </Section>

      <Section
        number={2}
        title="求人側が重視していそうなポイント"
        description="求人票の記載から読み取れる要素です。"
      >
        <ItemList empty={result.job_requirements.length === 0}>
          {result.job_requirements.map((item, index) => (
            <li key={index} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={IMPORTANCE_LABEL[item.importance].className}>
                  {IMPORTANCE_LABEL[item.importance].text}
                </Badge>
                <span className="font-medium text-slate-900">{item.requirement}</span>
              </div>
              {item.source_quote && (
                <p className="mt-1 text-sm text-slate-500">求人票：「{item.source_quote}」</p>
              )}
            </li>
          ))}
        </ItemList>
      </Section>

      <Section
        number={3}
        title="あなたとのマッチ"
        description={`強く関連 ${statusCounts.strong}件 ・ 関連 ${statusCounts.related}件 ・ 情報不足 ${statusCounts.unclear}件`}
      >
        <ItemList empty={result.matches.length === 0}>
          {result.matches.map((item, index) => (
            <li key={index} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`ring-1 ring-inset ${STATUS_LABEL[item.status].className}`}>
                  {STATUS_LABEL[item.status].text}
                </Badge>
                <span className="font-medium text-slate-900">{item.requirement}</span>
              </div>
              <dl className="mt-2 space-y-1 text-sm leading-relaxed">
                <div>
                  <dt className="inline font-medium text-slate-600">経歴の根拠：</dt>
                  <dd className="inline text-slate-800">
                    {item.evidence || "入力された経歴からは確認できませんでした"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-600">理由：</dt>
                  <dd className="inline text-slate-800">{item.reason}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ItemList>
      </Section>

      <Section number={4} title="アピールすべき経験" description="応募書類で強調すると、求人との対応関係が伝わりやすい経験です。">
        <ItemList empty={result.strengths_to_emphasize.length === 0}>
          {result.strengths_to_emphasize.map((item, index) => (
            <li key={index} className="py-4 first:pt-0 last:pb-0">
              <p className="font-semibold text-slate-900">{item.experience}</p>
              <p className="mt-1 text-sm text-slate-500">関連する求人の要素：{item.related_requirement}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">{item.reason}</p>
              <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950">
                <span className="font-semibold">書き方のヒント：</span>
                {item.how_to_write}
              </div>
            </li>
          ))}
        </ItemList>
      </Section>

      <Section
        number={5}
        title="弱い／不足しているポイント"
        description="不足＝不採用という意味ではありません。入力された情報から確認できない、または弱い要素です。"
      >
        <ItemList empty={result.gaps_or_unclear_points.length === 0}>
          {result.gaps_or_unclear_points.map((item, index) => (
            <li key={index} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-100 text-amber-900">{GAP_LABEL[item.type]}</Badge>
                <span className="font-medium text-slate-900">{item.point}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">{item.reason}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-medium">対応の方向性：</span>
                {item.suggestion}
              </p>
            </li>
          ))}
        </ItemList>
      </Section>

      <Section number={6} title="面接で確認・説明されそうなポイント">
        <ItemList empty={result.interview_points.length === 0}>
          {result.interview_points.map((item, index) => (
            <li key={index} className="py-4 first:pt-0 last:pb-0">
              <p className="font-semibold text-slate-900">Q. {item.question}</p>
              <dl className="mt-2 space-y-1 text-sm leading-relaxed">
                <div>
                  <dt className="inline font-medium text-slate-600">聞かれそうな理由：</dt>
                  <dd className="inline text-slate-800">{item.intent}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-600">準備しておくこと：</dt>
                  <dd className="inline text-slate-800">{item.preparation}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ItemList>
      </Section>

      <Section number={7} title="自己PRの方向性" description="完成文ではなく、どの経験を軸に組み立てるかの方向性です。">
        <ItemList empty={result.self_pr_direction.length === 0}>
          {result.self_pr_direction.map((item, index) => (
            <li key={index} className="py-3 first:pt-0 last:pb-0">
              <p className="font-semibold text-slate-900">{item.axis}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{item.detail}</p>
            </li>
          ))}
        </ItemList>
      </Section>

      <Section number={8} title="志望動機の方向性" description="求人票の要素と、あなたの経験・関心のつなげ方です。">
        <ItemList empty={result.motivation_direction.length === 0}>
          {result.motivation_direction.map((item, index) => (
            <li key={index} className="py-3 first:pt-0 last:pb-0">
              <p className="font-semibold text-slate-900">{item.job_element}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">→ {item.your_connection}</p>
            </li>
          ))}
        </ItemList>
      </Section>

      <PricingNote />

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          入力を修正して再分析する
        </button>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
        >
          {number}
        </span>
        {title}
      </h3>
      {description && <p className="mt-1 text-sm text-slate-500 sm:pl-10">{description}</p>}
      <div className="mt-4 sm:pl-10">{children}</div>
    </section>
  );
}

function ItemList({ empty, children }: { empty: boolean; children: ReactNode }) {
  if (empty) {
    return <p className="text-sm text-slate-500">該当する項目はありませんでした。</p>;
  }
  return <ul className="divide-y divide-slate-100">{children}</ul>;
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function BulletList({ items, className = "" }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={`list-disc space-y-0.5 pl-5 ${className}`}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
