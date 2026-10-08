# Science Learning Lab

A standalone, multilingual (Hebrew/English) interactive science learning platform for high school.
**Status: prototype (Phase 2 foundation). Not for use with students.**

Core principle: one platform, many independent scientific simulations, and multiple educational activities per simulation.

## What works today

- Hebrew (RTL, default) and English (LTR) interface, language switch on every page
- Subjects with topic folders (Biology: 3 topics)
- Simulation library with search (both languages) and filters
- Three independent simulations, each a self-contained package running in a sandbox:
  - **Enzyme virtual lab** (`public/sims/enzyme-lab/1.0.0`) – Canvas + SVG
  - **From gene to protein** (`public/sims/genetic-code/1.0.0`) – DOM/SVG
  - **Leeuwenhoek's microscope** (`public/sims/microscope-lens/1.0.0`) – Canvas
- Three activities (data, not code); two of them reuse the same enzyme lab
- Activity tasks checked live against what the simulation reports (protocol level 3)
- Lessons: two demo lessons generated from transcripts, playable self-paced or teacher-led, with games (timeline, matching, true/false)

Not yet: accounts, database, teachers' tools, the in-app AI connection, hosting. See `docs/DEVELOPMENT_ROADMAP.md`.

## Run it locally

Requires Node.js 20.9 or later.

```bash
npm install
npm run build
npm start          # http://localhost:3000  (redirects to /he)
```

For development with live reload: `npm run dev`.

## Checks

```bash
npm run check      # type check + lint + unit tests + production build
npm run test:e2e   # browser tests on desktop and phone sizes (needs Playwright's Chromium,
                   # or CHROMIUM_PATH=/path/to/chromium)
```

## Layout

| Path | What it is |
| --- | --- |
| `src/app/[locale]/` | Pages (home, library, simulation, teachers) |
| `src/components/` | UI, including `SimulationHost` (sandbox + protocol) and `ActivityPanel` |
| `src/lib/simulation/` | Manifest schema and message protocol (the shared contract) |
| `src/lib/activity/` | Activity schema and condition evaluation |
| `src/content/` | Manifests, activities and taxonomy (moves to the database in Phase 2) |
| `public/sims/<id>/<version>/` | Immutable simulation packages |
| `sdk/sll-bridge.js` | Optional helper for simulation authors |
| `messages/` | Interface text, one file per language |
| `docs/` | Project documentation |
| `tests/unit`, `tests/e2e` | Scientific/contract tests and browser tests |

## Documentation

Start with `docs/ARCHITECTURE.md`, then `docs/SIMULATION_PROTOCOL.md` and `docs/SIMULATION_MANIFEST.md`.
Decisions are logged in `docs/DECISIONS.md`.
