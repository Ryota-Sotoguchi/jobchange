import type { Analysis } from "./schema";

/**
 * APIキー未設定時（開発モード）に返すモック結果。sample.ts のサンプル入力に対応した内容。
 * MOCK_SCENARIO でエラー系の表示確認もできる。
 */

export const MOCK_SCENARIOS = ["success", "api_error", "invalid_response", "slow"] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function resolveMockScenario(value: string | undefined): MockScenario {
  return (MOCK_SCENARIOS as readonly string[]).includes(value ?? "")
    ? (value as MockScenario)
    : "success";
}

export const MOCK_ANALYSIS: Analysis = {
  input_check: { sufficient: true, notes: [] },
  summary:
    "この求人では、あなたの「Linuxサーバー（RHEL）の約5年の運用経験」「夜間障害の一次対応と再発防止策の報告」「AWS移行プロジェクトでのEC2・RDS・CloudWatchの構築経験」が特に関連しています。一方、「Terraform等によるインフラのコード化」と「コンテナ（Docker／ECS）の運用」については、入力された経歴からは具体的な経験が確認できません。AWSの利用期間が約1年である点は、担当範囲を具体的に示すことで補足できる余地があります。",
  job_requirements: [
    {
      requirement: "Linuxサーバーの構築・運用経験（3年以上）",
      importance: "high",
      source_quote: "Linux サーバーの構築・運用経験 3年以上",
    },
    {
      requirement: "AWS上のサービス基盤の運用経験",
      importance: "high",
      source_quote: "AWS（EC2、RDS、ECS、CloudWatch 等）上のサービス基盤の運用・構築",
    },
    {
      requirement: "障害対応とポストモーテムの実施",
      importance: "high",
      source_quote: "監視設計、障害対応、ポストモーテムの実施",
    },
    {
      requirement: "Python／シェルスクリプトによる運用自動化",
      importance: "medium",
      source_quote: "Python／シェルスクリプトによる運用作業の自動化",
    },
    {
      requirement: "TerraformによるIaC・CI/CDの改善",
      importance: "medium",
      source_quote: "Terraform によるインフラのコード化、CI/CD パイプラインの改善",
    },
    {
      requirement: "コンテナ（Docker／ECS）の運用",
      importance: "low",
      source_quote: "コンテナ（Docker／ECS）の運用経験",
    },
    {
      requirement: "開発チームと連携して改善を進める姿勢",
      importance: "medium",
      source_quote: "開発メンバーと積極的にコミュニケーションを取れる方",
    },
  ],
  matches: [
    {
      requirement: "Linuxサーバーの構築・運用経験（3年以上）",
      status: "strong",
      evidence: "RHELサーバー約60台の構築、パッチ適用、ログ監視、バックアップ運用（約5年）",
      reason: "必須要件の年数を満たしており、構築から日常運用まで一通りの経験が書かれています。",
    },
    {
      requirement: "AWS上のサービス基盤の運用経験",
      status: "related",
      evidence: "2025年〜 AWS移行プロジェクトでEC2・RDSの構築、CloudWatchのアラート設定を担当",
      reason:
        "AWSの構築経験はありますが期間が約1年で、移行後の運用をどこまで担当したかが読み取れないため「関連」としています。",
    },
    {
      requirement: "障害対応とポストモーテムの実施",
      status: "strong",
      evidence: "夜間障害の一次対応（月平均5件程度）、原因調査と再発防止策の報告書作成",
      reason: "障害対応に加え、再発防止策の報告書作成はポストモーテムの考え方に近い経験です。",
    },
    {
      requirement: "Python／シェルスクリプトによる運用自動化",
      status: "strong",
      evidence: "定型作業をシェルスクリプトで自動化し、作業時間を月20時間削減",
      reason: "自動化の対象と効果が数字で示されており、求人の業務内容と直接対応しています。",
    },
    {
      requirement: "TerraformによるIaC・CI/CDの改善",
      status: "unclear",
      evidence: "",
      reason: "Terraform等のIaCツールやCI/CDに関する記載が経歴に見当たりません。",
    },
    {
      requirement: "コンテナ（Docker／ECS）の運用",
      status: "unclear",
      evidence: "",
      reason: "DockerやECSの利用経験に関する記載がありません。",
    },
    {
      requirement: "開発チームと連携して改善を進める姿勢",
      status: "related",
      evidence: "運用チーム5名のサブリーダーとして新人教育と手順書整備を担当",
      reason:
        "チーム内での改善経験はありますが、開発チームなど他部署と協力した経験は明記されていません。",
    },
  ],
  strengths_to_emphasize: [
    {
      experience: "シェルスクリプトによる定型作業の自動化（月20時間削減）",
      related_requirement: "Python／シェルスクリプトによる運用自動化",
      reason:
        "求人の「課題を自ら見つけ、仕組みで解決する」という人物像と、成果の数字が結びつく経験です。",
      how_to_write:
        "「何が手作業で負担だったか」「なぜ自動化しようと考えたか」「どう実装したか」「削減時間以外の効果（ミス減少など）」を1〜2行ずつ書くと、自発性と仕組み化の姿勢が伝わりやすくなります。",
    },
    {
      experience: "夜間障害の一次対応と再発防止策の報告書作成",
      related_requirement: "障害対応とポストモーテムの実施",
      reason: "必須要件の「障害対応の経験」に直接対応し、再発防止まで行っている点が強みです。",
      how_to_write:
        "単に「障害対応を担当」と書くより、代表的な障害を1つ取り上げ、検知から原因特定・恒久対策までの流れと、自分が担った役割を書くと、対応力の具体像が伝わります。",
    },
    {
      experience: "AWS移行プロジェクトでのEC2・RDS構築とCloudWatchアラート設定",
      related_requirement: "AWS上のサービス基盤の運用経験",
      reason: "求人で挙げられているAWSサービスと重なっており、期間の短さを内容で補える経験です。",
      how_to_write:
        "移行対象のシステム規模、自分が設計から担当した部分、設定したアラートの考え方（何を・どの閾値で監視したか）を具体的に書くと、運用目線でAWSを扱えることが伝わります。",
    },
  ],
  gaps_or_unclear_points: [
    {
      point: "Terraform等によるインフラのコード化",
      type: "not_found",
      reason: "歓迎要件に挙げられていますが、IaCツールの利用経験は経歴から確認できません。",
      suggestion:
        "手順書整備や構成管理で近い取り組みがあれば書き足してください。未経験の場合は、学習中の内容や、手作業の構築で感じた課題とIaCへの関心を面接で説明できるよう準備しておくと話しやすくなります。",
    },
    {
      point: "コンテナ（Docker／ECS）の運用",
      type: "not_found",
      reason: "歓迎要件ですが、コンテナに関する記載がありません。",
      suggestion:
        "個人での学習や検証環境での利用経験があれば、業務外であることを明記したうえで補足できます。",
    },
    {
      point: "AWS環境の運用期間と担当範囲",
      type: "lacks_detail",
      reason: "AWSの経験が約1年で、構築後の運用（監視・障害対応・コスト管理など）をどこまで担当したかが読み取れません。",
      suggestion:
        "移行後に運用も担当しているなら、その内容を分けて書くと、必須要件の「AWSを利用したシステムの運用経験」との対応がはっきりします。",
    },
    {
      point: "開発チームとの協業経験",
      type: "indirect",
      reason: "チーム内のリーダー経験はありますが、求人が求める開発メンバーとの連携とは直接対応していません。",
      suggestion:
        "リリース対応やアプリ側の担当者と調整した場面があれば、その経験を具体的に書き足すと対応関係を伝えやすくなります。",
    },
  ],
  interview_points: [
    {
      question: "AWS移行プロジェクトでは、具体的にどこからどこまでを担当しましたか？",
      intent: "AWSの経験期間が短いため、実際の担当範囲と理解度を確認されやすい点です。",
      preparation: "構成図を簡単に説明できるようにし、自分が判断・設計した部分と指示を受けて作業した部分を分けて話せるようにしておきます。",
    },
    {
      question: "印象に残っている障害対応と、そのときの対応の流れを教えてください。",
      intent: "必須要件の障害対応について、判断力や再発防止の考え方を確認するためです。",
      preparation: "検知・一次対応・原因調査・恒久対策・報告の流れで、1件を時系列に説明できるよう整理しておきます。",
    },
    {
      question: "運用作業の自動化で、どのような課題をどう改善しましたか？",
      intent: "求める人物像の「仕組みで解決する」姿勢を確かめる質問です。",
      preparation: "自動化前の状態、選んだ方法の理由、効果（月20時間削減）を簡潔に話せるようにしておきます。",
    },
    {
      question: "TerraformやコンテナなどIaC・コンテナ技術の経験はありますか？",
      intent: "歓迎要件に対して、経歴から経験が確認できないためです。",
      preparation: "経験の有無を正直に伝えたうえで、学習状況や、手作業の運用で感じた課題とのつながりを話せるようにしておきます。",
    },
    {
      question: "SIerから自社サービスの運用に移りたい理由は何ですか？",
      intent: "働く環境が変わるため、動機と期待のずれがないかを確認されやすい点です。",
      preparation: "受託の運用で感じたことと、自社サービスで継続的に改善に関わりたい理由を、具体的な経験と結びつけて話せるようにしておきます。",
    },
  ],
  self_pr_direction: [
    {
      axis: "運用の手間を仕組みで減らしてきた経験",
      detail:
        "シェルスクリプトによる自動化（月20時間削減）を中心に据え、障害の再発防止策の報告など「同じ問題を繰り返さない工夫」を組み合わせると、求人の人物像と一貫した自己PRになります。",
    },
    {
      axis: "安定運用を支えてきた実務の厚み",
      detail:
        "約60台・約5年のLinux運用と月平均5件程度の障害対応を土台として示し、そのうえでAWS移行に取り組んでいることを「今後の伸びしろ」として添える構成が考えられます。",
    },
  ],
  motivation_direction: [
    {
      job_element: "自社SaaSのインフラを継続的に改善できる環境",
      your_connection:
        "受託の運用で自動化や再発防止に取り組んできた経験から、サービスに長く関わり改善を積み重ねたいという動機につなげられます。",
    },
    {
      job_element: "AWS・Terraformなどモダンな運用技術",
      your_connection:
        "AWS移行プロジェクトへの参加と資格取得を、クラウド中心の運用へ軸足を移したいという意欲の具体的な根拠として示せます。",
    },
    {
      job_element: "開発チームと連携した性能改善・リリースプロセスの整備",
      your_connection:
        "手順書整備や新人教育でチームの運用品質を上げてきた経験を、開発と運用の橋渡しに活かしたいという方向で接続できます。",
    },
  ],
};
