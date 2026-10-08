import { describe, expect, it } from "vitest";
import { LENS, MOUNT, PARTS, PIN_PATH, PLATE, RANGES, RIVETS, REAL_LENGTH_CM, VIEWS, pinTip, specimenAligned } from "../../sims-src/leeuwenhoek-microscope-3d/model.js";

describe("Leeuwenhoek 3D model – geometry facts", () => {
  it("the plates are about 5 cm long and about a third as wide, as in the photo", () => {
    expect(PLATE.height).toBeGreaterThan(45);
    expect(PLATE.height).toBeLessThan(55);
    expect(PLATE.width / PLATE.height).toBeGreaterThan(0.25);
    expect(PLATE.width / PLATE.height).toBeLessThan(0.55);
    expect(REAL_LENGTH_CM).toBe(5);
  });

  it("the lens is a ~1 mm bead near the top of the plates, inside them", () => {
    expect(LENS.radius * 2).toBeGreaterThan(0.8);
    expect(LENS.radius * 2).toBeLessThan(1.5);
    expect(LENS.y).toBeGreaterThan(PLATE.height / 4);
    expect(Math.abs(LENS.x)).toBeLessThan(PLATE.width / 2 - 2);
  });

  it("rivets are inside the plates, with two in the corners near the lens", () => {
    for (const [x, y] of RIVETS) {
      expect(Math.abs(x)).toBeLessThan(PLATE.width / 2);
      expect(Math.abs(y)).toBeLessThan(PLATE.height / 2);
    }
    expect(RIVETS.filter(([, y]) => y > LENS.y).length).toBe(2);
  });

  it("the pin's tip sits just behind the lens when the screws are at rest", () => {
    const tip = PIN_PATH[PIN_PATH.length - 1];
    expect(tip[0]).toBeCloseTo(LENS.x, 6);
    expect(tip[1]).toBeCloseTo(LENS.y, 6);
    expect(tip[2]).toBeGreaterThan(0);
    expect(specimenAligned(0, 0)).toBe(true);
  });

  it("the mount is behind the plates (specimen side), not attached in front", () => {
    expect(MOUNT.z0).toBeGreaterThan(0);
  });
});

describe("Leeuwenhoek 3D model – using the screws", () => {
  it("moving the mount up or down takes the specimen away from the lens", () => {
    expect(specimenAligned(2, 0)).toBe(false);
    expect(specimenAligned(-2, 0)).toBe(false);
    expect(specimenAligned(0.3, 0)).toBe(true);
  });

  it("moving the specimen away from the lens loses the sharp view", () => {
    expect(specimenAligned(0, 1.5)).toBe(false);
  });

  it("clamps to the screw ranges and rejects non-numbers", () => {
    expect(pinTip(99, 0).y).toBeCloseTo(LENS.y + RANGES.height.max, 6);
    expect(pinTip(0, -5).z).toBeCloseTo(PIN_PATH[PIN_PATH.length - 1][2], 6);
    expect(() => pinTip(Number.NaN, 0)).toThrow(TypeError);
  });

  it("every part is explained in both languages and has a view that shows it", () => {
    expect(PARTS.length).toBeGreaterThanOrEqual(9);
    for (const p of PARTS) {
      expect(p.he.length * p.en.length * p.textHe.length * p.textEn.length).toBeGreaterThan(0);
      expect(VIEWS).toContain(p.view);
    }
  });
});
