# Decisions

Newest first. "Owner" = project owner approval.

| Date | Decision | Status |
| --- | --- | --- |
| 2026-10-09 | 3D models may use three.js, bundled with esbuild into a classic script inside the package (sandboxed opaque-origin frames cannot load ES modules); no CDN, no network. Sources in `sims-src/`, bundle committed with the immutable package | Implemented |
| 2026-10-09 | End-to-end tests run Chromium with SwiftShader (software WebGL) so 3D models are really rendered and checked; a WebGL-less run checks the fallback | Implemented |
| 2026-10-09 | Leeuwenhoek's microscope: the schematic drawing was replaced by a 3D reconstruction (photo proportions + documented parts) shown from the timeline card, beside the real photo | Owner request |
| 2026-10-08 | Images are self-hosted with recorded licence and credit. Hooke has no authentic portrait; Rita Greer's 2004 reconstruction is used with a visible "modern reconstruction" note (Free Art License, artist credited). Images with unconfirmed sources are flagged to teachers and must be confirmed before public publication | Implemented, Schleiden/Schwann sources to confirm |
| 2026-10-08 | Timeline entries changed from expandable rows to always-open cards, per the owner's design | Owner design |
| 2026-10-08 | Topic maps are data (nodes with explicit rows, edges one row down or sideways) rendered as HTML boxes with measured SVG arrows, not a diagram library: no new dependency, accessible buttons, correct RTL. Expansion opens on hover/focus, stays open on click/tap | Implemented |
| 2026-10-08 | Timeline block is lesson data with stages and tracks; each event records `fromSource` so additions beyond the transcript are visible to the teacher (not to students) for review. Validation enforces year order and forward-moving stages | Implemented |
| 2026-10-08 | Game blocks (`sequence`, `match`, `categorize`) are lesson data, not simulations: no code per game, shuffled deterministically by block id, scored by pure functions (`src/lib/lesson/games.ts`). Ordering uses up/down buttons rather than drag-and-drop, for keyboard and screen-reader access | Implemented |
| 2026-10-08 | New simulation `microscope-lens` built for the cell lesson because no library simulation fitted (§9.2 step 4). Simplified model: ball-lens optics, fixed ×50 compound microscope, 0.2 mm visibility limit | Implemented, awaiting owner scientific review |
| 2026-10-08 | Lesson "cell-discovery" from transcript: corrected "150 years" to about 170; added Virchow (1855) and that Hooke saw dead cells; omitted an age-inappropriate anecdote and the unproven Vermeer-model claim | Implemented, awaiting owner review |
| 2026-10-08 | Subjects and topics: subject pages with topic "folders"; topics are data in the taxonomy, and items appear by shared concepts (no manual filing). First subject: Biology with 3 topics | Implemented |
| 2026-10-08 | Bridge keeps an embedded simulation inert until `init` arrives (fixes lost early clicks; root cause of the intermittent genetic-code test) | Implemented, protocol v1 behaviour |
| 2026-10-08 | Demo lesson "viruses-intro" generated from an owner-supplied transcript by running the §9.2 pipeline manually (Claude as the AI step). Transcript not committed; fingerprint only. Lesson text written in original words | Implemented, awaiting owner review |
| 2026-10-08 | Lesson delivery modes are one component with configuration, not two copies (self-paced: answer before next; teacher-led: teacher reveals answers, arrow keys) | Implemented |
| 2026-10-08 | Bridge measures body height (frames can shrink as well as grow). Packages are still pre-release 1.0.0, so updated in place | Implemented |
| 2026-10-08 | Language routing without middleware/proxy (root page redirects to `/he`) so the site does not depend on Node-runtime proxy support at the host | Implemented |
| 2026-10-08 | Hebrew is the default language regardless of browser language (`localeDetection: false`) | Implemented, reversible |
| 2026-10-08 | Fonts self-hosted via @fontsource (no Google Fonts requests from students' browsers) | Implemented |
| 2026-10-08 | Simulation bridge repeats `ready` until `init` (fixes a load-order race) | Implemented, part of protocol v1 |
| 2026-10-08 | Next.js 16 instead of 15: current stable line; 15 pulled a vulnerable PostCSS. Production dependencies audit clean | Implemented |
| 2026-10-08 | Known dev-only advisory: `braces` via `eslint-config-next` (no patched release yet). Not shipped to users | Accepted, monitor |
| 2026-10-08 | Standalone project: own repository `ecoshoham-glitch/science-learning-lab`, own hosting, database, credentials and domain; no connection to existing ECOShoham sites | Owner |
| 2026-10-08 | Stack: Next.js + TypeScript + Supabase | Owner approved |
| 2026-10-08 | Hosting: pending comparison (Cloudflare vs Vercel), see `DEPLOYMENT.md` | Awaiting owner |
| 2026-10-08 | Project Instructions v2.0: independent simulation modules, shared contract, activity layer, sandbox, AI lessons | Owner approved |
