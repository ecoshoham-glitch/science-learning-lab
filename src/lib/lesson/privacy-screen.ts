/**
 * Step 2 of the transcript pipeline (Project Instructions §9.2): privacy screening BEFORE any AI call.
 *
 * This deterministic pass removes contact and identity details that follow fixed patterns.
 * It cannot reliably find personal names; names are flagged for the teacher in the next pass
 * (and later by an AI-assisted pass that runs on already-screened text). Classroom recordings
 * must always be treated as potentially identifying.
 */

export type FindingKind = "email" | "phone" | "israeli-id" | "url";

export type ScreeningFinding = { kind: FindingKind; index: number; length: number };

export type ScreeningResult = {
  text: string;
  findings: ScreeningFinding[];
  counts: Record<FindingKind, number>;
};

const PATTERNS: Array<{ kind: FindingKind; re: RegExp; replacement: string }> = [
  { kind: "email", re: /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu, replacement: "[אימייל הוסר]" },
  { kind: "url", re: /\bhttps?:\/\/[^\s]+/gi, replacement: "[קישור הוסר]" },
  // Israeli mobile and landline numbers, with or without separators / +972.
  { kind: "phone", re: /(?:\+972[-\s]?|\b0)(?:[23489]|5\d|7\d)[-\s]?\d{3}[-\s]?\d{4}\b/g, replacement: "[טלפון הוסר]" },
  // Nine-digit numbers that pass the Israeli ID checksum.
  { kind: "israeli-id", re: /\b\d{9}\b/g, replacement: "[מספר זהות הוסר]" },
];

export function isValidIsraeliId(id: string): boolean {
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export function screenTranscript(input: string): ScreeningResult {
  const counts: Record<FindingKind, number> = { email: 0, phone: 0, "israeli-id": 0, url: 0 };
  const findings: ScreeningFinding[] = [];
  let text = input;

  for (const { kind, re, replacement } of PATTERNS) {
    text = text.replace(re, (match: string, offset: number) => {
      if (kind === "israeli-id" && !isValidIsraeliId(match)) return match;
      counts[kind] += 1;
      findings.push({ kind, index: offset, length: match.length });
      return replacement;
    });
  }
  return { text, findings, counts };
}
