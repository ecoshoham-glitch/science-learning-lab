# Lesson model

Status: design only (Project Instructions §9). Not implemented.

- A lesson is a versioned, editable sequence of blocks: objectives, explanations, media, simulation
  (reference to `{id, version}`), 3D model, inquiry activity, quiz, checkpoint, discussion prompt, summary.
- Lessons reference library items; they never copy simulation code.
- Delivery mode (teacher-led or self-paced) is configuration on the lesson or assignment, not a copy.
- Lessons from transcripts follow the pipeline in §9.2: rights confirmation, privacy screening before any AI
  call, outline approval, generation preferring validated library items, teacher editing with "not reviewed"
  marks, content review before public publication.

The activity schema (`src/lib/activity/schema.ts`) is the first building block: a lesson block of type
"activity" will reference an activity id.
