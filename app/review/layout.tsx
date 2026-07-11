import type { ReactNode } from "react";
import { ReviewBanner } from "@/components/review/ReviewBanner";

export default function ReviewLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <ReviewBanner />
      {children}
    </>
  );
}
