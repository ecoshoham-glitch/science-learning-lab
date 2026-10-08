# Changelog

## 0.3.0 – 2026-10-08 (prototype, not released)

- Subjects: "Subjects" page and a page per subject. Biology has three topic folders: the cell, genetic
  code and protein synthesis; enzymes and inquiry; viruses and the immune system. Other subjects show
  "coming soon".
- Fix: clicks made before a simulation is initialized were lost; simulations now wait, inert, for `init`.

## 0.2.0 – 2026-10-08 (prototype, not released)

- Lesson model v1 (blocks, delivery modes, provenance) and lesson player with self-paced and teacher-led modes.
- Lessons list and lesson pages; "Lessons" in the main navigation; example link on the teachers page.
- Demo lesson from a transcript: "Viruses: what they are, how they take over cells, and how the body remembers them".
- New activity `virus-variants-g10` on `genetic-code@1.0.0` (the simulation now has two activities).
- Privacy screening for transcripts (deterministic pass) with tests.
- Fix: simulation frames can shrink to fit their content.
- Fix: checklist lines must match task conditions one-to-one (enforced by a test).

## 0.1.0 – 2026-10-08 (prototype, not released)

- Next.js 16 project with Hebrew (default, RTL) and English (LTR).
- Simulation contract: manifest v1 and protocol v1 with validation, rate limiting and a sandboxed host.
- Simulation packages: `enzyme-lab@1.0.0`, `genetic-code@1.0.0` (pre-release; may still change before
  first publication, after which they are immutable).
- Activities: enzyme temperature (grade 10), enzyme pH inquiry (grade 12), mutation hunt (grade 10).
- Library with search and filters; teachers page placeholder.
- Unit tests (44) and end-to-end tests (26) incl. accessibility and sandbox isolation.
