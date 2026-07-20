# Task M1-I9-R1 Reading Note Preview Alignment Review

## 1. Authority

- Task ID: `M1-I9-R1`
- Task name: `Reading Note Preview Alignment`
- Human authority: Checkpoint B / M1-I8-R1 is accepted; fast-forward to `main` and this bounded LP-preview alignment are explicitly authorized.
- Branch: `feat/m1-i9-r1-reading-note-preview-alignment`
- Expected commit: `feat: align LP previews with Lunar Contrast artifacts`
- Browser, browser automation, GUI control, and screenshots by CodeX/agents: prohibited and not used.
- Merge of this branch to `main`, M1-I12, Milestone 1 completion, and Milestone 2: unauthorized.

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
- the existing single-column reflow remains controlling below 960px, including 390px.

## 9. Responsive

| Target | Source result |
| --- | --- |
| Desktop | Hero copy and compact cover remain a balanced two-column composition; `#note` is an asymmetric main/aside composition; Web and save links are visible. |
| 768px | Existing 960px reflow places the preview after Hero copy and the aside after the main artifact; the final M1-I9 override makes the aside a single column without changing DOM order. |
| 390px | Hero cover uses full available width; explicit title line break remains balanced; answer threshold remains normal flow; `#note` and public cases are one column; links retain at least `2.75rem` height; no fixed/sticky CTA is added. |
| 320px | Formal names remain in source; global body remains `16px`; decorative arcs and added shadows are removed first; no overflow masking is added. Final Human confirmation remains M1-I12 work. |

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
| Hero cover preview | Pending | Source reflow validated | Pending | Deferred to M1-I12 |
| Same-case product proof | Pending | Source reflow validated | Pending | Deferred to M1-I12 |
| Web/save direct links | Pending | Source target/order validated | Pending | Deferred to M1-I12 |
| Different-case public comparison | Pending | Source reflow validated | Pending | Deferred to M1-I12 |

Human should compare the LP preview against the accepted canonical Web and save artifacts in ordinary external Microsoft Edge, focusing on hierarchy, answer discoverability, boundary clarity, Japanese wrapping, and link visibility. CodeX/agents make no visual-acceptance claim.

## 20. Limitations

- Automated and raw-HTTP evidence does not establish visual quality or device rendering.
- No Browser, screenshot, viewport automation, Playwright, CDP, Puppeteer, Selenium, or GUI browser control was used.
- Primary desktop and 390px Human Visual QA of M1-I9-R1 remains pending.
- Final 320px, 200% zoom, keyboard/focus, and all-route regression remain held for M1-I12.
- No runtime feature, file generation, download, persistence, purchase, AI generation, or delivery capability was added.

## 21. Next gate

- M1-I8-R1: Human-accepted and merged to `main` by fast-forward.
- M1-I9-R1: implemented and automatically validated on its dedicated branch; Human Visual QA pending; not merged to `main`.
- M1-I12: unauthorized.
- Milestone 1: incomplete.
- Milestone 2: unauthorized.

The only next gate is Human Visual QA and acceptance of M1-I9-R1. Do not merge this branch to `main`, create a PR, or start M1-I12 without a later explicit Human decision.
