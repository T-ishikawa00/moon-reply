import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "月の返事 | 恋のメッセージ鑑定ノート",
  description:
    "AIが恋愛メッセージと関係状況を整理し、次の一手の判断材料を鑑定ノート形式で返すサービス。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
