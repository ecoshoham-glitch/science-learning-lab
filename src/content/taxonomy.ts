import type { LocalizedText } from "@/lib/simulation/manifest";

/**
 * Taxonomy is data, not code: adding a subject, concept or interaction type is an edit here
 * (later: a database table edited by administrators), never a change to simulations or pages.
 */
export const subjects: Record<string, LocalizedText> = {
  biology: { he: "ביולוגיה", en: "Biology" },
  chemistry: { he: "כימיה", en: "Chemistry" },
  physics: { he: "פיזיקה", en: "Physics" },
  medicine: { he: "רפואה", en: "Medicine" },
  anatomy: { he: "אנטומיה ופיזיולוגיה", en: "Anatomy and physiology" },
};

export const interactions: Record<string, LocalizedText> = {
  "virtual-lab": { he: "מעבדה וירטואלית", en: "Virtual lab" },
  manipulation: { he: "מניפולציה ישירה", en: "Direct manipulation" },
  "3d-model": { he: "מודל תלת-ממדי", en: "3D model" },
  game: { he: "משחק", en: "Game" },
  "data-investigation": { he: "חקר נתונים", en: "Data investigation" },
};

export const concepts: Record<string, LocalizedText> = {
  enzymes: { he: "אנזימים", en: "Enzymes" },
  "reaction-rate": { he: "קצב תגובה", en: "Reaction rate" },
  denaturation: { he: "דה-נטורציה", en: "Denaturation" },
  "controlled-experiment": { he: "ניסוי מבוקר", en: "Controlled experiment" },
  "genetic-code": { he: "הקוד הגנטי", en: "Genetic code" },
  transcription: { he: "שעתוק", en: "Transcription" },
  translation: { he: "תרגום", en: "Translation" },
  mutations: { he: "מוטציות", en: "Mutations" },
  ribosome: { he: "ריבוזום", en: "Ribosome" },
  trna: { he: "tRNA", en: "tRNA" },
  virus: { he: "נגיפים", en: "Viruses" },
  "host-cell": { he: "תא מאכסן", en: "Host cell" },
  "protein-synthesis": { he: "סינתזת חלבונים", en: "Protein synthesis" },
  "immune-memory": { he: "זיכרון חיסוני", en: "Immune memory" },
  vaccine: { he: "חיסונים", en: "Vaccines" },
};

export const difficulties: Record<string, LocalizedText> = {
  intro: { he: "היכרות", en: "Introductory" },
  intermediate: { he: "בינוני", en: "Intermediate" },
  advanced: { he: "מתקדם", en: "Advanced" },
};

export function label(map: Record<string, LocalizedText>, key: string, locale: "he" | "en"): string {
  return map[key]?.[locale] ?? key;
}
