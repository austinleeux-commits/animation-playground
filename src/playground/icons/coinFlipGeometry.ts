import type { LottieBezierShape } from '../lottie/lottie'

/*
 * Geometry for the coin flip: a two-tone disc turning on its vertical axis.
 *
 * The silhouette never changes — only the boundary between the two faces
 * moves, and it moves as an ellipse pinned to the top and bottom of the disc
 * (the same construction as a moon's terminator). One number describes the
 * whole animation:
 *
 *   u = -1  the incoming face is a hairline on the entry limb (nothing showing)
 *   u =  0  a straight vertical edge down the middle (half showing)
 *   u = +1  the incoming face has swept the whole disc
 *
 * The ellipse's x-radius is u * COIN_RADIUS, so every vertex and every bezier
 * handle below is *affine* in `u`. That is what lets the Lottie export animate
 * the entire sweep with two linearly-interpolated path keyframes instead of a
 * baked frame-by-frame morph — Lottie lerps vertices and tangents, which for
 * this shape is exact rather than an approximation.
 */

/** Traced from the source recording: a 68px disc in a 108px frame. */
export const COIN_VIEWBOX = 108
export const COIN_CENTER = COIN_VIEWBOX / 2
export const COIN_RADIUS = 34

/** Handle length that turns a cubic bezier into a quarter-circle of radius 1. */
const ARC_HANDLE = 0.5522847498307936

/** +1 when the incoming face sweeps in from the left limb, -1 from the right. */
export type CoinEntrySide = 1 | -1

/**
 * The incoming face at terminator offset `u` (see the module comment): the
 * entry-side half of the disc, closed off by the terminator ellipse.
 */
export function coinFaceShape(u: number, entrySide: CoinEntrySide): LottieBezierShape {
  const c = COIN_CENTER
  const r = COIN_RADIUS
  const terminatorX = u * r
  const discHandle = ARC_HANDLE * r
  const terminatorHandle = ARC_HANDLE * terminatorX

  return {
    closed: true,
    vertices: [
      // Top of the disc, where the terminator meets the rim.
      {
        v: [c, c - r],
        i: [entrySide * terminatorHandle, 0],
        o: [-entrySide * discHandle, 0],
      },
      // The entry limb.
      {
        v: [c - entrySide * r, c],
        i: [0, -discHandle],
        o: [0, discHandle],
      },
      // Bottom of the disc.
      {
        v: [c, c + r],
        i: [-entrySide * discHandle, 0],
        o: [entrySide * terminatorHandle, 0],
      },
      // The terminator's widest point, sweeping across the disc.
      {
        v: [c + entrySide * terminatorX, c],
        i: [0, discHandle],
        o: [0, -discHandle],
      },
    ],
  }
}
