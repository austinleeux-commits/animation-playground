/**
 * Evaluates a CSS-style `cubic-bezier(x1, y1, x2, y2)` curve, for animations
 * driven by a hand-rolled clock rather than by Motion. Newton-Raphson to invert
 * x(t), falling back to bisection when the curve is too flat to converge.
 */
export function cubicBezierEase([x1, y1, x2, y2]: [number, number, number, number]) {
  const value = (a: number, b: number, t: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  const slope = (a: number, b: number, t: number) =>
    3 * (1 - t) * (1 - t) * a + 6 * (1 - t) * t * (b - a) + 3 * t * t * (1 - b)

  return (x: number): number => {
    if (x <= 0) return 0
    if (x >= 1) return 1

    let t = x
    for (let i = 0; i < 8; i++) {
      const error = value(x1, x2, t) - x
      if (Math.abs(error) < 1e-6) return value(y1, y2, t)
      const d = slope(x1, x2, t)
      if (Math.abs(d) < 1e-6) break
      t -= error / d
    }

    let low = 0
    let high = 1
    t = x
    while (high - low > 1e-6) {
      if (value(x1, x2, t) < x) low = t
      else high = t
      t = (low + high) / 2
    }
    return value(y1, y2, t)
  }
}
