import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ReviewBanner } from "@/components/review/ReviewBanner";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ReviewLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <ReviewBanner />
      {children}
    </>
  );
}
