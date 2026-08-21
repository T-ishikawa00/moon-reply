import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MeasurementPageView } from "@/components/measurement/MeasurementPageView";
import "./globals.css";

export const metadata: Metadata = {
  title: "月の返事 | 恋のメッセージ鑑定ノート",
  description:
    "AIが恋愛メッセージと関係状況を整理し、次の一手の判断材料を鑑定ノート形式で返すサービス。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        <MeasurementPageView />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
