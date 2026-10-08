# Testing

## Suites

| Command | What it checks |
| --- | --- |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Vitest: scientific models against known values and invariants; manifest/activity contract; protocol validation; rate limiting |
| `npm run test:e2e` | Playwright on desktop and phone (Pixel 7) sizes, against a production build, with axe-core accessibility checks (WCAG 2.0–2.2 A/AA, serious and critical) |

## Scientific tests (examples)

- Enzyme lab: factor 1 at 37 °C; Q10 = 2 below (½ at 27 °C, ¼ at 17 °C); Gaussian denaturation above;
  rate = Vmax/2 at S = Km; rate within 0–100 over the whole range; noise within ±3 %; reproducible.
- Genetic code: 64 codons; stops exactly UAA/UAG/UGA; known assignments; codon counts per amino acid;
  correct translation of the starting gene; classification of silent, missense, nonsense, nonstop and
  frameshift mutations.
- The home-page curve uses the same formula as the package model (checked degree by degree).

## End-to-end tests (examples)

- Root goes to Hebrew/RTL; language switch keeps the page and flips direction.
- Library: Hebrew search, cross-language search, filters, empty state.
- Enzyme activity: configuration reaches the simulation (locked controls), five measurements complete the
  task; measured values match the model; switching activity re-configures the same simulation.
- Genetic activity: four mutation types found through the real UI; the activity notices.
- Sandbox: from inside a simulation, cookies, storage, parent DOM and network are blocked.

## Last run

2026-10-08 (0.2.0): unit 54/54 passed; end-to-end 38/38 passed (19 scenarios × desktop and phone).
Root cause of the earlier intermittent genetic-code failure found and fixed in 0.3.0 (early click undone by init); 16/16 repeated runs passed.

## Lesson tests

- Lesson references resolve to available simulation versions and compatible activities; a wrong version is detected.
- Transcript lessons keep only a fingerprint and stay unreviewed until review.
- Privacy screen removes e-mails, phones, valid Israeli IDs and links; keeps ordinary numbers.
- E2E: self-paced blocks "next" until a question is answered; the lesson's simulation activity completes
  through the real simulation; teacher-led hides answers until revealed and moves with arrow keys;
  provenance shown; English + accessibility.

## Cell lesson tests (0.4.0)

- Microscope model: ball-lens focal length and magnification formula, ~1.3 mm ≈ 260×, monotonic and
  inverse-proportional in diameter, compound fixed at 50×, bacteria need ×100 (threshold ≈ 3.4 mm), clamping.
- Games logic: stable shuffle that never returns the solved order, moves at the edges, scoring of all three games.
- Contract: broken game blocks (unknown/empty category, duplicate ids) are detected.
- E2E (desktop + phone): topic is first in Biology; microscope magnifications and bacteria visibility in the
  real UI; activity ticks; lesson prediction and simulation; timeline solved with buttons, focus follows
  the moved item; matching and true/false scoring; teacher "show solution"; English; axe.
- Timeline (0.5.0): gaps, stage ranges, scale and overview range (unit); broken timelines detected
  (contract); stages, gaps, expand, filter, teacher-only "added" marks, axe (e2e, desktop + phone).
- Last run 2026-10-08: unit 80/80; end-to-end 64/64.

## Not yet verified

- Real iPhone/Safari and Firefox (tests use Chromium only).
- Manual screen-reader testing (VoiceOver, TalkBack).
- Scientific review of the simulations by the owner (they are labelled as drafts).
