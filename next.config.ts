import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/internal/assessments": [
      "./ai/schemas/safety-assessment.schema.json",
      "./ai/schemas/decision-plan.schema.json",
      "./ai/schemas/report-content.schema.json",
      "./ai/schemas/validation-result.schema.json",
    ],
  },
};

export default nextConfig;
