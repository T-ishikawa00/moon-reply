import { NextResponse } from "next/server";

export function customerAuthJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });
}
