# Lesson model

Status: **lesson model and player implemented** (prototype). The in-app "upload transcript → AI lesson"
flow is not built yet; the demo lesson was produced by running the pipeline manually, with Claude acting
as the AI step.

Schema: `src/lib/lesson/schema.ts`. Example: `src/content/lessons/viruses-intro.json`.
Player: `src/components/lesson/LessonPlayer.tsx`. Pages: `/[locale]/lessons`, `/[locale]/lessons/[id]`.

## Structure

- A lesson is versioned data: metadata (title, audience, grades, duration, objectives, key concepts,
  misconceptions, curriculum mapping marked `suggested`), delivery configuration, provenance, and blocks.
- Block kinds: `explanation`, `question` (purpose `prediction` or `checkpoint`, with feedback and the
  targeted misconception), `simulation` (reference to `{id, version}` + optional activity id), `discussion`
  (with optional teacher note), `summary`, and three games:
  - `sequence` – put items in order; the solution is the order in the data; optional `detail` (e.g. a year)
    is revealed when solved.
  - `match` – pair each left item with its right item; each pair in the data is a correct match.
  - `categorize` – sort items into categories (e.g. true / false), with an optional explanation per item.
  Games are shuffled deterministically by block id (never starting solved), scored per item, and must be
  checked once before "next" in self-paced mode; teacher-led mode adds "show the solution to the class".
- `timeline` – an integrative timeline: `stages` (periods of progress), `tracks` (parallel strands, e.g.
  tools and ideas) and `events` in year order (year, optional approximate `yearLabel`, stage, track, title,
  text, `fromSource`). Shown as a proportional overview strip (always left-to-right) plus an accessible
  list grouped by stage, with gaps of 40+ years marked. Not scored.
- Worksheet blocks (assignments):
  - `fill-table` – students fill a table: `columns` (1–4, `long` for a text area) and `rows`, each with a
    given `cue` (e.g. a year), an optional `hint` and one cell per column with a model `answer`. Cells with an
    `accept` list (short answers such as names) are checked automatically and tolerantly (case, spaces,
    punctuation, niqqud and Hebrew final letters are ignored; a full name containing an accepted surname
    counts). Other cells are self-assessed against the model answer. A model answer appears only for a cell
    the student has filled in (or when the teacher shows them to the class in teacher-led mode).
  - `reflection` – an open, ungraded question with optional sentence starters, a minimum length and a teacher
    note.
  Answers are kept by the player for the whole lesson (not saved yet; accounts come later), and the student
  can copy all answers as plain text to send to the teacher. Validation: unique column and row ids, one cell
  per column, no unknown columns.
- A lesson has `type`: `lesson` (default) or `assignment` (a short student task, shown with an "Assignment"
  badge in topic and lesson lists).
- Every block records `origin` (`ai-generated`, `teacher`, `library`) and `reviewed`. Unreviewed AI blocks
  are labelled in the UI.
- Lessons reference library items; they never copy simulation code. `checkLessonReferences` verifies that
  each simulation is available at the exact version and that each activity belongs to it and is compatible.

## Delivery modes (§9.3)

One lesson, two modes, no duplicated content. Mode settings live in `lesson.delivery`:

| | Self-paced | Teacher-led |
| --- | --- | --- |
| Pacing | Student, part by part | Teacher, buttons or arrow keys (forward follows reading direction) |
| Questions | Student answers and gets feedback; `requireAnswerBeforeNext` blocks moving on | Shown large; answer hidden until the teacher reveals it (`revealAnswersByTeacher`) |
| Discussion | Prompt only | Prompt + teacher note |
| Layout | Normal | Classroom display: large type, tall panel |

## Transcript pipeline (§9.2) and where each step lives

| Step | Implemented | Where |
| --- | --- | --- |
| 1. Rights confirmation | Recorded in provenance; UI for teachers later | `provenance.pipeline.rights` |
| 2. Privacy screening before AI | Deterministic pass (e-mail, phone, Israeli ID with checksum, links) | `src/lib/lesson/privacy-screen.ts` + tests. Names are flagged for the teacher; an AI-assisted pass on screened text comes later |
| 3. Analysis (topics, objectives, misconceptions, mapping) | Manual in demo | Lesson metadata |
| 4. Outline approval | Not built (skipped in demo, recorded as such) | `provenance.pipeline.outline` |
| 5. Generation preferring library items | Manual in demo; reused `genetic-code@1.0.0` with a new activity | Lesson blocks |
| 6. Teacher review / content review | Not built | Status `pending` |

The transcript itself is never stored in the repository; only a SHA-256 fingerprint and a label.
In production, transcripts will be stored privately per owner (Supabase Storage, owner-only access).

## Still to build for the real flow

Upload UI, rights checkbox, server-side screening, AI gateway calls (needs approved API key and budget),
outline review screen, block editor, review queue, saving lessons to the database, assignment of a
lesson to a class in either mode, live class responses in teacher-led mode.
