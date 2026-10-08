# Topic maps

A topic map is a flowchart of a topic's written content, shown at the top of each topic on the subject
page. Students get the big picture first, then expand any idea for more detail.

## Data (`src/content/topic-maps/<topic>.json`, schema `src/lib/topic-map/schema.ts`)

- `topic` – the taxonomy topic id; `origin` and `reviewed` (AI-generated maps stay unreviewed until checked).
- `nodes` – `id`, `rank` (row, top to bottom), `title`, short `summary` (shown in the box), `details`
  (paragraphs shown when the idea is expanded) and an optional `link` to the lesson or simulation where it is taught.
- `edges` – `from`, `to`, optional `label`. Arrows go one row down, or sideways within a row.

Layout is data (ranks), so a teacher-facing editor can later move boxes without code.
`checkTopicMap` rejects unknown topics, skipped or upward arrows, rows wider than 3, unconnected boxes,
and links to lessons or simulations that are not available. Every topic must have a map (unit test).

## Interaction (`src/components/TopicMap.tsx`)

- Mouse: hovering a box previews its expansion; moving into the expansion keeps it open; clicking keeps it open.
- Keyboard: focusing a box previews it; Enter/Space keeps it open; Escape closes and returns focus.
- Touch: tapping opens it, tapping again closes it. On narrow screens the expansion opens under the chart.
- Screen readers: each box is a button with `aria-expanded`; arrows are decorative, and each box says in
  text which ideas it leads to.
- Arrows are measured from the rendered boxes and redrawn on resize; labels are HTML, so mixed
  Hebrew/English renders correctly.
