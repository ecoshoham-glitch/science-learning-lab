/**
 * Points for the home-page curve. Uses the same formula and constants as the enzyme lab
 * package model (public/sims/enzyme-lab/1.0.0/model.js); a unit test keeps them in sync.
 */
export function heroTemperatureFactor(t: number): number {
  const tOpt = 37;
  if (t <= tOpt) return Math.pow(2, (t - tOpt) / 10);
  const z = (t - tOpt) / 8;
  return Math.exp(-z * z);
}

export function heroCurvePoints(step = 1): Array<{ t: number; rate: number }> {
  const points: Array<{ t: number; rate: number }> = [];
  for (let t = 0; t <= 70; t += step) points.push({ t, rate: 100 * heroTemperatureFactor(t) });
  return points;
}
