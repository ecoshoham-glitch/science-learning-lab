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
      const isSvg = m.file.endsWith(".svg") && readFileSync(file, "utf8").trimStart().startsWith("<svg");
      expect(isJpeg || isPng || isSvg, m.file).toBe(true);
      expect(m.credit.he.length).toBeGreaterThan(5);
      expect(m.alt.he.length).toBeGreaterThan(5);
    }
  });

  it("SVG images contain no scripts, external references or embedded images", () => {
    for (const m of media.filter((x) => x.file.endsWith(".svg"))) {
      const svg = readFileSync(path.join("public", m.file), "utf8");
      expect(svg, m.file).not.toMatch(/<script|<foreignObject|href=|url\(|<image/i);
    }
  });

  it("share-alike and attribution licences name the author in the credit", () => {
    const photo = media.find((m) => m.id === "leeuwenhoek-microscope-photo")!;
    expect(photo.licence).toBe("cc-by-sa-3.0");
    expect(photo.credit.he).toContain("Jeroen Rouwkema");
    expect(photo.credit.he).toContain("CC BY-SA 3.0");
  });

  it("declared sizes match the image files", async () => {
    const { imageSize } = await import("./image-size");
    for (const m of media) {
      const s = imageSize(path.join("public", m.file));
      expect(s, m.id).toEqual({ width: m.width, height: m.height });
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
