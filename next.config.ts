import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

// Enforce only source-proven framing/plugin/base protections. Resource origins
// remain Report-Only pending release-time browser validation; no report sink is
// configured because reports can contain private result URLs and other data.
const resourcePolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com${isDevelopment ? " ws: wss:" : ""}`,
  "img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

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
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
          { key: "Content-Security-Policy-Report-Only", value: resourcePolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          // HSTS stays with the HTTPS edge; avoid a second policy here. Actual
          // Netlify response composition is a release-time verification item.
        ],
      },
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
      {
        source: "/account/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "Vary", value: "Cookie" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
