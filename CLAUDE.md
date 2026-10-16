@AGENTS.md

# 引き継ぎメモ

複数のPCで作業しているため、Claude との会話はPC間で引き継がれない。
現状と次の作業はここに書いておき、進んだら更新する。
サービスの中身・仕組み・既知の問題は README.md を参照。

## 現状（2026-10-16 時点）

- MVP（求人票×職務経歴のマッチ分析）は実装済み。`npm test`（70件）・`npm run lint`・`npm run typecheck` はすべて通る
- **本物のAIでの動作は未検証**。これまではモック（APIキー未設定時の開発モード）でしか動かしていない
- **レート制限は未実装**（`src/lib/rate-limit.ts` は常に許可）。このまま公開するとAPI費用に上限がない

## 次にやること

1. 各PCの `.env.local` に `OPENAI_API_KEY` を設定し、実在の求人票5〜10件で出力の品質と応答時間を確認する。結果が薄ければ `OPENAI_MODEL=gpt-6.1-sol` と比べる
2. レート制限（IPごとの回数制限など）を入れる
3. Vercel などで公開し、転職活動中の知人に使ってもらってヒアリングする（README「次にやること」）

## PC間の運用

- デフォルトブランチは `claude/youthful-gates-q9ls7c`（`main` はない）
- 作業前に `git pull`、作業後に `git push`
- APIキーは各PCの `.env.local` にだけ書く（Git管理外）。PCごとに別のキーを発行する
- APIキーをチャットに貼らない
