# M1-P3 Figma Handoff Specification

## 1. Status and execution boundary

- Task: `M1-P3 Reading Note Visual Excellence Specification`
- Status: `Draft completed; Human and ChatGPT review pending`
- Scope: documentation/design-only
- Figma file creation or mutation in M1-P3: prohibited
- Implementation authority: none

This is a production brief for a future Figma author. It defines what to draw and annotate without changing current fixture content. The author must use the current Japanese source text. Lorem Ipsum, invented substitute copy, translated placeholder text, AI-generated filler, shortened legal meaning, and fabricated product facts are prohibited.

## 2. Required Figma deliverables

The future Figma file must contain all of the following:

1. Web鑑定ノート — desktop complete-length frame.
2. Web鑑定ノート — 390px complete-length frame.
3. Web鑑定ノート — 768px reflow annotation.
4. Global 320px fallback rules.
5. 保存用判断カード — desktop frame.
6. 保存用判断カード — 390px frame.
7. 公開全文見本 — desktop complete-length frame.
8. 公開全文見本 — 390px complete-length frame.
9. LP product-preview alignment — desktop context frame.
10. LP product-preview alignment — 390px context frame.
11. LP same-case / different-case boundary annotation.
12. Review route wrapper treatment.
13. Future product-reader mode treatment.
14. Six chapter-archetype sheets.
15. Shared component anatomy sheet.
16. Typography sheet.
17. Spacing and vertical-rhythm sheet.
18. Color and surface sheet.
19. Content-lock and accessibility annotation sheet.

Every complete-length frame uses `Hug contents` vertically. Reference viewport rectangles are annotations only and must not clip the artifact.

## 3. Recommended Figma page and frame structure

```text
00_README_AND_LOCKS
  M1-P3 status / authority
  fixed-content sources and hashes
  do-not-change list

01_FOUNDATIONS
  Typography
  Spacing and rhythm
  Color and surfaces
  Border shadow grain decoration
  Responsive grids

02_ARCHETYPES
  A Identity Cover
  B Decision Answer
  C Letter Narrative
  D Evidence Interpretation
  E Action Time
  F Limits Closing

03_WEB_READING_NOTE
  Web 1440 complete
  Web 390 complete
  768 reflow annotation
  320 fallback annotation

04_SAVE_DECISION_CARD
  Save 1440
  Save 390

05_PUBLIC_FULL_SAMPLE
  Public 1440 complete
  Public 390 complete

06_LP_PREVIEW_ALIGNMENT
  LP note proof 1440 context
  LP note proof 390 context
  Same-case versus different-case annotation

07_WRAPPERS_AND_STATES
  Review wrapper
  Future product reader
  Error
  Static loading
  Comparison navigation

08_COMPONENT_ANATOMY
  Shared primitive anatomy and variants

09_HANDOFF
  Frame inventory
  Token-to-code mapping
  Accessibility checklist
  Fixed/editable/forbidden recap
  Human review checklist
```

Frame names use slash-separated semantics, for example `Web/1440/Complete`, `Web/390/Complete`, and `Archetype/B-Decision/390`.

## 4. Shared foundations

### 4.1 Responsive grids

| Target | Frame | Columns | Margin | Gutter | Artifact/content width |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop reference | 1440 | 12 | 72 | 24 | Web 840; public 800; save 720 |
| Intermediate desktop/tablet | 961–1280 | 12 | 48 | 20 | maximums above, fluid below |
| Tablet | 768 | 8 | 32 | 20 | Web up to 704 |
| 641–760 | target frame as needed | 8 | 24 | 16 | fluid single column |
| Primary mobile | 390 | 4 | 16 | 12 | standard route content 358; Reading Note artifact stage 366 via its limited 12px inset |
| QA fallback | 320 | 4 | 12 | 8 | artifact stage 296–304 via 8–12px inset; artifact internal padding 18–20 |

The artifact itself is an editorial column, not a 12-column card grid. Frame grids govern route alignment and annotation only.

At 390px, `16px` is the standard route-shell outer padding. The `12px` artifact-stage inset is a deliberate wide treatment limited to Reading Note artifacts and produces the `366px` available artifact width. It is not a replacement margin for LP body content, the public intro, or a general route shell.

### 4.2 Spacing scale

Use named steps:

| Name | Value | Primary use |
| --- | ---: | --- |
| `space-1` | 4 | micro alignment only |
| `space-2` | 8 | label-to-value, compact list gap |
| `space-3` | 12 | paragraph/list gap |
| `space-4` | 16 | control padding, compact grouping |
| `space-5` | 24 | subsection grouping |
| `space-6` | 32 | heading-to-body, paired gutter |
| `space-7` | 48 | mobile chapter threshold |
| `space-8` | 64 | cover zone / medium chapter threshold |
| `space-9` | 96 | desktop major chapter threshold |

### 4.3 Typography

No font imports. In Figma, select locally available fonts that map to the OS stacks. If a named font is unavailable, annotate the fallback; do not replace it with a branded external font.

- Mincho role: Yu Mincho → Hiragino Mincho ProN/Pro → Noto Serif JP → serif.
- Gothic role: Hiragino Sans → Yu Gothic/YuGothic → Noto Sans JP → system sans.
- Use the exact sizes and line heights from `M1_P3_READING_NOTE_VISUAL_EXCELLENCE_SPEC.md` Section 18.
- Text boxes use fixed width and auto height. Never fix height on Japanese body text.
- Demonstrate wrapping with the current longest fixture paragraphs, not short dummy text.

### 4.4 Color and surface tokens

Use current token names, not unnamed hex-only styles:

- Night 950/900/800/700.
- Moon 600/500/400/300.
- Paper 50/100/200/300.
- Ink 950/800/600/500.
- State success/caution/danger/review background, foreground, border.

Required foreground/background pairs:

- `ink-950` on `paper-50` for primary body.
- verified `ink-600` or darker on `paper-50/100/200` for secondary body.
- `paper-50` on `night-950/900/800` for primary Night text.
- `paper-200` on Night only after `4.5:1` verification for normal-size copy.
- `state-*-foreground` on matching `state-*-background`.

Every Figma color style description contains the token name, intended role, and required contrast. Gold is never used as small body text on Paper without passing contrast.

### 4.5 Shared responsive behavior

- `>= 961px`: desktop artifact maximums, selective true two/three-column structures.
- `761–960px`: narrower desktop/tablet; three columns collapse; route wrapper may stack.
- `641–760px`: one-column artifact; 24px route margins; 36–44px artifact padding.
- `<= 640px`: mobile composition; 16px route margin; no interior columns.
- `390px`: primary mobile frame; 16px standard route-shell padding, 12px Reading Note artifact-stage inset, 366px artifact width, and 24px artifact internal section padding.
- `320px`: 8–12px artifact-stage inset, 18–20px artifact internal padding, 16px body, and reduced/removed shadow and arc before content shrink.

No breakpoint changes fixed content order.

## 5. Handoff block — Web鑑定ノート

- **Screen name:** Web鑑定ノート 1440 / 390 complete
- **Route:** `/review/result/result-normal-001`
- **Mode:** Current Review mode; artifact anatomy must also work without review wrapper
- **Purpose:** Present the complete fixed `result-normal-001` as the paid-product reading experience.

- **Frame width:** `1440px` and `390px`; include annotated `768px` reflow and `320px` fallback callouts
- **Reference viewport height:** `900px` desktop, `844px` mobile; complete frame uses content height
- **Content width:** artifact `840px` target / `864px` max desktop; `366px` artifact at 390
- **Grid:** route 12-column desktop; artifact single editorial column
- **Outer padding:** stage 72px desktop route alignment, 32px at 768, 16px standard route shell at 390 with the Reading Note artifact stage widened to a 12px inset, and 8–12px artifact-stage inset at 320
- **Spacing scale:** shared `space-1` through `space-9`; chapters use 48–96px thresholds

- **Typography:** exact M1-P3 roles; Mincho for cover/answer/chapter titles, Gothic for body/control/meta
- **Color tokens:** Night, Moon, Paper, Ink, state review/caution
- **Foreground/background pair:** paper-50/paper-200 on Night; ink-950/verified ink-600 on Paper
- **Contrast requirement:** normal text `>=4.5:1`; large `>=3:1`; meaningful boundary `>=3:1`

- **Surface:** Night cover; continuous Paper body; one Night detailed-answer field; warm closing transition
- **Border:** 1px semantic borders; 3–4px side rule only where specified
- **Radius:** artifact 0–6px; route support up to 12px
- **Shadow:** one paper shadow; reduced at 390; removed if it causes 320 overflow
- **Decoration:** one medium MoonSeal, one cover LunarArc, one cover divider, optional closing divider/seal within global maximum

- **Component anatomy:** Review boundary → ArtifactShell → Cover with immediate answer → six explicit archetype compositions → comparison navigation outside shell
- **Landmark:** `main` containing one `article`; review notices are `aside`; comparison is `nav`
- **Heading level:** one h1 on the cover; fourteen part headings use ordered h2; true subsections h3
- **Slots:** product identity, consultation title, client/date, cover line, exact answer, letter, evidence, actions, time, limits, closing
- **Repeatable items:** fixture arrays only; preserve source order
- **Variants:** review wrapper present/absent; paired evidence/action structures; compact mobile

- **States:** default complete; review details collapsed/expanded; long-text stress; focus; 200% zoom annotation
- **Interaction:** native details, comparison links, closing link; no generation or save interaction
- **Focus:** 3px visible outline, not clipped by artifact shell
- **Reduced motion:** no automatic motion; hover translation optional and removed

- **Responsive:**
- **>= 961px:** 840px centered artifact; selective paired columns; three-day plan may use three columns
- **761–960px:** artifact fluid; three-day plan collapses; paired layouts require at least 280px each
- **641–760px:** one column; 36–44px section padding; wrapper stacks
- **<= 640px:** one column; 24px padding; comparison one column
- **390px:** 366px artifact; 500px+ cover; exact answer visible inside cover; no fixed CTA
- **320px:** 296–304px artifact; 18–20px padding; 16px body; decoration/shadow reduced first

- **Accessibility:**
- **Heading order:** h1 → h2 → h3 only
- **Reading order:** route boundary, cover answer, letter, detailed answer, evidence, action, time, limits, closing, comparison
- **ARIA:** decoration hidden; labelled aside/nav; exact status text
- **Touch target:** principal links/details `>=44px`
- **Contrast:** annotate every Night/Paper/state pair
- **200% zoom:** single-column reflow with no information loss

- **Fixed content:** entire `resultNormal001` source object and exact judgment; see lock matrix
- **Editable presentation:** component grouping, spacing, hierarchy, columns, decoration intensity, metadata subordination
- **Forbidden changes:** fixture/schema/text/judgment/facts/limits; formal names; Safety; price; runtime; font/assets

- **Implementation mapping:** `ReviewWebReport` remains the explicit composition; future small primitives under `components/artifact/`; route component supplies fixed fixture
- **Acceptance criteria:** cover reads as a product; answer found within 15 seconds; long text remains readable; six archetypes visible; wrapper does not dominate; all target widths pass
- **Open questions:** none required to draw; annotate the recommended “cover line then immediate answer” order for Human review.

## 6. Handoff block — 保存用判断カード

- **Screen name:** 保存用判断カード 1440 / 390
- **Route:** `/review/save-report/result-normal-001`
- **Mode:** Current Review mode with future wrapper-free compatibility
- **Purpose:** Enable a 30-second retrieval of the same fixed judgment, action, draft, next date, change conditions, remembered line, and limits.

- **Frame width:** `1440px`, `390px`
- **Reference viewport height:** `900px`, `844px`; content height grows naturally
- **Content width:** decision artifact `720px` max; `366px` at 390
- **Grid:** route grid only; artifact single column with one true do/do-not pair on desktop
- **Outer padding:** 72px desktop alignment; 16px standard route shell at 390 with a limited 12px Reading Note artifact-stage inset
- **Spacing scale:** shared scale; 32–64px major zones

- **Typography:** same roles; answer statement remains the strongest type
- **Color tokens:** same Night/Paper/Moon/Ink roles
- **Foreground/background pair:** Night answer with Paper text; Paper body with Ink
- **Contrast requirement:** `4.5:1` body, `3:1` large

- **Surface:** compact Paper artifact with Night answer block
- **Border:** one outer border and internal rules
- **Radius:** 0–6px
- **Shadow:** one restrained answer/paper shadow
- **Decoration:** small MoonSeal; no LunarArc required; one divider maximum

- **Component anatomy:** compact identity → answer → do/do-not → draft → next judgment → change conditions → remembered line → limitation
- **Landmark:** one `main` / one `article`; review notice `aside`
- **Heading level:** one h1 for consultation theme; answer and zones h2
- **Slots:** exact fixed fields only
- **Repeatable items:** action and condition arrays in source order
- **Variants:** review wrapper present/absent; desktop pair/mobile stack

- **States:** default; long-text wrap; focus; 200% zoom
- **Interaction:** comparison links/details only; no file action
- **Focus:** visible and unclipped
- **Reduced motion:** static

- **Responsive:**
- **>= 961px:** 720px centered; do/do-not may be paired
- **761–960px:** fluid artifact; retain pair only with adequate measure
- **641–760px:** one column
- **<= 640px:** one column, 24px padding
- **390px:** answer and first action visible early; limitation does not displace answer
- **320px:** formal title wraps; no abbreviation; 16px body

- **Accessibility:**
- **Heading order:** h1 then h2
- **Reading order:** exact visual order above
- **ARIA:** limitation `aside` or labelled footer; decoration hidden
- **Touch target:** `>=44px`
- **Contrast:** all token pairs annotated
- **200% zoom:** single column

- **Fixed content:** `resultNormal001`; exact `今日は送らない方がいい`
- **Editable presentation:** layout and typography only
- **Forbidden changes:** any fixture text; file/PDF/download/print/share implication; `保存用鑑定書` as formal name

- **Implementation mapping:** explicit `ReviewSaveReport` composition with shared primitives; no universal renderer
- **Acceptance criteria:** distinct from Web; scannable in 30 seconds; formal title is correct; same judgment; no file implication
- **Open questions:** none required to draw; show nickname in identity and keep fixed review date out of the primary scan path.

## 7. Handoff block — 公開全文見本

- **Screen name:** 公開全文見本 1440 / 390 complete
- **Route:** `/sample-report`
- **Mode:** Public fictional sample
- **Purpose:** Demonstrate product writing and visual grammar with the fixed `sample-send-001` edited artifact.

- **Frame width:** `1440px`, `390px`
- **Reference viewport height:** `900px`, `844px`; complete content height
- **Content width:** artifact `800px` max; intro content `1152px`; `366px` artifact at 390
- **Grid:** route 12-column; artifact single column
- **Outer padding:** shared route margins; public intro retains 16px standard route-shell padding at 390, while only the Reading Note artifact stage uses the limited 12px inset
- **Spacing scale:** same artifact scale

- **Typography:** same artifact roles; page intro h1 and artifact internal title h2
- **Color tokens:** same Night/Paper/Moon/Ink plus review disclosure role
- **Foreground/background pair:** same verified pairs
- **Contrast requirement:** same WCAG targets

- **Surface:** public Night intro, Night cover, continuous Paper body
- **Border:** semantic 1px rules
- **Radius:** 0–6px artifact
- **Shadow:** one paper shadow
- **Decoration:** same cover grammar; no extra decoration for marketing

- **Component anatomy:** public intro/disclosure → edited artifact cover/answer/letter/evidence/action/time/conditions/limits/closing → collapsed metadata → public comparison navigation
- **Landmark:** one main; intro section; artifact article; metadata details; nav
- **Heading level:** page h1 in public intro; artifact sections begin h2; no second h1
- **Slots:** exact `PUBLIC_SAMPLE_SEND_CASE` and report fields
- **Repeatable items:** fixed arrays in source order
- **Variants:** desktop/mobile; public comparison wording

- **States:** default; metadata expanded; focus; long text
- **Interaction:** request link, details, comparison links
- **Focus:** visible and unobscured
- **Reduced motion:** static

- **Responsive:**
- **>= 961px:** intro copy/action may share a row; 800px artifact
- **761–960px:** intro action may wrap; artifact fluid
- **641–760px:** intro stacks; all artifact layouts one column
- **<= 640px:** action full width; 24px artifact padding
- **390px:** fixed disclosure visible before or at artifact entry; no fake purchase proof
- **320px:** disclosure wraps naturally; no horizontal scroll

- **Accessibility:**
- **Heading order:** one h1, then h2/h3
- **Reading order:** disclosure before sample answer; metadata after artifact
- **ARIA:** fictional status text explicit; decorative elements hidden
- **Touch target:** `>=44px`
- **Contrast:** same verified pairs
- **200% zoom:** one column

- **Fixed content:** entire `PUBLIC_SAMPLE_SEND_CASE`, exact conclusion, exact disclosure
- **Editable presentation:** eight-part edited grouping and hierarchy only
- **Forbidden changes:** expansion to invented fourteen-part content; real-case/purchase/review/AI evidence implication

- **Implementation mapping:** explicit `PublicSampleReport` composition using shared primitives
- **Acceptance criteria:** same grammar as Web; clearly fictional; shorter by purpose; exact send judgment; disclosure prominent
- **Open questions:** none.

## 8. Handoff block — LP product-preview alignment

- **Screen name:** LP Reading Note proof 1440 / 390 context
- **Route:** `/#note` plus the adjacent different-case sample section for boundary annotation
- **Mode:** Public LP
- **Purpose:** Prove the artifact while distinguishing same-case format comparison from different-case conclusion comparison.

- **Frame width:** `1440px`, `390px`
- **Reference viewport height:** `900px`, `844px`; include enough preceding/following context to judge transitions
- **Content width:** page shell `1152px`; primary preview proportional to artifact, not a full-page miniature
- **Grid:** 12-column desktop; single mobile column
- **Outer padding:** 72px desktop, 16px mobile
- **Spacing scale:** LP section rhythm plus artifact internal rhythm

- **Typography:** LP section roles and exact artifact answer/body roles
- **Color tokens:** same Night/Paper/Moon/Ink
- **Foreground/background pair:** artifact pairs match Web; LP support copy uses verified Night pair
- **Contrast requirement:** same WCAG targets

- **Surface:** Night product-proof section with one Paper preview and one compact decision-card preview
- **Border:** artifact semantic rules; no generic card borders around every fact
- **Radius:** artifact 0–6px; support surfaces up to 8px
- **Shadow:** preview uses one light paper shadow
- **Decoration:** one seal/divider in preview; no duplicate arc spectacle

- **Component anatomy:** section heading → same-case short preview → Web purpose → save purpose → fixed-boundary note; adjacent section annotation identifies different public cases
- **Landmark:** labelled section; previews are articles/asides as appropriate
- **Heading level:** LP page h1 remains elsewhere; proof section h2; preview title h3
- **Slots:** selected exact `resultNormal001` fields only
- **Repeatable items:** three-day items may be selectively shown in order; no invented summary
- **Variants:** desktop composed proof; mobile continuous proof

- **States:** default; link focus; long wrap
- **Interaction:** only existing request/sample destinations; no internal fixture links from public LP
- **Focus:** visible, `>=44px` targets
- **Reduced motion:** static

- **Responsive:**
- **>= 961px:** main preview and purpose sidebar may be paired
- **761–960px:** preview/sidebar stack if measure narrows
- **641–760px:** one column
- **<= 640px:** one continuous proof; no card grid
- **390px:** exact answer precedes dense preview details; buttons full width only when natural
- **320px:** reduce shadow and padding; preserve formal names

- **Accessibility:**
- **Heading order:** preserve LP hierarchy
- **Reading order:** same-case explanation before preview, different-case section after
- **ARIA:** comparison purpose is textual, not color-only
- **Touch target:** `>=44px`
- **Contrast:** deep Night section must render using a defined token
- **200% zoom:** stack without loss

- **Fixed content:** exact `result-normal-001` excerpts and public case separation meaning
- **Editable presentation:** excerpt selection, layout, size, spacing
- **Forbidden changes:** new conclusion, full report duplication, AI feature-led hierarchy, fixed CTA

- **Implementation mapping:** `app/page.tsx` explicit LP composition; shared artifact primitives only where they do not create a giant renderer
- **Acceptance criteria:** artifact is principal proof; same-case and different-case purposes cannot be confused; desktop/390 match product grammar
- **Open questions:** none for drawing; implementation remains Checkpoint C and separately unauthorized.

## 9. Handoff block — Review route wrapper

- **Screen name:** Review wrapper / artifact entry
- **Route:** `/review/result/**`, `/review/save-report/**`
- **Mode:** Review only
- **Purpose:** Communicate fixed-fixture and inactive-runtime boundaries without competing with the artifact.

- **Frame width:** `1440`, `768`, `390`, `320` component frames
- **Reference viewport height:** show Header through first `240px` of artifact
- **Content width:** wrapper content `1152px`; artifact widths remain independent
- **Grid:** route grid
- **Outer padding:** shared route margins
- **Spacing scale:** compact 8/12/16/24

- **Typography:** Gothic small/meta only; product title typography prohibited
- **Color tokens:** state-review or neutral Night roles
- **Foreground/background pair:** verified review foreground/background
- **Contrast requirement:** `4.5:1`

- **Surface:** one compact strip plus optional route-specific boundary
- **Border:** one bottom rule
- **Radius:** none for full-width strip; up to 6px for details control
- **Shadow:** none
- **Decoration:** information icon only if text remains complete; no MoonSeal/arc

- **Component anatomy:** concise statement; native details; review index link; optional fixture facts inside expanded area
- **Landmark:** aside
- **Heading level:** no heading inserted into artifact hierarchy
- **Slots:** boundary statement, details, return link
- **Repeatable items:** runtime facts in dl
- **Variants:** global compact; Web route; save route

- **States:** collapsed default; expanded; focus
- **Interaction:** native details and link
- **Focus:** visible `3px` outline
- **Reduced motion:** none

- **Responsive:**
- **>= 961px:** statement and details control share row
- **761–960px:** wrap if required
- **641–760px:** stack
- **<= 640px:** single column
- **390px:** target collapsed height `<=80px` when copy wraps
- **320px:** natural height; no truncation

- **Accessibility:**
- **Heading order:** none added
- **Reading order:** before artifact
- **ARIA:** labelled aside; native details
- **Touch target:** summary/link `>=44px`
- **Contrast:** `4.5:1`
- **200% zoom:** expands in normal flow

- **Fixed content:** no purchase, AI, email, save, or persistence occurs; fictional fixture status
- **Editable presentation:** concise wording order and layout if meaning stays complete
- **Forbidden changes:** sticky banner, product-emphasis gold, hiding review status, runtime implication

- **Implementation mapping:** `ReviewBanner` and artifact-specific boundary; avoid duplicate dominant notices
- **Acceptance criteria:** understood, then visually dismissed; cover remains first dominant object
- **Open questions:** choose one dominant boundary during implementation; recommendation is global compact plus route-specific collapsed facts.

## 10. Handoff block — Future product-reader mode

- **Screen name:** Future product reader / wrapper-free artifact
- **Route:** no route authorized; anatomy preview only
- **Mode:** Future public/product mode
- **Purpose:** Prove that removing review chrome does not require changing artifact composition.

- **Frame width:** `1440`, `390` anatomy frames
- **Reference viewport height:** show Header, artifact opening, and end transition examples
- **Content width:** identical artifact widths
- **Grid:** identical route/artifact grid
- **Outer padding:** same stage rules
- **Spacing scale:** same

- **Typography:** identical artifact roles
- **Color tokens:** identical artifact roles
- **Foreground/background pair:** identical
- **Contrast requirement:** identical

- **Surface:** artifact only; no review strip or metadata
- **Border:** identical
- **Radius:** identical
- **Shadow:** identical
- **Decoration:** identical limits

- **Component anatomy:** Header → stage → ArtifactShell → non-review post-artifact navigation placeholder
- **Landmark:** main/article/nav
- **Heading level:** identical
- **Slots:** artifact content only
- **Repeatable items:** identical fixture-driven fields in design reference only
- **Variants:** Web/save/public reader anatomy

- **States:** anatomy only
- **Interaction:** no new route/control defined
- **Focus:** inherited
- **Reduced motion:** inherited

- **Responsive:**
- **>= 961px:** corresponding artifact width and desktop composition; review chrome absent
- **761–960px:** corresponding fluid artifact and paired-layout thresholds; no replacement wrapper
- **641–760px:** corresponding single-column artifact and route padding
- **<= 640px:** corresponding mobile artifact composition
- **390px:** corresponding 390px frame with no review banner or review metadata
- **320px:** corresponding fallback rules; no new abbreviation or clipping

- **Accessibility:**
- **Heading order:** identical one-h1 artifact order
- **Reading order:** Header → artifact → non-review post-artifact navigation
- **ARIA:** artifact decoration hidden; review-only aside and labels absent
- **Touch target:** principal links `>=44px`
- **Contrast:** identical approved artifact pairs
- **200% zoom:** identical one-column reflow with no information loss
- **Fixed content:** unchanged
- **Editable presentation:** wrapper removal only
- **Forbidden changes:** inventing a route, purchase state, delivery state, or implementation authorization

- **Implementation mapping:** no current code mapping required beyond keeping artifact primitives wrapper-independent
- **Acceptance criteria:** review chrome can be removed without re-layout of the artifact
- **Open questions:** none; route/product-mode implementation is explicitly deferred.

## 11. Six chapter-archetype sheets

Each sheet is `1440px` wide and contains a desktop specimen, a 390 specimen, anatomy labels, fixed source references, token labels, and misuse examples marked `Do not use`. Use the exact fixture excerpts named below.

### A — Identity / Cover

- Purpose: product identity and immediate orientation.
- Example source: consultation theme, client/date, cover line, exact judgment.
- Desktop specimen: 840px cover; mobile: 366px cover.
- Required anatomy: brand, product label, h1, identity dl, divider, cover line, immediate-answer zone.
- Variant: public sample; compact save identity.
- Accessibility: h1 visible; decoration hidden.
- Misuse specimen: star field, repeated badges, review ID on cover, oversized gold title — all crossed out.

### B — Decision / Answer

- Purpose: exact judgment, reason, now/next.
- Example source: `judgmentLabel`, `conclusionReasonSummary`, `tonightActions[0]`, `reviewTiming`.
- Required anatomy: label, answer, short reason, action/timing facts.
- Variants: cover-summary, detailed, save compact.
- Responsive: paired facts desktop, stack mobile.
- Misuse specimen: confidence score, glow, prediction badge — crossed out.

### C — Letter / Narrative

- Purpose: opening and closing emotional pacing.
- Example source: complete `shortLetter`; `rememberTonight` and `closingLetter`.
- Required anatomy: title, measure, paragraphs, optional remembered line.
- Variants: opening side-rule; closing warm field.
- Responsive: same text order, narrower measure.
- Misuse specimen: handwriting font, centered long text, wax seal — crossed out.

### D — Evidence / Interpretation

- Purpose: facts, possibilities, unknowns, anxiety, message reading.
- Example source: `readingGuide`, `relationshipTimeline`, `observedFacts`, `possibleInterpretations`, `anxietyCore`, `messageTemperature`.
- Required anatomy: semantic label, list/dl/timeline/quote, qualifier.
- Variants: guide, timeline, paired fact/unknown, numbered possibilities, quote analysis.
- Responsive: selective pairs collapse before 760px.
- Misuse specimen: equal card dashboard and fact/interpretation color-only distinction — crossed out.

### E — Action / Time

- Purpose: do/do-not, message, three-day plan, change conditions.
- Example source: `tonightActions`, `notTonightActions`, `laterMessageDraft`, `threeDayPlan`, `recommendationChangeConditions`, `holdDirectionConditions`.
- Required anatomy: labels, ordered items, explicit timing, condition qualifiers.
- Variants: action pair, draft, timeline, reevaluation pair.
- Responsive: all stack at 390; day labels remain text.
- Misuse specimen: sticky CTA, gamified checklist, moon icons without day labels — crossed out.

### F — Limits / Closing

- Purpose: unknowns, capability boundary, fixed disclaimer, remembered line, close.
- Example source: `materialUnknowns`, `reportCapabilities`, `fixedLimitationDisclaimer`, `rememberTonight`, `closingLetter`.
- Required anatomy: unknown/can-do comparison, labelled caution aside, closing voice.
- Variants: limitation; limitation-plus-closing.
- Responsive: caution full width; closing remains last artifact voice.
- Misuse specimen: collapsed disclaimer, tiny low-contrast legal copy, sales CTA inside closing — crossed out.

## 12. Shared component anatomy sheet

The sheet must document explicit primitives, not a schema renderer.

| Component | Required slots | Variants | States | Responsive rule | Accessibility | Forbidden use |
| --- | --- | --- | --- | --- | --- | --- |
| `ArtifactShell` | article children | Web/public/save width | default/focus containment | fluid to target max | article/labelled-by | fixture schema rendering |
| `ArtifactCover` | identity, h1, facts, line, answer | Web/public/save compact | default/long wrap | single column mobile | one h1 owner; decoration hidden | review metadata |
| `ArtifactAnswer` | label, answer, reason, now/next | summary/detailed/compact | default/long wrap | pair → stack | text carries meaning | confidence/probability |
| `ArtifactLetter` | title, paragraphs, remembered line | opening/closing | default | narrower measure | semantic paragraphs | handwriting simulation |
| `ArtifactSection` | number, title, explicit children | standard/warm/Night when specified | default | padding scales | heading level supplied explicitly | generic archetype switch |
| `ArtifactFactList` | label/items | list/dl | default | one column | ul/dl semantics | color-only category |
| `ArtifactTimeline` | ordered labelled items | relationship/three-day | default | 3 → 1 column | ol and text labels | decorative-only order |
| `ArtifactComparison` | left/right labels/content | fact/unknown, do/do-not, change/hold | default | 2 → 1 column | DOM order preserved | arbitrary card pair |
| `ArtifactMessageDraft` | timing label, quote, conditions | full/compact | default | one column | blockquote plus text conditions | copy/download control |
| `ArtifactActionPlan` | do/do-not lists | full/compact | default | 2 → 1 column | list semantics | CTA behavior |
| `ArtifactReevaluation` | next timing, change/hold lists | full/compact | default | 2 → 1 column | explicit labels | removing hold conditions |
| `ArtifactLimitation` | unknowns, capabilities, disclaimer | full/compact | default | one column mobile | labelled aside | collapsed-by-default disclaimer |
| `ArtifactClosing` | remembered line, letter, optional external link slot | Web/public | default | narrower measure | no heading skip | sales interruption |
| `ArtifactDivider` | decorative rule/point | Night/Paper | default | scales width | aria-hidden | between every chapter |

Component examples use exact fixture content. Figma components may expose text properties for design editing, but the handoff annotation must mark those properties `CONTENT LOCKED`.

## 13. Typography sheet requirements

The typography sheet includes all thirteen roles from the main specification with:

- desktop, 390px, and 320px specimens;
- Mincho/Gothic mapping;
- size, weight, line height, tracking, maximum measure;
- allowed Night/Paper background;
- required contrast;
- one short label specimen and one longest realistic Japanese wrap specimen;
- examples of correct and incorrect `phrase-keep`; and
- an explicit `NO EXTERNAL FONT` annotation.

## 14. Spacing sheet requirements

Show:

- base scale bars;
- paragraph/list/subsection/chapter gaps;
- cover zone spacing;
- desktop/768/390/320 artifact padding;
- 390px standard route-shell padding `16px` versus the Reading Note-only artifact-stage inset `12px`, resulting artifact width `366px`, and artifact internal padding `24px`;
- 320px artifact-stage inset `8–12px` and artifact internal padding `18–20px`;
- comparison navigation separation after closing;
- correct sparse chapter thresholds; and
- an anti-example where excessive whitespace simulates luxury without hierarchy.

## 15. Color and surface sheet requirements

Show:

- named token swatches;
- foreground/background pairs with contrast value placeholders to be populated from code audit;
- Night cover, Paper body, Warm answer support, Night answer, Caution, and Review surfaces;
- one approved paper shadow and one optional answer shadow;
- border/divider/radius rules;
- grain at final target opacity and a `grain off` comparison;
- MoonSeal/LunarArc/divider maximum-use rule; and
- prohibited gold/glow/star/occult examples crossed out.

## 16. Error, loading and comparison-state sheet

Create component frames for:

- missing fixture fail-closed error;
- unavailable report error;
- static loading preview;
- comparison navigation review mode;
- comparison navigation public mode.

Use current exact text. Loading must not imply network activity or progress. Error must show no fallback report. Public comparison wording must distinguish the send full sample from the separate fixed wait-case format comparison.

## 17. Annotation and redline rules

- Measurements use CSS pixels.
- Redlines identify frame width, artifact width, padding, gap, type size/line height, border, radius, shadow, and breakpoint behavior.
- Every annotation names a semantic token or component slot; avoid “gold 2” or “card 7”.
- Fixed content is marked with a red `CONTENT LOCKED` annotation and source path/object/field.
- Editable presentation is marked `PRESENTATION EDITABLE`.
- Prohibited change is marked `DO NOT IMPLEMENT`.
- Review-only content is marked `REVIEW ONLY — REMOVE IN PRODUCT READER`.
- Decoration is marked `ARIA-HIDDEN / NONINTERACTIVE / STATIC`.
- Complete-length frames include reference viewport overlays at 900px desktop and 844px mobile.

## 18. Accessibility annotations

Every screen frame must annotate:

- h1 ownership and heading order;
- main/article/aside/nav boundaries;
- DOM reading order where a desktop pair exists;
- minimum 44px targets;
- focus-visible placement and offset;
- contrast pair and target;
- decoration hidden from assistive technology;
- 200% zoom reflow result;
- reduced-motion behavior; and
- any native details collapsed/expanded state.

## 19. Fixed content sources

Use these sources directly:

- Web/save: `fixtures/review/reports.ts` → `resultNormal001`.
- Public full sample: `fixtures/public/public-sample-cases.ts` → `PUBLIC_SAMPLE_SEND_CASE`.
- LP different-case comparison: all three `PUBLIC_SAMPLE_CASES`.
- Review/Safety meaning: `fixtures/review/safety-states.ts` and `lib/safety/**`.
- Product facts: `fixtures/review/purchase-confirmations.ts` and `lib/legal/review-content.ts`.
- Error: `fixtures/review/errors.ts`.

The formal short-presentation label in Figma is `保存用判断カード`. Any later source alignment from residual `保存用鑑定書` is limited to Checkpoint B / M1-I8-R1, the saved-artifact title, report-comparison labels, Reading Note LP-preview labels, and customer-facing labels directly attached to a Reading Note artifact. The actual mutation files must be listed in Checkpoint B's exact manifest; fixture judgments, the product name, unrelated body copy, and purchase/legal/request copy remain locked.

The exact expected hashes are in `M1_P3_CONTENT_LOCK_MATRIX.md`. If a source or hash differs at Figma-production start, stop and request a new Human instruction. Do not silently update text in Figma.

## 20. Human review checklist for the Figma gate

For the Checkpoint B design gate, Human and ChatGPT review the future Figma file for:

- Web鑑定ノート desktop and 390px complete frames accepted;
- 保存用判断カード desktop and 390px frames accepted;
- 公開全文見本 desktop and 390px complete frames accepted;
- six archetype sheets accepted;
- typography, spacing, color, and component-anatomy sheets accepted;
- 768px reflow and 320px fallback annotations accepted;
- Review wrapper treatment accepted;
- current Japanese fixture text used with no Lorem Ipsum;
- exact fixed judgment and disclosure values;
- cover immediate answer before the letter/detail flow;
- six archetypes, not fourteen unrelated designs;
- product ownership and JPY 980 credibility;
- no AI-dashboard or fortune-telling cues;
- Web/save/public purposes visibly distinct;
- Review wrapper subordinate and removable;
- desktop/768/390/320 behavior explicit;
- typography/measure/wrapping credible with real Japanese text;
- accessibility/redline annotations complete; and
- no Figma decision implying implementation authorization.

For the later Checkpoint C design gate, after the M1-I8-R1 artifact grammar is accepted, Human and ChatGPT separately accept:

- LP-preview desktop frame;
- LP-preview 390px frame; and
- same-case / different-case boundary annotation.

## 21. Acceptance and next gate

This handoff document is accepted only as part of explicit M1-P3 Human acceptance. Its acceptance makes visually neutral Checkpoint A eligible for a separate exact-manifest authorization; an actual Figma file is not a Checkpoint A dependency.

Checkpoint B cannot begin from documentation alone. Its formal design dependency is a Human-approved Figma file satisfying every Checkpoint B frame, sheet, annotation, and Review-wrapper item explicitly listed in Section 20. Checkpoint C separately requires the Section 20 LP-preview desktop and 390px frames, the same-case / different-case boundary annotation, and the accepted M1-I8-R1 artifact grammar.

Figma-file acceptance itself is not application implementation authorization. Checkpoint B / M1-I8-R1, Checkpoint C / M1-I9-R1, and M1-I12 each require a separate explicit Human authorization and exact mutation manifest.
