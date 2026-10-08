# Changelog

## 0.6.0 – 2026-10-08 (prototype, not released)

- Topic maps: every Biology topic opens with a flowchart of its written content. Hover, focus or tap a box
  to expand it (details + a link to the lesson or simulation). Four maps: the cell; genetic code and protein
  synthesis; enzymes; viruses and immunity. See `docs/TOPIC_MAPS.md`.

## 0.5.0 – 2026-10-08 (prototype, not released)

- Lesson model: `timeline` block – an integrative timeline with stages of progress, parallel tracks (e.g.
  tools vs ideas), a proportional overview strip, gaps between periods, expandable events, a track filter,
  and a teacher-only mark on events added beyond the source.
- Lesson `cell-discovery` 0.2.0: new part 11, "The full timeline: tools and ideas" (12 events, 6 stages,
  1590–1939).

## 0.4.0 – 2026-10-08 (prototype, not released)

- Biology topic "The cell – the unit of life" (first topic), with new concepts `cell`, `cell-theory`, `microscope`.
- New simulation `microscope-lens@1.0.0` (pre-release): Leeuwenhoek ball lens vs Hooke's ×50 compound
  microscope; cork, pond water and blood samples; scientific model with unit tests.
- New activity `microscope-discovery-g10` (5 steps: observe, find bacteria, threshold question, compound
  microscope, reflection).
- Lesson model: three game blocks – `sequence` (timeline), `match`, `categorize` (e.g. true/false) – scored,
  deterministic shuffle, keyboard-accessible, "show solution" in teacher-led mode, must be checked before
  moving on in self-paced mode.
- Lesson "Discovering the cell" generated from an owner-supplied transcript (12 parts, 3 games).

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
