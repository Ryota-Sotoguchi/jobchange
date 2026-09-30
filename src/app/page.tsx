import { Analyzer } from "@/components/Analyzer";

const OUTPUTS = [
  "求人側が重視しているポイント",
  "あなたの経験とのマッチ・不足",
  "応募書類で強調すべき経験",
  "面接で聞かれそうなこと",
];

export default function Home() {
  return (
    <>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <span className="text-base font-bold text-slate-900">求人マッチ分析AI</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">β</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
        <section className="py-10 sm:py-14">
          <h1 className="text-2xl font-bold leading-snug text-slate-900 sm:text-4xl sm:leading-tight">
            <span className="inline-block">この求人で、</span>
            <span className="inline-block">あなたの経歴の</span>
            <br className="hidden sm:inline" />
            <span className="inline-block">どこをアピールすべきかが分かる</span>
          </h1>
          <p className="phrase-wrap mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            求人票とあなたの職務経歴を入力すると、「この求人で何をアピールすべきか」をAIが整理します。
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {OUTPUTS.map((item) => (
              <li
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <Analyzer />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs leading-relaxed text-slate-500 sm:px-6">
          <p>
            本サービスの分析は、入力された情報と求人情報をもとにした情報整理・応募準備の支援を目的としています。採用結果を保証するものではありません。
          </p>
          <p>入力内容は分析のためにOpenAIのAPIへ送信されます。本サービスでは入力内容を保存しません。</p>
          <p>© 求人マッチ分析AI（仮称）</p>
        </div>
      </footer>
    </>
  );
}
