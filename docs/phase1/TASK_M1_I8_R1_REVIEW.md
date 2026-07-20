# Task M1-I8-R1 Checkpoint A Technical Preparation Review

## 1. Status and authority

- Task ID: `M1-I8-R1`
- Checkpoint: `A — Technical Preparation`
- Base / accepted documentation commit: `d6a9f111a2e15c54e9f250a2126d64abfacdefd0`
- Accepted locked-source base: `84edb93c6e098c65ae2e180478827033c25d488a`
- Branch: `feat/m1-i8-r1-checkpoint-a`
- Status: **Human-accepted; implementation and automated validation complete**
- Accepted implementation commit: `7977f09eca733168c8bac3ae20670c21fa00cbda`
- Expected commit: `refactor: prepare M1-I8-R1 reading note visual system`
- Checkpoint B / M1-I8-R1 Visual Excellence: **Human-authorized; implementation not yet started; B — `Lunar Contrast Edition` controlling**
- M1-I9-R1 and M1-I12: **unauthorized and unimplemented**
- Milestone 1: **incomplete**
- Milestone 2 and later: **unauthorized**
- Figma: optional and non-authoritative; not used
- Browser or screenshot use by CodeX/agents: prohibited; none used

The earlier Human instruction authorized only Checkpoint A within the exact manifest below. The current Human decision accepts that implementation at commit `7977f09eca733168c8bac3ae20670c21fa00cbda` and separately authorizes Checkpoint B within its own exact manifest. This remains technical acceptance, not Human visual acceptance of the canonical Reading Note.

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

## 6. Formal-name alignment map — change deferred

The controlling short-artifact name remains `保存用判断カード`. A targeted source audit found exactly three residual `保存用鑑定書` occurrences:

| Source | Current label | Proposed formal alignment | Checkpoint A disposition |
| --- | --- | --- | --- |
| `components/report/ReviewSaveReport.tsx` | `保存用鑑定書` | `保存用判断カード` | direct saved-artifact title candidate; defer to separately authorized Checkpoint B manifest |
| `components/review/BrandFoundationPreview.tsx` | `保存用鑑定書` | `保存用判断カード` | review-preview label candidate; defer to separately authorized exact manifest |
| `lib/legal/review-content.ts` | `保存用鑑定書見本` | `保存用判断カード見本` | outside an automatic sweep; requires explicit file authority and scope eligibility before change |

Checkpoint A changes none of these strings. It does not edit customer-facing copy, the Content Lock Matrix, formal-name locks, or unrelated labels.

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

## 11. Stop boundary and next gate

The current Human decision authorizes Checkpoint A fast-forward to `main`, then Checkpoint B implementation on `feat/m1-i8-r1-checkpoint-b-lunar-contrast` within its exact mutation manifest. Checkpoint B must not merge to `main` before Human Visual QA. M1-I9-R1, M1-I12, Milestone 1 completion, and Milestone 2 remain unauthorized.
