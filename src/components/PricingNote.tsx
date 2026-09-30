/** 将来の料金モデルの静的表示。決済機能はない。 */
export function PricingNote() {
  return (
    <section aria-labelledby="pricing-heading" className="rounded-xl border border-slate-200 p-5 sm:p-6">
      <h3 id="pricing-heading" className="text-base font-semibold text-slate-900">
        料金について（予定）
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        現在はテスト公開中のため無料でご利用いただけます。正式版では以下の料金を予定しています。
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Free</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">1回無料</p>
          <p className="mt-1 text-sm text-slate-500">まずは1件の求人でお試し</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            Pro
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">準備中</span>
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            980円<span className="text-sm font-medium text-slate-500"> / 1分析</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">応募したい求人ごとに分析</p>
        </div>
      </div>
    </section>
  );
}
