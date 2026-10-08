# Changelog

## 0.8.1 – 2026-10-09 (prototype, not released)

- Media library: real micrographs supplied by the owner, digitally coloured and credited – blood cells (NCI,
  white cells coloured from hand-traced outlines), E. coli (NIAID), SARS-CoV-2 in a cell (CDC), and Hooke's
  original Micrographia page and cork figure (Science History Institute). Ready for the chosen site design.
- Design canvas: a second row of the three directions built on these real photos (with motion).

## 0.8.0 – 2026-10-09 (prototype, not released)

- New simulation `leeuwenhoek-microscope-3d@1.0.0` (pre-release, `3d-model`): a three.js reconstruction of
  Leeuwenhoek's microscope that students rotate from every side (drag, pinch, view and rotate buttons,
  auto-rotate off for reduced motion). Parts the photo does not show – the eye side, the lens socket, the
  back of the mount, the bracket's fixing screw and nut – are completed from descriptions of the surviving
  instruments. Nine parts are highlighted and explained; two sliders work the positioning and focusing
  screws. Without WebGL it shows the photo with the same explanations.
- Timeline cards can open a library simulation in place. The 1673 card keeps the photo and opens the 3D model.
- The schematic drawing of the microscope was removed (owner request).
- Simulations that need npm libraries are bundled from `sims-src/` into classic scripts (`npm run build:sims`).

## 0.7.2 – 2026-10-09 (prototype, not released)

- Real photo of Leeuwenhoek's microscope (exact replica; Jeroen Rouwkema, Wikimedia Commons, CC BY-SA 3.0,
  supplied by the owner and resized) beside the illustration on the 1673 timeline card.
- Timeline events can show up to three images; on phones several images sit in a row above the text.
- Media entries record their pixel size (checked by a test).
- Fix (microscope-lens 1.0.0, pre-release): switching samples twice within one animation frame skipped the
  first sample's observation. Observations are now recorded on every change; only drawing is coalesced.
  Regression test added (failed before the fix).

## 0.7.1 – 2026-10-09 (prototype, not released)

- Original illustration of Leeuwenhoek's single-lens microscope (SVG, gentle focusing motion, respects
  reduced motion) on the 1673 timeline card; card text explains its parts. Lesson `cell-discovery` 0.3.1.
- Design directions for the site (with motion) prepared on a design canvas for the owner to choose from.

## 0.7.0 – 2026-10-08 (prototype, not released)

- Media library (`docs/MEDIA.md`): self-hosted images with alt text, credit, licence and source status.
- Timeline events can show a picture. Timeline entries are now cards (picture, year, name and years,
  discovery, description, credit), following the owner's design; the overview strip jumps to a card.
- Lesson `cell-discovery` 0.3.0: portraits of Hooke (labelled as a modern reconstruction), Leeuwenhoek,
  Schleiden and Schwann on their timeline cards.

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
