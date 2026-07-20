# M1-P3 Reading Note Visual Excellence Specification

## 1. Document status and authority

- Task ID: `M1-P3`
- Task name: `Reading Note Visual Excellence Specification`
- Status: `Human and ChatGPT accepted`
- Scope: canonical documentation/design specification plus the recorded M1-P3-R1 coded-prototype gate correction
- Base commit: `7e02c5f38c37f0249b7b732fb1fc740a806f0562`
- Canonical implementation authority: none; M1-P3-R1 review-only coded prototype authority is separate and bounded

This document specifies the next visual-quality target for the Reading Note artifacts. It does not authorize canonical visual implementation, fixture, Safety, package, runtime, or deployment changes. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction, rejected A — `Quiet Editorial Letter`, and separately authorized only Checkpoint A / M1-I8-R1 Technical Preparation. Checkpoint B remains unauthorized.

Authority order:

1. `docs/ROADMAP.md` controls milestones, product definition, price, Safety order, and authorization.
2. Current Human-fixed decisions in this document control M1-P3 visual design.
3. `M1_P3_CONTENT_LOCK_MATRIX.md` controls fixed content and semantic values.
4. This document controls visual grammar and acceptance targets.
5. `M1_P3_FIGMA_HANDOFF_SPEC.md` is optional, non-authoritative Figma reference material.
6. `M1_P3_IMPLEMENTATION_PLAN.md` describes possible future checkpoints but grants no authority to execute them.

If these artifacts conflict, implementation must stop and the conflict must be returned to Human. No agent may resolve a conflict by editing fixed fixture content or changing a Human-fixed decision.

## 2. Human-fixed decisions

The following decisions are closed and must not be returned as open questions:

- Product: `恋のメッセージ鑑定ノート`.
- Long presentation: `Web鑑定ノート`.
- Short presentation: `保存用判断カード`.
- `保存用鑑定書` is not a formal product name. Existing application use is a deferred M1-I8-R1 alignment item.
- Web鑑定ノート order: cover; one-line `今夜の答え` inside the cover; `月の返事からの短い手紙`; detailed `今夜の答え`; rationale/body; message draft; action plan; three-day direction; re-evaluation conditions; uncertainty/limits; closing.
- The cover summary may shorten presentation but must not change the fixed judgment.
- Fixed content includes fixture judgments, consultation facts, Safety meaning, uncertainty, non-guarantee, chapter purpose, price, one-consultation/one-note unit, one-shot purchase, 18+, Safety before payment, `normal_allowed`-only continuation, fail-closed handling, and inactive runtime boundaries.
- Presentation order, heading position, short summaries, spacing, measure, columns, typography, hierarchy, grouping, archetypes, decoration strength, responsive composition, and subordination of review metadata may change.
- Primary mobile width: `390px`.
- Tablet reflow target: `768px`.
- QA fallback: `320px`.
- External fonts are prohibited.
- The public full sample is a shorter edited artifact using the same visual grammar; it is not expanded to fourteen chapters.
- The artifact is the primary product-quality target. Header, ReviewBanner, route boundary, comparison navigation, and Footer must not damage its first impression, reading entry, or closing aftertaste.
- The required coded-prototype design gate is complete: Human selected and accepted B — `Lunar Contrast Edition`; A — `Quiet Editorial Letter` is rejected.
- Figma is optional, non-authoritative reference material. A Figma file is not required and has no independent implementation-gate authority.
- Prototype acceptance selects design direction only; it does not authorize canonical visual implementation. Checkpoint A is authorized only by the separate explicit Human instruction and exact mutation manifest.

### 2.1 Human-selected canonical direction

The canonical direction is B — `Lunar Contrast Edition`, without A/B hybridization:

- strong Night cover;
- independent `今夜の答え` answer band;
- clear Night-to-Paper scene transition;
- Paper-led body composition that supports sustained long-form reading;
- three-day plan expressed with lunar phases;
- Night-surface closing;
- restrained MoonSeal / LunarArc use;
- no stars, constellations, tarot, magic imagery, or strong glow;
- no conversion of the body into a collection of cards;
- information hierarchy for judgment, reasons, actions, and limits ahead of decoration;
- early mobile recognition of `今夜の答え`;
- mobile cover-title wrapping may be adjusted during separately authorized formal implementation without changing meaning;
- no fixed or sticky CTA;
- no compromise composition that mixes A components into B; and
- preserve the existing whitespace, readability, anti-card-sprawl, and decoration-restraint requirements.

## 3. Product objective

The artifact must make a user understand that JPY 980 buys a deliberately edited decision aid, not access to a chat response. The design must produce four outcomes:

1. Ownership: the cover and continuous paper body feel like one retained product.
2. Orientation: the fixed judgment is available immediately without skipping the letter and rationale.
3. Endurance: long Japanese text remains readable to the closing section.
4. Agency: the user can distinguish facts, interpretations, actions, change conditions, and limits without being pressured into a predetermined relationship outcome.

The price point does not justify ornamental excess. It requires disciplined hierarchy, careful typography, credible material treatment, and a complete beginning-to-end reading experience.

## 4. User emotional context

The likely reader is waiting for a reply, re-reading a message, and seeking relief from ambiguity. This creates predictable risks:

- scanning only for a definitive answer;
- reading silence as proof of rejection;
- treating every paragraph as equally urgent;
- losing confidence when caveats look like generic legal disclaimers; and
- interpreting ornate lunar decoration as a supernatural claim.

The design response is:

- show the answer early, in plain language;
- separate confirmed facts from possible interpretations;
- make action and re-evaluation timing easy to retrieve;
- keep uncertainty adjacent to the advice it qualifies;
- reduce visual urgency; and
- use lunar identity as quiet authorship, never as evidence for the judgment.

## 5. Definition of Visual Excellence

Visual Excellence is achieved only when all of the following are true:

- the artifact is recognizable as a designed publication before the user reads technical or review metadata;
- the answer can be found within approximately 15 seconds and understood within approximately 30 seconds;
- the reading order remains obvious without a dashboard, table of contents, or repeated card pattern;
- chapter roles are differentiated through six reusable editorial archetypes;
- Japanese body measure, line height, paragraph spacing, and wrapping support continuous reading;
- decoration is sparse, stable, and subordinate to meaning;
- desktop, 768px, 390px, and 320px each have an intentional composition;
- fixed content hashes and semantic locks remain unchanged; and
- Human Visual QA confirms the result in ordinary external Microsoft Edge.

“Premium” means better measure, rhythm, hierarchy, material consistency, and restraint. It does not mean more gold, more glow, more borders, larger headings, or more decorative symbols.

## 6. Brand direction

The direction is `quiet premium`, `Japanese editorial`, `private letter`, `curated decision artifact`, and `calm authority` with subtle lunar authorship.

| Design lever | Increase | Reduce | Apply to | Do not apply to |
| --- | --- | --- | --- | --- |
| Editorial structure | continuous reading, numbered sections, meaningful white space | equal-weight cards and repeated badges | Web note, sample, decision card | review metadata and global navigation |
| Material quality | warm paper, controlled ink, one credible paper shadow | beige-on-beige flatness and fake parchment | artifact body | Header, ReviewBanner, error controls |
| Lunar identity | one MoonSeal, one restrained arc, sparse divider points | stars, particles, zodiac, tarot, aura, glow | cover, answer threshold, closing | every chapter heading or list item |
| Calm authority | direct labels, stable alignment, explicit facts/limits | urgency, emotional coercion, certainty theatre | answer, actions, conditions, limits | decorative copy and CTA repetition |
| Japanese publication feel | Mincho display roles, Gothic body roles, disciplined measure | oversized English eyebrows and narrow luxury imitation | title, chapter opening, letter, quote | metadata, controls, code IDs |
| Product ownership | cover-to-closing continuity and coherent edges | SaaS shell dominance | artifact itself | route wrapper and comparison navigation |

Cheap fortune-telling constraints:

- no tarot, constellations, zodiac marks, crystal motifs, psychic language, star particles, purple-gold spectacle, or glowing prediction panels;
- no use of lunar symbols as the reason for a judgment;
- no black background with thin gold borders repeated around every section; and
- no headline that promises the other person’s feelings, reply, reconciliation, or future.

Generic AI-service constraints:

- no chat bubbles, avatars, typing indicators, model badges, prompt/result panels, regenerate controls, confidence scores, or dashboard cards;
- AI disclosure remains factual and subordinate to the product promise; and
- the artifact leads with editorial authorship and decision support, not technology.

Desktop may use broader margins and occasional paired columns. Mobile must use the same hierarchy with fewer simultaneous columns, smaller decoration, and shorter measures; it must not be a mechanically stacked desktop card grid.

## 7. Anti-goals

M1-P3 explicitly rejects:

- AI chat UI or dashboard composition;
- a generic card grid;
- one bordered card per chapter;
- fourteen independent chapter designs;
- full-page beige without a deliberate Night/Paper transition;
- white text on pale backgrounds;
- excessive gold, glow, shadow, gradients, glass, or grain;
- star particles, parallax, automatic reveal, looping or ambient animation;
- tarot, astrology, zodiac, psychic, or spiritual-decoration cues;
- “luxury” simulated only by hairlines and oversized headings;
- fixed/sticky/floating CTA;
- decoration that competes with the judgment or body text;
- long body text centered or set in all Mincho;
- a compressed screenshot-like saved view; and
- a universal schema renderer or one giant component for Web, save, and public compositions.

## 8. Fixed product and runtime boundaries

The design must preserve:

- canonical category: `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`;
- `税込980円`, `1相談 / 1鑑定ノート`, `都度払い`, `自動更新なし`, and `18歳以上`;
- AI disclosure and non-guarantee;
- Safety before payment;
- `normal_allowed` alone continues;
- `needs_review`, `rejected`, invalid age, contradictory selection, missing acknowledgement, and unknown/error states fail closed;
- fixed fixture judgments, consultation facts, uncertainty, limitations, and recommendation meaning;
- deterministic fixture/mock or browser-memory-only operation; and
- inactive AI, DB/Supabase runtime, payment, email, API, server action, analytics, persistence, file generation, and deployment.

No visual device may imply that purchase, generation, delivery, save, download, print, share, or persistence is active.

## 9. Content and semantic lock

`M1_P3_CONTENT_LOCK_MATRIX.md` is mandatory implementation input. The following are immutable under M1-I8-R1 visual work:

- the complete `result-normal-001` source object;
- all three public sample source objects;
- the public full-sample fixed disclosure;
- the Web and save fixed judgment `今日は送らない方がいい`;
- the public full-sample judgment `今夜は短く返信してよい`;
- Safety state names and continuation flags;
- product, price, age, unit, purchase, AI, non-guarantee, and unsupported-case meanings; and
- all fixture IDs and source relationships.

The cover’s immediate answer uses the exact fixed `judgmentLabel`. It is a second presentation of the same value, not new content. No paraphrase may broaden, soften, or reverse the judgment.

## 10. Target reading experience

The intended sequence is:

1. Route context is understood but visually dismissed.
2. The cover establishes product identity and consultation identity.
3. The exact one-line answer is visible inside the cover.
4. The short letter regulates pace and emotional tone.
5. The detailed answer explains the judgment.
6. Evidence and interpretation are read as distinct categories.
7. The reader reaches usable message/action/time guidance.
8. Change conditions and uncertainty restore agency.
9. The closing resolves the reading without a sales interruption.
10. Comparison navigation appears outside the artifact as secondary navigation.

The page must support both scanning and full reading without creating two separate content structures.

## 11. Product-level information hierarchy

Priority order:

1. Product identity and consultation theme.
2. Exact immediate answer.
3. Short letter.
4. Detailed answer and reason summary.
5. Confirmed facts and possible interpretations.
6. Message temperature and recommended action.
7. Message draft and three-day direction.
8. Re-evaluation conditions.
9. Uncertainty, non-guarantee, and capability boundaries.
10. Closing line and reading-end navigation.
11. Review metadata.

Review metadata never shares the same surface, type size, or gold emphasis as the product answer. It must be outside the artifact or collapsed after the artifact.

## 12. Artifact opening experience

The opening must create a clean threshold:

- SiteHeader ends before the review boundary.
- ReviewBanner or route boundary uses one compact line plus collapsed details.
- A Night stage begins with at least `32px` desktop and `16px` mobile separation before the artifact.
- The artifact cover is the first dominant object.
- No comparison navigation, technical fixture ID, or repeated CTA appears before the cover.

The opening is a publication entry, not an application status screen. The route wrapper may state that no purchase/AI/save occurs, but it may not visually outweigh the cover.

## 13. Cover specification

Required content, in order:

1. MoonSeal and `月の返事` identity.
2. `恋のメッセージ鑑定ノート` product label.
3. Consultation theme.
4. Subordinate client/date identity where applicable.
5. One restrained EditorialDivider.
6. Cover line.
7. Immediate-answer band with label `今夜の答え` and the exact fixed judgment.

Desktop:

- artifact width: `840px` target, `864px` maximum;
- cover minimum height: `600px`, content-driven beyond that;
- cover padding: `64px` inline and `56–72px` block;
- title measure: maximum `14` full-width characters per visual line where natural wrapping permits;
- answer band sits in the lower third and remains inside normal flow.

390px:

- stage outer padding: `12px`;
- cover padding: `24px` inline, `32px` block;
- minimum height: `500px`, content-driven;
- client/date stacks vertically;
- LunarArc is cropped to at most `35%` of the cover area;
- answer band remains in normal flow and never overlays text.

The cover must not use a fake binding, page curl, wax seal, constellation, rotated paper, or full-bleed texture. Grain is static and barely visible.

## 14. Immediate-answer specification

- Source: exact `report.judgmentLabel` or the corresponding fixed public-case `conclusion`.
- Label: `今夜の答え`.
- It appears once inside the cover and once in the detailed answer section.
- The cover instance is one line or naturally wraps to two lines; it has no explanatory paragraph.
- The detailed instance contains reason summary, first action, and next review timing.
- Repetition is acceptable only because the first instance is orientation and the second is explanation.
- Do not add probability, confidence, divination language, or a stronger imperative.

Visual treatment:

- Night-on-Night or Paper-on-Night high-contrast band;
- one top rule or surface shift, not a full card with shadow;
- answer statement in Mincho, weight `600`;
- label and metadata in Gothic;
- no glow, pulse, reveal, badge, or icon that implies certainty.

## 15. Short-letter specification

The short letter follows the cover and precedes the detailed answer.

- Body uses the same fixed `shortLetter` paragraphs in order.
- Maximum reading measure: `34em` desktop, `22em` at 390px.
- A single `1px` moon-gold side rule may mark the letter.
- Paragraphs are not placed in separate cards.
- The letter uses body-large Gothic by default; a short opening or closing line may use Mincho, but the entire letter must not be Mincho.
- Salutation, signature, simulated handwriting, stationery graphics, or decorative quotation marks are prohibited unless the fixed content later contains them.

## 16. Detailed-answer specification

The detailed answer is the first strong chapter after the letter.

It contains:

- exact judgment;
- conclusion reason summary;
- current conclusion context;
- first immediate action; and
- review timing.

Desktop may use a `2fr / 1fr` internal split only for “now” and “next review” summaries. At 760px and below it is one column. The detailed answer is the strongest interior surface, but its visual weight must remain below the cover as a whole.

The section must not restate all later actions, conditions, or limitations. It points forward and preserves the need to read.

## 17. Chapter archetype system

Use six archetypes. They control visual grammar, not data rendering. Each artifact composes explicit chapters; no generic schema-to-UI loop is authorized.

### Archetype A — Identity / Cover

- Purpose: establish ownership, product identity, consultation identity, and immediate orientation.
- Semantic structure: `header`, one page `h1`, identity `dl`, exact answer summary.
- Visual hierarchy: brand → product → consultation title → metadata → answer.
- Heading treatment: Mincho, restrained scale, left aligned.
- Body measure: title `12–16` full-width characters per visual line; support copy `30–34em`.
- Suitable content: cover and public-sample cover.
- Unsuitable content: long rationale, lists, review metadata.
- Desktop: Night field with broad internal margins.
- 390px: full-width single column, reduced arc and shadow.
- Divider/decoration: one seal, one arc, one divider maximum.
- Accessibility: h1 is visible; decoration is `aria-hidden`.
- Candidate: `ArtifactCover`, integrating `ArtifactIdentity`.
- Variants: Web, public, compact save header.
- Misuse risk: turning identity into mystical proof or repeating the cover before every chapter.

### Archetype B — Decision / Answer

- Purpose: state the judgment and immediate implication.
- Semantic structure: labelled section, h2, exact answer, short reason, now/next facts.
- Visual hierarchy: label → answer → reason → action/timing.
- Heading treatment: answer statement in Mincho; supporting labels in Gothic.
- Body measure: answer `18–24em`; reason `34em`.
- Suitable content: immediate answer, detailed answer, save-card answer.
- Unsuitable content: full evidence lists or legal disclaimers.
- Desktop: one strong field with optional two-column facts.
- 390px: one column; answer remains above reason.
- Divider/decoration: one surface shift; no repeated moon icon.
- Accessibility: answer is text, never color-only; heading order is preserved.
- Candidate: `ArtifactAnswer`.
- Variants: cover-summary, detailed, compact.
- Misuse risk: adding certainty, probability, or an oversized banner that overwhelms the document.

### Archetype C — Letter / Narrative

- Purpose: regulate pace, acknowledge emotion, and close the reading.
- Semantic structure: h2 plus ordered paragraphs or one blockquote.
- Visual hierarchy: chapter title → letter body → optional remembered line.
- Heading treatment: Mincho chapter title; Gothic long body.
- Body measure: `32–34em` desktop, `20–22em` mobile.
- Suitable content: short letter and closing letter.
- Unsuitable content: facts, conditions, action checklists.
- Desktop: narrow inset within the artifact column.
- 390px: full available width with one side rule.
- Divider/decoration: side rule or one divider, never both repeatedly.
- Accessibility: paragraph order matches DOM reading order.
- Candidate: `ArtifactLetter`, `ArtifactClosing` as an explicit closing variant.
- Variants: opening, closing.
- Misuse risk: simulated handwriting, sentimental ornament, centered long prose.

### Archetype D — Evidence / Interpretation

- Purpose: distinguish facts, possibilities, unknowns, anxiety, and message reading.
- Semantic structure: explicit subsections, `dl`, `ol`, timeline, quotation, or paired comparison.
- Visual hierarchy: category label → evidence → interpretation qualifier.
- Heading treatment: Mincho chapter title; Gothic subsection titles.
- Body measure: `32–36em`; paired columns each at least `15rem`.
- Suitable content: reading guide, relationship timeline, possible interpretations, anxiety core, message temperature.
- Unsuitable content: primary answer or action CTA.
- Desktop: single column with selective paired comparison.
- 390px: all pairs stack; label remains adjacent to value.
- Divider/decoration: plain rules and numbered indices.
- Accessibility: use lists and definition lists; do not encode fact vs possibility by color alone.
- Candidates: `ArtifactFactList`, `ArtifactTimeline`, `ArtifactComparison`.
- Variants: guide, timeline, quote analysis, fact/unknown split.
- Misuse risk: creating a dashboard of equal cards or implying interpretations are facts.

### Archetype E — Action / Time

- Purpose: make the recommendation usable and time-bounded.
- Semantic structure: do/do-not lists, message draft, ordered three-day plan, change-condition comparison.
- Visual hierarchy: action label → instruction → condition/timing.
- Heading treatment: Mincho chapter title; strong Gothic action labels.
- Body measure: list items `28–32em`; draft `30em`.
- Suitable content: recommended actions, draft, three-day plan, re-evaluation conditions.
- Unsuitable content: unqualified predictions or purchase CTA.
- Desktop: two columns only for true do/do-not or change/hold comparisons; timeline may use three columns.
- 390px: one column; timeline remains ordered and labelled `今夜`, `明日`, `3日目`.
- Divider/decoration: rules, numbered points, restrained moon-phase markers only for the three-day plan.
- Accessibility: ordered meaning remains in text; phase markers are decorative.
- Candidates: `ArtifactMessageDraft`, `ArtifactActionPlan`, `ArtifactTimeline`, `ArtifactReevaluation`.
- Variants: action pair, message, time plan, conditions.
- Misuse risk: fixed CTA, gamified checklist, or decoration obscuring sequence.

### Archetype F — Limits / Closing

- Purpose: preserve uncertainty, non-guarantee, capability boundary, and a calm ending.
- Semantic structure: capability/limitation pair, caution `aside`, remembered line, closing paragraphs.
- Visual hierarchy: what is unknown → what the artifact can do → fixed disclaimer → closing.
- Heading treatment: Mincho chapter title; Gothic caution and legal text.
- Body measure: `32–36em`.
- Suitable content: material unknowns, capabilities, fixed disclaimer, remembered line, closing.
- Unsuitable content: review fixture metadata or sales CTA.
- Desktop: paired capability/limit section followed by full-width caution and narrow closing.
- 390px: one column; caution remains visually subordinate to the answer.
- Divider/decoration: one closing divider or seal, not both at every subpart.
- Accessibility: `aside` has a text label; disclaimer contrast is at least `4.5:1`.
- Candidates: `ArtifactLimitation`, `ArtifactClosing`.
- Variants: limitation-only, limitation-plus-closing.
- Misuse risk: making the disclaimer look optional or letting it dominate the product.

Chapter mapping:

| Current part | Archetype |
| --- | --- |
| Cover | A Identity / Cover + B immediate-answer variant |
| Short letter | C Letter / Narrative |
| 今夜の答え | B Decision / Answer |
| この鑑定の読み方 | D Evidence / Interpretation — guide variant |
| 今の関係をほどく | D — timeline/facts variant |
| 相手にどう届く可能性があるか | D — possibilities variant |
| 不安の核 | D — fact/interpretation comparison variant |
| 文面の温度 | D — quote analysis variant |
| 今夜の推奨アクション | E Action / Time — action pair variant |
| 送る場合の文面案 | E — message draft variant |
| 3日間の月明かりプラン | E — timeline variant |
| 方針を変える条件 | E — re-evaluation variant |
| まだ断定できないこと | F Limits / Closing — limitation variant |
| 月の返事からの締め | F — closing variant |

## 18. Typography system

Font stacks:

- Heading/expressive: `"Yu Mincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Noto Serif JP", serif`.
- Body/control: `"Hiragino Sans", "Yu Gothic", "YuGothic", "Noto Sans JP", system-ui, sans-serif`.
- No font file, webfont request, package, or external asset may be added.

| Role | Family | Weight | Line height | Tracking | Max line length | Desktop | 390px | 320px | Allowed background | Contrast |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | --- |
| display | Mincho | 600 | 1.42 | `-0.02em` | 12–16 JP chars/line | 48px | 36px | 32px | Night or Paper | 3:1 large; target 4.5:1 |
| artifact title | Gothic | 800 | 1.6 | `0.08em` | 24em | 14px | 13px | 13px | Night/Paper | 4.5:1 |
| page title | Mincho | 600 | 1.48 | `-0.015em` | 18 JP chars/line | 40px | 32px | 28px | Night/Paper | 3:1 large; target 4.5:1 |
| chapter title | Mincho | 600 | 1.55 | `-0.01em` | 22 JP chars/line | 32px | 26px | 24px | Paper | 3:1 large; target 4.5:1 |
| subsection | Gothic | 700 | 1.7 | `0` | 28em | 18px | 17px | 16px | Paper/Night | 4.5:1 |
| answer statement | Mincho | 600 | 1.4 | `-0.015em` | 18em | 46px | 34px | 30px | Night or answer surface | 3:1 large; target 4.5:1 |
| body large | Gothic | 400 | 2.0 | `0.01em` | 34em | 18px | 17px | 16px | Paper/Night | 4.5:1 |
| body | Gothic | 400 | 1.95 | `0.01em` | 34–36em | 17px | 16px | 16px | Paper/Night | 4.5:1 |
| small | Gothic | 400/600 | 1.75 | `0.01em` | 40em | 14px | 14px | 13px | Paper/Night | 4.5:1 |
| metadata | Gothic | 700 | 1.6 | `0.06em` | 32em | 12px | 12px | 12px | Review surfaces only | 4.5:1 |
| note / limitation | Gothic | 400/700 | 1.85 | `0` | 36em | 14px | 14px | 13px | Caution/Paper | 4.5:1 |
| CTA | Gothic | 800 | 1.5 | `0` | one natural line | 16px | 16px | 15px | Night/Paper | 4.5:1 |
| numeric index | Gothic | 800 | 1.5 | `0.08em` | n/a | 12px | 12px | 11px | Paper/Night | 4.5:1 when meaningful |

Do not reduce body text below `16px` merely to preserve a desktop composition.

## 19. Japanese line-length and wrapping rules

- Desktop body target: `28–38` full-width Japanese characters per line; hard maximum `40`.
- 390px body target: `19–24` characters per line, determined by available width and glyph metrics.
- 320px fallback: `16–21` characters per line.
- Use `line-break: strict`, `word-break: normal`, and `overflow-wrap: break-word` for prose.
- Never apply `overflow-wrap: anywhere` to Japanese prose or headings; it is allowed only for technical identifiers.
- Use `text-wrap: balance` only for short headings.
- `phrase-keep` is allowed only for a short semantic label of approximately `12` characters or fewer. If it creates overflow, remove the keep rule; do not shrink text.
- Manual `<br>` is allowed only where a named title variant explicitly owns the line break and has a no-break mobile fallback.
- Do not justify Japanese body text.
- Do not center paragraphs longer than two short lines.
- Hanging punctuation and advanced font features are not required because OS stack behavior varies; acceptance is based on readable wrapping, not typographic simulation.

## 20. Spacing and vertical rhythm

Use a `4px` base with primary steps `8, 12, 16, 24, 32, 48, 64, 96`.

- paragraph gap: `12–16px`;
- list item gap: `12px`;
- subsection gap: `24–32px`;
- chapter heading to body: `24–32px`;
- chapter separation desktop: `72–96px` including padding;
- chapter separation 390px: `48–64px`;
- cover major-zone separation: `48–72px` desktop, `32–48px` mobile;
- paired-column gutter: `24–32px`;
- artifact edge padding desktop: `56–72px`;
- artifact edge padding 390px: `24px`;
- artifact edge padding 320px: `18–20px`.

Spacing distinguishes chapter roles before borders or background changes are introduced. No chapter may create “premium” appearance solely through excessive empty space.

## 21. Color and surface system

Use existing semantic families, with no new raw color proliferation:

- Night: `--night-950`, `--night-900`, `--night-800`, `--night-700`.
- Moon: `--moon-600`, `--moon-500`, `--moon-400`, `--moon-300`.
- Paper: `--paper-50`, `--paper-100`, `--paper-200`, `--paper-300`.
- Ink: `--ink-950`, `--ink-800`, `--ink-600`, `--ink-500`.
- States: success, caution, danger, and review role tokens.

Approved surface roles:

| Surface | Background | Primary text | Use |
| --- | --- | --- | --- |
| Night cover | night-950 → night-700 | paper-50 / paper-200 | cover and route-stage threshold |
| Paper body | paper-50 | ink-950 / ink-600 after contrast verification | continuous reading |
| Warm answer support | paper-200 | ink-950 | detailed-answer context and closing transition |
| Night answer | night-950 → night-700 | paper-50 / paper-200 | answer field only |
| Caution | state-caution background | state-caution foreground | limitation or non-guarantee where needed |
| Review | state-review background | state-review foreground | route metadata only |

Moon gold is an accent, not body text on Paper unless the exact pair meets `4.5:1`. White text on pale gold or pale paper is prohibited.

## 22. Border, divider, shadow and grain rules

- Standard border: `1px` paper or night semantic border.
- Strong answer boundary: at most one `1px` accent border or a `3–4px` side rule.
- Divider: `1px`, with an optional single lunar point.
- Radius: `0–6px` for the artifact; `8–12px` only for route/support surfaces. Avoid pill shapes except status labels.
- Paper shadow: one shared low-opacity shadow; do not stack multiple dramatic shadows.
- Answer shadow: only on a Night answer surface if contrast with the body requires depth.
- Grain: static, opacity at or below `0.35` after visual review; no contrast-bearing information; no animation.
- Grain pseudo-elements require an explicit positioned containing block and isolation so they cannot escape the artifact.
- No inner glow, neon outline, glass blur, or shadow on every chapter.

## 23. MoonSeal, LunarArc and decoration rules

- One medium MoonSeal on the Web/public cover.
- One small MoonSeal may appear in the closing or save-card identity; total visible seals per artifact should not exceed two.
- One LunarArc on the cover; a second is allowed only in a major answer or final Night field and must not be visible simultaneously with the cover arc in the same viewport at normal desktop height.
- EditorialDivider is used at the cover threshold and optionally before the closing, not between every chapter.
- Three-day phase markers are allowed only in the time-plan archetype and remain decorative; textual day labels are mandatory.
- All decorative SVG/CSS elements are `aria-hidden`, noninteractive, non-animated, and removable without loss of meaning.
- No stars, constellations, zodiac, tarot, orbit animation, lens flare, or particle field.

## 24. Desktop artifact layout

Reference frame: `1440px × 900px` viewport, complete-length frame using content height.

- stage width: full viewport, Night-to-Paper transition permitted;
- artifact target width: `840px`; maximum `864px`;
- main body is one editorial column;
- body text measure: `34–36em`, usually `560–620px` depending on OS font;
- two columns are permitted only for fact/unknown, do/do-not, change/hold, or capability/limit pairs;
- three columns are permitted only for the three-day plan and must collapse at `<=760px`;
- comparison navigation sits outside the artifact at maximum `992px` and lower visual weight;
- Header/Footer remain outside the artifact surface.

The artifact is not vertically centered in a fake application panel and does not use a persistent side rail.

## 25. 390px mobile artifact layout

Reference viewport: `390px × 844px`.

- standard route-shell outer padding: `16px`;
- Reading Note artifact-stage outer inset: `12px`;
- artifact available width: `366px`;
- artifact internal section padding: `24px`;
- no interior multi-column layout;
- answer, message draft, timeline, conditions, and limitations retain distinct sequencing through spacing and rules;
- Header and route boundary wrap before the artifact and are not sticky;
- comparison links become a one-column list with `44px` minimum targets;
- shadow spread is reduced so it does not imply horizontal overflow;
- no CTA is fixed, sticky, or floating;
- decorative arc is cropped and cannot sit behind more than one text group;
- body remains at least `16px`.

Mobile is not a stack of desktop cards. It is one continuous publication with deliberate chapter thresholds.

The `12px` inset is a limited wide treatment for a Reading Note artifact stage. It must not be applied indiscriminately to LP body content, the public intro, or a general route shell; those retain the standard `16px` route-shell padding at 390px.

## 26. 768px tablet reflow

Reference viewport: `768px × 1024px`.

- stage outer padding: `32px`;
- artifact maximum width: `704px`;
- cover padding: `48px`;
- body padding: `44–52px`;
- all three-column structures collapse to one column;
- true paired comparisons may remain two columns only when each column is at least `280px`; otherwise they stack;
- route boundary stacks its description and details control;
- comparison navigation uses one or two columns based on measured copy, not equal-height cards;
- title scale is between desktop and mobile values; do not retain desktop `48px+` display type by simple scaling.

## 27. 641–760px behavior

- Use a single-column artifact composition.
- Outer stage padding: `24px`.
- Artifact edge padding: `36–44px`.
- Collapse all paired analysis/action structures before text measures become narrow.
- Review boundary and public intro actions stack.
- Header navigation may wrap but must not overlap the artifact entry.
- Do not introduce a separate breakpoint-specific content order.
- Media-query ownership must be explicit: `<=960`, `<=760`, `<=640`, then optional `<=360` fallback, ordered broad-to-narrow.

## 28. 320px fallback

Reference viewport: `320px × 568px`.

- artifact-stage inset: `8–12px`;
- artifact internal padding: `18–20px`;
- body: `16px`, line height at least `1.9`;
- answer: minimum `30px`, natural two-line wrap allowed;
- all controls and links: minimum `44px` principal target;
- no horizontal scroll, clipped focus ring, single-character column, or text hidden behind decoration;
- technical IDs use `overflow-wrap: anywhere`; customer prose does not;
- long product/section names wrap naturally; do not abbreviate formal names;
- shadows and arcs are reduced or removed before content width is reduced.

320px is a robustness fallback, not the primary design canvas.

## 29. Web鑑定ノート specification

The Web artifact uses the fixed content in this exact product order:

1. Cover with exact immediate answer.
2. `月の返事からの短い手紙`.
3. Detailed `今夜の答え`.
4. `この鑑定の読み方`.
5. `今の関係をほどく`.
6. `相手にどう届く可能性があるか`.
7. `不安の核`.
8. `文面の温度`.
9. `今夜の推奨アクション`.
10. `送る場合の文面案`.
11. `3日間の月明かりプラン`.
12. `方針を変える条件`.
13. `まだ断定できないこと`.
14. `月の返事からの締め`.

The cover answer and detailed answer use the same fixed judgment. The detailed section supplies the explanation; the cover does not duplicate the reason paragraph. The artifact is one `article` with one `h1`. Chapter titles are ordered `h2`; internal labels are `h3` only where a real subsection exists.

## 30. 保存用判断カード specification

- Formal visible title: `保存用判断カード`.
- Existing `保存用鑑定書` copy is aligned only in Checkpoint B / M1-I8-R1 and only within that checkpoint's exact mutation manifest.
- The permitted alignment surfaces are the saved-artifact title, report-comparison labels, Reading Note LP-preview labels, and customer-facing labels directly attached to a Reading Note artifact.
- Other body-copy editing, fixture-judgment changes, product-name changes, and unrelated purchase/legal/request copy changes are prohibited.
- Purpose: retrieve the decision in approximately 30 seconds.
- Required order: identity; consultation theme; answer; do; do not; message draft conditions; next judgment time; change conditions; remembered line; fixed limitation.
- It remains a screen artifact, not A4, PDF, print, image, or downloadable file.
- It uses the same fixed `result-normal-001` object and judgment as Web.
- It is not generated from a universal chapter schema and is not a compressed duplicate of all fourteen chapters.
- Desktop maximum width: `720px`; 390px uses full available width with `24px` padding.
- The fixed limitation remains visible but must not displace the answer from the first screenful at 390px.

## 31. 公開全文見本 specification

- Route: `/sample-report`.
- Fixed source: `PUBLIC_SAMPLE_SEND_CASE` / `sample-send-001`.
- Fixed judgment: `今夜は短く返信してよい`.
- Required fixed disclosure remains verbatim.
- The sample uses the same cover, answer, letter, evidence, action, time, re-evaluation, limitation, and closing grammar as Web.
- It remains an eight-part edited artifact; it must not be padded to fourteen chapters.
- Public intro explains that it is fictional before the artifact.
- Review/fixture metadata is collapsed after the artifact.
- Desktop maximum width: `800px`; 390px uses the same mobile rhythm as Web.

## 32. LP proof and preview alignment

- The LP preview proves the artifact, not AI technology.
- The same-case LP/Web/save comparison uses `result-normal-001` and preserves `今日は送らない方がいい`.
- The different-case section continues to use wait/send/distance public cases and must not be presented as three formats of one result.
- LP previews may select excerpts but may not invent a new conclusion, fact, action, or promise.
- Preview typography, Night/Paper tokens, answer hierarchy, divider, and spacing must visibly belong to the artifact system.
- LP preview remains shorter and lighter than the artifact. It must not reproduce a full page inside a tiny mockup.
- Desktop and 390px LP frames are reviewed alongside artifact frames before M1-I9-R1 authorization.

## 33. ReportComparisonNavigation specification

- It appears after the artifact, outside the paper surface.
- It uses one editorial list, not three equal cards.
- Public mode explicitly states that the preceding send case differs from the fixed wait-case format comparison.
- Review mode explicitly states that the three views share the same fixed judgment.
- Link purpose and destination are visible without technical IDs.
- Fixture IDs remain in review metadata, not link labels.
- Minimum target: `44px`; visible focus is required.
- At 390px and 320px it is one column.
- No purchase, generation, save, or delivery implication is added.

## 34. ReviewBanner and review-boundary treatment

- ReviewBanner is route chrome, not part of the artifact.
- Default collapsed height target: `48–64px`; longer detail remains inside native `details`.
- Use neutral review color roles, not Moon-gold product emphasis.
- One concise statement must communicate: fixed fictional data; no purchase; no AI; no email; no save.
- Technical fixture IDs appear only in expanded details or post-artifact metadata.
- Banner and artifact boundary are not both visually dominant. If both remain, the global banner is minimal and the artifact-specific boundary supplies route-specific facts.
- Neither element is sticky.
- Future product-reader mode removes all review-only wrapper content without changing artifact anatomy.

## 35. Error and loading state alignment

Error:

- uses a shared artifact-adjacent Paper surface rather than unrelated raw color classes;
- keeps one h1, explicit fail-closed status, no fallback content, and clear return links;
- never displays a normal fixture when an ID is unknown;
- retains no-purchase/no-generation/no-save meaning.

Loading:

- remains a static review preview in M1;
- uses no spinner, shimmer, pulse, skeleton animation, fake progress, fetch, timer, or automatic transition;
- announces fixed status text through `role="status"`;
- uses the same typography, border, and surface tokens as the artifact wrapper.

At reduced motion, nothing visually or semantically changes because the states are already static.

## 36. Reading start and reading end treatment

Start:

- route boundary ends cleanly;
- stage gap creates a threshold;
- cover is the first dominant object;
- answer is discoverable inside the cover;
- no floating navigation overlays the first page.

End:

- fixed limitation precedes or sits within the closing archetype without becoming the last emotional sentence;
- closing letter and remembered line provide the final artifact voice;
- any CTA remains non-fixed and outside the closing prose;
- comparison navigation begins after at least `48px` desktop or `32px` mobile separation;
- Footer is visually separated from comparison navigation and does not look like another chapter.

## 37. Accessibility requirements

- One page, one visible h1.
- Heading levels do not skip for visual sizing.
- DOM order equals visual reading order at every breakpoint.
- `main`, `article`, `header`, `section`, `aside`, `nav`, lists, and definition lists reflect meaning.
- Decorative MoonSeal/LunarArc/divider/phase markers are hidden from assistive technology.
- Meaning is not encoded by color, border, or position alone.
- Keyboard-only operation reaches every link, details summary, and control in logical order.
- Focus-visible is at least `3px`, is not clipped by artifact overflow, and meets visible contrast.
- Principal interactive targets are at least `44 × 44 CSS px`.
- Body contrast is at least `4.5:1`; large text at least `3:1`; meaningful boundaries at least `3:1` where required.
- At 200% zoom, no information is lost, no two-dimensional scrolling is required for prose, and controls remain reachable.
- Japanese text does not collapse into single-character vertical runs.
- Status, error, and limitation text remains explicit.

## 38. Reduced-motion requirements

- Respect `prefers-reduced-motion: reduce`.
- No automatic animation is required for the artifact.
- Hover translation is optional and must be removed in reduced-motion mode.
- Smooth scrolling is disabled in reduced-motion mode.
- No information may depend on transition, reveal, parallax, shimmer, pulse, rotation, or timed progress.
- Decorative elements remain static in all modes.

## 39. Content-lock validation

Before any implementation mutation:

1. Recompute every exact scalar UTF-8 hash and exact source-slice LF-normalized hash in `M1_P3_CONTENT_LOCK_MATRIX.md`.
2. Verify every named exact fixture/object diff and exact rendered string.
3. Evaluate every semantic behavior assertion against its named source files and behavior owners.
4. Stop if any exact lock or semantic behavior assertion differs.
5. Record exact source commit and separate `Exact locks` and `Semantic behavior assertions` output sections.

After each checkpoint:

1. Recompute exact locks and re-evaluate semantic behavior assertions.
2. Compare exact values against the M1-P3 expected values.
3. Verify `fixtures/**`, `lib/safety/**`, product facts, and semantic behavior owners have no unauthorized diff.
4. Require `EXACT_LOCKS: PASS`, `SEMANTIC_ASSERTIONS: PASS`, and then `CONTENT_LOCK_GATE: PASS`.
5. Treat a mismatch as a hard failure; do not “update” expected hashes or rewrite an assertion inside an implementation task.

Cover summary validation must prove the displayed string equals the source judgment exactly. A hash of a summary sentence is never sufficient evidence for Safety order, fail-closed behavior, AI/non-guarantee meaning, purchase disablement, or runtime inactivity.

## 40. Technical preparation requirements

Checkpoint A is separately authorized by the current Human instruction and must remain visually neutral. Required preparation:

- add a deterministic content-lock check using Node built-ins or an equivalent dependency-free method;
- resolve the three real undefined custom-property references currently observed: `--violet-600`, `--ink-400`, and `--moon-700`;
- retain `--swatch-color` as an intentional component-provided dynamic property or give it an explicit fallback;
- give `paper-grain` an explicit positioned and isolated containing block;
- separate active artifact styles from obsolete LP/report style inventory;
- order media queries broad-to-narrow and document ownership of `960`, `760`, `640`, and optional `360` thresholds;
- establish an `artifact-*` style boundary and small explicit visual primitives;
- prepare an exact-manifest formal-name alignment map from residual `保存用鑑定書` to `保存用判断カード` without changing customer-facing copy in Checkpoint A; and
- produce a no-visual-change or explicitly documented delta audit before Checkpoint B.

No package or external asset is required.

## 41. Component mapping

| Candidate | Decision | Responsibility | Boundary |
| --- | --- | --- | --- |
| `ArtifactShell` | adopt | article width, surface, paper isolation, focus containment | no content schema |
| `ArtifactCover` | adopt | identity, consultation title, metadata, immediate answer slot | integrates `ArtifactIdentity` |
| `ArtifactIdentity` | integrate | brand/product/client/date anatomy | private subpart of Cover/save header |
| `ArtifactAnswer` | adopt | exact answer, reason, now/next variants | no fixture mutation |
| `ArtifactLetter` | adopt | opening/closing narrative measure | explicit children only |
| `ArtifactSection` | adopt narrowly | numbering, heading, body spacing | not a universal renderer or archetype switch |
| `ArtifactFactList` | adopt | labelled fact/unknown lists | semantic list/dl only |
| `ArtifactTimeline` | adopt | relationship and three-day ordered sequences | explicit variants, textual labels required |
| `ArtifactComparison` | adopt narrowly | true paired semantic comparison | not a generic card grid |
| `ArtifactMessageDraft` | adopt | quote, use timing, conditions | exact fixed draft content |
| `ArtifactActionPlan` | adopt | do/do-not and immediate actions | no CTA behavior |
| `ArtifactReevaluation` | adopt | change/hold conditions and next review | preserves both directions |
| `ArtifactLimitation` | adopt | uncertainty, capability, fixed disclaimer | cannot be hidden/collapsed by default |
| `ArtifactClosing` | adopt | remembered line, closing paragraphs, end transition | no sales interruption inside prose |
| `ArtifactDivider` | integrate | reuse or wrap existing `EditorialDivider` | one semantic visual grammar |

Web, save, and public report components remain separate compositions. They may share the primitives above; they must not be merged into one giant component.

## 42. CSS and token strategy

- Preserve semantic palette families and eliminate real undefined references before visual work.
- Use `artifact-*` component classes and `--artifact-*` local aliases only when a local role is clearer than a global token.
- No new raw color may be introduced without a named role, contrast evidence, and reuse rationale.
- Keep page/route styles separate from artifact styles.
- Move or clearly mark obsolete M1-I1/M1-I4 style blocks after usage audit; deletion requires a separate validated checkpoint.
- Use container dimensions and normal flow rather than viewport-fixed heights.
- Use CSS Grid only for genuine semantic comparisons or timelines.
- Use logical properties for padding/margins where practical.
- Avoid `overflow-x: hidden` as a defect mask.
- Focus outline must render outside controls even when the paper surface uses `overflow: clip`.
- Media queries are ordered `max-width: 960px`, `760px`, `640px`, then optional `360px`.

## 43. Implementation checkpoints

- M1-P3-R1 coded visual prototype gate: separately Human-authorized review-only A/B prototypes are implemented and automatically validated on isolated `/review/visual-excellence/**` routes. Both use the same fixed `result-normal-001` content subset and semantic order. Human selected and accepted B — `Lunar Contrast Edition` and rejected A — `Quiet Editorial Letter`. This is design evidence, not canonical visual implementation, and the prototype UI is not merged into `main`.
- Checkpoint A: Checkpoint A / M1-I8-R1 Technical Preparation is explicitly Human-authorized and not yet implemented. It is limited to the recorded exact mutation manifest and visually neutral content-lock and CSS/style-boundary preparation.
- Checkpoint B: Checkpoint B / M1-I8-R1 Visual Excellence remains unauthorized and unimplemented. The B selection satisfies its design-direction dependency, but separate explicit canonical implementation authorization with an exact mutation manifest is still absent. Figma is optional and is not a dependency. When authorized, Checkpoint B's scope remains Web, save, public sample, wrapper, comparison, error/loading, and the manifest-bounded formal-name alignment.
- Checkpoint C: M1-I9-R1 LP preview alignment remains unauthorized and unimplemented. Its dependencies are an accepted M1-I8-R1 artifact grammar, an explicit same-case/different-case boundary decision, and separate Human authorization. Optional Figma reference frames do not authorize it.
- Checkpoint D: M1-I12 final responsive/accessibility QA and acceptance package remains unauthorized and unimplemented and requires separate explicit Human authorization.

Each checkpoint has its own allowed files, validation, rollback, commit, and Human gate in `M1_P3_IMPLEMENTATION_PLAN.md`. Documentation, prototype selection, or optional Figma material cannot start a checkpoint without its separate explicit Human authorization. Completion or acceptance of one dependency or checkpoint does not authorize the next.

## 44. Human Visual QA criteria

Human reviews in ordinary external Microsoft Edge. Checkpoint B uses this route/viewport matrix:

| Surface | Desktop | 768px | 390px | 320px |
| --- | --- | --- | --- | --- |
| Web鑑定ノート | full visual review | reflow review | full visual review | overflow / wrap / focus fallback review |
| 保存用判断カード | full visual review | reflow review | full visual review | full fallback review |
| 公開全文見本 | full visual review | reflow review | full visual review | overflow / wrap fallback review |

Additional Checkpoint B coverage:

- Review wrapper: desktop and 390px.
- Error/loading: representative desktop and representative 390px.
- Common checks: answer discoverability, Japanese wrapping, horizontal overflow, focus visibility, keyboard order, contrast, 200% zoom, reduced motion, route-chrome subordination, and reading-end aftertaste.
- Product-quality checks: the artifact carries plausible JPY 980 ownership value, does not resemble pasted AI output/a blog/dashboard/cheap fortune-telling site, keeps six archetypes distinguishable, makes the message draft usable, makes the three-day sequence unambiguous, and preserves the closing aftertaste.

M1-I12 repeats the applicable checks and adds full-route regression. Web, save, public, and LP preview must share one grammar while retaining distinct purposes.

Human observations and automated checks must be recorded separately.

## 45. Automated validation criteria

Required for future implementation checkpoints:

- exact-lock output section PASS;
- semantic-behavior-assertion output section PASS;
- combined content-lock gate PASS only after both sections pass;
- undefined custom properties: zero real undefined references; intentional dynamic properties explicitly allowlisted;
- `npm.cmd run typecheck` PASS;
- `npm.cmd run lint` PASS with zero warnings;
- `npm.cmd run build` PASS;
- `git diff --check` PASS;
- fixture, `lib/safety/**`, package, product-fact, and runtime diffs absent;
- one h1 per relevant route by source/rendered-markup assertion;
- fixed judgments and disclosures present exactly;
- unknown fixture remains fail closed;
- no external font/asset/network, new package, fixed/sticky CTA, API, AI, DB, payment, email, analytics, persistence, or file-generation code;
- raw HTTP/rendered-text checks only when a future implementation task separately authorizes server use.

Automated checks do not establish visual acceptance.

## 46. Explicit exclusions

M1-P3 excludes:

- application implementation;
- CSS, component, fixture, Safety, product fact, price, request-sheet, or legal redesign changes;
- AI, DB, payment, email, API, server action, analytics, deployment, external font, or external asset;
- PDF, file generation, download, print, share, clipboard, or persistence;
- Storybook, screenshot regression, browser automation, or new package;
- animation production;
- Figma file creation or mutation;
- Browser, in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browser control, or screenshot acquisition by CodeX/agents;
- main commit/push, merge, or PR creation.

## 47. Open implementation questions

These are review-gate questions only; they do not reopen Human-fixed decisions:

1. Whether Checkpoint A keeps `EditorialDivider` unchanged or introduces an `ArtifactDivider` wrapper for naming consistency.
2. Whether the exact cover answer is placed after the cover line or before it; recommendation: after, as the final cover zone.
3. Whether the compact save header retains client identity; recommendation: retain nickname, omit the fixed review date from the primary scan path.
4. Whether obsolete CSS is deleted in Checkpoint A or only inventoried; recommendation: inventory first and delete only when usage checks prove it safe.
5. Whether future product-reader mode receives a new public route; recommendation: no route decision under M1-P3 or M1-I8-R1.

None of these questions permits fixture, judgment, Safety, price, runtime, font, or product-name changes.

## 48. Acceptance criteria

Product quality:

- the cover is recognizably a product;
- it has credible ownership value at JPY 980;
- it does not look like pasted AI output, a generic blog article, or a cheap fortune-telling site;
- the conclusion is reached quickly;
- the full text remains readable;
- chapter purposes are visually distinguishable;
- the message draft is immediately usable;
- the three-day timeline is understandable;
- the closing has aftertaste; and
- the disclaimer does not overwhelm the product.

Responsive:

- desktop has a natural editorial layout;
- 768px reflows without breakage;
- 390px is not a simple stacked desktop card layout;
- 320px has no horizontal scroll;
- CTA is never fixed or sticky; and
- text does not wrap one character at a time.

Accessibility:

- one page, one h1;
- correct heading order;
- keyboard-only operation;
- clear focus-visible;
- principal targets at least 44px;
- body contrast at least 4.5:1;
- large text contrast at least 3:1;
- no information loss at 200% zoom; and
- reduced motion preserves all meaning.

Technical:

- zero real undefined CSS custom properties;
- no proliferation of raw colors;
- exact fixture/scalar/source-slice/rendered-string locks match;
- semantic behavior assertions pass independently of those hashes;
- `lib/safety/**` unchanged;
- package files unchanged;
- no runtime addition;
- no external font or asset;
- typecheck, lint, build, and `git diff --check` pass.

## 49. Next gate

M1-P3 is Human and ChatGPT accepted as the authoritative, complete documentation/design specification. M1-P3-R1 A/B coded visual prototypes are implemented and automatically validated. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`.

Figma is optional and non-authoritative. Prototype selection does not authorize canonical visual implementation. Checkpoint A is explicitly authorized and not yet implemented; after implementation and automated validation, work stops for Human acceptance. Checkpoint B remains unauthorized and unimplemented. M1-I9-R1 and M1-I12 remain separately unauthorized. Milestone 1 remains incomplete. Milestone 2 remains unauthorized.
