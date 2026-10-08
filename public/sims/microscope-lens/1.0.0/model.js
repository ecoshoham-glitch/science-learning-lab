/*
 * Microscope lens simulation – scientific model, v1.0.0.
 * SIMPLIFIED EDUCATIONAL MODEL.
 *
 * Single ball lens (Leeuwenhoek type):
 *   focal length  f = n·D / (4·(n − 1))      (effective focal length of a glass sphere)
 *   magnification M = 250 mm / f             (simple magnifier, near point 250 mm)
 *   with n = 1.52 (glass) and D the ball diameter in mm.
 *   A ~1.3 mm ball gives M ≈ 260, close to Leeuwenhoek's best surviving lenses.
 *
 * Compound microscope of the 1660s (Hooke type): fixed M = 50, the practical upper limit then.
 *
 * Visibility: an object is seen clearly when its apparent size (actual size × M) reaches 0.2 mm,
 * a comfortable limit for the eye. Diffraction, lens aberrations and lighting are ignored.
 *
 * Pure functions, no DOM.
 */
(function (root) {
  "use strict";

  var CONSTANTS = Object.freeze({
    refractiveIndex: 1.52,
    nearPointMm: 250,
    compoundMagnification: 50,
    clearApparentMm: 0.2,
  });

  var RANGES = Object.freeze({ lensDiameter: { min: 1, max: 10 } });

  /** Typical sizes in micrometres. */
  var SPECIMENS = Object.freeze({
    corkCell: { sizeUm: 30, he: "תאי שעם (דפנות)", en: "Cork cells (walls)" },
    protist: { sizeUm: 100, he: "חד-תאיים (פרוטיסטים)", en: "Single-celled protists" },
    bacterium: { sizeUm: 2, he: "חיידקים", en: "Bacteria" },
    redBloodCell: { sizeUm: 7.5, he: "תאי דם אדומים", en: "Red blood cells" },
  });

  var SAMPLES = Object.freeze({
    cork: ["corkCell"],
    pond: ["protist", "bacterium"],
    blood: ["redBloodCell"],
  });

  function assertFinite(name, x) {
    if (typeof x !== "number" || !isFinite(x)) throw new TypeError(name + " must be a finite number");
  }

  function clampDiameter(d) {
    assertFinite("lensDiameter", d);
    return Math.min(RANGES.lensDiameter.max, Math.max(RANGES.lensDiameter.min, d));
  }

  /** Effective focal length of a glass ball, in mm. */
  function focalLength(diameterMm) {
    var d = clampDiameter(diameterMm);
    var n = CONSTANTS.refractiveIndex;
    return (n * d) / (4 * (n - 1));
  }

  /** Magnification of a ball lens of the given diameter. */
  function ballMagnification(diameterMm) {
    return CONSTANTS.nearPointMm / focalLength(diameterMm);
  }

  /** Magnification for an instrument: "ball" (uses diameter) or "compound" (fixed). */
  function magnification(instrument, diameterMm) {
    return instrument === "compound" ? CONSTANTS.compoundMagnification : ballMagnification(diameterMm);
  }

  /** Apparent size in mm of an object of `sizeUm` micrometres at magnification M. */
  function apparentSizeMm(sizeUm, m) {
    assertFinite("size", sizeUm);
    assertFinite("magnification", m);
    return (sizeUm / 1000) * m;
  }

  function isClearlyVisible(sizeUm, m) {
    return apparentSizeMm(sizeUm, m) >= CONSTANTS.clearApparentMm;
  }

  /** Smallest magnification at which an object is seen clearly. */
  function minMagnificationToSee(sizeUm) {
    return CONSTANTS.clearApparentMm / (sizeUm / 1000);
  }

  var api = {
    CONSTANTS: CONSTANTS,
    RANGES: RANGES,
    SPECIMENS: SPECIMENS,
    SAMPLES: SAMPLES,
    focalLength: focalLength,
    ballMagnification: ballMagnification,
    magnification: magnification,
    apparentSizeMm: apparentSizeMm,
    isClearlyVisible: isClearlyVisible,
    minMagnificationToSee: minMagnificationToSee,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LensModel = api;
})(typeof window !== "undefined" ? window : this);
