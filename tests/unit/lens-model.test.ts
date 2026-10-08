import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const L = require("../../public/sims/microscope-lens/1.0.0/model.js");

describe("microscope lens model – known values", () => {
  it("ball lens focal length f = nD/(4(n-1))", () => {
    expect(L.focalLength(2)).toBeCloseTo((1.52 * 2) / (4 * 0.52), 10);
  });

  it("a ~1.3 mm ball gives about 250–270x, like Leeuwenhoek's best lenses", () => {
    const m = L.ballMagnification(1.3);
    expect(m).toBeGreaterThan(250);
    expect(m).toBeLessThan(270);
  });

  it("the compound microscope of the 1660s is fixed at 50x", () => {
    expect(L.magnification("compound", 1)).toBe(50);
    expect(L.magnification("compound", 9)).toBe(50);
  });
});

describe("microscope lens model – invariants", () => {
  it("a smaller ball always magnifies more (the discovery in the text)", () => {
    for (let d = 1; d < 10; d += 0.1) expect(L.ballMagnification(d)).toBeGreaterThan(L.ballMagnification(d + 0.1));
  });

  it("magnification is inversely proportional to diameter", () => {
    expect(L.ballMagnification(2) / L.ballMagnification(4)).toBeCloseTo(2, 10);
  });

  it("clamps diameters to the valid range and rejects non-numbers", () => {
    expect(L.ballMagnification(0.1)).toBeCloseTo(L.ballMagnification(1), 10);
    expect(() => L.ballMagnification(NaN)).toThrow(TypeError);
  });
});

describe("what can be seen", () => {
  const { bacterium, corkCell, redBloodCell, protist } = L.SPECIMENS;

  it("bacteria (2 µm) need 100x; the 1660s compound microscope (50x) cannot show them", () => {
    expect(L.minMagnificationToSee(bacterium.sizeUm)).toBeCloseTo(100, 10);
    expect(L.isClearlyVisible(bacterium.sizeUm, 50)).toBe(false);
    expect(L.isClearlyVisible(bacterium.sizeUm, L.ballMagnification(1.3))).toBe(true);
  });

  it("cork cells were visible to Hooke at 50x", () => {
    expect(L.isClearlyVisible(corkCell.sizeUm, 50)).toBe(true);
  });

  it("red blood cells and protists are visible with any ball lens in range", () => {
    expect(L.isClearlyVisible(redBloodCell.sizeUm, L.ballMagnification(10))).toBe(true);
    expect(L.isClearlyVisible(protist.sizeUm, L.ballMagnification(10))).toBe(true);
  });

  it("bacteria become visible below about 3.4 mm diameter (M = 100)", () => {
    expect(L.isClearlyVisible(bacterium.sizeUm, L.ballMagnification(3.3))).toBe(true);
    expect(L.isClearlyVisible(bacterium.sizeUm, L.ballMagnification(3.6))).toBe(false);
  });

  it("every sample lists known specimens", () => {
    for (const ids of Object.values(L.SAMPLES) as string[][]) for (const id of ids) expect(L.SPECIMENS[id]).toBeDefined();
  });
});
