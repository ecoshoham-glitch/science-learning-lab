# Decisions

Newest first. "Owner" = project owner approval.

| Date | Decision | Status |
| --- | --- | --- |
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
