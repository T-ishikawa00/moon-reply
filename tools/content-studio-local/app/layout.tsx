import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../../../app/globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Studio Local | 月の返事",
  description: "Synthetic marketing cases only. Local development use only.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: "no-referrer",
};

export default function ContentStudioLocalLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
