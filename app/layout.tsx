import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "月の返事 | 恋のメッセージ鑑定ノート",
  description:
    "返信待ち、追いメッセージ、曖昧な関係で不安になる夜に。送る前に読む、恋のメッセージ鑑定ノート。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
