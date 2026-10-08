/*
 * Enzyme virtual lab – scientific model, v1.0.0.
 * SIMPLIFIED EDUCATIONAL MODEL. Not a model of any specific enzyme.
 *
 * relative rate (%) = 100 * S / (Km + S) * fT(T) * fpH(pH)
 *
 *   Substrate:   Michaelis–Menten saturation, Km = 2 mM (rate is half of maximum at S = Km).
 *   Temperature: below the optimum (37 °C) the rate doubles for every 10 °C (Q10 = 2);
 *                above it, denaturation is modeled as a Gaussian fall-off (width 8 °C).
 *   pH:          Gaussian around the optimum (pH 7, width 1.5 pH units).
 *
 * Measurement: each measurement adds reproducible noise of at most ±3 % of the true value,
 * so repeated trials differ slightly, as in a real lab.
 *
 * Pure functions, no DOM. Loaded as a classic script in the browser and with require() in tests.
 */
(function (root) {
  "use strict";

  var CONSTANTS = Object.freeze({
    vmax: 100,
    km: 2, // mM
    tOpt: 37, // °C
    q10: 2,
    denatureWidth: 8, // °C
    pHOpt: 7,
    pHWidth: 1.5,
    noise: 0.03,
  });

  var RANGES = Object.freeze({
    temperature: { min: 0, max: 80 },
    pH: { min: 1, max: 14 },
    substrate: { min: 0, max: 20 },
  });

  function assertFinite(name, x) {
    if (typeof x !== "number" || !isFinite(x)) throw new TypeError(name + " must be a finite number");
  }

  function clamp(x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
  }

  /** Temperature factor, 0..1, equal to 1 at the optimum. */
  function temperatureFactor(t) {
    assertFinite("temperature", t);
    t = clamp(t, RANGES.temperature.min, RANGES.temperature.max);
    if (t <= CONSTANTS.tOpt) return Math.pow(CONSTANTS.q10, (t - CONSTANTS.tOpt) / 10);
    var z = (t - CONSTANTS.tOpt) / CONSTANTS.denatureWidth;
    return Math.exp(-z * z);
  }

  /** pH factor, 0..1, equal to 1 at the optimum. */
  function pHFactor(pH) {
    assertFinite("pH", pH);
    pH = clamp(pH, RANGES.pH.min, RANGES.pH.max);
    var z = (pH - CONSTANTS.pHOpt) / CONSTANTS.pHWidth;
    return Math.exp(-z * z);
  }

  /** Substrate saturation factor, 0..1 (Michaelis–Menten). */
  function substrateFactor(s) {
    assertFinite("substrate", s);
    s = clamp(s, RANGES.substrate.min, RANGES.substrate.max);
    return s / (CONSTANTS.km + s);
  }

  /** True (noise-free) relative rate in % of the maximum. */
  function rate(conditions) {
    return (
      CONSTANTS.vmax *
      substrateFactor(conditions.substrate) *
      temperatureFactor(conditions.temperature) *
      pHFactor(conditions.pH)
    );
  }

  /** Small deterministic PRNG (mulberry32) so measurements are reproducible per session. */
  function prng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** One measurement: the true rate with at most ±3 % relative noise, rounded to 0.1. */
  function measure(conditions, seedText, trialIndex) {
    var r = rate(conditions);
    var rand = prng(hashString(String(seedText) + ":" + trialIndex))();
    var noisy = r * (1 + (rand * 2 - 1) * CONSTANTS.noise);
    return Math.max(0, Math.round(noisy * 10) / 10);
  }

  var api = {
    CONSTANTS: CONSTANTS,
    RANGES: RANGES,
    temperatureFactor: temperatureFactor,
    pHFactor: pHFactor,
    substrateFactor: substrateFactor,
    rate: rate,
    measure: measure,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EnzymeModel = api;
})(typeof window !== "undefined" ? window : this);
