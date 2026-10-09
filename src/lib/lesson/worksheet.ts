/**
 * Pure helpers for the worksheet blocks (`fill-table`, `reflection`): tolerant answer matching for short
 * answers such as names, and plain-text export of a student's answers. No React here.
 */

const NIQQUD = /[֑-ׇ]/g;
const FINALS: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

/** Lower-cases, removes niqqud, punctuation and spaces, and treats final letters as regular ones. */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFC")
    .replace(NIQQUD, "")
    .toLowerCase()
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * A short answer is accepted when its normalized form contains one of the accepted forms.
 * So "רוברט הוק", "הוק" and "Robert Hooke" all match the accepted form "הוק" or "hooke".
 */
export function matchesAccepted(answer: string, accepted: readonly string[]): boolean {
  const a = normalizeAnswer(answer);
  if (a.length < 2) return false;
  return accepted.some((x) => {
    const n = normalizeAnswer(x);
    return n.length > 0 && a.includes(n);
  });
}

/** Enough text to count as an answer to an open question (ignores spaces and punctuation). */
export function hasEnoughText(text: string, minChars: number): boolean {
  return normalizeAnswer(text).length >= minChars;
}

export type ExportRow = { label: string; fields: { label: string; value: string }[] };

/** Plain text a student can paste into a message to the teacher. */
export function answersAsText(title: string, rows: readonly ExportRow[], reflection?: { prompt: string; text: string }): string {
  const lines = [title, ""];
  for (const r of rows) {
    lines.push(r.label);
    for (const f of r.fields) lines.push(`  ${f.label}: ${f.value.trim() || "—"}`);
    lines.push("");
  }
  if (reflection) lines.push(reflection.prompt, reflection.text.trim() || "—");
  return lines.join("\n").trim();
}
