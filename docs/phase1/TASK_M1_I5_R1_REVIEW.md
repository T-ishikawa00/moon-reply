# TASK_M1_I5_R1_REVIEW.md

## Status

Human visually reviewed and accepted Task M1-I5 and Task M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`. Human then separately authorized only M1-I6. Milestone 2 and all later milestones remain unauthorized.

## Base commit

`6d8001c5c6068a9493e68791f0468e5b5766f038`

The correction started from a clean `main` working tree with `HEAD` and `origin/main` both equal to the base commit.

## Human review finding

The current-page item in shared legal navigation used a nearly black full-card background. On the rendered page it appeared blacked out, disabled, visually heavier than the surrounding legal page, and too similar to the site/header night background. The treatment did not communicate current location clearly enough.

## Authorized correction

Only `LegalNavigation` in `components/legal/LegalReview.tsx` changes:

- active background: warm pale gold `#f1dfb0`;
- active text: dark `#2b2335`;
- active border and inset-left accent: gold `#80652d`;
- current marker: compact dark navy/purple `#2a2440` badge with warm-white `#fff8e8` text;
- active hover: retains the warm current-page appearance; and
- keyboard focus: a separate purple `#55416f` ring with an ivory offset remains visibly distinct from the current state.

The link uses wrapping flex layout, a shrinkable and breakable label, and a non-breaking compact badge so the longest legal label and `現在` marker are designed to remain contained at a 320px viewport. Rendered containment-class assertions passed, and Human subsequently accepted the corrected treatment at commit `7a232b8feef446200cde5425cb3a98eb683b4391`.

## Accessibility preservation

- exactly one current navigation link per rendered route retains `aria-current="page"`;
- visible `現在` text remains in the current link and is not hidden from assistive technology;
- the current state is not conveyed by color alone;
- links remain keyboard operable;
- the visible focus ring is distinct from the persistent active border;
- the minimum link touch target remains `min-h-12`; and
- hover does not replace or obscure the active treatment.

## Scope boundary

No legal text, Decision ID, unresolved status, legal-page route, review-boundary wording, fixed product fact, footer link, request flow, Safety behavior, purchase confirmation, report/sample page, publication-gate state, or operator/provider decision changes. No runtime integration, package change, Supabase change, or `lib/safety` change. No M1-I6 work.

## Validation

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with zero warnings.
- `npm.cmd run build`: passed and generated 27 pages. The first restricted run failed before compilation with environment-level `EPERM` on `.next/trace`; the permitted rerun passed.
- Raw HTTP checks: `/legal`, `/legal/terms`, `/legal/privacy`, `/legal/tokushoho`, `/legal/refund`, `/legal/ai-disclosure`, `/legal/unsupported-cases`, and `/contact` each returned HTTP 200.
- Rendered HTML checks: every route had exactly one navigation item with `aria-current="page"`, visible `現在` inside that link, all eight legal/contact navigation links, the warm active-state classes, and the narrow-layout containment classes.
- Contrast calculations: active text `#2b2335` on `#f1dfb0` is `11.42:1`; badge text `#fff8e8` on `#2a2440` is `13.93:1`.
- `next-env.d.ts`: unchanged after validation.
- Package, Supabase, and `lib/safety` diffs: empty.
- The application diff changes only shared navigation classes and badge presentation; no runtime integration was added.
- `git diff --check` and staged validation are completed in the final Git workflow.

## Next gate

Task M1-I5-R1 is accepted. The next gate is Human Visual QA and acceptance of the separately authorized M1-I6. Milestone 2 remains unauthorized.
