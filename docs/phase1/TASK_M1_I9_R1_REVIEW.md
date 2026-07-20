# Task M1-I9-R1 Reading Note Preview Alignment Review

## 1. Authority

- Task ID: `M1-I9-R1`
- Task name: `Reading Note Preview Alignment`
- Human authority: Checkpoint B / M1-I8-R1 and M1-I9-R1 are accepted; fast-forward of this accepted branch to `main` and M1-I12 Final QA are explicitly authorized.
- Branch: `feat/m1-i9-r1-reading-note-preview-alignment`
- Expected commit: `feat: align LP previews with Lunar Contrast artifacts`
- Browser, browser automation, GUI control, and screenshots by CodeX/agents: prohibited and not used.
- Fast-forward of this branch to `main`: authorized. M1-I12: Human-authorized and not yet completed. Milestone 1 completion and Milestone 2: unauthorized.

## 2. Base commit

- Base and final accepted Checkpoint B `main`: `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`
- Accepted Checkpoint B implementation-and-polish commit: `bb2079aafb3666562e2876ead4c24a5c933bea8a`
- Branch creation: from the exact clean `main` base above after `origin/main` synchronization.

## 3. Exact mutation manifest

Application:

- `app/page.tsx`
- `app/globals.css`

Documentation:

- `docs/ROADMAP.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/M1_P3_IMPLEMENTATION_PLAN.md`
- `docs/phase1/TASK_M1_I9_R1_REVIEW.md`

No other file is authorized or changed.

## 4. Checkpoint B acceptance

- Checkpoint B / M1-I8-R1 is Human-accepted.
- B — `Lunar Contrast Edition` is the canonical design.
- Implementation and automated validation are complete.
- Primary desktop and 390px Visual QA is complete.
- Accepted implementation-and-polish commit: `bb2079aafb3666562e2876ead4c24a5c933bea8a`.
- Acceptance synchronization commit: `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`.
- The accepted branch was fast-forwarded to `main` without a merge commit and pushed to `origin/main`.

## 5. Hero cover alignment

The existing `lp-note-cover` remains subordinate to the Hero sales copy and becomes a compact canonical Lunar Contrast cover:

- strong Night cover using the existing `ArtifactCover`;
- restrained existing `LunarArc` and `MoonSeal` decoration;
- preserved `月の返事`, `恋のメッセージ鑑定ノート`, `今夜の答えを、一冊の中へ。`, `今夜の答え`, `送る場合の文面`, `3日間の行動方針`, and `架空の内容見本`;
- independent `ArtifactAnswer` threshold reading `preview.judgmentLabel` directly from the accepted fixture object; and
- explicit fictional-sample labelling, with no fixed/sticky position, animation, external font, or external asset.

## 6. Product proof alignment

`#note` retains one editorial composition in this DOM and visual order:

1. short fixed-case sample;
2. Web鑑定ノート — `深く読む一冊`; and
3. 保存用判断カード — `30秒で見返す`.

The short sample uses a restrained Night cover, independent Night answer band, and Paper detail body. The Web preview repeats the accepted cover/answer grammar at reduced scale and links to `/review/result/result-normal-001`. The save preview uses a compact Paper decision-card composition with its own Night answer band and links to `/review/save-report/result-normal-001`. Every judgment rendering reads `preview.judgmentLabel`; no fixture value is copied into local data and no report content is invented.

## 7. Same-case / different-case boundary

- `#note` explicitly states that its three formats use the same fixed fictional case and are not three different judgments.
- The public case section remains a comparison of three different fixed fictional cases with distinct conclusions.
- The `#note` footer identifies `/sample-report` as a different `送る` case before linking to it.
- `PUBLIC_SAMPLE_CASES`, all three conclusions, facts, review conditions, and the public-section CTA remain source-owned and unchanged.

## 8. Public case alignment

The three public cases retain all content and become one continuous Paper editorial comparison on the surrounding Night section:

- non-equal desktop columns avoid a generic equal-card grid;
- no sequence of three Night cards and no gold body text;
- conclusions remain before context, facts, and review conditions in the DOM;
- shared rules and a restrained middle-column Paper tint preserve comparison without making each case a mini report; and
- the R2 correction makes the single-column reflow controlling at and below 760px, including 390px and 320px, while preserving the editorial three-column comparison above 760px.

## 9. Responsive

| Target | Source result |
| --- | --- |
| Desktop | Hero copy and compact cover remain a balanced two-column composition; `#note` is an asymmetric main/aside composition; Web and save links are visible. |
| 768px | This bounded correction does not alter 768px: the later M1-I9 outer grid remains controlling, while the final 960px override keeps the aside itself to one column. DOM order remains unchanged. |
| 390px | Hero cover uses full available width; explicit title line break remains balanced; answer threshold remains normal flow. M1-I9-R1-R1 re-establishes the intended one-column `#note` cascade after the late desktop override; public cases remain one column; links retain at least `2.75rem` height; no fixed/sticky CTA is added. |
| 320px | The M1-I9-R1-R1 one-column `#note` rules remain controlling; formal names remain in source; global body remains `16px`; internal artifact padding is `1.125rem` / 18px; decorative arcs and added shadows are removed first; no overflow masking is added. Final Human confirmation remains pending. |

## 10. Accessibility

- Page `h1`: exactly one, the existing Hero `h1`.
- New headings: `h3` only under the existing `#note` `h2`; heading order remains intact.
- DOM order equals visual order; no CSS `order` is introduced.
- Existing `LunarArc` and unlabelled `MoonSeal` components remain `aria-hidden`.
- Direct links have a minimum height of `2.75rem` / 44px and inherit the global 3px visible focus ring.
- Body copy remains left-aligned sans-serif with accepted Ink/Paper or Paper/Night roles; color is not the sole carrier of meaning.
- No motion is added; the existing reduced-motion behavior remains sufficient.
- Source structure remains complete for 200% zoom; final Human zoom/focus confirmation remains M1-I12 work.

## 11. Content locks

- `EXACT_LOCKS: PASS`
- `SEMANTIC_ASSERTIONS: PASS`
- `CONTENT_LOCK_GATE: PASS`
- `preview.judgmentLabel`: read directly at every LP answer consumer.
- `PUBLIC_SAMPLE_CASES`, product and artifact names, JPY 980 price, 18+ policy, AI disclosure, non-guarantee, Safety-before-payment, and inactive runtime remain unchanged.

## 12. Safety

- `UNSUPPORTED_CASES_EXACT_LOCK: PASS`
- `SEM-UNSUPPORTED-CASES: PASS`
- `SAFETY_POLICY_GATE: PASS`
- No `fixtures/**`, `lib/**`, request, purchase, legal, or Safety owner is changed.

## 13. Typecheck

- Command: `npm.cmd run typecheck`
- Result: PASS.

## 14. Lint

- Command: `npm.cmd run lint`
- Result: PASS with zero warnings.

## 15. Build

- Command: `npm.cmd run build`
- Result: PASS; 28 static/SSG pages generated.

## 16. HTTP checks

| Route | Status | Required evidence |
| --- | --- | --- |
| `/` | 200 | one `h1`; Web/save/public links; same-case and different-case wording; exact fixed judgment; all three public conclusions |
| `/sample-report` | 200 | public full sample remains available |
| `/review/result/result-normal-001` | 200 | canonical Web鑑定ノート remains available |
| `/review/save-report/result-normal-001` | 200 | canonical 保存用判断カード remains available |

The review routes remain display-only: opening them does not purchase, generate, deliver, email, or save anything.

## 17. CSS asset gate

- Review server: one clean production `next start` process on port `3018`.
- HTML CSS hrefs: extracted from all four required routes.
- Every CSS URL: HTTP 200 and non-empty.
- Required selectors present in served CSS: `.lp-note-cover`, `.lp-artifact`, `.lp-decision-card`, `.lp-sample-cases`.
- `CSS_ASSET_GATE: PASS`.

## 18. Prohibited-scope audit

- Changed files equal the ten-file manifest in section 3.
- `components/**`, `fixtures/**`, `lib/**`, `scripts/**`, package files, report routes/components, request, purchase, legal, Header, Footer, product facts, judgment, public conclusions, price, age, Safety, and runtime: zero diff.
- Added package, external font/image, AI, DB, payment, email, API, server action, persistence, analytics, generation, download, print, share, fixed/sticky CTA, parallax, animation, star particles, occult imagery, and overflow masking: zero.
- Browser/screenshots: not used.

## 19. Human QA matrix

| Surface | Desktop | 768px | 390px | 320px |
| --- | --- | --- | --- | --- |
| Hero cover preview | Human-accepted | Source reflow validated | Human-accepted | Deferred to M1-I12 |
| Same-case product proof | Human-accepted | Source reflow validated | Human-accepted | Deferred to M1-I12 |
| Web/save direct links | Human-accepted | Source target/order validated | Human-accepted | Deferred to M1-I12 |
| Different-case public comparison | Human-accepted | Source reflow validated | Human-accepted | Deferred to M1-I12 |

Human completed primary desktop/390px comparison of the LP preview against the accepted canonical Web and save artifacts in ordinary external Microsoft Edge, including hierarchy, answer discoverability, boundary clarity, Japanese wrapping, and link visibility. This acceptance is Human evidence; CodeX/agents make no independent visual-acceptance claim.

## 20. Limitations

- Automated and raw-HTTP evidence does not establish visual quality or device rendering.
- No Browser, screenshot, viewport automation, Playwright, CDP, Puppeteer, Selenium, or GUI browser control was used.
- Primary desktop and 390px Human Visual QA of M1-I9-R1 is complete and accepted.
- Final 320px Human review, 200% zoom, keyboard/focus, reduced-motion, reading-quality, and all-route regression remain held for M1-I12.
- No runtime feature, file generation, download, persistence, purchase, AI generation, or delivery capability was added.

## 21. Next gate

- M1-I8-R1: Human-accepted and merged to `main` by fast-forward.
- M1-I9-R1: Human-accepted at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`; implementation, automated validation, and primary desktop/390px Visual QA complete; fast-forward to `main` authorized.
- M1-I12: Human-authorized; not yet completed.
- Milestone 1: incomplete pending M1-I12.
- Milestone 2: unauthorized.

The next gate is acceptance synchronization, authorized fast-forward of M1-I9-R1 to `main`, and execution of the separately authorized M1-I12 validation/documentation-only final QA. Do not create a PR, merge commit, or start Milestone 2.

## 22. M1-I9-R1-R1 bounded mobile reflow correction

- Correction task ID: `M1-I9-R1-R1`.
- Human Visual QA found a release-blocking defect at 390px: the short sample was compressed into an extremely narrow column while the Web note and save card remained in the adjacent column.
- Static cascade audit identified the cause: the M1-I9 desktop `.lp-artifact` declaration appears after the original 960px media query and therefore restored `minmax(0, 1.18fr) minmax(18rem, 0.82fr)` below 960px. The later 640px media query did not reset the outer grid or its child minimum sizes.
- The bounded correction adds a final 640px rule that restores `minmax(0, 1fr)`, constrains every direct child to the available width, clears automatic minimum inline sizing, and keeps `.lp-artifact__aside`, `.lp-artifact__index`, and `.lp-decision-card` within one column.
- The 320px fallback inherits the same one-column structure and retains the existing 18px panel padding, decoration reduction, and shadow removal.
- DOM order, content, links, judgment data, fixed cases, Hero, desktop `#note`, public sample, canonical reports, Header, Footer, and all other LP sections are unchanged.
- No CSS `order`, horizontal-overflow masking, `writing-mode`, truncation, fixed/sticky positioning, or animation is added.
- `LP_MOBILE_REFLOW_GATE: PASS` from static source assertions at both 390px and 320px.
- Post-correction `EXACT_LOCKS`, `SEMANTIC_ASSERTIONS`, `SAFETY_POLICY_GATE`, and `CONTENT_LOCK_GATE`: PASS.
- Post-correction typecheck, lint with zero warnings, clean production build with 28 generated pages, and `git diff --check`: PASS.
- Post-correction raw-HTTP asset verification: `/` returned 200; both stylesheet hrefs returned 200 with non-empty bodies; all 14 served mobile-correction declarations were present; `CSS_ASSET_GATE: PASS`.
- Human primary desktop/390px Visual QA is complete and M1-I9-R1 is accepted at `82600df57481cae2c61d370288083a61f0c719c3`; M1-I12 is Human-authorized and not yet completed; Milestone 1 remains incomplete pending M1-I12.

## 23. M1-I9-R1-R2 different-case mobile reflow correction

- Correction task ID: `M1-I9-R1-R2`.
- Human Visual QA confirmed a second, separate release-blocking defect: the three cases under `相談内容によって、今夜の答えは変わります。` remained in three narrow columns at 390px, producing one-character-wide Japanese wrapping.
- Static cascade audit identified the cause: the late M1-I9 `.lp-sample-cases` desktop declaration restored the non-equal three-column grid after the original 960px single-column rule. The later media rule reset only case borders and padding, not the comparison grid itself.
- Exact R2 mutation manifest: `app/globals.css` and this review document. No component, fixture, Safety owner, canonical report, script, package, dependency, or runtime file is changed.
- Above 760px, the existing `minmax(0, 0.82fr) minmax(0, 1.16fr) minmax(0, 0.94fr)` editorial comparison remains unchanged.
- At and below 760px, the comparison grid is one `minmax(0, 1fr)` column. Each case is full width; each case and every direct child clears its automatic minimum inline size; desktop grid placement and vertical separators are reset; horizontal separators preserve case boundaries.
- The disclosure and `「送る」ケースの全文見本を読む` link become full-width normal-flow content. The link retains the global `2.75rem` / 44px minimum target.
- DOM and visual order remain the source order: `01 今夜は待つ`, `02 今夜は短く返信してよい`, `03 こちらからの追加連絡を止める`. No CSS `order` is introduced.
- The 320px fallback inherits the same one-column grid and keeps the existing 18px case padding. No `writing-mode`, horizontal-overflow masking, truncation, transform correction, fixed/sticky positioning, or animation is added.
- Static source verification: 15 responsive/cascade/order assertions passed; `LP_MOBILE_REFLOW_GATE: PASS`.
- Content and Safety verification: `EXACT_LOCKS`, `SEMANTIC_ASSERTIONS`, `UNSUPPORTED_CASES_EXACT_LOCK`, `SAFETY_POLICY_GATE`, and `CONTENT_LOCK_GATE`: PASS.
- Typecheck, lint with zero warnings, clean production build with 28 generated pages, and `git diff --check`: PASS.
- Raw HTTP on the new production server: `/`, `/sample-report`, `/review/result/result-normal-001`, and `/review/save-report/result-normal-001` returned 200.
- CSS asset integrity: two stylesheet assets returned 200 with non-empty bodies; 11 served-CSS desktop/mobile assertions passed; `CSS_ASSET_GATE: PASS`.
- Human completed and accepted the heading, cases 01 through 03, and lower disclosure/link at 390px; the complete single-column sequence at 320px remains held for M1-I12.
- M1-I9-R1 is Human-accepted at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`; fast-forward to `main` is authorized; no PR is created; M1-I12 is Human-authorized and not yet completed; Milestone 1 remains incomplete pending M1-I12.

## 24. Human acceptance

- Human accepted M1-I9-R1 Reading Note Preview Alignment.
- Accepted final implementation commit: `82600df57481cae2c61d370288083a61f0c719c3`.
- Implementation and automated validation are complete.
- Primary desktop/390px Visual QA is complete for the Hero, same-case three-format presentation, and different-case three-case comparison.
- The mobile one-character wrapping defect is resolved.
- Fast-forward to `main` is authorized.
- M1-I12 Final QA & Milestone 1 Acceptance Package is Human-authorized and not yet completed.
- Milestone 1 remains incomplete pending M1-I12. Milestone 2 remains unauthorized.
