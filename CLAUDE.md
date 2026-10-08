# Notes for Claude sessions in this repository

- The Project Instructions (v2.0) in the claude.ai Project are authoritative. Talk to the owner in Hebrew;
  code, comments and docs in English.
- This is a standalone project. Never touch, connect to or deploy anything related to the owner's other
  websites or repositories (e.g. eco-shoham).
- Nothing is deployed. Do not deploy, buy services or create paid resources without explicit owner approval;
  before any public deployment, show the exact URL and wait for approval.
- Before finishing a task: `npm run check`, and `npm run test:e2e` when UI or simulations change.
- Simulation packages in `public/sims/<id>/<version>/` are immutable once published (currently all are
  pre-release 1.0.0). A change after publication = a new version directory.
- Activities may use only parameters/observables declared in the simulation's manifest
  (`checkActivityCompatibility` + tests).
- Hebrew is default; graphs, sequences, sliders and formulas stay left-to-right.
- Read `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` first; log new decisions there.
