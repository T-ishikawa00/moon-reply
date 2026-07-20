# Task M1-I8-R1 Checkpoint A Acceptance and Checkpoint B Visual Excellence Review

## 1. Status and authority

- Task ID: `M1-I8-R1`
- Checkpoints: `A — Technical Preparation` and `B — Visual Excellence`
- Base / accepted documentation commit: `d6a9f111a2e15c54e9f250a2126d64abfacdefd0`
- Accepted locked-source base: `84edb93c6e098c65ae2e180478827033c25d488a`
- Checkpoint A branch: `feat/m1-i8-r1-checkpoint-a`
- Checkpoint A status: **Human-accepted; implementation and automated validation complete**
- Checkpoint A accepted implementation commit: `7977f09eca733168c8bac3ae20670c21fa00cbda`
- Checkpoint A acceptance-synchronization commit and final `main` base: `79011f274c35a0cf80f68af845ffaca95e8884c9`
- Checkpoint A commit: `refactor: prepare M1-I8-R1 reading note visual system`
- Checkpoint B base: `79011f274c35a0cf80f68af845ffaca95e8884c9`
- Checkpoint B branch: `feat/m1-i8-r1-checkpoint-b-lunar-contrast`
- Checkpoint B status: **implemented and automatically validated; B — `Lunar Contrast Edition` controlling; Human Visual QA pending; not merged to `main`**
- Checkpoint B expected commit: `feat: implement M1-I8-R1 reading note visual excellence`
- Prototype reference: `d5095ec3c7cf14a9646cb621a64b88d970e908bc`; read-only inspection only, with no merge, cherry-pick, or rebase
- M1-I9-R1 and M1-I12: **unauthorized and unimplemented**
- Milestone 1: **incomplete**
- Milestone 2 and later: **unauthorized**
- Figma: optional and non-authoritative; not used
- Browser or screenshot use by CodeX/agents: prohibited; none used

Human accepted Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`; the accepted state and documentation are fast-forwarded to `main` at `79011f274c35a0cf80f68af845ffaca95e8884c9`. The separate Checkpoint B authorization is now implemented and automatically validated only within its exact manifest on the dedicated branch. Automated evidence is not Human visual acceptance of the canonical Reading Note.

## 2. Exact mutation manifest

Application / technical files:

- `app/globals.css`
- `components/artifact/ArtifactPrimitives.tsx`
- `components/artifact/ArtifactPrimitives.module.css`
- `components/artifact/index.ts`
- `scripts/verify-m1-content-locks.mjs`

Review / status documents:

- `docs/ROADMAP.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/M1_P3_IMPLEMENTATION_PLAN.md`
- `docs/phase1/TASK_M1_I8_R1_REVIEW.md`

Final changed-file count: `13`. No file outside this manifest is permitted or required.

## 3. Deterministic content-lock gate

`scripts/verify-m1-content-locks.mjs` uses lock algorithm `M1-P3-lock-v1` and fails closed. It:

- verifies eight LF-normalized source-slice SHA-256/character-count locks;
- compiles the current fixed-data owners and their immutable accepted-base versions in separate OS temporary trees;
- deep-compares eight exported object locks;
- checks the named fixture/object-owner files against the accepted source base;
- verifies sixteen scalar value/hash locks;
- verifies nine source-to-render binding locks;
- evaluates eight independent semantic behavior assertions;
- executes the permanent Safety verifier; and
- reports `CONTENT_LOCK_GATE: PASS` only if exact locks, semantic assertions, and Safety all pass.

Expected lock values were not refreshed. `docs/phase1/M1_P3_CONTENT_LOCK_MATRIX.md`, fixtures, and Safety owners are unchanged.

## 4. CSS technical preparation

### 4.1 Undefined-token resolution

No parallel palette was introduced. The three previously undefined references now alias approved existing roles:

| Undefined reference | Existing role mapping | Current use | Contrast / role rationale |
| --- | --- | --- | --- |
| `--violet-600` | `var(--night-700)` | native choice/acknowledgement accent | Night accent remains restrained; `#242039` is `14.81:1` against `--paper-100` |
| `--ink-400` | `var(--ink-500)` | disabled-control border | existing muted Ink role; `#7b6f7e` is `3.51:1` against `--paper-300` |
| `--moon-700` | `var(--focus-ring-paper)` | light-surface status text | existing dark-gold accessible role; minimum measured contrast is `6.38:1` across `--paper-50` through `--paper-200` |

Targeted search confirms every use of the three names has one root declaration. No unresolved use remains.

### 4.2 Paper grain

`.paper-grain` now establishes `position: relative` and `isolation: isolate`. Its existing absolute, pointer-events-none pseudo-element is therefore anchored and stacked explicitly behind content without adding clipping, overflow masking, or layout dimensions.

### 4.3 Responsive ordering

The responsive rules are now ordered broad-to-narrow:

1. `960px`
2. existing `760px` rule as the approved 768-class reflow
3. `640px` rule covering the 640/390 class
4. explicit `320px` fallback preserving the existing narrow shell widths
5. reduced-motion preference

No breakpoint value or intended layout declaration was broadened. The 320px fallback repeats the already controlling narrow width constraints and does not introduce a mobile redesign or fixed/sticky CTA.

### 4.4 Proven-unused legacy selector removal

A literal consumer audit across `app/**`, `components/**`, `fixtures/**`, `lib/**`, and `scripts/**` found no current consumer for these six legacy classes:

- `.lp-section`
- `.lp-section--paper`
- `.lp-section--ivory`
- `.lp-section--night`
- `.lp-section--purple`
- `.lp-navigation`

Eight CSS selector occurrences were removed, including the two modifier eyebrow occurrences. Every LP/report selector with a current consumer was retained. No broad prefix deletion was used.

### 4.5 Dynamic swatch allowance

`components/review/BrandFoundationPreview.tsx` deliberately supplies `--swatch-color` through an inline custom property for each approved palette entry. That source is unchanged. `app/globals.css` now uses `var(--swatch-color, var(--paper-200))`, so a missing dynamic value degrades to an approved paper role instead of an invalid background declaration.

## 5. Artifact presentation boundary

Checkpoint A adds only five small presentation primitives:

- `ArtifactSurface`
- `ArtifactRule`
- `ArtifactMetadata`
- `ArtifactStamp`
- `ArtifactSectionLabel`

They use normal element attributes, existing global tokens, and one paper/night surface tone. They contain no content schema, fixture resolver, chapter model, renderer, routing, state, behavior, or runtime integration. `components/artifact/index.ts` exports only these primitives and their types.

No canonical or review-only screen imports the new boundary in Checkpoint A. Adoption and any visual composition remain deferred to a separately authorized exact manifest. This is not a universal report renderer.

## 6. Formal-name alignment map — Checkpoint B disposition

The controlling short-artifact name remains `保存用判断カード`. A targeted source audit found exactly three residual `保存用鑑定書` occurrences:

| Source | Checkpoint A label | Formal alignment | Checkpoint B disposition |
| --- | --- | --- | --- |
| `components/report/ReviewSaveReport.tsx` | `保存用鑑定書` | `保存用判断カード` | aligned within the exact manifest |
| `components/review/BrandFoundationPreview.tsx` | `保存用鑑定書` | `保存用判断カード` | aligned within the exact manifest |
| `lib/legal/review-content.ts` | `保存用鑑定書見本` | `保存用判断カード見本` | deliberately unchanged; outside the exact manifest and deferred |

Checkpoint A changed none of these strings. Checkpoint B changes only the two authorized labels. It does not edit the Content Lock Matrix, formal-name locks, legal owner, or unrelated labels.

## 7. Bounded visual-delta audit

- New artifact primitives have zero current consumers, so they create no current rendered delta.
- Removed selectors have zero proven consumers, so their deletion creates no current rendered delta.
- Responsive reordering preserves the existing declarations and makes cascade order deterministic; the explicit 320px fallback repeats existing constraints.
- The swatch fallback is dormant for current preview entries because each entry supplies `--swatch-color`.
- Resolving invalid token references produces the intended bounded correction only at existing native choice accents, disabled borders, and light-surface legal status text.
- Explicit paper-grain positioning can correct only the grain containing block/stacking relationship; it does not change content, hierarchy, dimensions, or interaction.
- No canonical component, route, wording owner, fixture, or prototype surface was edited.

No Human visual-acceptance claim is made. Human may inspect the existing surfaces in ordinary external Microsoft Edge if desired.

## 8. Protected-scope audit

Baseline actual-content fingerprints and tracked counts were captured before mutation. Final `git diff --quiet` checks against the base confirm that each protected set remains byte-identical, so its fingerprint is unchanged:

| Protected set | Tracked files | Before SHA-256 | After SHA-256 |
| --- | ---: | --- | --- |
| `fixtures/**` | 6 | `8c00a12fc6b7fdd6d94d368252c84aaffda2b42f0f0e71c3e70498c478f63ab3` | `8c00a12fc6b7fdd6d94d368252c84aaffda2b42f0f0e71c3e70498c478f63ab3` |
| `lib/safety/**` | 5 | `185ea12b5209c533c9184e072eaf6bd875a40f45f6727b00bb0cf932494f2151` | `185ea12b5209c533c9184e072eaf6bd875a40f45f6727b00bb0cf932494f2151` |
| package and lockfile | 2 | `913f292ad703251feed852947ba551f17f2fde8e150a225d6dae264a9befc4b5` | `913f292ad703251feed852947ba551f17f2fde8e150a225d6dae264a9befc4b5` |
| canonical UI surfaces | 29 | `05be435ce80a691911acb7a3bffee40402b80109634d5ed5f79e2bb32096cc37` | `05be435ce80a691911acb7a3bffee40402b80109634d5ed5f79e2bb32096cc37` |
| prototype surfaces | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649c934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649c934ca495991b7852b855` |

The prototype directories remain absent from `main` and this branch. No API route, server action, persistence, analytics, external asset/font, deployment, payment, email, or AI runtime owner was added.

## 9. Automated validation

| Check | Result |
| --- | --- |
| Initial content-lock gate before technical mutation | PASS |
| Eight exact source locks | PASS |
| Eight accepted-base object locks and owner-file diff | PASS |
| Sixteen scalar locks | PASS |
| Nine rendered-string/binding locks | PASS |
| `EXACT_LOCKS` | PASS |
| Eight semantic behavior assertions | PASS |
| `SEMANTIC_ASSERTIONS` | PASS |
| Permanent Safety policy verifier | PASS |
| `SAFETY_POLICY_GATE` | PASS |
| `CONTENT_LOCK_GATE` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS with zero warnings |
| `npm run build` | PASS; 28 static/SSG pages generated |
| `git diff --check` | PASS |
| Exact changed-file manifest | PASS; 13/13 authorized files only |
| Protected-scope diff audit | PASS |
| Undefined-token targeted audit | PASS |
| Legacy-selector consumer audit | PASS |
| Browser/screenshots | not used |

## 10. Human acceptance record

- [x] Confirmed this is technical preparation, not canonical visual implementation or visual acceptance.
- [x] Confirmed no product wording, fixed judgment, fixture, Safety meaning, behavior, or information hierarchy changed.
- [x] Confirmed the five artifact primitives are narrow presentation units and not a universal renderer.
- [x] Confirmed the bounded CSS corrections are acceptable.
- [x] Checkpoint A accepted at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`.

## 11. Checkpoint A closure and transition

Checkpoint A was accepted, its eight-document acceptance synchronization was committed as `docs: accept M1-I8-R1 checkpoint A`, and `main` was fast-forwarded without a merge commit to `79011f274c35a0cf80f68af845ffaca95e8884c9`. Checkpoint B was then branched from that exact `main` state. The prototype commit remained read-only reference evidence.

## 12. Checkpoint B exact mutation manifest

Application / presentation files:

- `app/globals.css`
- `components/artifact/ArtifactComposition.tsx`
- `components/artifact/ArtifactComposition.module.css`
- `components/artifact/index.ts`
- `components/report/PublicSampleReport.tsx`
- `components/report/ReportComparisonNavigation.tsx`
- `components/report/ReviewLoadingPlaceholder.tsx`
- `components/report/ReviewReportError.tsx`
- `components/report/ReviewSaveReport.tsx`
- `components/report/ReviewWebReport.tsx`
- `components/review/BrandFoundationPreview.tsx`
- `components/review/ReviewBanner.tsx`

Status / evidence documents:

- `docs/ROADMAP.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/M1_P3_IMPLEMENTATION_PLAN.md`
- `docs/phase1/TASK_M1_I8_R1_REVIEW.md`

Final manifest: `20` files. Authorized but unnecessary `ArtifactPrimitives` files remain unchanged. No fixture, Safety, legal, script, package, route resolver, request/purchase owner, prototype surface, or runtime owner is changed.

## 13. Shared artifact architecture

Checkpoint B adds nine presentation-only composition boundaries: `ArtifactShell`, `ArtifactCover`, `ArtifactAnswer`, `ArtifactLetter`, `ArtifactTimeline`, `ArtifactComparison`, `ArtifactMessageDraft`, `ArtifactLimitation`, and `ArtifactClosing`.

- Callers supply all content and choose semantic elements through the explicit `as` prop.
- DOM order remains the caller's visual order; no CSS `order` is introduced.
- Variants and classes are visual only.
- There is no fixture/schema renderer, route-conditional universal renderer, resolver, state, hidden behavior, or runtime integration.
- The three canonical compositions remain separate. Every shared boundary is used by at least two of Web, save, and public surfaces.

## 14. Surface implementation

### 14.1 Web鑑定ノート

The Web note uses a strong Night cover, an in-cover answer band with exact judgment `今日は送らない方がいい`, a Night-to-Paper transition, restrained `MoonSeal`/`LunarArc`, Paper long-form body, deep-Ink emphasis for the important answer and message, restrained lunar phases, and a Night closing. The reading order is cover, in-cover answer, short letter, detailed same answer, reading guide, relationship, interpretations, anxiety, temperature, actions, message, three-day plan, change conditions, limitations, and closing. Content and recommendation meaning are unchanged; the CTA remains ordinary document flow.

### 14.2 保存用判断カード

The save artifact displays the exact formal name `保存用判断カード`, repeats the same fixed judgment, and uses a distinct compact approximately-30-second decision-card composition rather than a shortened Web note. Its maximum width is approximately `720px`; the message is a deep-Ink anchor. It adds no file, PDF, download, persistence, print, or share behavior.

### 14.3 公開全文見本

The public sample continues to use `PUBLIC_SAMPLE_SEND_CASE`, exact conclusion `今夜は短く返信してよい`, the existing exact disclosure, and the existing eight-part content structure. It adds no prose. The public intro owns the sole page `h1`; the artifact uses `h2`/`h3`. It shares the Lunar Contrast grammar while remaining a shorter edited artifact with its own Night closing.

### 14.4 Navigation, review wrapper, error, and loading

- Comparison navigation remains an editorial list, not an equal-card grid. Targets remain at least `44px`, with one-column mobile reflow and no purchase, generation, or save implication.
- `ReviewBanner` is neutral, non-sticky, collapsed by default, and subordinate to the artifact. Decision IDs remain inside `details`; its explicit no-purchase/no-AI/no-email/no-save statement is preserved.
- Error pages use approved tokens, keep one `h1`, fail closed without a fallback report, do not expose an arbitrary fixture ID in visible markup, and provide safe return links.
- Loading is static `role="status"` content without spinner, shimmer, pulse, progress, fetch, timer, or automatic transition.

## 15. Responsive and accessibility source evidence

| Target | Implemented source rule | Human status |
| --- | --- | --- |
| Desktop | Web target approximately `840px` within `864px`; public approximately `800px`; save approximately `720px` | pending visual review |
| 768px | comparison/action layouts collapse; review chrome remains subordinate | pending visual review |
| 390px | `12px` stage inset yields approximately `366px`; `24px` internal inset; body text at least `16px`; answer remains near the entry viewport | pending visual review |
| 320px | `8–12px` stage inset; `18–20px` internal inset; no deliberate clipping or overflow masking; formal save title is allowed to wrap and must not truncate | pending visual review |

Source and rendered-markup checks confirm one `h1`, ordered headings, DOM/visual-order parity, caller-owned semantics, decorative `aria-hidden` treatment, at least `3px` focus treatment, at least `44px` interactive targets, static reduced-motion-compatible behavior, short-heading-only balance, left-aligned Japanese body copy, and no long-body Mincho role. Actual 200% zoom, keyboard/focus, wrapping, clipping, and visual contrast require Human review.

## 16. Checkpoint B automated and raw-HTTP evidence

| Check | Result |
| --- | --- |
| `EXACT_LOCKS` | PASS |
| `SEMANTIC_ASSERTIONS` | PASS |
| `SAFETY_POLICY_GATE` | PASS |
| `CONTENT_LOCK_GATE` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS with zero warnings |
| `npm run build` | PASS; 28 static/SSG pages generated |
| required raw-HTTP routes | PASS; HTTP 200 |
| one `h1` and heading order | PASS on required and unknown-fixture surfaces |
| exact Web judgment in cover and detailed answer | PASS |
| exact same save judgment and formal name | PASS |
| exact public conclusion and disclosure | PASS |
| unknown result/save IDs | PASS; fail closed, no normal fallback, no visible raw arbitrary ID |
| exact 20-file mutation manifest | PASS |
| protected/prohibited-scope audit | PASS |
| external fonts/assets/packages and runtime behavior | absent |
| fixed/sticky CTA and horizontal-overflow masking | absent |
| `git diff --check` | PASS |
| Browser/screenshots | not used |

Raw HTTP coverage:

- `/`
- `/review`
- `/review/result/result-normal-001`
- `/review/save-report/result-normal-001`
- `/sample-report`
- `/review/error/missing-fixture`
- `/review/error/unavailable-report`
- an unknown result-fixture route
- an unknown save-fixture route

The production review server runs on `127.0.0.1:3017`. It was started without stopping or modifying any existing process on port `3016`.

## 17. Human Visual QA matrix and hard stop

| Surface | Desktop | 768px | 390px | 320px |
| --- | --- | --- | --- | --- |
| Web鑑定ノート | Pending | Pending | Pending | Pending |
| 保存用判断カード | Pending | Pending | Pending | Pending |
| 公開全文見本 | Pending | Pending | Pending | Pending |
| Review wrapper | Pending | Pending | Pending | Pending |
| Error/loading | Pending | Pending | Pending | Pending |

Human must inspect answer discoverability, Japanese wrapping, horizontal overflow, formal-name wrapping, focus visibility, keyboard order, contrast, 200% zoom, reduced motion, route-chrome subordination, and closing aftertaste in ordinary external Microsoft Edge. CodeX/agents used no Browser, browser automation, GUI control, or screenshots and make no visual-acceptance claim.

The next and only current gate is Human Visual QA and acceptance of Checkpoint B. Checkpoint B must not merge to `main`. M1-I9-R1, M1-I12, Milestone 1 completion, and Milestone 2 remain unauthorized. No PR is authorized or created.

## 18. M1-I8-R1-R1 First Viewport & Readability Polish

### 18.1 Human defect findings and bounded corrections

| Human finding | Bounded correction |
| --- | --- |
| Web鑑定ノートの長い Night cover により、desktop 初期 viewport で「今夜の答え」を発見できない | stage 上余白、cover minimum height、cover 内の見出し・metadata・divider 間隔を圧縮し、answer band は DOM・normal flow・独立した Night band のまま維持 |
| 保存用判断カードで判断までの距離が長く、30秒で見返す用途の hierarchy が弱い | stage と header の余白、title size/line-height、subtitle・divider・metadata rhythm を限定的に圧縮し、answer の DOM 順序と独立性を維持 |
| `ReviewBanner` と artifact review boundary の二段表示が商品 artifact を押し下げる | closed 時の各帯を `44px` minimum、合計約 `88px` に圧縮し、details、文言、fixture ID、`44px` summary target を維持 |
| Paper 本文の一部が淡く、長文可読性が不足する | 主要 prose のみ `var(--ink-800)` へ一段濃くし、metadata、eyebrow、fixture details、補足 label、Night 面を変更しない |

This correction changes no content, component JSX, fixture, route, behavior, artifact primitive, Safety, Legal, package, prototype, price, age, judgment, or public conclusion.

### 18.2 Exact CSS selectors changed

Review chrome:

- `.review-banner__inner`
- `.review-banner__lead`
- `.artifact-review-boundary__inner`

Web first viewport and responsive flow:

- `.reading-note-stage`
- `.reading-note-cover`
- `.reading-note-cover__type`
- `.reading-note-cover h1`
- `.reading-note-cover__facts`
- `.reading-note-cover__facts div`
- `.reading-note-cover__facts dd`
- `.reading-note-cover .editorial-divider`
- `.reading-note-cover__line`
- `.reading-note-cover__answer`
- `.reading-note-cover__answer strong`

Save first viewport and responsive flow:

- `.save-decision-stage`
- `.save-decision-note__header`
- `.save-decision-note__header > p`
- `.save-decision-note__header h1`
- `.save-decision-note__header .editorial-divider`
- `.save-decision-note__header dl`
- `.save-decision-note__header dl div`
- `.save-decision-note__header dd`
- `.save-decision-answer`
- `.save-decision-answer h2`

Primary Paper prose contrast:

- `.reading-note-section__body > p`
- `.reading-note-letter__body p`
- `.reading-guide-grid dd`
- `.reading-note-list li`
- `.possibility-list p`
- `.anxiety-grid p`
- `.message-temperature__notes dd`
- `.lunar-plan p`
- `.save-decision-list li`
- `.save-decision-next > p`
- `.save-decision-note__footer p`
- `.public-sample-note__body > section > div p`
- `.public-sample-detail-list li`
- `.public-sample-temperature dd`
- `.public-sample-limitation p`

### 18.3 First-viewport source intent

| Target | Correction source intent | Human status |
| --- | --- | --- |
| Desktop review chrome | `ReviewBanner` `44px` minimum + artifact boundary `44px` minimum; combined closed height approximately `88px` | pending visual review |
| Desktop Web | stage top padding `32–44px`; cover minimum height `34rem`; cover top padding `3rem`; reduced type/title/facts/divider rhythm; answer remains normal flow | pending visual review |
| Desktop Save | stage top padding `32–40px`; header vertical padding `2.5rem`; title maximum `2.6rem` at `1.45` line-height; reduced subtitle/divider/metadata rhythm | pending visual review |
| 390px Web | stage top padding `24px`; cover top padding `28px`; title remains untruncated at `1.9–2.1rem`; metadata becomes readable label/value rows; answer remains normal flow | pending visual review |
| 390px Save | header vertical padding `24px`; formal name retained; consultation theme remains untruncated; metadata becomes readable label/value rows; answer label and judgment remain the next normal-flow section | pending visual review |
| 320px | existing `8px` stage inset and `18px` internal inset remain controlling; no clipping, overflow masking, or truncation was introduced; formal name and title may wrap naturally | pending visual review |

Body copy remains at least the global `1rem` (`16px`). No sticky/fixed positioning, absolute answer overlay, CSS `order`, `overflow-x:hidden`, animation, or parallax was added.

### 18.4 Paper prose contrast treatment

The named primary Paper prose selectors use `var(--ink-800)`. Static token contrast is:

| Pair | Contrast |
| --- | ---: |
| `ink-800` / `paper-50` | `13.53:1` |
| `ink-800` / `paper-100` | `13.02:1` |
| `ink-800` / `paper-200` | `11.54:1` |
| `ink-800` / `paper-300` | `10.16:1` |

The minimum measured Paper pairing is `10.16:1`, above the required `4.5:1`. Secondary metadata and supporting review copy remain `var(--ink-600)`. The Save answer reason remains `var(--paper-200)` on its approved Night answer surface because this correction does not recolor Night surfaces.

### 18.5 CSS asset failure prevention and HTTP evidence

The prior Human-review failure mode was a stale `.next` / served CSS asset mismatch: generated HTML referenced CSS that was not being served from the matching clean build, producing unstyled HTML and an oversized black `MoonSeal`. For this correction, port `3017` was confirmed without an existing listener, `C:\projects\moon-reply\.next` was removed, a clean production build was generated, and one `next start -p 3017` server was launched for this worktree.

Raw HTTP evidence after that clean build:

- Web route: HTTP `200`
- Save route: HTTP `200`
- Public route: HTTP `200`
- CSS hrefs extracted from all three HTML responses: `2`
- every extracted CSS URL: HTTP `200`
- every extracted CSS body: non-empty
- `.reading-note-cover`: present
- `.save-decision-note`: present
- `.public-sample-note`: present
- `.review-banner`: present
- `.artifact-review-boundary`: present
- `CSS_ASSET_GATE: PASS`

### 18.6 Automated validation and hard stop

| Check | Result |
| --- | --- |
| `EXACT_LOCKS` | PASS |
| `SEMANTIC_ASSERTIONS` | PASS |
| `SAFETY_POLICY_GATE` | PASS |
| `CONTENT_LOCK_GATE` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS with zero warnings |
| `npm.cmd run build` | PASS; 28 static/SSG pages generated |
| protected-scope diff | PASS; zero |
| exact mutation manifest | PASS; `app/globals.css` and this review record only |
| fixed/sticky addition | zero |
| horizontal-overflow masking addition | zero |
| `git diff --check` | PASS |
| Browser/screenshots | not used |

Human Visual QA remains pending for desktop, 390px, 320px, keyboard/focus, 200% zoom, Japanese wrapping, answer discoverability, and review-chrome subordination. Checkpoint B remains unaccepted and unmerged. `main` is unchanged. M1-I9-R1 and M1-I12 remain unauthorized; Milestone 1 remains incomplete. No PR was created.
