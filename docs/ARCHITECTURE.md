# Architecture

Last updated: 2026-10-08 (prototype).

## Principle

One platform, many independent scientific simulations, and multiple educational activities per simulation.
The only thing simulations share is a thin contract (manifest + message protocol). Everything inside a
simulation — model, algorithms, visualization technology, interaction — is the simulation's own choice.

## Layers

```
Simulation modules            Shared contract              Educational activity layer
(any web technology)   --->   manifest + protocol v1  <--- activities (data) referencing
public/sims/<id>/<ver>/       src/lib/simulation/          one simulation version
```

- **Simulation module**: an immutable, versioned package (`index.html` + its own files). Never changed in
  place; a change is a new version directory.
- **Manifest** (`docs/SIMULATION_MANIFEST.md`): what the platform knows about a simulation – subject,
  concepts, grades, parameters with units and valid ranges, observables, events, device needs, license,
  scientific model documentation, validation status. Library, search and activities read only the manifest.
- **Protocol** (`docs/SIMULATION_PROTOCOL.md`): `postMessage` envelopes with declared capability levels 0–3.
- **Activity** (`src/lib/activity/schema.ts`): references `{simulation id, version}`; adds initial
  parameters, locked controls, objectives, curriculum mapping (labelled "suggested" until verified), steps
  (choice, task, reflect). Task conditions use only declared observables; `checkActivityCompatibility`
  enforces this and is covered by tests.

## Sandbox (section 8.9)

| Layer | Prototype | Production plan |
| --- | --- | --- |
| Origin isolation | `<iframe sandbox="allow-scripts">` (opaque origin) | Same, plus packages served from a separate domain (`NEXT_PUBLIC_SIM_ORIGIN`) |
| Network | CSP on `/sims/*`: `connect-src 'none'`, scripts only from the package | Same CSP on the simulation domain |
| Messages | Accepted only from the frame's window, schema-validated (zod), rate-limited (30/s) | Same |
| Identity | Random session id only | Same |

Verified by an end-to-end test: from inside a simulation, cookies, storage, the parent page and the network
are all inaccessible.

## Pages

- `/[locale]` home · `/[locale]/library` · `/[locale]/simulations/[id]` · `/[locale]/teachers`
- `/` redirects to `/he`. There is no middleware/proxy (portability; see `DEPLOYMENT.md`).
- All pages are pre-rendered (static). Phase 2 adds server features (auth, database, AI gateway).

## Internationalization

next-intl with `[locale]` routes. Interface text in `messages/he.json` and `messages/en.json`; content
objects carry `{ he, en }`. Graphs, DNA sequences, slider scales and formulas are always left-to-right;
units inside Hebrew text use Unicode isolates (U+2066…U+2069) or `.ltr-island`.

## Technology

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, next-intl 4, zod 4, Vitest,
Playwright + axe-core. Fonts are self-hosted (Rubik, Assistant via @fontsource) – no third-party requests
from students' browsers.

## Planned subsystems (not built yet)

Authentication and roles (Supabase), classrooms and assignments, teacher activity builder, AI gateway,
simulation import (HTML/ZIP/iframe/link), AI simulation studio, lessons (teacher-led and self-paced),
3D model viewer, AR. See `DEVELOPMENT_ROADMAP.md`.
