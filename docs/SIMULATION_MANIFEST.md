# Simulation manifest – version 1

Schema: `src/lib/simulation/manifest.ts` (zod). Examples: `src/content/simulations/*.json`.

| Field | Meaning |
| --- | --- |
| `manifestVersion` | Always `1` for this format |
| `id`, `version` | Lower-case id; semantic version. The package lives at `public/sims/<id>/<version>/` |
| `title`, `summary` | `{ he, en }` |
| `subject`, `concepts[]`, `interaction`, `difficulty` | Taxonomy keys (`src/content/taxonomy.ts`); taxonomy is data |
| `grades` | `{ from, to }` |
| `languages` | Interface languages the simulation supports |
| `status` | `available` or `planned` |
| `entry` | Package entry path (required when available) |
| `protocol` | `{ version: 1, capabilityLevel: 0–3 }` |
| `parameters[]` | `{ id, kind: "number", label, unit, min, max, step, default }`; requires level 3 |
| `observables[]` | `{ id, type, label, unit? }` – what activities may check |
| `events[]` | Event names the simulation may emit |
| `device` | `{ minWidth, touch, webgl }` |
| `accessibility` | `{ he, en }` description of accessible use and alternatives |
| `license` | `{ id, holder, source }` |
| `scientificModel` | `{ kind: "simplified-educational" \| "realistic", description, assumptions[] }` |
| `validation` | `{ status: draft \| automated-tests-passed \| teacher-approved \| reviewed, notes? }` |

## Validation rules

- Defaults must lie inside `[min, max]`; `grades.from <= grades.to`.
- Available simulations need an `entry`; parameters require capability level 3.
- Tests check that the entry and bridge files exist and that the entry path matches `<id>/<version>`.

## Scientific accuracy

Every manifest documents its model, assumptions and simplifications, and states whether it is a simplified
educational model. The UI shows a "draft – not yet scientifically reviewed" label until `validation.status`
is `reviewed`.
