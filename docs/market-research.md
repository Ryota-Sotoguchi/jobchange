# 市場・競合調査メモ（2026-09-30 時点）

MVP の方向性を決めるための最小限の調査。短時間で方向性をつかむことを優先し、網羅性より判断材料を重視した。
価格・機能は変わりやすいため、意思決定の前に各サービスの公式情報を再確認すること。

## 1. 競合の全体像

| 領域 | 代表的なサービス | 価格 | 主な機能 | 本サービスとの違い |
|---|---|---|---|---|
| 国内のAI書類作成ツール | RESUMY.AI、MYレジュメ、yagish、moovy「AI職務経歴書」、ビズ研の職務経歴書AI | ほぼ無料・登録不要が多い | 質問に答える／経歴を入れると職務経歴書・自己PR・志望動機の文章を生成 | 「文章を作る」ことが中心。特定の求人票に対してどの経験が効くかの分析は弱い |
| 転職媒体に付属するAI | doda（生成AIで職務内容を自動生成、2024〜）、ビズリーチ（レジュメ添削AI、2026/05〜） | 無料（会員登録が必要。会員獲得が目的） | 職務経歴の生成・改善提案、キャリアアドバイザーの添削 | 経歴そのものを磨く。個別求人との対応付けは主目的ではない |
| 海外の求人マッチ型ツール | Jobscan、Teal | Jobscan は約 $49.95/月（月5回まで無料スキャン）、Teal は有料プラン約 $9〜29/月 | 求人票と履歴書を比べて Match Rate（%）を出し、不足キーワード・スキルを指摘 | ATS（応募者管理システム）のキーワード最適化が中心で、数値スコアを出す。日本語の求人票には対応していない |
| AI面接サービス | MiAI、HRmax、Our AI面接 など | 企業向け。1面接 ¥1,000〜、または月額7.5万円〜 | 企業側がAIで面接・評価する | 採用企業向け。求職者の面接準備を支援するものではない |
| 最大の代替手段 | ChatGPT などの汎用AI + ネットで公開されているプロンプト | 無料〜 | 求人票と経歴を貼って自由に質問できる | 何をどう聞くかは利用者次第。構造化・根拠の提示・抜け漏れの防止は保証されない |

## 2. ユーザーは何にお金を払っているか

- 国内では、職務経歴書の「作成」「添削」は無料が相場になっている（媒体が会員獲得のために無償で提供している）。
- 有料で成立している例（Jobscan など）は、「応募する求人ごとに、通過の確率を上げるための具体的な修正点」にお金を払わせている。
- AIの文章をそのまま使うと採用担当者に見抜かれるという懸念が広く共有されている。「完成文をもらう」ことより「自分の言葉で書くための材料と方向性」に価値がある。

## 3. 差別化の方針（MVPに反映したこと）

1. **数値スコアを出さない「要件 ↔ 経歴の根拠」対応表**：Jobscan型の Match Rate（%）とは逆に、採用予測に見える数字を出さない。その代わり、「求人票のどの記載」と「経歴のどの記載」が対応しているかを根拠つきで示す。
2. **完成文ではなく方向性**：自己PR・志望動機は「どの経験を軸にするか」を示すにとどめ、AI文章の丸写しを避ける。
3. **面接準備まで一気通貫**：深掘りされそうな問い・聞かれる理由・準備することまで出す。
4. **登録不要・保存しない・日本語の求人票に特化**：個人情報の心理的なハードルを下げる。

## 4. 料金モデルの仮説

- 想定：Free（1回無料）／Pro（1分析 980円）の従量課金。
- 根拠：転職活動は数か月に一度で、応募先も数社〜十数社程度。月額サブスクより「応募したい求人ごとに払う」ほうが利用実態に合い、心理的なハードルも低い。
- 検証方法：MVPでは決済や支払意向の回答UIは作らない。最初のユーザーへの直接ヒアリングで「この結果に980円払うか」「払わないなら何が足りないか」を確認する。

## 5. AIモデルの比較（採用：OpenAI `gpt-6-luna`）

1分析あたり 入力約7,000トークン・出力約6,000トークン、1ドル=150円で概算。価格は 1Mトークンあたりの 入力 / 出力。

| 提供元 | モデル | 価格 | 1分析あたり | 備考 |
|---|---|---|---|---|
| OpenAI | GPT-6 Luna（`gpt-6-luna`） | $0.10 / $0.50 | 約¥0.5 | 2026/09/22 公開。**採用** |
| OpenAI | GPT-5.6 Luna | $0.20 / $1.20 | 約¥1.3 | 旧世代 |
| Google | Gemini 3.1 Flash-Lite | $0.25 / $1.50 | 約¥1.6 | |
| Google | Gemini 3.5 Flash-Lite | $0.30 / $2.50 | 約¥2.6 | Googleが新規利用に推奨 |
| Google | Gemini 3.8 Flash | $0.75 / $3.75 | 約¥4 | 2026/12/31までの導入価格（2027/01〜 $1.50 / $7.50） |
| Anthropic | Claude Haiku 4.5 | $1 / $5 | 約¥5.5 | |
| OpenAI | GPT-6.1 Sol / GPT-6 Sol | $2 / $10 | 約¥11 | 品質が足りない場合の切り替え先候補 |
| Anthropic | Claude Sonnet 5.5 | $2 / $10 | 約¥11 | |
| Google | Gemini 3.1 Pro | $2 / $12 | 約¥13 | |
| Anthropic | Claude Opus 5.5 | $4 / $20 | 約¥22 | |
| OpenAI / Anthropic | GPT-6 Astra / Claude Fable 5.1 | $10 / $50 | 約¥55 | 最上位 |

- 採用理由：最安で、同じSDKのまま `OPENAI_MODEL` を変えるだけで上位モデル（`gpt-6.1-sol`）に切り替えられる。
- 注意：小型モデルのため、日本語の細かな読み解きの質は実際の求人票で確認が必要。質が足りなければ上位モデルに切り替える（1分析あたり約¥11でも、¥980の価格設定に対して十分に余裕がある）。
- Gemini は無料枠のデータが製品改善に使われうるため、個人情報を扱う本サービスでは使うなら有料枠が前提。

## 出典

- [職務経歴書AI自動作成ツールおすすめ7選（AI相談ラボ）](https://craftai.jp/ai-powered-resume-creation-tool/)
- [RESUMY.AI、全ての機能を無料提供（PR TIMES）](https://prtimes.jp/main/html/rd/p/000000033.000115507.html)
- [MYレジュメ](https://myresume-ai.jp/)
- [職務経歴書作成AI（ビズ研）](https://biztemplatelab.com/tools/syokumu_keirekisyo_ai/)
- [doda、生成AIによる職務内容の自動生成機能を搭載（パーソルキャリア）](https://www.persol-career.co.jp/newsroom/news/service/2024/20240424_1441/)
- [ビズリーチ、「レジュメ添削AI機能」を提供開始](https://www.bizreach.co.jp/pressroom/pressrelease/2026/0520.html)
- [Jobscan vs. Teal（Jobscan）](https://www.jobscan.co/blog/jobscan-vs-teal/)
- [When do I get my free monthly scans?（Jobscan）](https://support.jobscan.co/hc/en-us/articles/360056018654-When-do-I-get-my-free-monthly-scans)
- [AI面接サービスおすすめ比較15選（JAPAN AI ラボ）](https://japan-ai.co.jp/media/8194/)
- [ChatGPTで職務経歴書・履歴書の自己PRを仕上げる方法（マイナビ転職）](https://tenshoku.mynavi.jp/knowhow/trend/30/)
- [Pricing（OpenAI API）](https://developers.openai.com/api/docs/pricing)
- [Introducing GPT-6 Sol and Luna（OpenAI）](https://openai.com/index/introducing-gpt-6-sol-and-luna/)
- [OpenAI launches GPT-6.1 Sol（TechCrunch）](https://techcrunch.com/2026/09/29/openai-launches-gpt-6-1-sol-says-it-nearly-matches-gpt-6-astra-and-costs-less/)
- [Gemini Developer API pricing（Google）](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini Models（Google）](https://ai.google.dev/gemini-api/docs/models)
