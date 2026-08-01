import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const r1C1R1BaselineSha = "bdc98af2c7c59a1d7ececa2077906c8fbb839ac9";
const r1C1R1CorrectionBaselineSha =
  "28bedad969d1007bbd731f0e9d47824eecd84651";
const r1C1R1AcceptedImplementationSha =
  "d8415e2ae165143d646c6f9573e24752d8b1a1c7";
const r1C1R1AcceptanceSha =
  "277101219c27477e67e1196af0e6067713571edc";
const r1C1R2PackageSha =
  "d0ad3eceb130a806b2c2b06cb1a59dbbaa35bf4e";
const r1C1R2ResultSha =
  "7239f50fd24eb80369e74583cd619c2155813401";
const r1C1R2ReviewSha =
  "2c3f9e8a4b1c763a2d7d56d367cf16dc4993aca6";
const r1C1R2R1AcceptedImplementationSha =
  "378c304c45b85cf419d263204e495f2d800a8bc9";
const r1C1R2R1AcceptedAcceptanceSha =
  "fbb315f45e777fe2001e54657d7015ebbf7d3663";
const r1C1R2R2PackageSha =
  "36e7d1967a502f0ed80aaccb12d44507f0058560";
const r1C1R2R2ResultSha =
  "2cb243486063ba9235f4f3ce65f051cf5fd38d6e";
const r1C1R2R2ReviewSha =
  "33a91f00be9f71fa533c9635d30425dc23914d81";
const r1C1R2R2R1AcceptedImplementationSha =
  "b65af5303d0f1514742b794a00ce35f5c4a99bf4";
const r1C1R1ImplementationCommits = [
  "715fd906ad94ecc18b55dd13b16784c26bf12129",
  "28bedad969d1007bbd731f0e9d47824eecd84651",
  r1C1R1AcceptedImplementationSha,
];
const r1C1R1CapabilityManifestPath =
  "evals/runtime/m2-p4-i3-r1-c1-r1/capabilities-v1.json";
const exactR1C1R1Paths = [
  "lib/assessment/runtime/contracts/writing-signals-v1.ts",
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v5.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
  "lib/assessment/runtime/writing-signals-grounding-v1.ts",
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "lib/assessment/runtime/structured-intake-grounding-v5.ts",
  "lib/assessment/runtime/writing-context-integrity-v2.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r1/postmortem-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r1/responsibility-matrix-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r1/replay-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r1/capabilities-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/validation.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1C1R1CorrectionPaths = [
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "scripts/lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs",
  "evals/runtime/m2-p4-i3-r1-c1-r1/replay-results-v1.json",
  r1C1R1CapabilityManifestPath,
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1C1R1AcceptanceSyncPaths = [
  r1C1R1CapabilityManifestPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1C1R2CapabilityManifestPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2/capabilities-v1.json";
const r1C1R2AuthorizationPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2/authorization-v1.json";
const r1C1R2ResultsPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-results-v1.json";
const exactR1C1R2Paths = [
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/quality-contract-v1.json",
  r1C1R2AuthorizationPath,
  r1C1R2CapabilityManifestPath,
  r1C1R2ResultsPath,
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1C1R2ReviewSyncPaths = [
  r1C1R2CapabilityManifestPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1C1R2R1CapabilityManifestPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2-r1/capabilities-v1.json";
const exactR1C1R2R1Paths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r1/semantic-consistency-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r1/offline-analysis-v1.json",
  r1C1R2R1CapabilityManifestPath,
  "scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R1_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1C1R2R1AcceptanceSyncPaths = [
  r1C1R2R1CapabilityManifestPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1C1R2R2CapabilityManifestPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/capabilities-v1.json";
const r1C1R2R2AuthorizationPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/authorization-v1.json";
const r1C1R2R2ResultsPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-results-v1.json";
const exactR1C1R2R2Paths = [
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/quality-contract-v1.json",
  r1C1R2R2AuthorizationPath,
  r1C1R2R2CapabilityManifestPath,
  r1C1R2R2ResultsPath,
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1C1R2R2ReviewSyncPaths = [
  r1C1R2R2CapabilityManifestPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1C1R2R2R1CapabilityManifestPath =
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/capabilities-v1.json";
const exactR1C1R2R2R1Paths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/practical-reason-consistency-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/offline-analysis-v1.json",
  r1C1R2R2R1CapabilityManifestPath,
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_R1_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1C1R2R2R1AcceptanceSyncPaths = [
  r1C1R2R2R1CapabilityManifestPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_R1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "72d4121ff4ad0682bcafbeed4f72f6491e697ffa";
const i1bBaselineSha =
  "554d2cb5a2f816ac82edf3cc247458fe34a4a74c";
const i1bAcceptedImplementationSha =
  "9588c8fd6ab47c265f5f661d4473a29d73885427";
const i1cBaselineSha =
  "c27120eea067f91c5e9ef4447e382f55a329e158";
const i1cAcceptedImplementationSha =
  "b523349ec33c36a90c645d4a1b7a6d37832af151";
const i2BaselineSha =
  "20d4178e3a63026128f3a25d052196c7161e7e27";
const i2AcceptedImplementationSha =
  "410714875903ae61b5bcdc6cce90030f5679b3b3";
const i3BaselineSha =
  "61e33a10e195fad17e253a6b9719217e1992f273";
const i2ExactPaths = [
  "app/review/runtime/i2/page.tsx",
  "lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts",
  "evals/runtime/m2-p4-i2-field-disposition-v1.json",
  "evals/runtime/m2-p4-i2-capabilities-v1.json",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "docs/phase2/TASK_M2_P4_I2_REVIEW.md",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/globals.css",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
];
const i2AcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i2-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I2_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
];
const i3ExactPaths = [
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "evals/runtime/m2-p4-i3-quality-contract-v1.json",
  "evals/runtime/m2-p4-i3-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "docs/phase2/TASK_M2_P4_I3_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const i3ImplementationSha = "c85d6d122ad71569532a55887b9a3b6d93f8a288";
const layer1PlanningSha = "ec7cd53884ab4056c78d2596c609baef5701274a";
const acceptedPlanningSha = "3c64e5e2179b4c03979119068716326337a002c6";
const r1aBaselineSha = "e5cfd903740267db6d070964a9ec72a7d823f310";
const r1aFirstImplementationSha =
  "3ba1d2aab4d3af5cb30e95b5c5c12c0f0eb2e19a";
const r1aAcceptedImplementationSha =
  "8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd";
const exactPlanningAcceptanceSyncPaths = [
  "docs/phase2/M2_P4_I3_R1_INTERACTION_RELATIONSHIP_VOICE_FINAL_PLAN.md",
  "docs/phase2/TASK_M2_P4_I3_R1_FINAL_PLANNING_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1APaths = [
  "lib/assessment/runtime/contracts/writing-context-v1.ts",
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "evals/runtime/m2-p4-i3-r1-a-schema-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1AAcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1bBaselineSha = "2381312ced5fc726dfa245632c25da6bb68a376f";
const r1bFirstImplementationSha =
  "0ccf59114fe4079e0a5513fef3faf1b9fade11e7";
const r1bAcceptedImplementationSha =
  "4a1237ac647bff79229d7181d978d5613c2c3b87";
const exactR1BPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
  "lib/assessment/runtime/structured-intake-grounding-v4.ts",
  "lib/assessment/runtime/writing-context-integrity-v1.ts",
  "lib/assessment/runtime/structured-intake-legacy-view-v3.ts",
  "evals/runtime/m2-p4-i3-r1-b-grounding-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-runtime-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1BReviewCorrectionPaths = [
  "lib/assessment/runtime/writing-context-integrity-v1.ts",
  "evals/runtime/m2-p4-i3-r1-b-grounding-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-runtime-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1BAcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const c1BaselineSha = "76c469db264cd1cb9434b6a19ec5c75db5754a2a";
const c1ResultCommitSha = "7b0c1b6da5d877f7a7a6de5be431276452e3b8b2";
const exactC1Paths = [
  "scripts/lib/m2-p4-i3-r1-c1-provider-runner.mjs",
  "scripts/lib/m2-p4-i3-r1-c1-evaluator.mjs",
  "scripts/run-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-summary-v1.md",
  "evals/runtime/m2-p4-i3-r1-c1/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactC1ReviewSyncPaths = [
  "evals/runtime/m2-p4-i3-r1-c1/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const i1cImplementationPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "lib/assessment/runtime/contextual-inference-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const i1cAcceptedStackPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "lib/assessment/runtime/change-condition-grounding-v3.ts",
  "lib/assessment/runtime/contextual-inference-v3.ts",
  "lib/assessment/runtime/contextual-integrity-v3.ts",
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/report-grounding-v3.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/semantic-disposition-v3.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/structured-intake-grounding-v3.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
];
const failures = new Map();

const gateOrder = [
  "M2_P3_RUNTIME_CAPABILITY_GATE",
  "M2_P3_INTERNAL_ROUTE_GATE",
  "M2_P3_PRODUCTION_DISABLE_GATE",
  "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
  "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
  "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
  "M2_P3_PROVIDER_DIAGNOSTIC_GATE",
  "M2_P3_STORE_FALSE_GATE",
  "M2_P3_SUPABASE_SERVER_ONLY_GATE",
  "M2_P3_RLS_GATE",
  "M2_P3_DATABASE_SCHEMA_GATE",
  "M2_P3_IDEMPOTENCY_GATE",
  "M2_P3_PIPELINE_ORDER_GATE",
  "M2_P3_SAFETY_GATE",
  "M2_P3_DECISION_POLICY_GATE",
  "M2_P3_STAGE_PERSISTENCE_GATE",
  "M2_P3_FAIL_CLOSED_GATE",
  "M2_P3_NO_RETRY_GATE",
  "M2_P3_NO_REPAIR_GATE",
  "M2_P3_NO_FALLBACK_GATE",
  "M2_P3_USAGE_LEDGER_GATE",
  "M2_P3_FAKE_RUNTIME_GATE",
  "M2_P3_ZERO_LIVE_NETWORK_GATE",
  "M2_P3_ZERO_SPEND_GATE",
  "M2_P3_PUBLIC_PRODUCT_UNCHANGED_GATE",
  "M2_P3_I2_RENDERER_ONLY_GATE",
  "M2_P3_DEPENDENCY_AUDIT_GATE",
  "M2_P3_PRODUCTION_VULNERABILITY_GATE",
  "M2_P3_SUPABASE_DEPENDENCY_GATE",
  "M2_P3_ATOMIC_FINALIZATION_GATE",
  "M2_P3_FINALIZATION_ROLLBACK_GATE",
  "M2_P3_CONCURRENT_IDEMPOTENCY_GATE",
  "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
  "M2_P3_R1_RUNTIME_HARDENING_GATE",
];

for (const gateName of gateOrder) failures.set(gateName, []);

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function check(gateName, condition, detail) {
  if (!condition) failures.get(gateName).push(detail);
}

function gate(gateName, verification) {
  try {
    verification();
  } catch (error) {
    failures
      .get(gateName)
      .push(error instanceof Error ? error.message : String(error));
  }
}

function gitText(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function historicalPaths(startCommit, endCommit) {
  return gitText(["diff", "--name-only", startCommit, endCommit, "--"])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function currentTaskPaths(startCommit) {
  const paths = new Set(
    gitText(["diff", "--name-only", startCommit, "--"])
      .split(/\r?\n/gu)
      .map((item) => item.trim().replaceAll("\\", "/"))
      .filter(Boolean),
  );
  const status = gitText([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  for (const line of status.split(/\r?\n/gu).filter(Boolean)) {
    let item = line.slice(3).trim();
    if (item.includes(" -> ")) item = item.split(" -> ").at(-1);
    paths.add(item.replaceAll("\\", "/"));
  }
  return [...paths].sort((left, right) => left.localeCompare(right, "en"));
}

function isExactLiteralSet(paths, expectedPaths) {
  return (
    paths.length === expectedPaths.length &&
    new Set(paths).size === expectedPaths.length &&
    paths.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        !item.includes("*") &&
        !item.endsWith("/"),
    ) &&
    JSON.stringify(paths) === JSON.stringify([...expectedPaths].sort((left, right) => left.localeCompare(right, "en")))
  );
}

function deterministicUuidFactory(initialSequence = 0) {
  let sequence = initialSequence;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

const [
  { AssessmentApplication },
  {
    FakeAiStageTransport,
    FakeAssessmentRepository,
    needsMoreInformationStageOutputs,
    safetyBlockedStageOutputs,
    wait003StageOutputs,
  },
  {
    loadCanonicalStageCatalog,
    loadM2P4ContextualRuntimeStageCatalog,
    loadM2P4RuntimeStageCatalog,
  },
  {
    createOpenAiProviderFailureDiagnostic,
  },
  {
    OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS,
    OPENAI_NULLABLE_FIELD_MAPPINGS,
    OpenAIStructuredOutputSchemaError,
    assertOpenAIStructuredOutputSchema,
    toOpenAiStructuredOutputSchema,
  },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-diagnostics.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
]);

const canonicalCatalog = await loadCanonicalStageCatalog();
const catalog = await loadM2P4RuntimeStageCatalog();
const contextualCatalog = await loadM2P4ContextualRuntimeStageCatalog();
const waitDecisionFacts = {
  schema_version: "m2-p4-decision-facts-v1",
  relationship_stage: "in_relationship",
  selected_requests: ["decide_send_or_wait", "message_impact"],
  latest_direct_message: {
    sender: "user",
    kind: "other",
    response_expectation: "optional",
    user_reply_state: "not_applicable",
    sns_signal_only: false,
  },
  contact_state: {
    unanswered_user_message_count: 1,
    elapsed_since_latest_user_message_minutes: 120,
    usual_cadence_relation: "within_usual",
    proposed_message_present: true,
  },
  boundary_state: {
    kind: "none",
    status: "none",
    repeated_unanswered_contact: false,
  },
  practical_reason: {
    kind: "none",
    active: false,
    deadline: "none",
  },
  information_state: {
    complete_for_decision: true,
  },
};
const wait003Input = {
  currentSituation:
    "交際中です。2時間前に、最近寂しいと感じていることを長めのメッセージで送りました。まだ返信はありません。",
  optionalMessage:
    "怒ってる？さっきの重かったよね、ごめん。何か言ってほしい。",
  relationship: "in_relationship",
  requestedTopics: ["decide_send_or_wait", "message_impact"],
  privacyAcknowledged: true,
};

function asM2P4RuntimeOutputs(outputs) {
  const runtimeOutputs = structuredClone(outputs);
  const structuredIntake = runtimeOutputs["PB-01"];
  if (
    !structuredIntake ||
    Object.keys(structuredIntake).length === 1
  ) {
    runtimeOutputs["PB-01"] = {
      schema_version: "pipeline-schema-v2.0.0",
    };
    return runtimeOutputs;
  }
  const ordinaryReady =
    runtimeOutputs["PB-03"]?.eligibility === "ready" &&
    runtimeOutputs["PB-02"]?.classification === "normal_allowed";
  runtimeOutputs["PB-01"] = {
    ...structuredIntake,
    schema_version: "pipeline-schema-v2.0.0",
    decision_facts: ordinaryReady ? waitDecisionFacts : null,
  };
  return runtimeOutputs;
}

function makeApplication({
  outputs,
  repository = new FakeAssessmentRepository(),
  transportOptions = {},
  trace = [],
  uuid = deterministicUuidFactory(),
} = {}) {
  const transport = new FakeAiStageTransport({
    outputs: asM2P4RuntimeOutputs(outputs ?? wait003StageOutputs()),
    ...transportOptions,
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    observe: (event) => trace.push(event),
    now: () => "2026-07-29T00:00:00.000Z",
    uuid,
  });
  return { application, repository, transport, trace };
}

async function expectSafeFailure(application, expectedCode, key) {
  try {
    await application.submit(wait003Input, key);
    assert.fail(`expected ${expectedCode}`);
  } catch (error) {
    assert.equal(error?.safeCode, expectedCode);
  }
}

const happy = makeApplication();
const happyResult = await happy.application.submit(
  wait003Input,
  "10000000-0000-4000-8000-000000000001",
);
assert.equal(happyResult.eligibility, "ready");

const expectedTrace = [
  "PB-01",
  "LOCAL_SCHEMA_PB-01",
  "PB-02",
  "LOCAL_SCHEMA_PB-02",
  "PB-03",
  "LOCAL_SCHEMA_PB-03",
  "LOCAL_SAFETY_AGGREGATION",
  "LOCAL_ELIGIBILITY_GATE",
  "LOCAL_DECISION_POLICY",
  "PB-04",
  "LOCAL_SCHEMA_AND_PLAN_VALIDATION",
  "PB-05",
  "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
  "PB-06",
  "LOCAL_SEMANTIC_DISPOSITION",
  "SAVE_FINAL_REPORT",
  "COMPLETE_RUN",
];

const duplicate = await happy.application.submit(
  wait003Input,
  "10000000-0000-4000-8000-000000000001",
);

const needsMore = makeApplication({
  outputs: needsMoreInformationStageOutputs(),
});
const needsMoreResult = await needsMore.application.submit(
  wait003Input,
  "20000000-0000-4000-8000-000000000001",
);

const safetyBlocked = makeApplication({
  outputs: safetyBlockedStageOutputs(),
});
const safetyBlockedResult = await safetyBlocked.application.submit(
  wait003Input,
  "30000000-0000-4000-8000-000000000001",
);

const schemaFailureOutputs = wait003StageOutputs();
schemaFailureOutputs["PB-01"] = {
  schema_version: "pipeline-schema-v1.0.0",
};
const schemaFailure = makeApplication({ outputs: schemaFailureOutputs });
await expectSafeFailure(
  schemaFailure.application,
  "M2_STAGE_SCHEMA_INVALID",
  "40000000-0000-4000-8000-000000000001",
);

const modelMismatch = makeApplication({
  transportOptions: {
    returnedModelAtStage: { "PB-02": "unexpected-model" },
  },
});
await expectSafeFailure(
  modelMismatch.application,
  "M2_STAGE_MODEL_MISMATCH",
  "50000000-0000-4000-8000-000000000001",
);

const databaseFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "completeStage:PB-03",
  }),
});
await expectSafeFailure(
  databaseFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "60000000-0000-4000-8000-000000000001",
);

const pb05Failure = makeApplication({
  transportOptions: { failAtStage: "PB-05" },
});
await expectSafeFailure(
  pb05Failure.application,
  "M2_FAKE_STAGE_FAILURE",
  "70000000-0000-4000-8000-000000000001",
);

const reportInsertFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "finalizeCompletedAssessment:reportInsert",
  }),
});
await expectSafeFailure(
  reportInsertFailure.application,
  "M2_FINALIZATION_PERSISTENCE_FAILED",
  "71000000-0000-4000-8000-000000000001",
);

const runUpdateFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "finalizeCompletedAssessment:runUpdate",
  }),
});
await expectSafeFailure(
  runUpdateFailure.application,
  "M2_FINALIZATION_PERSISTENCE_FAILED",
  "72000000-0000-4000-8000-000000000001",
);

const finalizedRecord = [...happy.repository.reports.values()][0];
assert.ok(finalizedRecord);
let duplicateFinalizationCode = null;
try {
  await happy.repository.finalizeCompletedAssessment(finalizedRecord);
} catch (error) {
  duplicateFinalizationCode = error?.safeCode ?? null;
}

const concurrent = makeApplication();
const concurrentResults = await Promise.allSettled([
  concurrent.application.submit(
    wait003Input,
    "73000000-0000-4000-8000-000000000001",
  ),
  concurrent.application.submit(
    wait003Input,
    "73000000-0000-4000-8000-000000000001",
  ),
]);

const createRequestFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "createRequest",
  }),
});
await expectSafeFailure(
  createRequestFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "74000000-0000-4000-8000-000000000001",
);

const createRunFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "createRun",
  }),
});
await expectSafeFailure(
  createRunFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "75000000-0000-4000-8000-000000000001",
);

const firstStageStartFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "startStage:PB-01",
  }),
});
await expectSafeFailure(
  firstStageStartFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "76000000-0000-4000-8000-000000000001",
);

const resubmissionRepository = new FakeAssessmentRepository();
const failedSubmission = makeApplication({
  repository: resubmissionRepository,
  transportOptions: { failAtStage: "PB-05" },
  uuid: deterministicUuidFactory(100),
});
await expectSafeFailure(
  failedSubmission.application,
  "M2_FAKE_STAGE_FAILURE",
  "77000000-0000-4000-8000-000000000001",
);
const sameKeyAfterFailure = makeApplication({
  repository: resubmissionRepository,
  uuid: deterministicUuidFactory(200),
});
await expectSafeFailure(
  sameKeyAfterFailure.application,
  "M2_DUPLICATE_SUBMISSION",
  "77000000-0000-4000-8000-000000000001",
);
const deliberateResubmission = makeApplication({
  repository: resubmissionRepository,
  uuid: deterministicUuidFactory(300),
});
const deliberateResubmissionResult =
  await deliberateResubmission.application.submit(
    wait003Input,
    "78000000-0000-4000-8000-000000000001",
  );

const runtimeManifest = json(
  "evals/runtime/m2-p3-runtime-capabilities-v1.json",
);
const i1bRuntimeManifest = json(
  "evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json",
);
const i1cRuntimeManifest = json(
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
);
const i2RuntimeManifest = json(
  "evals/runtime/m2-p4-i2-capabilities-v1.json",
);
const i3RuntimeManifest = json(
  "evals/runtime/m2-p4-i3-capabilities-v1.json",
);
const dependencyAuditSummary = json(
  "evals/runtime/m2-p3-a-dependency-audit-summary-v1.json",
);
const packageManifest = json("package.json");
const packageLock = json("package-lock.json");
const dependencyReviewSource = source(
  "docs/phase2/M2_P3_A_DEPENDENCY_SECURITY_REVIEW.md",
);
const routeSource = source("app/api/internal/assessments/route.ts");
const pageSource = source("app/review/runtime/page.tsx");
const i2PageSource = source("app/review/runtime/i2/page.tsx");
const i2FixtureSource = source(
  "lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts",
);
const i2NoteSource = source("components/runtime/RuntimeAssessmentNote.tsx");
const environmentSource = source("lib/assessment/runtime/environment.ts");
const transportSource = source(
  "lib/assessment/runtime/openai-transport.ts",
);
const diagnosticSource = source(
  "lib/assessment/runtime/openai-diagnostics.ts",
);
const repositorySource = source(
  "lib/assessment/runtime/supabase-repository.ts",
);
const pipelineSource = source("lib/assessment/runtime/pipeline.ts");
const applicationSource = source("lib/assessment/runtime/application.ts");
const policySource = source("lib/assessment/runtime/policy.ts");
const policyV2Source = source("lib/assessment/runtime/policy-v2.ts");
const fakeSource = source("lib/assessment/runtime/fakes.ts");
const migrationSource = source(
  "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
);
const atomicMigrationSource = source(
  "supabase/migrations/0003_m2_p3_atomic_finalization.sql",
);
const runtimePackageSource = source(
  "lib/assessment/runtime/package.json",
);
gate("M2_P3_RUNTIME_CAPABILITY_GATE", () => {
  const i1bSnapshot = i1bRuntimeManifest.implementation_snapshot;
  const i1cSnapshot = i1cRuntimeManifest.implementation_snapshot;
  const lowercaseShaPattern = /^[0-9a-f]{40}$/u;
  const declaredI1bPaths = [...i1bRuntimeManifest.implementation_paths].sort();
  const historicalI1bPaths = gitText([
    "diff",
    "--name-only",
    i1bSnapshot.base_commit_sha,
    i1bSnapshot.end_commit_sha,
    "--",
  ])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort();
  gitText(["cat-file", "-e", `${i1bSnapshot.base_commit_sha}^{commit}`]);
  gitText(["cat-file", "-e", `${i1bSnapshot.end_commit_sha}^{commit}`]);
  gitText([
    "merge-base",
    "--is-ancestor",
    i1bSnapshot.base_commit_sha,
    i1bSnapshot.end_commit_sha,
  ]);
  gitText([
    "merge-base",
    "--is-ancestor",
    i1bSnapshot.end_commit_sha,
    "HEAD",
  ]);
  const declaredI1cPaths = [...i1cRuntimeManifest.implementation_paths].sort();
  const declaredI1cAcceptedStackPaths = [
    ...i1cRuntimeManifest.accepted_stack_paths,
  ].sort();
  const historicalI1cAcceptedStackPaths = gitText([
    "diff",
    "--name-only",
    i1cSnapshot.base_commit_sha,
    i1cSnapshot.end_commit_sha,
    "--",
  ])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort();
  gitText(["cat-file", "-e", `${i1cSnapshot.base_commit_sha}^{commit}`]);
  gitText(["cat-file", "-e", `${i1cSnapshot.end_commit_sha}^{commit}`]);
  gitText([
    "merge-base",
    "--is-ancestor",
    i1cSnapshot.base_commit_sha,
    i1cSnapshot.end_commit_sha,
  ]);
  gitText([
    "merge-base",
    "--is-ancestor",
    i1cSnapshot.end_commit_sha,
    "HEAD",
  ]);
  check(
    "M2_P3_RUNTIME_CAPABILITY_GATE",
    runtimeManifest.task_id === "M2-P3-A" &&
      runtimeManifest.baseline.commit === baselineSha &&
      Object.values(runtimeManifest.enabled_capabilities).every(Boolean) &&
      Object.values(runtimeManifest.disabled_capabilities).every(
        (value) => value === false,
      ),
    "M2-P3 successor capability manifest differs",
  );
  check(
    "M2_P3_RUNTIME_CAPABILITY_GATE",
    runtimeManifest.historical_snapshots.length >= 3,
    "historical capability snapshots are not preserved explicitly",
  );
  check(
    "M2_P3_RUNTIME_CAPABILITY_GATE",
    canonicalCatalog.promptBundleVersion === "prompt-bundle-v1.0.0" &&
      canonicalCatalog.schemaSetVersion === "pipeline-schema-v1.0.0" &&
      catalog.promptBundleVersion === "prompt-bundle-runtime-v2.0.0" &&
      catalog.schemaSetVersion === "pipeline-schema-runtime-v2.0.0" &&
      contextualCatalog.promptBundleVersion ===
        "prompt-bundle-runtime-v3.0.0" &&
      contextualCatalog.schemaSetVersion ===
        "pipeline-schema-runtime-v3.0.0" &&
      i1cRuntimeManifest.task_id === "M2-P4-I1-C" &&
      i1cRuntimeManifest.status === "human_chatgpt_accepted_complete" &&
      i1cRuntimeManifest.accepted_implementation_commit ===
        i1cAcceptedImplementationSha &&
      i1cRuntimeManifest.baseline.commit === i1cBaselineSha &&
      JSON.stringify(i1cSnapshot) ===
        JSON.stringify({
          type: "historical_commit_range",
          base_commit_sha: i1cBaselineSha,
          end_commit_sha: i1cAcceptedImplementationSha,
          include_working_tree: false,
          immutable_snapshot: true,
        }) &&
      lowercaseShaPattern.test(i1cSnapshot.base_commit_sha) &&
      lowercaseShaPattern.test(i1cSnapshot.end_commit_sha) &&
      i1cRuntimeManifest.implementation_paths.length === 21 &&
      new Set(i1cRuntimeManifest.implementation_paths).size === 21 &&
      i1cRuntimeManifest.implementation_paths.every(
        (item) =>
          typeof item === "string" &&
          item.length > 0 &&
          !item.includes("*") &&
          !item.endsWith("/"),
      ) &&
      JSON.stringify(declaredI1cPaths) ===
        JSON.stringify([...i1cImplementationPaths].sort()) &&
      i1cRuntimeManifest.accepted_stack_paths.length === 27 &&
      new Set(i1cRuntimeManifest.accepted_stack_paths).size === 27 &&
      i1cRuntimeManifest.accepted_stack_paths.every(
        (item) =>
          typeof item === "string" &&
          item.length > 0 &&
          !item.includes("*") &&
          !item.endsWith("/"),
      ) &&
      JSON.stringify(declaredI1cAcceptedStackPaths) ===
        JSON.stringify([...i1cAcceptedStackPaths].sort()) &&
      JSON.stringify(historicalI1cAcceptedStackPaths) ===
        JSON.stringify(declaredI1cAcceptedStackPaths) &&
      Object.values(i1cRuntimeManifest.task_execution_evidence).every(
        (value) => value === 0 || value === false,
      ) &&
      i1bRuntimeManifest.task_id === "M2-P4-I1-B" &&
      i1bRuntimeManifest.status === "human_chatgpt_accepted_complete" &&
      i1bRuntimeManifest.accepted_implementation_commit ===
        i1bAcceptedImplementationSha &&
      i1bRuntimeManifest.baseline.commit === i1bBaselineSha &&
      JSON.stringify(i1bSnapshot) ===
        JSON.stringify({
          type: "historical_commit_range",
          base_commit_sha: i1bBaselineSha,
          end_commit_sha: i1bAcceptedImplementationSha,
          include_working_tree: false,
          immutable_snapshot: true,
        }) &&
      lowercaseShaPattern.test(i1bSnapshot.base_commit_sha) &&
      lowercaseShaPattern.test(i1bSnapshot.end_commit_sha) &&
      i1bRuntimeManifest.implementation_paths.length === 16 &&
      new Set(i1bRuntimeManifest.implementation_paths).size === 16 &&
      i1bRuntimeManifest.implementation_paths.every(
        (item) =>
          typeof item === "string" &&
          item.length > 0 &&
          !item.includes("*") &&
          !item.endsWith("/"),
      ) &&
      JSON.stringify(historicalI1bPaths) ===
        JSON.stringify(declaredI1bPaths),
    "M2-P4 I1-B/I1-C successor boundaries are not exact or a historical catalog changed",
  );
});

gate("M2_P3_INTERNAL_ROUTE_GATE", () => {
  for (const required of [
    'export async function POST',
    '"idempotency-key"',
    "maximumBodyBytes",
    "allowedFields",
    "privacyAcknowledged",
    "validateOrigin",
  ]) {
    check(
      "M2_P3_INTERNAL_ROUTE_GATE",
      routeSource.includes(required),
      `route is missing ${required}`,
    );
  }
});

gate("M2_P3_PRODUCTION_DISABLE_GATE", () => {
  check(
    "M2_P3_PRODUCTION_DISABLE_GATE",
    environmentSource.includes('process.env.NODE_ENV !== "production"') &&
      environmentSource.includes(
        'process.env.M2_INTERNAL_RUNTIME_ENABLED === "true"',
      ) &&
      pageSource.includes('process.env.NODE_ENV === "production"') &&
      pageSource.includes("notFound()"),
    "development-only fail-closed boundary differs",
  );
});

gate("M2_P3_SERVER_SECRET_BOUNDARY_GATE", () => {
  const secretSources = [
    environmentSource,
    transportSource,
    repositorySource,
    source("lib/assessment/runtime/service.ts"),
  ].join("\n");
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    secretSources.match(/import "server-only";/gu)?.length === 4,
    "live secret owners are not server-only fenced",
  );
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    ![
      routeSource,
      source("components/runtime/RuntimeAssessmentForm.tsx"),
      source("components/runtime/RuntimeAssessmentNote.tsx"),
    ]
      .join("\n")
      .includes("OPENAI_API_KEY"),
    "browser or route code names the OpenAI secret",
  );
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    !source(".env.example").includes("sk-") &&
      !source(".env.example").includes("service_role") &&
      source(".gitignore").includes(".env.local"),
    "environment example or ignore contract is unsafe",
  );
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    !secretSources.includes("console."),
    "runtime logs secret-owner state",
  );
});

gate("M2_P3_OPENAI_REQUEST_CONTRACT_GATE", () => {
  for (const required of [
    "this.client.responses.create",
    "service_tier: \"default\"",
    "truncation: \"disabled\"",
    "effort: \"low\"",
    "type: \"json_schema\"",
    "strict: true",
    "tools: []",
    "stream: false",
    "background: false",
  ]) {
    check(
      "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
      transportSource.includes(required),
      `OpenAI contract is missing ${required}`,
    );
  }
  check(
    "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
    !transportSource.includes("previous_response_id") &&
      !transportSource.includes("conversation:"),
    "stateful Responses field is present",
  );
});

gate("M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE", () => {
  const projectedSchemas = catalog.definitions.map((definition) => ({
    stageId: definition.stageId,
    schema: toOpenAiStructuredOutputSchema(definition.outputSchema),
  }));
  const projectedJson = JSON.stringify(projectedSchemas);
  const canonicalJson = JSON.stringify(
    catalog.definitions.map((definition) => definition.outputSchema),
  );

  const validRoot = (properties = {}) => ({
    type: "object",
    properties,
    additionalProperties: false,
    required: Object.keys(properties),
  });
  const schemaViolation = (schema) => {
    try {
      assertOpenAIStructuredOutputSchema(schema);
      return null;
    } catch (error) {
      return error;
    }
  };
  const expectViolation = (schema, schemaPath, violatedRule) => {
    const error = schemaViolation(schema);
    return (
      error instanceof OpenAIStructuredOutputSchemaError &&
      error.schemaPath === schemaPath &&
      error.violatedRule === violatedRule &&
      error.message === `${schemaPath}: ${violatedRule}` &&
      Object.keys(error).every((key) =>
        ["name", "schemaPath", "violatedRule"].includes(key),
      )
    );
  };

  const nestedObjectWithoutAdditionalProperties = validRoot({
    nested: {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
    },
  });
  const nestedObjectWithIncompleteRequired = validRoot({
    nested: {
      type: "object",
      properties: {
        first: { type: "string" },
        second: { type: "string" },
      },
      additionalProperties: false,
      required: ["first"],
    },
  });
  const objectWithExtraRequiredKey = {
    type: "object",
    properties: { value: { type: "string" } },
    additionalProperties: false,
    required: ["value", "not_a_property"],
  };
  const rootAnyOf = {
    ...validRoot(),
    anyOf: [validRoot()],
  };
  const nestedAllOf = validRoot({
    value: { allOf: [{ type: "string" }] },
  });
  const nestedOneOf = validRoot({
    value: { oneOf: [{ type: "string" }, { type: "null" }] },
  });
  const arrayWithUniqueItems = validRoot({
    values: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
    },
  });
  const arrayWithPrefixItems = validRoot({
    values: {
      type: "array",
      items: { type: "string" },
      prefixItems: [{ type: "string" }],
    },
  });
  const validNestedAnyOf = validRoot({
    value: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
  });
  const validDefinitionReference = {
    ...validRoot({
      item: { $ref: "#/$defs/item" },
    }),
    $defs: {
      item: {
        type: "object",
        properties: { value: { type: "string" } },
        additionalProperties: false,
        required: ["value"],
      },
    },
  };
  const invalidReferenceSibling = {
    ...validRoot({
      item: {
        $ref: "#/$defs/item",
        type: "object",
      },
    }),
    $defs: {
      item: {
        type: "object",
        properties: {},
        additionalProperties: false,
        required: [],
      },
    },
  };

  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    expectViolation(
      nestedObjectWithoutAdditionalProperties,
      "#/properties/nested/additionalProperties",
      "object additionalProperties must be false",
    ) &&
      expectViolation(
        nestedObjectWithIncompleteRequired,
        "#/properties/nested/required",
        "object required must contain every properties key",
      ) &&
      expectViolation(
        objectWithExtraRequiredKey,
        "#/required",
        "object required must contain no extra keys",
      ) &&
      expectViolation(
        rootAnyOf,
        "#/anyOf",
        "root schema must not use anyOf",
      ) &&
      expectViolation(
        nestedAllOf,
        "#/properties/value/allOf",
        "allOf is prohibited",
      ) &&
      expectViolation(
        nestedOneOf,
        "#/properties/value/oneOf",
        "oneOf is prohibited",
      ) &&
      expectViolation(
        arrayWithUniqueItems,
        "#/properties/values/uniqueItems",
        "uniqueItems is prohibited",
      ) &&
      expectViolation(
        arrayWithPrefixItems,
        "#/properties/values/prefixItems",
        "prefixItems is prohibited",
      ),
    "provider schema validator missed a prohibited schema shape",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    schemaViolation(validNestedAnyOf) === null &&
      schemaViolation(validDefinitionReference) === null &&
      expectViolation(
        invalidReferenceSibling,
        "#/properties/item/type",
        "$ref must not have sibling validation keywords",
      ),
    "provider schema validator rejected a valid anyOf/ref or allowed ref siblings",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    projectedSchemas.every(({ schema }) => schemaViolation(schema) === null),
    "an actual PB-01 through PB-06 provider schema is invalid",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    canonicalJson.includes('"uniqueItems":true') &&
      !OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS.some((keyword) =>
        projectedJson.includes(`${JSON.stringify(keyword)}:`),
      ) &&
      !projectedJson.includes('"items":false'),
    "provider schemas contain an unsupported Structured Outputs keyword",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    transportSource.includes(
      "toOpenAiStructuredOutputSchema(",
    ) &&
      transportSource.includes("assertOpenAIStructuredOutputSchema(") &&
      transportSource.indexOf("assertOpenAIStructuredOutputSchema(") <
        transportSource.indexOf("this.client.responses.create") &&
      transportSource.includes(
        "logDevelopmentOpenAIStructuredOutputSchemaFailure(error)",
      ) &&
      transportSource.includes(
        'throw new M2RuntimeError("M2_STAGE_PROVIDER_FAILED")',
      ) &&
      source("lib/assessment/runtime/openai-schema.ts").includes(
        '"M2_OPENAI_SCHEMA_CONFIGURATION_INVALID"',
      ) &&
      source("lib/assessment/runtime/openai-schema.ts").includes(
        "schemaPath: error.schemaPath",
      ) &&
      source("lib/assessment/runtime/openai-schema.ts").includes(
        "violatedRule: error.violatedRule",
      ) &&
      source("lib/assessment/runtime/validation.ts").includes(
        "ajv.compile(definition.outputSchema)",
      ),
    "provider projection or canonical AJV validation is missing",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    JSON.stringify(OPENAI_NULLABLE_FIELD_MAPPINGS.map(
      ({ stageId, schemaPath }) => [stageId, schemaPath],
    )) ===
      JSON.stringify([
        ["PB-04", "#/properties/message_draft"],
        ["PB-05", "#/properties/message_draft_context"],
        ["PB-06", "#/properties/final_disposition"],
        ["PB-06", "#/properties/repair_strategy"],
        [
          "PB-06",
          "#/$defs/deterministic_check/properties/json_path",
        ],
      ]) &&
      OPENAI_NULLABLE_FIELD_MAPPINGS.every(
        (mapping) =>
          mapping.providerRepresentation.startsWith("required ") &&
          mapping.canonicalHandling ===
            "canonical schema accepts null directly",
      ),
    "nullable provider-field mappings are incomplete or imply adapter repair",
  );
});

gate("M2_P3_PROVIDER_DIAGNOSTIC_GATE", () => {
  const rawBodySentinel = "RAW_PROVIDER_BODY_MUST_NOT_BE_LOGGED";
  const exactSchemaContext = "Invalid schema context at properties.timeline";
  const apiError = new OpenAI.APIError(
    400,
    {
      type: "invalid_request_error",
      code: "invalid_json_schema",
      param: "text.format.schema",
      message: `${exactSchemaContext}\u0000 sk-test-secret sb_secret_test Bearer test-token ${"x".repeat(1200)}`,
      raw_body_sentinel: rawBodySentinel,
    },
    undefined,
    new Headers({ "x-request-id": "req_sanitized_test" }),
  );
  const diagnostic = createOpenAiProviderFailureDiagnostic(
    "PB-01",
    apiError,
  );
  check(
    "M2_P3_PROVIDER_DIAGNOSTIC_GATE",
    assert.deepEqual(Object.keys(diagnostic).sort(), [
      "failureClassification",
      "httpStatus",
      "openaiErrorCode",
      "openaiErrorMessage",
      "openaiErrorParam",
      "openaiErrorType",
      "requestId",
      "stageId",
    ].sort()) === undefined &&
      diagnostic.stageId === "PB-01" &&
      diagnostic.httpStatus === 400 &&
      diagnostic.openaiErrorType === "invalid_request_error" &&
      diagnostic.openaiErrorCode === "invalid_json_schema" &&
      diagnostic.openaiErrorParam === "text.format.schema" &&
      diagnostic.openaiErrorMessage?.includes(exactSchemaContext) &&
      diagnostic.openaiErrorMessage.length <= 1000 &&
      !/[\u0000-\u001f\u007f]/u.test(diagnostic.openaiErrorMessage) &&
      !diagnostic.openaiErrorMessage.includes("sk-test-secret") &&
      !diagnostic.openaiErrorMessage.includes("sb_secret_test") &&
      !diagnostic.openaiErrorMessage.includes("Bearer") &&
      diagnostic.requestId === "req_sanitized_test" &&
      diagnostic.failureClassification === "openai_api_error" &&
      !JSON.stringify(diagnostic).includes(rawBodySentinel) &&
      createOpenAiProviderFailureDiagnostic(
        "PB-01",
        new Error("not an OpenAI SDK error"),
      ).openaiErrorMessage === null,
    "provider diagnostic fields are incomplete or unsafe",
  );
  check(
    "M2_P3_PROVIDER_DIAGNOSTIC_GATE",
    diagnosticSource.includes(
      'process.env.NODE_ENV !== "development"',
    ) &&
      diagnosticSource.includes('console.error(') &&
      transportSource.includes(
        "logDevelopmentOpenAiProviderFailure(stageRequest.stageId, error)",
      ),
    "development-only provider diagnostic logging is missing",
  );
});

gate("M2_P3_STORE_FALSE_GATE", () => {
  check(
    "M2_P3_STORE_FALSE_GATE",
    transportSource.includes("store: false"),
    "store false is absent",
  );
});

gate("M2_P3_SUPABASE_SERVER_ONLY_GATE", () => {
  check(
    "M2_P3_SUPABASE_SERVER_ONLY_GATE",
    repositorySource.includes('import "server-only";') &&
      repositorySource.includes("persistSession: false") &&
      repositorySource.includes("autoRefreshToken: false") &&
      environmentSource.includes('required("SUPABASE_SECRET_KEY")') &&
      !source("components/runtime/RuntimeAssessmentForm.tsx").includes(
        "@supabase/supabase-js",
      ),
    "Supabase server-only boundary differs",
  );
});

gate("M2_P3_RLS_GATE", () => {
  const tables = [
    "assessment_requests",
    "assessment_runs",
    "assessment_stage_runs",
    "assessment_reports",
  ];
  check(
    "M2_P3_RLS_GATE",
    tables.every((table) =>
      migrationSource.includes(
        `alter table public.${table} enable row level security`,
      ),
    ) && !/\bcreate\s+policy\b/iu.test(migrationSource),
    "RLS or no-public-policy contract differs",
  );
});

gate("M2_P3_DATABASE_SCHEMA_GATE", () => {
  for (const required of [
    "create table public.assessment_requests",
    "idempotency_key text not null unique",
    "create table public.assessment_runs",
    "usage_derived_cost_usd numeric",
    "create table public.assessment_stage_runs",
    "unique (run_id, stage_id)",
    "prompt_hash text not null",
    "schema_hash text not null",
    "create table public.assessment_reports",
    "run_id uuid not null unique",
    "on delete cascade",
  ]) {
    check(
      "M2_P3_DATABASE_SCHEMA_GATE",
      migrationSource.includes(required),
      `migration is missing ${required}`,
    );
  }
  check(
    "M2_P3_DATABASE_SCHEMA_GATE",
    !/\bif\s+not\s+exists\b/iu.test(migrationSource),
    "migration masks unexpected state",
  );
});

gate("M2_P3_IDEMPOTENCY_GATE", () => {
  check(
    "M2_P3_IDEMPOTENCY_GATE",
    applicationSource.includes("findByIdempotencyKey") &&
      applicationSource.includes("M2_DUPLICATE_SUBMISSION") &&
      duplicate.duplicate === true &&
      happy.transport.calls.length === 6,
    "duplicate submission was not returned without new Stage calls",
  );
});

gate("M2_P3_PIPELINE_ORDER_GATE", () => {
  check(
    "M2_P3_PIPELINE_ORDER_GATE",
    JSON.stringify(happy.trace) === JSON.stringify(expectedTrace) &&
      JSON.stringify(happy.transport.calls) ===
        JSON.stringify(["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]),
    `pipeline order differs: ${JSON.stringify(happy.trace)}`,
  );
});

gate("M2_P3_SAFETY_GATE", () => {
  check(
    "M2_P3_SAFETY_GATE",
    safetyBlockedResult.eligibility === "safety_blocked" &&
      safetyBlocked.transport.calls.length === 3 &&
      needsMoreResult.eligibility === "needs_more_information" &&
      needsMoreResult.questionCodes.length <= 3,
    "Safety or eligibility stop behavior differs",
  );
});

gate("M2_P3_DECISION_POLICY_GATE", () => {
  check(
    "M2_P3_DECISION_POLICY_GATE",
    policySource.includes("buildDecisionPolicy") &&
      policySource.includes("allowed_decisions: [selected]") &&
      policyV2Source.includes("buildDecisionPolicyV2") &&
      pipelineSource.includes("requireDecisionFacts(structuredIntake)") &&
      pipelineSource.includes("buildDecisionPolicyV2(decisionFacts)") &&
      !pipelineSource.includes("buildDecisionPolicy(request") &&
      happyResult.decision === "wait_and_reassess",
    "historical policy or active typed-facts decision policy differs",
  );
});

gate("M2_P3_STAGE_PERSISTENCE_GATE", () => {
  check(
    "M2_P3_STAGE_PERSISTENCE_GATE",
    happy.repository.stageRuns.size === 6 &&
      [...happy.repository.stageRuns.values()].every(
        (stage) =>
          stage.status === "completed" &&
          stage.completion?.outputJson &&
          stage.requestHash.length === 64 &&
          stage.promptHash.length === 64 &&
          stage.schemaHash.length === 64,
      ),
    "completed Stage records are incomplete",
  );
  check(
    "M2_P3_STAGE_PERSISTENCE_GATE",
    [...schemaFailure.repository.stageRuns.values()].some(
      (stage) => stage.status === "failed" && stage.failure?.outputJson,
    ),
    "failed Stage output was not persisted",
  );
});

gate("M2_P3_FAIL_CLOSED_GATE", () => {
  check(
    "M2_P3_FAIL_CLOSED_GATE",
    schemaFailure.transport.calls.length === 1 &&
      modelMismatch.transport.calls.length === 2 &&
      databaseFailure.transport.calls.length === 3 &&
      pb05Failure.transport.calls.length === 5 &&
      !pb05Failure.transport.calls.includes("PB-06"),
    "a failure executed a later Stage",
  );
});

gate("M2_P3_NO_RETRY_GATE", () => {
  check(
    "M2_P3_NO_RETRY_GATE",
    schemaFailure.transport.calls.filter((stage) => stage === "PB-01").length ===
      1 &&
      modelMismatch.transport.calls.filter((stage) => stage === "PB-02")
        .length === 1 &&
      !pipelineSource.includes("while (") &&
      !pipelineSource.includes("setTimeout("),
    "retry behavior is present",
  );
});

gate("M2_P3_NO_REPAIR_GATE", () => {
  check(
    "M2_P3_NO_REPAIR_GATE",
    !pipelineSource.includes('"PB-07"') &&
      !catalog.definitions.some((definition) => definition.stageId === "PB-07"),
    "PB-07 or Repair execution is present",
  );
});

gate("M2_P3_NO_FALLBACK_GATE", () => {
  check(
    "M2_P3_NO_FALLBACK_GATE",
    environmentSource.includes('model !== "gpt-5.6-luna"') &&
      transportSource.includes("model: stageRequest.model") &&
      pipelineSource.includes("M2_STAGE_MODEL_MISMATCH"),
    "single-model fail-closed behavior differs",
  );
});

gate("M2_P3_USAGE_LEDGER_GATE", () => {
  check(
    "M2_P3_USAGE_LEDGER_GATE",
    happyResult.usage.totalInputTokens > 0 &&
      happyResult.usage.totalOutputTokens > 0 &&
      happyResult.usage.totalReasoningTokens > 0 &&
      happyResult.usage.usageDerivedCostUsd > 0 &&
      source("lib/assessment/runtime/cost.ts").includes(
        "prevents reasoning from being double-counted",
      ),
    "usage-derived cost ledger differs",
  );
});

gate("M2_P3_FAKE_RUNTIME_GATE", () => {
  check(
    "M2_P3_FAKE_RUNTIME_GATE",
    fakeSource.includes("class FakeAssessmentRepository") &&
      fakeSource.includes("class FakeAiStageTransport") &&
      happyResult.report.content.cover_line.length > 0 &&
      needsMoreResult.eligibility === "needs_more_information" &&
      safetyBlockedResult.eligibility === "safety_blocked",
    "required fake runtime scenarios did not pass",
  );
});

gate("M2_P3_ZERO_LIVE_NETWORK_GATE", () => {
  const fakes = [
    happy,
    needsMore,
    safetyBlocked,
    schemaFailure,
    modelMismatch,
    databaseFailure,
    pb05Failure,
    reportInsertFailure,
    runUpdateFailure,
    concurrent,
    createRequestFailure,
    createRunFailure,
    firstStageStartFailure,
    failedSubmission,
    sameKeyAfterFailure,
    deliberateResubmission,
  ];
  check(
    "M2_P3_ZERO_LIVE_NETWORK_GATE",
    fakes.every(
      (runtime) =>
        runtime.transport.actualProviderCalls === 0 &&
        runtime.repository.actualSupabaseCalls === 0,
    ),
    "a live provider or Supabase call was recorded",
  );
});

gate("M2_P3_ZERO_SPEND_GATE", () => {
  check(
    "M2_P3_ZERO_SPEND_GATE",
    happy.transport.apiSpendUsd === 0 &&
      runtimeManifest.task_execution_evidence.api_spend_usd === 0,
    "actual API spend is not zero",
  );
});

gate("M2_P3_PUBLIC_PRODUCT_UNCHANGED_GATE", () => {
  const publicDiff = gitText([
    "diff",
    "--name-only",
    baselineSha,
    "--",
    "app/page.tsx",
    "app/request",
    "components/request",
    "components/report",
    "fixtures/public",
    "fixtures/review",
  ]).trim();
  const baseCss = gitText(["show", `${baselineSha}:app/globals.css`]);
  const currentCss = source("app/globals.css");
  const normalizedBaseCss = baseCss.replace(/\r\n/gu, "\n");
  const normalizedCurrentCss = currentCss.replace(/\r\n/gu, "\n");
  check(
    "M2_P3_PUBLIC_PRODUCT_UNCHANGED_GATE",
    publicDiff === "" &&
      normalizedCurrentCss.startsWith(normalizedBaseCss) &&
      normalizedCurrentCss.includes(
        "M2-P3 internal development runtime. No public navigation entry.",
      ),
    `public product diff is not isolated: ${publicDiff}`,
  );
});

gate("M2_P3_I2_RENDERER_ONLY_GATE", () => {
  const expectedI2Paths = [...i2ExactPaths].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const historicalI2Paths = gitText([
    "diff",
    "--name-only",
    i2BaselineSha,
    i2AcceptedImplementationSha,
    "--",
  ])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "en"));
  const actualI2Paths = [...historicalI2Paths];
  const actualI2AcceptanceSyncPaths = gitText([
    "diff",
    "--name-only",
    i2AcceptedImplementationSha,
    i3BaselineSha,
    "--",
  ])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "en"));
  const expectedI2AcceptanceSyncPaths = [...i2AcceptanceSyncPaths].sort(
    (left, right) => left.localeCompare(right, "en"),
  );
  const i2Snapshot = i2RuntimeManifest.implementation_snapshot;
  const protectedI2Diff = gitText([
    "diff",
    "--name-only",
    i2BaselineSha,
    i2AcceptedImplementationSha,
    "--",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/policy.ts",
    "lib/assessment/runtime/policy-v2.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/contracts",
    "app/api",
    "supabase",
    "ai/prompts",
    "ai/schemas",
    "evals/development",
    "evals/holdout",
  ]).trim();
  const actualI3Paths = historicalPaths(i3BaselineSha, i3ImplementationSha);
  const expectedI3Paths = [...i3ExactPaths].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const layer1PlanningManifest = json(
    "evals/runtime/m2-p4-i3-r1-planning-capabilities-v1.json",
  );
  const finalPlanningManifest = json(
    "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
  );
  const r1aManifest = json(
    "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  );
  const r1bManifest = json(
    "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  );
  const r1C1R1Manifest = json(r1C1R1CapabilityManifestPath);
  const r1C1R2Manifest = json(r1C1R2CapabilityManifestPath);
  const r1C1R2Authorization = json(r1C1R2AuthorizationPath);
  const r1C1R2Results = json(r1C1R2ResultsPath);
  const r1C1R2R1Manifest = json(r1C1R2R1CapabilityManifestPath);
  const r1C1R2R2Manifest = json(r1C1R2R2CapabilityManifestPath);
  const r1C1R2R2Authorization = json(r1C1R2R2AuthorizationPath);
  const r1C1R2R2Results = json(r1C1R2R2ResultsPath);
  const r1C1R2R2R1Manifest = json(r1C1R2R2R1CapabilityManifestPath);
  const actualLayer1PlanningPaths = historicalPaths(
    i3ImplementationSha,
    layer1PlanningSha,
  );
  const actualFinalPlanningPaths = historicalPaths(
    layer1PlanningSha,
    acceptedPlanningSha,
  );
  const actualPlanningAcceptanceSyncPaths = historicalPaths(
    acceptedPlanningSha,
    r1aBaselineSha,
  );
  const actualR1AImplementationPaths = historicalPaths(
    r1aBaselineSha,
    r1aAcceptedImplementationSha,
  );
  const actualR1ASelfCorrectionPaths = historicalPaths(
    r1aFirstImplementationSha,
    r1aAcceptedImplementationSha,
  );
  const actualR1AAcceptanceSyncPaths = historicalPaths(
    r1aAcceptedImplementationSha,
    r1bBaselineSha,
  );
  const actualR1BImplementationPaths = historicalPaths(
    r1bBaselineSha,
    r1bAcceptedImplementationSha,
  );
  const actualR1BReviewCorrectionPaths = historicalPaths(
    r1bFirstImplementationSha,
    r1bAcceptedImplementationSha,
  );
  const actualR1BAcceptanceSyncPaths = historicalPaths(
    r1bAcceptedImplementationSha,
    c1BaselineSha,
  );
  const actualC1ExecutionPaths = historicalPaths(
    c1BaselineSha,
    c1ResultCommitSha,
  );
  const actualC1ReviewSyncPaths = historicalPaths(
    c1ResultCommitSha,
    r1C1R1BaselineSha,
  );
  const actualR1C1R1ImplementationPaths = historicalPaths(
    r1C1R1BaselineSha,
    r1C1R1AcceptedImplementationSha,
  );
  const actualR1C1R1CorrectionPaths = historicalPaths(
    r1C1R1CorrectionBaselineSha,
    r1C1R1AcceptedImplementationSha,
  );
  const actualR1C1R1AcceptanceSyncPaths = historicalPaths(
    r1C1R1AcceptedImplementationSha,
    r1C1R1AcceptanceSha,
  );
  const actualR1C1R2ExecutionPaths = historicalPaths(
    r1C1R1AcceptanceSha,
    r1C1R2ResultSha,
  );
  const actualR1C1R2ReviewSyncPaths = historicalPaths(
    r1C1R2ResultSha,
    r1C1R2ReviewSha,
  );
  const actualR1C1R2Paths = historicalPaths(
    r1C1R1AcceptanceSha,
    r1C1R2ReviewSha,
  );
  const actualR1C1R2R1ImplementationPaths = historicalPaths(
    r1C1R2ReviewSha,
    r1C1R2R1AcceptedImplementationSha,
  );
  const actualR1C1R2R1AcceptanceSyncPaths = historicalPaths(
    r1C1R2R1AcceptedImplementationSha,
    r1C1R2R1AcceptedAcceptanceSha,
  );
  const actualR1C1R2R1Paths = historicalPaths(
    r1C1R2ReviewSha,
    r1C1R2R1AcceptedAcceptanceSha,
  );
  const actualR1C1R2R2ExecutionPaths = historicalPaths(
    r1C1R2R1AcceptedAcceptanceSha,
    r1C1R2R2ResultSha,
  );
  const actualR1C1R2R2ReviewSyncPaths = historicalPaths(
    r1C1R2R2ResultSha,
    r1C1R2R2ReviewSha,
  );
  const actualR1C1R2R2Paths = historicalPaths(
    r1C1R2R1AcceptedAcceptanceSha,
    r1C1R2R2ReviewSha,
  );
  const actualR1C1R2R2R1ImplementationPaths = historicalPaths(
    r1C1R2R2ReviewSha,
    r1C1R2R2R1AcceptedImplementationSha,
  );
  const actualR1C1R2R2R1AcceptanceSyncPaths = currentTaskPaths(
    r1C1R2R2R1AcceptedImplementationSha,
  );
  const actualR1C1R2R2R1Paths = currentTaskPaths(r1C1R2R2ReviewSha);
  const expectedR1C1R2R2R1ImplementationSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1C1R2R2ReviewSha,
    end_commit_sha: r1C1R2R2R1AcceptedImplementationSha,
    exact_paths: 13,
    immutable_snapshot: true,
    include_working_tree: false,
  };
  const expectedR1C1R2R1ImplementationSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1C1R2ReviewSha,
    end_commit_sha: r1C1R2R1AcceptedImplementationSha,
    exact_paths: 13,
    immutable_snapshot: true,
    include_working_tree: false,
  };
  const expectedR1ASnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1aBaselineSha,
    end_commit_sha: r1aAcceptedImplementationSha,
    exact_paths: 18,
    include_working_tree: false,
    immutable_snapshot: true,
  };
  const expectedR1C1R2ExecutionSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1C1R1AcceptanceSha,
    end_commit_sha: r1C1R2ResultSha,
    exact_paths: 17,
    immutable_snapshot: true,
    include_working_tree: false,
  };
  const expectedR1C1R2R2ExecutionSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1C1R2R1AcceptedAcceptanceSha,
    end_commit_sha: r1C1R2R2ResultSha,
    exact_paths: 17,
    immutable_snapshot: true,
    include_working_tree: false,
  };
  const expectedR1ASelfCorrection = {
    required: true,
    status: "resolved",
    commit: r1aAcceptedImplementationSha,
    changed_paths: ["scripts/verify-m2-p4-i3-r1-a-contracts.mjs"],
    scope_expansion: false,
    force_push: false,
  };
  const expectedR1BSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1bBaselineSha,
    end_commit_sha: r1bAcceptedImplementationSha,
    exact_paths: 22,
    include_working_tree: false,
    immutable_snapshot: true,
  };
  const expectedR1BReviewCorrection = {
    base_commit: r1bFirstImplementationSha,
    correction_commit: r1bAcceptedImplementationSha,
    exact_paths: 9,
    provenance_ownership_matrix: "7/7",
    valid_grounding_cases: 20,
    invalid_grounding_cases: 20,
    downstream_input_parity: "15/15",
    scope_expansion: false,
    force_push: false,
  };
  const expectedR1C1R1ImplementationSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: r1C1R1BaselineSha,
    end_commit_sha: r1C1R1AcceptedImplementationSha,
    exact_paths: 31,
    immutable_snapshot: true,
    include_working_tree: false,
  };
  const expectedR1C1R1FinalCorrection = {
    type: "historical_commit_range",
    base_commit_sha: r1C1R1CorrectionBaselineSha,
    end_commit_sha: r1C1R1AcceptedImplementationSha,
    exact_paths: 9,
  };
  const i2ExecutionSources = [
    i2PageSource,
    i2FixtureSource,
    i2NoteSource,
  ].join("\n");
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    actualI2Paths.length === 16 &&
      new Set(actualI2Paths).size === 16 &&
      JSON.stringify(actualI2Paths) === JSON.stringify(expectedI2Paths) &&
      actualI2Paths.every(
        (item) => !item.includes("*") && !item.endsWith("/"),
      ),
    `I2 exact renderer/static-preview scope differs: ${actualI2Paths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    JSON.stringify(historicalI2Paths) === JSON.stringify(expectedI2Paths) &&
      actualI2AcceptanceSyncPaths.length === 8 &&
      new Set(actualI2AcceptanceSyncPaths).size === 8 &&
      JSON.stringify(actualI2AcceptanceSyncPaths) ===
        JSON.stringify(expectedI2AcceptanceSyncPaths) &&
      actualI2AcceptanceSyncPaths.every(
        (item) => !item.includes("*") && !item.endsWith("/"),
      ),
    `I2 accepted snapshot or exact acceptance-sync scope differs: ${actualI2AcceptanceSyncPaths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    i2RuntimeManifest.task_id === "M2-P4-I2" &&
      i2RuntimeManifest.status === "human_chatgpt_accepted_complete" &&
      i2RuntimeManifest.accepted_implementation_commit ===
        i2AcceptedImplementationSha &&
      i2RuntimeManifest.baseline === i2BaselineSha &&
      JSON.stringify(i2Snapshot) ===
        JSON.stringify({
          type: "historical_commit_range",
          base_commit_sha: i2BaselineSha,
          end_commit_sha: i2AcceptedImplementationSha,
          include_working_tree: false,
          immutable_snapshot: true,
        }) &&
      JSON.stringify(i2RuntimeManifest.exact_mutation_paths) ===
        JSON.stringify(i2ExactPaths) &&
      i2RuntimeManifest.i3_status === "not_started",
    "I2 accepted renderer-only successor manifest differs",
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    actualI3Paths.length === 19 &&
      new Set(actualI3Paths).size === 19 &&
      JSON.stringify(actualI3Paths) === JSON.stringify(expectedI3Paths) &&
      actualI3Paths.every(
        (item) => !item.includes("*") && !item.endsWith("/"),
      ) &&
      i3RuntimeManifest.task_id === "M2-P4-I3" &&
      i3RuntimeManifest.status ===
        "implementation_pending_human_chatgpt_review" &&
      i3RuntimeManifest.baseline === i3BaselineSha &&
      JSON.stringify(i3RuntimeManifest.exact_mutation_paths) ===
        JSON.stringify(i3ExactPaths) &&
      i3RuntimeManifest.schema_mutations === 0 &&
      i3RuntimeManifest.ui_mutations === 0 &&
      i3RuntimeManifest.policy_mutations === 0,
    `I3 exact 19-path successor differs: ${actualI3Paths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    isExactLiteralSet(
      actualLayer1PlanningPaths,
      layer1PlanningManifest.exact_mutation_paths,
    ) &&
      layer1PlanningManifest.exact_mutation_path_count === 9 &&
      isExactLiteralSet(
        actualFinalPlanningPaths,
        finalPlanningManifest.exact_mutation_paths,
      ) &&
      finalPlanningManifest.planning_snapshot.exact_paths === 12 &&
      finalPlanningManifest.planning_snapshot.immutable_snapshot === true &&
      isExactLiteralSet(
        actualPlanningAcceptanceSyncPaths,
        exactPlanningAcceptanceSyncPaths,
      ) &&
      isExactLiteralSet(actualR1AImplementationPaths, exactR1APaths) &&
      isExactLiteralSet(
        actualR1AAcceptanceSyncPaths,
        exactR1AAcceptanceSyncPaths,
      ) &&
      isExactLiteralSet(actualR1BImplementationPaths, exactR1BPaths) &&
      isExactLiteralSet(
        actualR1BReviewCorrectionPaths,
        exactR1BReviewCorrectionPaths,
      ) &&
      isExactLiteralSet(
        actualR1BAcceptanceSyncPaths,
        exactR1BAcceptanceSyncPaths,
      ) &&
      isExactLiteralSet(actualC1ExecutionPaths, exactC1Paths) &&
      isExactLiteralSet(actualC1ReviewSyncPaths, exactC1ReviewSyncPaths) &&
      exactR1C1R1Paths.length === 31 &&
      isExactLiteralSet(
        actualR1C1R1ImplementationPaths,
        exactR1C1R1Paths,
      ) &&
      isExactLiteralSet(actualR1ASelfCorrectionPaths, [
        "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
      ]) &&
      r1aManifest.task_id === "M2-P4-I3-R1-A" &&
      r1aManifest.status === "human_chatgpt_accepted_complete" &&
      r1aManifest.accepted_implementation_commit ===
        r1aAcceptedImplementationSha &&
      JSON.stringify(r1aManifest.implementation_commits) ===
        JSON.stringify([
          r1aFirstImplementationSha,
          r1aAcceptedImplementationSha,
        ]) &&
      JSON.stringify(r1aManifest.implementation_snapshot) ===
        JSON.stringify(expectedR1ASnapshot) &&
      JSON.stringify(r1aManifest.self_correction) ===
        JSON.stringify(expectedR1ASelfCorrection) &&
      r1aManifest.active_runtime_changed === false &&
      r1aManifest.next_candidate ===
        "M2-P4-I3-R1-B PB-01 v4 Writing Context Extraction and Grounding" &&
      r1aManifest.next_candidate_authorized === false &&
      r1bManifest.task_id === "M2-P4-I3-R1-B" &&
      r1bManifest.status === "human_chatgpt_accepted_complete" &&
      r1bManifest.accepted_implementation_commit ===
        r1bAcceptedImplementationSha &&
      JSON.stringify(r1bManifest.implementation_commits) ===
        JSON.stringify([
          r1bFirstImplementationSha,
          r1bAcceptedImplementationSha,
        ]) &&
      JSON.stringify(r1bManifest.implementation_snapshot) ===
        JSON.stringify(expectedR1BSnapshot) &&
      r1bManifest.review_correction_required === false &&
      r1bManifest.review_correction_status === "resolved" &&
      JSON.stringify(r1bManifest.review_correction) ===
        JSON.stringify(expectedR1BReviewCorrection) &&
      r1bManifest.active_runtime_changed === false &&
      r1bManifest.service_mutations === 0 &&
      r1bManifest.candidate_catalog === "runtime-stage-catalog-v5.0.0" &&
      r1bManifest.provider_diagnostic === "not_started" &&
      r1bManifest.next_candidate ===
        "M2-P4-I3-R1-C1 PB-01 v4 Bounded Provider Diagnostic" &&
      r1bManifest.next_candidate_authorized === false &&
      r1bManifest.runtime_activation_candidate ===
        "M2-P4-I3-R1-C2 PB-01 v4 Runtime Activation" &&
      r1bManifest.runtime_activation_authorized === false,
    `R1 planning/R1-A/R1-B/C1 successor boundaries differ: r1a_implementation=${actualR1AImplementationPaths.join(",")}; r1a_acceptance=${actualR1AAcceptanceSyncPaths.join(",")}; r1b_implementation=${actualR1BImplementationPaths.join(",")}; r1b_correction=${actualR1BReviewCorrectionPaths.join(",")}; r1b_acceptance=${actualR1BAcceptanceSyncPaths.join(",")}; c1_execution=${actualC1ExecutionPaths.join(",")}; c1_review_sync=${actualC1ReviewSyncPaths.join(",")}; c1_r1_implementation=${actualR1C1R1ImplementationPaths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    isExactLiteralSet(
      actualR1C1R1CorrectionPaths,
      exactR1C1R1CorrectionPaths,
    ) &&
      isExactLiteralSet(
        actualR1C1R1AcceptanceSyncPaths,
        exactR1C1R1AcceptanceSyncPaths,
      ) &&
      r1C1R1Manifest.task_id === "M2-P4-I3-R1-C1-R1" &&
      r1C1R1Manifest.status === "human_chatgpt_accepted_complete" &&
      r1C1R1Manifest.application_architecture_accepted === true &&
      r1C1R1Manifest.application_offline_implementation_accepted === true &&
      r1C1R1Manifest.provider_quality_accepted === false &&
      r1C1R1Manifest.accepted_implementation_commit ===
        r1C1R1AcceptedImplementationSha &&
      JSON.stringify(r1C1R1Manifest.implementation_commits) ===
        JSON.stringify(r1C1R1ImplementationCommits) &&
      JSON.stringify(r1C1R1Manifest.implementation_snapshot) ===
        JSON.stringify(expectedR1C1R1ImplementationSnapshot) &&
      JSON.stringify(r1C1R1Manifest.final_review_correction) ===
        JSON.stringify(expectedR1C1R1FinalCorrection) &&
      isExactLiteralSet(
        [...r1C1R1Manifest.acceptance_sync_exact_paths].sort((left, right) =>
          left.localeCompare(right, "en"),
        ),
        exactR1C1R1AcceptanceSyncPaths,
      ) &&
      r1C1R1Manifest.acceptance_sync_exact_path_count === 8 &&
      r1C1R1Manifest.strict_source_replay_verdict === "FAIL" &&
      r1C1R1Manifest.strict_cases_passed === 5 &&
      r1C1R1Manifest.application_adjudicated_decision_facts === "8/8" &&
      r1C1R1Manifest.application_canonical_fixtures === "8/8" &&
      r1C1R1Manifest.provider_semantic_coverage === "7/8" &&
      r1C1R1Manifest.provider_retest_required === true &&
      r1C1R1Manifest.r1_c1_r2_authorized === false &&
      r1C1R1Manifest.c2_eligible === false &&
      r1C1R1Manifest.c2_authorized === false &&
      r1C1R1Manifest.active_runtime_changed === false &&
      r1C1R1Manifest.next_candidate ===
        "M2-P4-I3-R1-C1-R2 PB-01 v5 Bounded Provider Diagnostic" &&
      r1C1R1Manifest.next_candidate_authorized === false,
    `R1-C1-R1 acceptance boundary differs: implementation=${actualR1C1R1ImplementationPaths.join(",")}; correction=${actualR1C1R1CorrectionPaths.join(",")}; acceptance=${actualR1C1R1AcceptanceSyncPaths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    exactR1C1R2Paths.length === 17 &&
      isExactLiteralSet(actualR1C1R2Paths, exactR1C1R2Paths) &&
      isExactLiteralSet(actualR1C1R2ExecutionPaths, exactR1C1R2Paths) &&
      exactR1C1R2ReviewSyncPaths.length === 8 &&
      isExactLiteralSet(
        actualR1C1R2ReviewSyncPaths,
        exactR1C1R2ReviewSyncPaths,
      ) &&
      r1C1R2Manifest.task_id === "M2-P4-I3-R1-C1-R2" &&
      r1C1R2Manifest.status === "human_chatgpt_reviewed_fail_complete" &&
      r1C1R2Manifest.execution_protocol_accepted === true &&
      r1C1R2Manifest.diagnostic_evidence_valid === true &&
      r1C1R2Manifest.post_run_evaluator_correction_accepted === true &&
      r1C1R2Manifest.provider_product_gate_passed === false &&
      JSON.stringify(r1C1R2Manifest.execution_snapshot) ===
        JSON.stringify(expectedR1C1R2ExecutionSnapshot) &&
      JSON.stringify(r1C1R2Manifest.execution_commits) ===
        JSON.stringify([r1C1R2PackageSha, r1C1R2ResultSha]) &&
      isExactLiteralSet(
        [...r1C1R2Manifest.review_sync_exact_paths].sort((left, right) =>
          left.localeCompare(right, "en"),
        ),
        exactR1C1R2ReviewSyncPaths,
      ) &&
      r1C1R2Manifest.review_sync_exact_path_count === 8 &&
      r1C1R2Manifest.authorization_id ===
        "M2-P4-I3-R1-C1-R2-2026-08-01" &&
      r1C1R2Manifest.baseline === r1C1R1AcceptanceSha &&
      r1C1R2Manifest.branch ===
        "test/m2-p4-i3-r1-c1-r2-provider-diagnostic" &&
      r1C1R2Manifest.exact_paths === 17 &&
      r1C1R2Manifest.historical_verifier_mode ===
        "accepted_sha_external_clone" &&
      r1C1R2Manifest.historical_verifier_sha === r1C1R1AcceptanceSha &&
      r1C1R2Manifest.historical_snapshot_revalidation === "7/7" &&
      r1C1R2Manifest.historical_verifiers_current_branch_compatible ===
        false &&
      r1C1R2Manifest.incompatibility_reason ===
        "exact R1-C1-R1 31-path snapshot authority" &&
      r1C1R2Manifest.old_verifier_mutations === 0 &&
      r1C1R2Manifest.scope_expansion === 0 &&
      r1C1R2Manifest.model === "gpt-5.6-luna" &&
      r1C1R2Manifest.stage === "PB-01 v5 only" &&
      r1C1R2Manifest.authorized_calls === 8 &&
      r1C1R2Manifest.retry_count === 0 &&
      r1C1R2Manifest.repair_count === 0 &&
      r1C1R2Manifest.fallback_count === 0 &&
      r1C1R2Manifest.db_operations === 0 &&
      r1C1R2Manifest.supabase_operations === 0 &&
      r1C1R2Manifest.holdout_use === 0 &&
      r1C1R2Manifest.real_user_data === 0 &&
      r1C1R2Manifest.active_runtime_changed === false &&
      r1C1R2Manifest.r1_c1_r2_authorized === true &&
      r1C1R2Manifest.authorization_consumed === true &&
      r1C1R2Manifest.rerun_authorized === false &&
      r1C1R2Manifest.provider_diagnostic_verdict === "FAIL" &&
      r1C1R2Manifest.case_pass_count === 5 &&
      r1C1R2Manifest.actual_calls === 8 &&
      r1C1R2Manifest.completed_calls === 8 &&
      r1C1R2Manifest.pb_02_through_pb_06_calls === 0 &&
      r1C1R2Manifest.secret_leakage === 0 &&
      r1C1R2Manifest.c2_eligible === false &&
      r1C1R2Manifest.c2_authorized === false &&
      r1C1R2Manifest.next_candidate ===
        "M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision" &&
      r1C1R2Manifest.next_candidate_authorized === false &&
      r1C1R2Manifest.i3_final_acceptance === "pending" &&
      r1C1R2Manifest.main_changed === false &&
      r1C1R2Manifest.milestone_2 === "incomplete" &&
      r1C1R2Authorization.authorization_id ===
        r1C1R2Manifest.authorization_id &&
      r1C1R2Authorization.consumed === true &&
      r1C1R2Authorization.authorized_calls === 8 &&
      r1C1R2Authorization.rerun_authorized === false &&
      r1C1R2Results.calls_authorized === 8 &&
      r1C1R2Results.status ===
        "provider_diagnostic_failed_pending_human_chatgpt_review" &&
      r1C1R2Results.evaluation.verdict === "FAIL" &&
      r1C1R2Results.evaluation.case_pass_count === 5 &&
      r1C1R2Results.calls_actual === 8 &&
      r1C1R2Results.calls_completed === 8 &&
      r1C1R2Results.retry_count === 0 &&
      r1C1R2Results.repair_count === 0 &&
      r1C1R2Results.fallback_count === 0 &&
      r1C1R2Results.pb_02_through_pb_06_calls === 0 &&
      r1C1R2Results.db_operations === 0 &&
      r1C1R2Results.supabase_operations === 0 &&
      r1C1R2Results.holdout_use === 0 &&
      r1C1R2Results.real_user_data === 0 &&
      r1C1R2Results.active_runtime_changed === false &&
      r1C1R2Results.rerun_authorized === false &&
      r1C1R2Results.c2_eligible === false &&
      r1C1R2Results.c2_authorized === false,
    `R1-C1-R2 failed-diagnostic review boundary differs: execution=${actualR1C1R2ExecutionPaths.join(",")}; review_sync=${actualR1C1R2ReviewSyncPaths.join(",")}; cumulative=${actualR1C1R2Paths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    exactR1C1R2R1Paths.length === 13 &&
      exactR1C1R2R1AcceptanceSyncPaths.length === 8 &&
      isExactLiteralSet(
        actualR1C1R2R1ImplementationPaths,
        exactR1C1R2R1Paths,
      ) &&
      isExactLiteralSet(
        actualR1C1R2R1AcceptanceSyncPaths,
        exactR1C1R2R1AcceptanceSyncPaths,
      ) &&
      isExactLiteralSet(actualR1C1R2R1Paths, exactR1C1R2R1Paths) &&
      r1C1R2R1Manifest.task_id === "M2-P4-I3-R1-C1-R2-R1" &&
      r1C1R2R1Manifest.status === "human_chatgpt_accepted_complete" &&
      r1C1R2R1Manifest.offline_prompt_revision_accepted === true &&
      r1C1R2R1Manifest.accepted_implementation_commit ===
        r1C1R2R1AcceptedImplementationSha &&
      JSON.stringify(r1C1R2R1Manifest.implementation_snapshot) ===
        JSON.stringify(expectedR1C1R2R1ImplementationSnapshot) &&
      r1C1R2R1Manifest.baseline === r1C1R2ReviewSha &&
      r1C1R2R1Manifest.branch ===
        "feat/m2-p4-i3-r1-c1-r2-r1-semantic-consistency" &&
      isExactLiteralSet(
        [...r1C1R2R1Manifest.exact_mutation_paths].sort((left, right) =>
          left.localeCompare(right, "en"),
        ),
        exactR1C1R2R1Paths,
      ) &&
      r1C1R2R1Manifest.exact_mutation_path_count === 13 &&
      isExactLiteralSet(
        [...r1C1R2R1Manifest.acceptance_sync_exact_paths].sort((left, right) =>
          left.localeCompare(right, "en"),
        ),
        exactR1C1R2R1AcceptanceSyncPaths,
      ) &&
      r1C1R2R1Manifest.acceptance_sync_exact_path_count === 8 &&
      r1C1R2R1Manifest.prompt === "pb-01-structure-v6" &&
      r1C1R2R1Manifest.catalog === "runtime-stage-catalog-v7.0.0" &&
      r1C1R2R1Manifest.prompt_bundle ===
        "prompt-bundle-runtime-v7.0.0" &&
      r1C1R2R1Manifest.provider_schema === "pipeline-schema-v5.0.0" &&
      r1C1R2R1Manifest.candidate_runtime_schema_set ===
        "pipeline-schema-runtime-v3.2.0" &&
      r1C1R2R1Manifest.grounded_schema === "pipeline-schema-v4.0.0" &&
      r1C1R2R1Manifest.candidate_catalog_inactive === true &&
      r1C1R2R1Manifest.active_runtime_changed === false &&
      r1C1R2R1Manifest.accepted_r2_evidence_unchanged === true &&
      r1C1R2R1Manifest.provider_calls === 0 &&
      r1C1R2R1Manifest.provider_outputs_mutated === 0 &&
      r1C1R2R1Manifest.provider_quality_established === false &&
      r1C1R2R1Manifest.provider_retest_required === true &&
      r1C1R2R1Manifest.db_operations === 0 &&
      r1C1R2R1Manifest.supabase_operations === 0 &&
      r1C1R2R1Manifest.holdout_use === 0 &&
      r1C1R2R1Manifest.real_user_data === 0 &&
      r1C1R2R1Manifest.protected_diff === 0 &&
      r1C1R2R1Manifest.main_changed === false &&
      r1C1R2R1Manifest.c2_eligible === false &&
      r1C1R2R1Manifest.c2_authorized === false &&
      r1C1R2R1Manifest.next_candidate ===
        "M2-P4-I3-R1-C1-R2-R2 Four-Case Bounded Provider Diagnostic" &&
      r1C1R2R1Manifest.next_candidate_authorized === false &&
      r1C1R2R1Manifest.i3_final_acceptance === "pending" &&
      r1C1R2R1Manifest.main_changed === false &&
      r1C1R2R1Manifest.milestone_2 === "incomplete",
    `R1-C1-R2-R1 accepted offline successor boundary differs: implementation=${actualR1C1R2R1ImplementationPaths.join(",")}; acceptance=${actualR1C1R2R1AcceptanceSyncPaths.join(",")}; cumulative=${actualR1C1R2R1Paths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    exactR1C1R2R2Paths.length === 17 &&
      exactR1C1R2R2ReviewSyncPaths.length === 8 &&
      exactR1C1R2R2Paths.length - exactR1C1R2R2ReviewSyncPaths.length === 9 &&
      isExactLiteralSet(
        actualR1C1R2R2ExecutionPaths,
        exactR1C1R2R2Paths,
      ) &&
      isExactLiteralSet(
        actualR1C1R2R2ReviewSyncPaths,
        exactR1C1R2R2ReviewSyncPaths,
      ) &&
      isExactLiteralSet(actualR1C1R2R2Paths, exactR1C1R2R2Paths) &&
      r1C1R2R2Manifest.task_id === "M2-P4-I3-R1-C1-R2-R2" &&
      r1C1R2R2Manifest.status === "human_chatgpt_reviewed_fail_complete" &&
      r1C1R2R2Manifest.execution_protocol_accepted === true &&
      r1C1R2R2Manifest.diagnostic_evidence_valid === true &&
      r1C1R2R2Manifest.frozen_targeted_verdict === "FAIL" &&
      r1C1R2R2Manifest.provider_product_gate_passed === false &&
      r1C1R2R2Manifest.targeted_repairs_evidence_accepted === true &&
      r1C1R2R2Manifest.targeted_repairs_passed === "3/3" &&
      r1C1R2R2Manifest.principal_quoted_ownership === "PASS" &&
      r1C1R2R2Manifest.ownership_sequence_control_passed === true &&
      r1C1R2R2Manifest.normal_control_overall === "FAIL" &&
      r1C1R2R2Manifest.r2r2_04_classification ===
        "decision_policy_equivalent_but_semantically_incomplete" &&
      r1C1R2R2Manifest.decision_policy_equivalent === true &&
      r1C1R2R2Manifest.decision_facts_semantic_completeness_passed === false &&
      JSON.stringify(r1C1R2R2Manifest.execution_snapshot) ===
        JSON.stringify(expectedR1C1R2R2ExecutionSnapshot) &&
      JSON.stringify(r1C1R2R2Manifest.execution_commits) ===
        JSON.stringify([r1C1R2R2PackageSha, r1C1R2R2ResultSha]) &&
      isExactLiteralSet(
        [...r1C1R2R2Manifest.review_sync_exact_paths].sort((left, right) =>
          left.localeCompare(right, "en"),
        ),
        exactR1C1R2R2ReviewSyncPaths,
      ) &&
      r1C1R2R2Manifest.review_sync_exact_path_count === 8 &&
      r1C1R2R2Manifest.baseline === r1C1R2R1AcceptedAcceptanceSha &&
      r1C1R2R2Manifest.branch ===
        "test/m2-p4-i3-r1-c1-r2-r2-four-case-provider-diagnostic" &&
      r1C1R2R2Manifest.exact_paths === 17 &&
      r1C1R2R2Manifest.model === "gpt-5.6-luna" &&
      r1C1R2R2Manifest.stage === "PB-01 v6 only" &&
      r1C1R2R2Manifest.authorized_calls === 4 &&
      r1C1R2R2Manifest.actual_calls === 4 &&
      r1C1R2R2Manifest.completed_calls === 4 &&
      r1C1R2R2Manifest.additional_provider_calls === 0 &&
      r1C1R2R2Manifest.retry_count === 0 &&
      r1C1R2R2Manifest.repair_count === 0 &&
      r1C1R2R2Manifest.fallback_count === 0 &&
      r1C1R2R2Manifest.pb_02_through_pb_06_calls === 0 &&
      r1C1R2R2Manifest.db_operations === 0 &&
      r1C1R2R2Manifest.supabase_operations === 0 &&
      r1C1R2R2Manifest.holdout_use === 0 &&
      r1C1R2R2Manifest.real_user_data === 0 &&
      r1C1R2R2Manifest.authorization_consumed === true &&
      r1C1R2R2Manifest.rerun_authorized === false &&
      r1C1R2R2Manifest.provider_quality_established === false &&
      r1C1R2R2Manifest.full_eight_case_confirmation_required === true &&
      r1C1R2R2Manifest.active_runtime_changed === false &&
      r1C1R2R2Manifest.main_changed === false &&
      r1C1R2R2Manifest.c2_eligible === false &&
      r1C1R2R2Manifest.c2_authorized === false &&
      r1C1R2R2Manifest.next_candidate ===
        "M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision" &&
      r1C1R2R2Manifest.next_candidate_authorized === false &&
      r1C1R2R2Authorization.consumed === true &&
      r1C1R2R2Authorization.rerun_authorized === false &&
      r1C1R2R2Authorization.actual_calls === 4 &&
      r1C1R2R2Results.status ===
        "provider_targeted_diagnostic_failed_pending_human_chatgpt_review" &&
      r1C1R2R2Results.evaluation.verdict === "FAIL" &&
      r1C1R2R2Results.evaluation.case_pass_count === 3 &&
      r1C1R2R2Results.evaluation.targeted_repairs === "PASS" &&
      r1C1R2R2Results.evaluation.normal_regression_control === "FAIL" &&
      r1C1R2R2Results.evaluation.principal_r2r2_03_quoted_ownership ===
        "PASS" &&
      r1C1R2R2Results.calls_actual === 4 &&
      r1C1R2R2Results.calls_completed === 4 &&
      r1C1R2R2Results.retry_count === 0 &&
      r1C1R2R2Results.repair_count === 0 &&
      r1C1R2R2Results.fallback_count === 0 &&
      r1C1R2R2Results.pb_02_through_pb_06_calls === 0 &&
      r1C1R2R2Results.db_operations === 0 &&
      r1C1R2R2Results.supabase_operations === 0 &&
      r1C1R2R2Results.holdout_use === 0 &&
      r1C1R2R2Results.real_user_data === 0 &&
      r1C1R2R2Results.active_runtime_changed === false &&
      r1C1R2R2Results.rerun_authorized === false &&
      r1C1R2R2Results.c2_eligible === false &&
      r1C1R2R2Results.c2_authorized === false,
    `R1-C1-R2-R2 failed-targeted-review boundary differs: execution=${actualR1C1R2R2ExecutionPaths.join(",")}; review_sync=${actualR1C1R2R2ReviewSyncPaths.join(",")}; cumulative=${actualR1C1R2R2Paths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    exactR1C1R2R2R1Paths.length === 13 &&
      exactR1C1R2R2R1AcceptanceSyncPaths.length === 8 &&
      isExactLiteralSet(
        actualR1C1R2R2R1ImplementationPaths,
        exactR1C1R2R2R1Paths,
      ) &&
      isExactLiteralSet(
        actualR1C1R2R2R1AcceptanceSyncPaths,
        exactR1C1R2R2R1AcceptanceSyncPaths,
      ) &&
      isExactLiteralSet(actualR1C1R2R2R1Paths, exactR1C1R2R2R1Paths) &&
      r1C1R2R2R1Manifest.task_id === "M2-P4-I3-R1-C1-R2-R2-R1" &&
      r1C1R2R2R1Manifest.status ===
        "human_chatgpt_accepted_complete" &&
      r1C1R2R2R1Manifest.offline_practical_reason_revision_accepted ===
        true &&
      r1C1R2R2R1Manifest.accepted_implementation_commit ===
        r1C1R2R2R1AcceptedImplementationSha &&
      JSON.stringify(r1C1R2R2R1Manifest.implementation_snapshot) ===
        JSON.stringify(expectedR1C1R2R2R1ImplementationSnapshot) &&
      r1C1R2R2R1Manifest.baseline === r1C1R2R2ReviewSha &&
      r1C1R2R2R1Manifest.branch ===
        "feat/m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency" &&
      isExactLiteralSet(
        [...r1C1R2R2R1Manifest.exact_mutation_paths].sort((left, right) =>
          left.localeCompare(right, "en"),
        ),
        exactR1C1R2R2R1Paths,
      ) &&
      r1C1R2R2R1Manifest.exact_mutation_path_count === 13 &&
      isExactLiteralSet(
        [
          ...r1C1R2R2R1Manifest.acceptance_sync_exact_paths,
        ].sort((left, right) => left.localeCompare(right, "en")),
        exactR1C1R2R2R1AcceptanceSyncPaths,
      ) &&
      r1C1R2R2R1Manifest.acceptance_sync_exact_path_count === 8 &&
      r1C1R2R2R1Manifest.prompt === "pb-01-structure-v7" &&
      r1C1R2R2R1Manifest.catalog === "runtime-stage-catalog-v8.0.0" &&
      r1C1R2R2R1Manifest.prompt_bundle ===
        "prompt-bundle-runtime-v8.0.0" &&
      r1C1R2R2R1Manifest.provider_schema === "pipeline-schema-v5.0.0" &&
      r1C1R2R2R1Manifest.candidate_runtime_schema_set ===
        "pipeline-schema-runtime-v3.2.0" &&
      r1C1R2R2R1Manifest.grounded_schema === "pipeline-schema-v4.0.0" &&
      r1C1R2R2R1Manifest.practical_reason_consistency_implemented === true &&
      r1C1R2R2R1Manifest.targeted_repairs_preserved === "3/3" &&
      r1C1R2R2R1Manifest.ownership_sequence_preserved === true &&
      r1C1R2R2R1Manifest.candidate_catalog_inactive === true &&
      r1C1R2R2R1Manifest.provider_calls === 0 &&
      r1C1R2R2R1Manifest.provider_outputs_mutated === 0 &&
      r1C1R2R2R1Manifest.provider_quality_established === false &&
      r1C1R2R2R1Manifest.final_eight_case_confirmation_required === true &&
      r1C1R2R2R1Manifest.final_eight_case_confirmation_authorized === false &&
      r1C1R2R2R1Manifest.active_runtime_changed === false &&
      r1C1R2R2R1Manifest.db_operations === 0 &&
      r1C1R2R2R1Manifest.supabase_operations === 0 &&
      r1C1R2R2R1Manifest.holdout_use === 0 &&
      r1C1R2R2R1Manifest.real_user_data === 0 &&
      r1C1R2R2R1Manifest.protected_diff === 0 &&
      r1C1R2R2R1Manifest.main_changed === false &&
      r1C1R2R2R1Manifest.c2_eligible === false &&
      r1C1R2R2R1Manifest.c2_authorized === false &&
      r1C1R2R2R1Manifest.next_candidate ===
        "M2-P4-I3-R1-C1-R3 Final Eight-Case PB-01 Provider Confirmation" &&
      r1C1R2R2R1Manifest.next_candidate_authorized === false &&
      r1C1R2R2R1Manifest.i3_final_acceptance === "pending" &&
      r1C1R2R2R1Manifest.milestone_2 === "incomplete",
    `R1-C1-R2-R2-R1 accepted offline successor boundary differs: implementation=${actualR1C1R2R2R1ImplementationPaths.join(",")}; acceptance_sync=${actualR1C1R2R2R1AcceptanceSyncPaths.join(",")}; cumulative=${actualR1C1R2R2R1Paths.join(",")}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    !isExactLiteralSet(
      [...finalPlanningManifest.exact_mutation_paths, exactR1APaths[0]],
      finalPlanningManifest.exact_mutation_paths,
    ),
    "Final Planning accepted an R1-A successor path",
  );
  for (const unauthorizedPath of [
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
    "ai/schemas/unauthorized.schema.json",
    "ai/prompts/unauthorized.developer.md",
    "components/runtime/UnauthorizedComponent.tsx",
    "app/unauthorized/page.tsx",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  ]) {
    check(
      "M2_P3_I2_RENDERER_ONLY_GATE",
      !isExactLiteralSet([...exactR1APaths, unauthorizedPath], exactR1APaths),
      `R1-A accepted unauthorized path: ${unauthorizedPath}`,
    );
  }
  for (const unauthorizedPath of [
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
    "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
    "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
    "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
    "lib/assessment/runtime/policy-v3.ts",
    "components/runtime/Unauthorized.tsx",
  ]) {
    check(
      "M2_P3_I2_RENDERER_ONLY_GATE",
      !isExactLiteralSet([...exactR1BPaths, unauthorizedPath], exactR1BPaths),
      `R1-B accepted unauthorized path: ${unauthorizedPath}`,
    );
  }
  for (const unauthorizedPath of [
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
    "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
    "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
    "lib/assessment/runtime/structured-intake-grounding-v4.ts",
    "lib/assessment/runtime/writing-context-integrity-v1.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "components/runtime/Unauthorized.tsx",
    "app/unauthorized/page.tsx",
    "evals/development/unauthorized.json",
    "evals/holdout/unauthorized.json",
  ]) {
    check(
      "M2_P3_I2_RENDERER_ONLY_GATE",
      !isExactLiteralSet([...exactC1Paths, unauthorizedPath], exactC1Paths),
      `R1-C1 accepted unauthorized path: ${unauthorizedPath}`,
    );
    check(
      "M2_P3_I2_RENDERER_ONLY_GATE",
      !isExactLiteralSet(
        [...exactC1ReviewSyncPaths, unauthorizedPath],
        exactC1ReviewSyncPaths,
      ),
      `R1-C1 review sync accepted unauthorized path: ${unauthorizedPath}`,
    );
    check(
      "M2_P3_I2_RENDERER_ONLY_GATE",
      !isExactLiteralSet(
        [...exactR1C1R2ReviewSyncPaths, unauthorizedPath],
        exactR1C1R2ReviewSyncPaths,
      ),
      `R1-C1-R2 review sync accepted unauthorized path: ${unauthorizedPath}`,
    );
    check(
      "M2_P3_I2_RENDERER_ONLY_GATE",
      !isExactLiteralSet(
        [...exactR1C1R2R2ReviewSyncPaths, unauthorizedPath],
        exactR1C1R2R2ReviewSyncPaths,
      ),
      `R1-C1-R2-R2 review sync accepted unauthorized path: ${unauthorizedPath}`,
    );
  }
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    protectedI2Diff === "",
    `I2 changed protected runtime/API/DB/Prompt/Schema paths: ${protectedI2Diff}`,
  );
  check(
    "M2_P3_I2_RENDERER_ONLY_GATE",
    i2PageSource.includes('process.env.NODE_ENV === "production"') &&
      i2PageSource.includes(
        'process.env.M2_INTERNAL_RUNTIME_ENABLED !== "true"',
      ) &&
      i2PageSource.includes("notFound()") &&
      i2PageSource.includes("index: false") &&
      i2PageSource.includes("follow: false") &&
      !i2PageSource.includes("/api/internal/assessments") &&
      !i2ExecutionSources.includes("fetch(") &&
      !i2ExecutionSources.includes('from "openai"') &&
      !i2ExecutionSources.includes("@supabase/supabase-js") &&
      !i2ExecutionSources.includes("createClient(") &&
      !i2ExecutionSources.includes(".rpc("),
    "I2 fixed preview is not production-disabled and zero-execution",
  );
});

gate("M2_P3_DEPENDENCY_AUDIT_GATE", () => {
  const requiredCommands = [
    "npm.cmd audit --omit=dev --json",
    "npm.cmd audit --json",
    "npm.cmd ls --depth=0",
  ];
  const requiredPackages = [
    "openai",
    "ajv",
    "@supabase/supabase-js",
    "next",
    "react",
  ];
  const permittedClassifications = new Set([
    "production-reachable",
    "production-installed but not runtime-reachable",
    "development-only",
    "false positive / not applicable",
  ]);
  const highOrCritical = dependencyAuditSummary.findings.filter((finding) =>
    ["high", "critical"].includes(finding.severity),
  );
  check(
    "M2_P3_DEPENDENCY_AUDIT_GATE",
    dependencyAuditSummary.schema_version ===
      "m2-p3-a-dependency-audit-summary-v1" &&
      JSON.stringify(dependencyAuditSummary.commands) ===
        JSON.stringify(requiredCommands) &&
      requiredPackages.every(
        (packageName) =>
          typeof dependencyAuditSummary.installed_packages[packageName]
            ?.version === "string",
      ) &&
      highOrCritical.length >= 4 &&
      highOrCritical.every(
        (finding) =>
          typeof finding.package === "string" &&
          typeof finding.direct === "boolean" &&
          ["production", "development"].includes(finding.dependency_scope) &&
          Array.isArray(finding.dependency_paths) &&
          finding.dependency_paths.length > 0 &&
          typeof finding.affected_version === "string" &&
          typeof finding.patched_version_availability === "string" &&
          permittedClassifications.has(finding.runtime_classification) &&
          typeof finding.runtime_reachability_evidence === "string" &&
          typeof finding.proposed_safe_remediation === "string" &&
          typeof finding.remediation_breaking === "boolean" &&
          typeof finding.resolved === "boolean",
      ) &&
      dependencyReviewSource.includes("MODULE_TYPELESS_PACKAGE_JSON"),
    "dependency evidence, classification, or warning review is incomplete",
  );
});

gate("M2_P3_PRODUCTION_VULNERABILITY_GATE", () => {
  const unresolvedProductionReachable =
    dependencyAuditSummary.findings.filter(
      (finding) =>
        !finding.resolved &&
        ["high", "critical"].includes(finding.severity) &&
        finding.runtime_classification === "production-reachable",
    );
  check(
    "M2_P3_PRODUCTION_VULNERABILITY_GATE",
    unresolvedProductionReachable.length === 0 &&
      dependencyAuditSummary.decision
        .unresolved_production_reachable_high_or_critical === 0 &&
      dependencyAuditSummary.decision.r1_automated_gate === "pass" &&
      dependencyReviewSource.includes(
        "Human / ChatGPT acceptance remains on hold",
      ),
    "an unresolved production-reachable high/critical finding remains",
  );
});

gate("M2_P3_SUPABASE_DEPENDENCY_GATE", () => {
  const baselinePackage = JSON.parse(
    gitText(["show", `${baselineSha}:package.json`]),
  );
  const installed = dependencyAuditSummary.installed_packages;
  check(
    "M2_P3_SUPABASE_DEPENDENCY_GATE",
    installed["@supabase/supabase-js"].version ===
      packageLock.packages["node_modules/@supabase/supabase-js"].version &&
      installed["@supabase/supabase-js"].dependency_status ===
        "direct production dependency" &&
      installed["@supabase/supabase-js"].introduction === "pre-existing" &&
      typeof baselinePackage.dependencies["@supabase/supabase-js"] ===
        "string" &&
      installed.openai.version ===
        packageLock.packages["node_modules/openai"].version &&
      installed.ajv.version === packageLock.packages["node_modules/ajv"].version &&
      installed.next.version ===
        packageLock.packages["node_modules/next"].version &&
      installed.react.version ===
        packageLock.packages["node_modules/react"].version &&
      packageManifest.dependencies["@supabase/supabase-js"] !== undefined,
    "required dependency versions or Supabase provenance differ",
  );
});

gate("M2_P3_ATOMIC_FINALIZATION_GATE", () => {
  const originalMigrationDiff = gitText([
    "diff",
    "--name-only",
    "HEAD",
    "--",
    "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
  ]).trim();
  for (const required of [
    "create function public.finalize_completed_assessment(",
    "p_report_id uuid",
    "p_run_id uuid",
    "p_request_id uuid",
    "p_report_json jsonb",
    "p_decision_card_json jsonb",
    "security invoker",
    "set search_path = ''",
    "insert into public.assessment_reports",
    "update public.assessment_runs",
    "update public.assessment_requests",
    "from public",
    "from anon",
    "from authenticated",
    "to service_role",
  ]) {
    check(
      "M2_P3_ATOMIC_FINALIZATION_GATE",
      atomicMigrationSource.includes(required),
      `atomic migration is missing ${required}`,
    );
  }
  check(
    "M2_P3_ATOMIC_FINALIZATION_GATE",
    repositorySource.includes(
      'this.client.rpc("finalize_completed_assessment"',
    ) &&
      !repositorySource.includes(
        'this.client.from("assessment_reports").insert',
      ) &&
      pipelineSource.includes(
        "this.repository.finalizeCompletedAssessment",
      ) &&
      !pipelineSource.includes("this.repository.saveReport") &&
      !/\bexecute\s+(format|immediate)\b/iu.test(atomicMigrationSource) &&
      originalMigrationDiff === "" &&
      [
        "assessment_requests",
        "assessment_runs",
        "assessment_stage_runs",
        "assessment_reports",
      ].every((table) =>
        migrationSource.includes(
          `alter table public.${table} enable row level security`,
        ),
      ),
    "final writes are not isolated to one fixed, server-only transaction",
  );
});

gate("M2_P3_FINALIZATION_ROLLBACK_GATE", () => {
  const happyRun = happy.repository.runs.get(happyResult.runId);
  const happyRequest = happy.repository.requests.get(happyResult.requestId);
  const rollbackRuntimes = [reportInsertFailure, runUpdateFailure];
  check(
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    happy.repository.reports.size === 1 &&
      happyRun?.status === "completed" &&
      happyRun?.decision === happyResult.decision &&
      happyRequest?.status === "completed" &&
      happy.repository.events.includes("finalizeCompletedAssessment"),
    "successful final writes did not commit together",
  );
  check(
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    rollbackRuntimes.every(
      (runtime) =>
        runtime.repository.reports.size === 0 &&
        [...runtime.repository.runs.values()].every(
          (run) => run.status === "failed" && run.decision === undefined,
        ) &&
        runtime.repository.events.includes(
          "finalizeCompletedAssessment:rollback",
        ) &&
        runtime.transport.calls.length === 6,
    ),
    "a finalization failure left a partial report/run state",
  );
  check(
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    duplicateFinalizationCode === "M2_FINALIZATION_STATE_CONFLICT" &&
      happy.repository.reports.size === 1,
    "duplicate finalization was not rejected without a duplicate report",
  );
});

gate("M2_P3_CONCURRENT_IDEMPOTENCY_GATE", () => {
  const fulfilled = concurrentResults.filter(
    (result) => result.status === "fulfilled",
  );
  const rejected = concurrentResults.filter(
    (result) => result.status === "rejected",
  );
  check(
    "M2_P3_CONCURRENT_IDEMPOTENCY_GATE",
    fulfilled.length === 1 &&
      rejected.length === 1 &&
      rejected[0]?.reason?.safeCode === "M2_DUPLICATE_SUBMISSION" &&
      concurrent.repository.requests.size === 1 &&
      concurrent.repository.runs.size === 1 &&
      concurrent.repository.reports.size === 1 &&
      concurrent.transport.calls.length === 6 &&
      repositorySource.includes('error?.code === "23505"') &&
      repositorySource.includes('"M2_IDEMPOTENCY_CONFLICT"') &&
      applicationSource.includes(
        'error.safeCode === "M2_IDEMPOTENCY_CONFLICT"',
      ) &&
      sameKeyAfterFailure.transport.calls.length === 0 &&
      deliberateResubmissionResult.eligibility === "ready" &&
      deliberateResubmission.transport.calls.length === 6 &&
      resubmissionRepository.requests.size === 2,
    "concurrent submissions can create duplicate requests or provider runs",
  );
});

gate("M2_P3_PERSIST_BEFORE_PROVIDER_GATE", () => {
  const startWriteIndex = pipelineSource.indexOf(
    "await this.repository.startStage",
  );
  const providerCallIndex = pipelineSource.indexOf(
    "response = await this.transport.invoke",
  );
  const persistedStageIds = [...happy.repository.stageRuns.values()].map(
    (stage) => stage.stageId,
  );
  check(
    "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
    createRequestFailure.transport.calls.length === 0 &&
      createRunFailure.transport.calls.length === 0 &&
      firstStageStartFailure.transport.calls.length === 0 &&
      startWriteIndex >= 0 &&
      providerCallIndex > startWriteIndex &&
      happy.transport.calls.every((stageId) =>
        persistedStageIds.includes(stageId),
      ),
    "provider execution can occur before request/run/Stage start persistence",
  );
  check(
    "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
    !pb05Failure.transport.calls.includes("PB-06") &&
      needsMore.repository.reports.size === 0 &&
      safetyBlocked.repository.reports.size === 0,
    "a failed or unauthorized path reached PB-06/final report persistence",
  );
});

gate("M2_P3_R1_RUNTIME_HARDENING_GATE", () => {
  const prerequisiteGates = [
    "M2_P3_DEPENDENCY_AUDIT_GATE",
    "M2_P3_PRODUCTION_VULNERABILITY_GATE",
    "M2_P3_SUPABASE_DEPENDENCY_GATE",
    "M2_P3_ATOMIC_FINALIZATION_GATE",
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    "M2_P3_CONCURRENT_IDEMPOTENCY_GATE",
    "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
  ];
  check(
    "M2_P3_R1_RUNTIME_HARDENING_GATE",
    prerequisiteGates.every(
      (gateName) => failures.get(gateName).length === 0,
    ) &&
      JSON.parse(runtimePackageSource).type === "module" &&
      dependencyAuditSummary.execution_evidence.openai_calls === 0 &&
      dependencyAuditSummary.execution_evidence.supabase_calls === 0 &&
      dependencyAuditSummary.execution_evidence.api_spend_usd === 0,
    "one or more R1 hardening prerequisites failed",
  );
});

for (const gateName of gateOrder) {
  for (const detail of failures.get(gateName)) {
    console.error(`FAIL_DETAIL | gate=${gateName} | ${detail}`);
  }
  console.log(
    `${gateName}: ${failures.get(gateName).length === 0 ? "PASS" : "FAIL"}`,
  );
}

const passed = gateOrder.every(
  (gateName) => failures.get(gateName).length === 0,
);
console.log(`M2_P3_RUNTIME_VERTICAL_SLICE_GATE: ${passed ? "PASS" : "FAIL"}`);
process.exitCode = passed ? 0 : 1;
