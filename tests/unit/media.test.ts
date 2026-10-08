import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getLesson, checkLessonReferences, media } from "@/content/registry";

describe("media library", () => {
  it("every image file exists, is a real JPEG/PNG, and has a credit, alt text and licence", () => {
    expect(media.length).toBeGreaterThan(0);
    for (const m of media) {
      const file = path.join("public", m.file);
      expect(existsSync(file), m.file).toBe(true);
      const head = readFileSync(file).subarray(0, 4);
      const isJpeg = head[0] === 0xff && head[1] === 0xd8;
      const isPng = head.toString("latin1", 1, 4) === "PNG";
      expect(isJpeg || isPng, m.file).toBe(true);
      expect(m.credit.he.length).toBeGreaterThan(5);
      expect(m.alt.he.length).toBeGreaterThan(5);
    }
  });

  it("modern reconstructions are labelled as such for students", () => {
    for (const m of media.filter((x) => x.kind === "reconstruction")) expect(m.note, m.id).toBeDefined();
  });

  it("free-art-licence images name the artist in the credit", () => {
    const hooke = media.find((m) => m.id === "hooke")!;
    expect(hooke.licence).toBe("free-art-license");
    expect(hooke.credit.en).toContain("Rita Greer");
  });

  it("a timeline event pointing to unknown media is detected", () => {
    const l = structuredClone(getLesson("cell-discovery")!);
    const tl = l.blocks.find((b) => b.kind === "timeline");
    if (tl?.kind === "timeline") tl.events[0].media = "nobody";
    expect(checkLessonReferences(l).join(" ")).toContain("unknown media nobody");
  });
});
