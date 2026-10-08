import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
// The model ships inside the immutable simulation package; tests load that exact file.
const M = require("../../public/sims/enzyme-lab/1.0.0/model.js");

const opt = { temperature: 37, pH: 7, substrate: 2 };

describe("enzyme lab model – known values", () => {
  it("temperature factor is 1 at the optimum (37 °C)", () => {
    expect(M.temperatureFactor(37)).toBeCloseTo(1, 10);
  });

  it("follows Q10 = 2 below the optimum: half the rate 10 °C lower, a quarter 20 °C lower", () => {
    expect(M.temperatureFactor(27)).toBeCloseTo(0.5, 10);
    expect(M.temperatureFactor(17)).toBeCloseTo(0.25, 10);
  });

  it("falls sharply above the optimum (denaturation)", () => {
    expect(M.temperatureFactor(45)).toBeCloseTo(Math.exp(-1), 10);
    expect(M.temperatureFactor(60)).toBeLessThan(0.01);
    expect(M.temperatureFactor(80)).toBeLessThan(1e-6);
  });

  it("is half of maximum when substrate equals Km (Michaelis–Menten)", () => {
    expect(M.rate(opt)).toBeCloseTo(50, 10);
  });

  it("approaches saturation at high substrate", () => {
    expect(M.rate({ ...opt, substrate: 20 })).toBeCloseTo((100 * 20) / 22, 10);
  });

  it("pH factor is 1 at pH 7 and symmetric around it", () => {
    expect(M.pHFactor(7)).toBeCloseTo(1, 10);
    expect(M.pHFactor(5.5)).toBeCloseTo(M.pHFactor(8.5), 10);
    expect(M.pHFactor(5.5)).toBeCloseTo(Math.exp(-1), 10);
  });
});

describe("enzyme lab model – invariants", () => {
  it("is monotonic increasing below the optimum and decreasing above it", () => {
    for (let t = 0; t < 37; t++) expect(M.temperatureFactor(t + 1)).toBeGreaterThan(M.temperatureFactor(t));
    for (let t = 37; t < 80; t++) expect(M.temperatureFactor(t + 1)).toBeLessThan(M.temperatureFactor(t));
  });

  it("the highest rate on a 1 °C grid is at 37 °C", () => {
    let bestT = 0;
    for (let t = 0; t <= 80; t++) {
      if (M.rate({ ...opt, temperature: t }) > M.rate({ ...opt, temperature: bestT })) bestT = t;
    }
    expect(bestT).toBe(37);
  });

  it("rate stays within 0..100 across the whole valid range", () => {
    for (let t = 0; t <= 80; t += 5)
      for (let p = 1; p <= 14; p += 1)
        for (let s = 0; s <= 20; s += 2.5) {
          const r = M.rate({ temperature: t, pH: p, substrate: s });
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(100);
        }
  });

  it("no substrate means no reaction", () => {
    expect(M.rate({ ...opt, substrate: 0 })).toBe(0);
  });

  it("rejects non-numeric input instead of returning NaN", () => {
    expect(() => M.rate({ ...opt, temperature: NaN })).toThrow(TypeError);
    expect(() => M.rate({ ...opt, pH: "7" })).toThrow(TypeError);
  });

  it("clamps values outside the valid range to the range edge", () => {
    expect(M.temperatureFactor(200)).toBeCloseTo(M.temperatureFactor(80), 12);
    expect(M.substrateFactor(-5)).toBe(0);
  });
});

describe("enzyme lab model – measurement noise", () => {
  it("each measurement is within ±3 % (plus rounding) of the true rate", () => {
    const conditions = { temperature: 30, pH: 7, substrate: 10 };
    const truth = M.rate(conditions);
    for (let i = 0; i < 500; i++) {
      const m = M.measure(conditions, "session-a", i);
      expect(Math.abs(m - truth)).toBeLessThanOrEqual(truth * 0.03 + 0.05);
    }
  });

  it("is reproducible for the same session and trial, and varies between trials", () => {
    const c = { temperature: 30, pH: 7, substrate: 10 };
    expect(M.measure(c, "s", 3)).toBe(M.measure(c, "s", 3));
    const values = new Set(Array.from({ length: 20 }, (_, i) => M.measure(c, "s", i)));
    expect(values.size).toBeGreaterThan(5);
  });
});

describe("home page curve stays in sync with the package model", () => {
  it("matches temperatureFactor at every degree", async () => {
    const { heroTemperatureFactor } = await import("@/lib/hero-curve");
    for (let t = 0; t <= 70; t++) expect(heroTemperatureFactor(t)).toBeCloseTo(M.temperatureFactor(t), 12);
  });
});
