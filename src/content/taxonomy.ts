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

/**
 * Topics are the folders inside a subject. A simulation or lesson appears in every topic
 * that shares at least one of its concepts, so content never has to be filed by hand twice.
 * Adding a topic (or a whole subject) is a data edit here.
 */
export type Topic = {
  id: string;
  subject: string;
  title: LocalizedText;
  description: LocalizedText;
  concepts: string[];
};

export const topics: Topic[] = [
  {
    id: "cell-and-proteins",
    subject: "biology",
    title: { he: "התא, הקוד הגנטי וסינתזת חלבונים", en: "The cell, the genetic code and protein synthesis" },
    description: {
      he: "איך ההוראות שב-DNA הופכות לחלבון, ומה קורה כשהן משתנות.",
      en: "How the instructions in DNA become a protein, and what happens when they change.",
    },
    concepts: ["genetic-code", "transcription", "translation", "mutations", "ribosome", "trna", "protein-synthesis"],
  },
  {
    id: "enzymes",
    subject: "biology",
    title: { he: "אנזימים וחקר", en: "Enzymes and inquiry" },
    description: {
      he: "גורמים שמשפיעים על פעילות אנזימים, ותכנון ניסוי מבוקר.",
      en: "What affects enzyme activity, and how to design a controlled experiment.",
    },
    concepts: ["enzymes", "reaction-rate", "denaturation", "controlled-experiment"],
  },
  {
    id: "viruses-immunity",
    subject: "biology",
    title: { he: "נגיפים ומערכת החיסון", en: "Viruses and the immune system" },
    description: {
      he: "מהו נגיף, איך הוא משתלט על תא, ואיך הגוף נלחם בו וזוכר אותו.",
      en: "What a virus is, how it takes over a cell, and how the body fights and remembers it.",
    },
    concepts: ["virus", "host-cell", "immune-memory", "vaccine"],
  },
];

export function topicsFor(subject: string): Topic[] {
  return topics.filter((t) => t.subject === subject);
}

export function inTopic(topic: Topic, itemConcepts: string[]): boolean {
  return itemConcepts.some((c) => topic.concepts.includes(c));
}
