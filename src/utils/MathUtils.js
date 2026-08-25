/**
 * Utility math and interpolation functions for SoulBonker 3D
 */

export const MathUtils = {
  clamp: (val, min, max) => Math.min(Math.max(val, min), max),

  lerp: (a, b, t) => a + (b - a) * t,

  // Frame-rate independent exponential smoothing
  damp: (a, b, lambda, dt) => {
    return MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
  },

  randomRange: (min, max) => Math.random() * (max - min) + min,

  randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

  distSq2D: (x1, z1, x2, z2) => {
    const dx = x1 - x2;
    const dz = z1 - z2;
    return dx * dx + dz * dz;
  },

  dist2D: (x1, z1, x2, z2) => Math.sqrt(MathUtils.distSq2D(x1, z1, x2, z2)),

  angleTo: (fromX, fromZ, toX, toZ) => Math.atan2(toX - fromX, toZ - fromZ),

  // Shortest angle difference in radians
  angleDiff: (target, current) => {
    let diff = (target - current) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return diff;
  },

  easeOutQuad: (x) => 1 - (1 - x) * (1 - x),

  easeOutBack: (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },

  easeOutBounce: (x) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }
};
