import { describe, expect, it } from "vitest";
import { answersAsText, hasEnoughText, matchesAccepted, normalizeAnswer } from "@/lib/lesson/worksheet";
import { checkLessonReferences, getLesson } from "@/content/registry";
import { lessonSchema, type Lesson } from "@/lib/lesson/schema";

describe("normalizeAnswer", () => {
  it("ignores case, spaces, punctuation, niqqud and final letters", () => {
    expect(normalizeAnswer("  Robert   HOOKE! ")).toBe("roberthooke");
    expect(normalizeAnswer("שְׁלַיְידֶן")).toBe("שליידנ");
    expect(normalizeAnswer("שליידן")).toBe(normalizeAnswer("שליידנ"));
    expect(normalizeAnswer("ואן-ליווינהוק")).toBe("ואנליווינהוק");
  });
});

describe("matchesAccepted", () => {
  const hooke = ["הוק", "hooke"];
  it("accepts a full name, a surname and English spelling", () => {
    expect(matchesAccepted("רוברט הוק", hooke)).toBe(true);
    expect(matchesAccepted("הוק", hooke)).toBe(true);
    expect(matchesAccepted("Robert Hooke", hooke)).toBe(true);
  });
  it("rejects empty, one-letter and wrong answers", () => {
    expect(matchesAccepted("", hooke)).toBe(false);
    expect(matchesAccepted("ה", hooke)).toBe(false);
    expect(matchesAccepted("שוואן", hooke)).toBe(false);
  });
  it("accepts the common spellings of the names in the cell assignment", () => {
    const lesson = getLesson("cell-timeline-task")!;
    const table = lesson.blocks.find((b) => b.kind === "fill-table")!;
    if (table.kind !== "fill-table") throw new Error("no table");
    const accept = (row: string) => table.rows.find((r) => r.id === row)!.cells.name.accept!;
    expect(matchesAccepted("אנטוני ואן לוונהוק", accept("leeuwenhoek"))).toBe(true);
    expect(matchesAccepted("ליווינהוק", accept("leeuwenhoek"))).toBe(true);
    expect(matchesAccepted("Antonie van Leeuwenhoek", accept("leeuwenhoek"))).toBe(true);
    expect(matchesAccepted("מתיאס שליידן", accept("schleiden"))).toBe(true);
    expect(matchesAccepted("תאודור שוון", accept("schwann"))).toBe(true);
    expect(matchesAccepted("שליידן", accept("schwann"))).toBe(false);
  });
});

describe("hasEnoughText", () => {
  it("counts letters and digits only", () => {
    expect(hasEnoughText("   ...   ", 3)).toBe(false);
    expect(hasEnoughText("לא ידעתי", 7)).toBe(true);
  });
});

describe("answersAsText", () => {
  it("lists every row and field, marks empty answers and adds the reflection", () => {
    const text = answersAsText(
      "משימה",
      [{ label: "1665", fields: [{ label: "שם", value: " הוק " }, { label: "עיסוק", value: "" }] }],
      { prompt: "מה חדש?", text: "הכול" },
    );
    expect(text).toBe("משימה\n\n1665\n  שם: הוק\n  עיסוק: —\n\nמה חדש?\nהכול");
  });
});

describe("cell timeline assignment", () => {
  it("is an assignment in the cell topic with the three requested columns", () => {
    const lesson = getLesson("cell-timeline-task")!;
    expect(lesson.type).toBe("assignment");
    expect(lesson.keyConcepts).toContain("cell");
    const table = lesson.blocks.find((b) => b.kind === "fill-table");
    if (table?.kind !== "fill-table") throw new Error("no table");
    expect(table.columns.map((c) => c.id)).toEqual(["name", "occupation", "method"]);
    expect(table.rows.map((r) => r.id)).toEqual(["hooke", "leeuwenhoek", "schleiden", "schwann"]);
    expect(lesson.blocks.some((b) => b.kind === "reflection")).toBe(true);
    expect(checkLessonReferences(lesson)).toEqual([]);
  });

  it("lessons default to type lesson", () => {
    expect(getLesson("cell-discovery")!.type).toBe("lesson");
  });

  it("detects broken tables", () => {
    const lesson = structuredClone(getLesson("cell-timeline-task")!) as Lesson;
    const table = lesson.blocks.find((b) => b.kind === "fill-table");
    if (table?.kind !== "fill-table") throw new Error("no table");
    delete (table.rows[0].cells as Record<string, unknown>).method;
    (table.rows[1].cells as Record<string, unknown>).extra = table.rows[1].cells.name;
    table.rows[2].id = table.rows[3].id;
    table.columns.push({ ...table.columns[0] });
    const problems = checkLessonReferences(lessonSchema.parse(lesson)).join(" | ");
    expect(problems).toContain("duplicate column ids");
    expect(problems).toContain("duplicate row ids");
    expect(problems).toContain("row hooke has no cell for column method");
    expect(problems).toContain("unknown column extra");
  });
});
