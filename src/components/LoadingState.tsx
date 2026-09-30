export function LoadingState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
      />
      <div>
        <p className="font-semibold text-slate-900">求人票と職務経歴を分析しています</p>
        <p className="mt-1 text-sm text-slate-500">数十秒ほどかかる場合があります。このままお待ちください。</p>
      </div>
    </div>
  );
}
