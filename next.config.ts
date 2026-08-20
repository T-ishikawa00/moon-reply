import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/internal/assessments": [
      "./ai/schemas/safety-assessment.schema.json",
      "./ai/schemas/decision-plan.schema.json",
      "./ai/schemas/report-content.schema.json",
      "./ai/schemas/validation-result.schema.json",
    ],
    "/api/consultations/prepare": [
      "./lib/assessment/runtime/contracts/**/*",
      "./ai/prompts/**/*",
      "./ai/schemas/**/*",
    ],
    "/api/consultations/clarifications": [
      "./lib/assessment/runtime/contracts/**/*",
      "./ai/prompts/**/*",
      "./ai/schemas/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/result/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
