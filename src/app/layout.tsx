import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "求人マッチ分析AI｜この求人で何をアピールすべきかを整理",
  description:
    "求人票とあなたの職務経歴を入力すると、求人側が重視している点、あなたの経験との対応、不足している点、面接で聞かれそうな点をAIが整理します。登録不要・入力内容は保存しません。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
