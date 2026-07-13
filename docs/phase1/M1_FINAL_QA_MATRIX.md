# M1_FINAL_QA_MATRIX.md

## Status vocabulary and evidence boundary

- `Automated PASS`: supported by source audit, build output, HTTP, rendered HTML, or deterministic calculation.
- `Human pending`: requires device/browser visual or keyboard evidence that CodeX did not claim.
- `Not applicable`: the criterion does not apply to the route.
- `Deferred`: intentionally outside M1-I6.

All 30 rows returned HTTP 200 and exactly one `h1`. Responsive and complete keyboard/focus status remain `Human pending` even where source-level containment and semantics passed. No in-app browser was used.

| Route | Purpose | Review/public boundary | HTTP | Heading | Responsive | Keyboard/focus | Touch target | Contrast | Link integrity | Fail-closed applicability | Runtime/network | Human visual status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | LP and request entry | Public | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | Balanced mobile headings; non-fixed CTA preserved; public labels localized. |
| `/request` | Three-step local form | Public with local-review notice | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Native fields/labels; first-error focus and hash correction behavior preserved. |
| `/review` | Review inventory and current gate | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | M1-I6 Human QA gate shown; Milestone 2 remains unauthorized. |
| `/review/request/normal-allowed` | Allowlisted normal state | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | Only normal state links to request confirmation. |
| `/review/request/needs-review` | Review-risk stop | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No purchase or ordinary-report forward path. |
| `/review/request/rejected` | Reject-risk stop | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No romance encouragement or normal continuation. |
| `/review/request/contradictory-selection` | Correctable Safety conflict | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Correction returns to Step 3; no forward path. |
| `/review/request/invalid-age` | 18+ gate stop | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No DOB or identity-document request. |
| `/review/request/missing-consent` | Required acknowledgement stop | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Returns to Step 3; no marketing consent. |
| `/review/request/unknown-error` | Unknown state stop | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Unknown never becomes normal. |
| `/review/request/confirmation/normal-001` | Review request confirmation | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Allowlisted normal fixture only; correction links valid. |
| `/review/purchase/confirmation/normal-001` | Payment-free final confirmation | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Raw `none` localized; purchase control remains native disabled. |
| `/sample-report` | Fictional public writing sample | Public | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | One primary `架空サンプル`; sample ID is collapsed review metadata. |
| `/review/result/result-normal-001` | Nine-section Web report | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | `50rem` measure; fixture text and judgment unchanged. |
| `/review/save-report/result-normal-001` | Save-oriented quick reference | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | `52rem` measure; no file/download/print/copy/share behavior. |
| `/review/error/missing-fixture` | Missing-fixture error | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No normal fallback. |
| `/review/error/unavailable-report` | Static unavailable-report error | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No retry job, generation, or transaction claim. |
| `/legal` | Legal review hub | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | One warm current item with visible `現在`. |
| `/legal/terms` | Terms draft review | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | Draft/publication boundary preserved. |
| `/legal/privacy` | Privacy draft review | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | Current non-send behavior remains distinct from future plan. |
| `/legal/tokushoho` | Tokushoho rows review | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | Long rows use responsive grid and safe breaking. |
| `/legal/refund` | Refund policy review | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | Candidate policy and unresolved status remain separate. |
| `/legal/ai-disclosure` | AI use/limit review | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Not applicable | Automated PASS | Human pending | No AI runtime added. |
| `/legal/unsupported-cases` | Safety boundary review | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | Blocked-state links remain review-only and non-transactional. |
| `/contact` | Inactive contact preparation | Legal review boundary + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No form, input, button, `mailto:`, or active endpoint. |
| `/review/request/not-allowlisted` | Unknown request-state fail closed | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No normal confirmation, price, judgment, or fallback fixture. |
| `/review/request/confirmation/rejected-001` | Rejected confirmation fail closed | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No normal fixture content or purchase continuation. |
| `/review/purchase/confirmation/not-allowlisted` | Unknown purchase fail closed | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No price card, disabled normal purchase panel, or report. |
| `/review/result/not-allowlisted` | Unknown Web result fail closed | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No fixed judgment, normal report chapters, or fixture fallback. |
| `/review/save-report/not-allowlisted` | Unknown save result fail closed | Review banner + noindex | Automated PASS | Automated PASS | Human pending | Human pending | Automated PASS | Human pending | Automated PASS | Automated PASS | Automated PASS | Human pending | No save content, judgment, generated-file status, or fallback. |

## Cross-route automated evidence

- 30 documented route responses: HTTP 200 and one `h1` each.
- 25 distinct active internal link targets: HTTP 200.
- 19 audited `/review/**` URLs: centralized rendered `noindex, nofollow` and review banner.
- Eight legal/contact routes: retained `noindex, nofollow`, exactly one `aria-current="page"`, visible `現在`, and all legal boundary labels.
- Five explicit fail-closed routes: normal-content negative assertions passed.
- Favicon: root icon metadata and `/icon.svg` HTTP 200 `image/svg+xml` passed.
- Public copy, sample truth/metadata placement, localized `なし` rows, native disabled purchase control, and inactive contact assertions passed.

## Human gate

`Human Visual QA remains required.` Milestone 1 remains unaccepted until Human reviews representative routes and accepts M1-I6. Milestone 2 remains unauthorized.
