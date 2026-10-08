# Decisions

Newest first. "Owner" = project owner approval.

| Date | Decision | Status |
| --- | --- | --- |
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
