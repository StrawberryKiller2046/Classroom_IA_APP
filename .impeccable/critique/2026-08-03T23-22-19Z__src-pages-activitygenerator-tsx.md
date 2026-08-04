---
target: Activity Generator page + AppShell sidebar
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-03T23-22-19Z
slug: src-pages-activitygenerator-tsx
---
Method: dual-agent (A: independent design-review sub-agent · B: independent detector/browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good loading/toast feedback, but usage quota only surfaces on this one page |
| 2 | Match System / Real World | 3 | Worksheet-styled preview matches a teacher's mental model well |
| 3 | User Control and Freedom | 2 | No cancel-in-flight, no reset/start-over, no undo after generating |
| 4 | Consistency and Standards | 3 | Dashboard's StatStrip and Generator's FormSection use different grouping conventions for similar content |
| 5 | Error Prevention | 2 | Validation only surfaces post-submit; no guard before spending a generation credit |
| 6 | Recognition Rather Than Recall | 3 | Smart auto-derivation within a session, but nothing persists between sessions |
| 7 | Flexibility and Efficiency | 2 | Fully applicable (daily-use tool, repeat inputs) — zero shortcuts or presets |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but the "minimalism" is missing hierarchy, not deliberate editing |
| 9 | Error Recovery | 2 | Generic toast text; no differentiation of failure cause (quota vs. network vs. content) |
| 10 | Help and Documentation | 1 | No tooltips or explanation of what a choice like "Mixed" produces before spending a credit |
| **Total** | | **24/40** | **Acceptable — significant improvements needed before users are happy** |

## Design Specificity Verdict

**LLM assessment**: This reads as shadcn/ui in its default configuration wearing a single custom hue. A brand primary exists (`oklch(0.52 0.19 265)`, blue-violet) but it only touches three things across the whole page: the sidebar logo badge, the active-nav tint, and the primary button fill. Every Select, Input, section boundary, and the sidebar itself is stock shadcn "new-york" with no domain vocabulary layered on top. The `--accent` token (a pale green) is defined in the theme and effectively unused anywhere. The one place the app genuinely commits to being an exam tool is the generated-worksheet preview card (ruled Name/Teacher/Date header, worksheet-shaped loading skeleton) — that's real specificity, and it's the exception, not the pattern. Swap the copy for "Invoice Generator" and nothing else in the form would need to change. Your framing is correct — not because color is literally absent, but because it's applied so sparingly it doesn't register as authored.

**Deterministic scan**: `detect.mjs --json src` returned a clean exit (0 findings) — no structural anti-patterns in the source markup itself. The live browser overlay (a separate, DOM-level check on the rendered page) flagged one item on both `/` and `/dashboard`: a `layout-transition` rule reporting `transition: height` on `<body>`. I checked the app's own CSS and component code for a source of this and found nothing — no `body` transition is declared anywhere in `index.css`, `main.tsx`, or `App.tsx`. This is most likely a browser/tooling artifact (possibly from the diagnostic overlay script itself, or a computed-style side effect of `transition: all`-style utility classes on an ancestor) rather than a real product issue. Flagging it as unconfirmed rather than a priority finding — worth a 30-second look if you want certainty, but I wouldn't spend a design pass on it.

**Visual overlays**: No user-visible `[Human]` browser overlay was left open for you — the review agent's browser environment couldn't composite screenshots (pane wasn't displayed for frame capture), so overlay evidence was captured via console output only, not a live visual highlight. The finding above is the complete overlay output; nothing else was flagged on either page.

## Overall Impression

The bones are solid — clean information architecture, sensible defaults, real content-aware loading states — but the surface is unauthored. The biggest single opportunity is also the most obvious one once you see it: the generated-worksheet card is the best-designed thing in the product, and its visual language (ruled structure, purposeful restraint, "this is a real exam" feel) stops at the edge of the preview pane instead of setting the tone for the whole screen.

## What's Working

1. **`WorksheetGhost` skeleton** (`ActivityPreview.tsx`) — doesn't just spin; it renders a muted Name/Teacher/Date row and question-line placeholders that foreshadow the actual deliverable's shape before it exists. Real content-aware loading design, rare in this category of app.
2. **The generated worksheet card itself** — ruled header fields, a subject/grade/difficulty/count badge strip — the one moment that visually declares "this is an exam," not a generic form response.
3. **Deferred-default micro-interactions** — exam name auto-derives from subject + grade + date, education level infers from grade, exercise type pre-selects to "Mixed" instead of an empty placeholder, all overridable via "touched" flags. Quietly cuts required taps without removing control.

## Priority Issues

**[P0] Sections have no real boundary; fields have no visual hierarchy**
- **Why it matters**: `FormSection` (`ActivityGenerator.tsx:327-334`) is just an uppercase muted-gray label; every `Field` (line 336) renders the same `Label` + full-width Input/Select regardless of whether it's required (Subject) or optional (Topic, Classroom link). Cognitive-load scoring failed 4 of 8 checks directly because of this — chunking, grouping, visual hierarchy, and progressive disclosure all fail. Ten fields read as one undifferentiated list instead of three logical stages.
- **Fix**: Wrap each section in a padded/bordered container with subtle depth (shadow, not just a gray border), and visually demote optional fields relative to required ones.
- **Suggested command**: `$impeccable layout`

**[P1] No domain-specific visual language outside the preview card**
- **Why it matters**: Primary color touches exactly 3 elements total on the page; `--accent` is defined and dead. Typography, iconography, and section chrome are all stock shadcn. The app has a genuinely strong visual idea (the worksheet motif) and confines it to one component.
- **Fix**: Extend the worksheet motif backward into the form itself; use the currently-unused `--accent` for something meaningful (e.g. a "ready to generate" state) instead of leaving it dead in the token set.
- **Suggested command**: `$impeccable colorize`

**[P1] Zero reassurance at the credit-spending moment**
- **Why it matters**: The "3 generations this month" chip (`ActivityGenerator.tsx:134-138`) is visually disconnected from the Generate button and shows no ceiling — a teacher can't tell if they're about to burn their last generation before committing. This is the single highest-stakes moment in the flow and currently gets zero visual reinforcement.
- **Fix**: Anchor a compact "X of Y left" progress indicator next to or inside the submit area; make the limit visible, not just the count used.
- **Suggested command**: `$impeccable colorize`

**[P2] Sidebar is flat, undifferentiated, and missing shell-level affordances**
- **Why it matters**: `AppShell.tsx` gives all 5 nav items equal visual weight despite Generator being the explicit landing surface; no shadow/elevation on the aside; no account/settings/usage summary lives in the persistent chrome.
- **Fix**: Add light elevation to the sidebar, and consider a sidebar-footer usage/plan summary so quota context is visible everywhere, not just on the Generator page.
- **Suggested command**: `$impeccable colorize` (active section header) + `$impeccable layout` (depth/elevation)

**[P3] No progress cue through the form's 3 conceptual stages, and an ungrouped 70-option Country select**
- **Why it matters**: Minor but real scan cost on the single most frequently reused field in the tool (Country rarely changes between sessions but has to be re-scanned alphabetically every time).
- **Fix**: Lower priority than the above; consider once section grouping lands.
- **Suggested command**: `$impeccable layout`

## Persona Red Flags

**Alex (impatient power user, same class every day)**: Every field resets to blank on load (`defaultValues` are all `""`, `ActivityGenerator.tsx:63-77`) — Alex re-picks Country/Grade/Subject/Education-level from scratch every session with zero "last used" memory, directly failing heuristic #7. No "duplicate last activity" or preset path exists anywhere. The quota pill gives no ceiling, so Alex can't gauge whether a batch of 5 generations is safe before starting.

**Jordan (confused first-timer)**: "Country / curriculum region" is the very first required field with no explanatory copy on why it matters, committing Jordan to a choice before understanding its purpose. The three `FormSection` labels are 12px uppercase gray text, easy to skim past — Jordan is likely to perceive one long field list rather than three logical stages. Nothing explains what "Mixed" difficulty/type will actually produce before a generation is spent on it.

**Sam (accessibility-dependent, screen reader/keyboard)**: Live accessibility-tree inspection during the review showed every Select renders two comboboxes in the tree — the visible Radix trigger plus a hidden native `<select>` with the full option list — a real risk of doubled or confusing screen-reader announcements per field. The active sidebar/bottom-nav state is signaled mostly by color plus a 2px bar, with no weight change, thin margin for low-vision users. Field errors render as plain destructive-colored text with no icon — color-only error signaling.

## Minor Observations

- Mobile bottom nav duplicates all 5 sidebar items 1:1 — consistent, but the "Options" section content sits far down a long scroll on a phone with no jump/anchor.
- The usage chip ("3 generations this month") uses `font-mono` for a plain sentence — monospace here reads as an arbitrary choice rather than a numeric-alignment one.
- The demo-mode banner (flask icon + warning tint) is a clear system-status signal, worth confirming it renders as prominently as it reads in code.
- `Field` hint copy ("AI will suggest a title...", "Filled in from the grade above...") is genuinely well-written and reassuring — better than the rest of the form's copy register; worth using as the voice reference when touching other copy.
- The `layout-transition` / `transition: height` finding on `<body>` (noted above) — unconfirmed source, likely tooling artifact, not urgent.

## Questions to Consider

1. The worksheet-card treatment is clearly the strongest, most teacher-specific design idea in the codebase — why does it stop at the preview pane instead of setting the visual language for the whole page?
2. The app already persists classrooms, history, and a planner — so why does the Generator form forget every input the moment you leave it? Is there a product reason a daily-use tool shouldn't remember your last class?
3. `--accent` is defined but effectively dead — was it meant for something (correct-answer states, success indicators) that hasn't been wired up yet, or is it worth removing to avoid an inconsistent token set?
