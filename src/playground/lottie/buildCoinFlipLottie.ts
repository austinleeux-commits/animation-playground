import type { TransitionConfig } from 'dialkit'
import {
  COIN_CENTER,
  COIN_RADIUS,
  COIN_VIEWBOX,
  coinFaceShape,
  type CoinEntrySide,
} from '../icons/coinFlipGeometry'
import { hexToLottieColor, type LottieBezierShape } from './lottie'

const EXPORT_SIZE = 512
const EXPORT_SCALE = EXPORT_SIZE / COIN_VIEWBOX
const FRAME_RATE = 60

/**
 * A sweep can't overshoot — the face would spill past the disc's rim — so a
 * spring dial is read as its duration plus a decelerating curve, in the live
 * preview and in the export alike.
 */
const SPRING_EASE_BEZIER: [number, number, number, number] = [0.33, 0, 0.15, 1]

export type CoinFlipLottieOptions = {
  transition: TransitionConfig
  holdSeconds: number
  entrySide: CoinEntrySide
  frontColor: string
  backColor: string
}

export function coinFlipEase(transition: TransitionConfig): [number, number, number, number] {
  return transition.type === 'easing' ? transition.ease : SPRING_EASE_BEZIER
}

export function coinFlipSeconds(transition: TransitionConfig): number {
  return transition.type === 'easing' ? transition.duration : (transition.visualDuration ?? 0.8)
}

function scalePoint([x, y]: [number, number]): [number, number] {
  return [x * EXPORT_SCALE, y * EXPORT_SCALE]
}

function scaleShape(shape: LottieBezierShape) {
  return {
    c: shape.closed,
    v: shape.vertices.map((pt) => scalePoint(pt.v)),
    i: shape.vertices.map((pt) => scalePoint(pt.i)),
    o: shape.vertices.map((pt) => scalePoint(pt.o)),
  }
}

function staticLayerTransform() {
  return {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: [0, 0, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [100, 100, 100] },
  }
}

function staticGroupTransform() {
  return {
    ty: 'tr',
    p: { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
    r: { a: 0, k: 0 },
    o: { a: 0, k: 100 },
  }
}

function fillItem(colorHex: string) {
  return { ty: 'fl', nm: 'Fill', c: { a: 0, k: hexToLottieColor(colorHex) }, o: { a: 0, k: 100 } }
}

/** The plain disc under the sweep — whichever face the turn is starting from. */
function discLayer(ind: number, name: string, colorHex: string, ip: number, op: number) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: staticLayerTransform(),
    shapes: [
      {
        ty: 'gr',
        nm: name,
        it: [
          {
            ty: 'el',
            nm: 'Disc',
            p: { a: 0, k: scalePoint([COIN_CENTER, COIN_CENTER]) },
            s: { a: 0, k: [COIN_RADIUS * 2 * EXPORT_SCALE, COIN_RADIUS * 2 * EXPORT_SCALE] },
          },
          fillItem(colorHex),
          staticGroupTransform(),
        ],
      },
    ],
    ip,
    op,
    st: 0,
  }
}

/**
 * The incoming face sweeping across. Two path keyframes are enough: the shape
 * is affine in the terminator offset, so Lottie's linear vertex interpolation
 * reproduces every frame in between exactly (see `coinFlipGeometry`).
 */
function sweepLayer(
  ind: number,
  name: string,
  colorHex: string,
  entrySide: CoinEntrySide,
  ease: [number, number, number, number],
  startFrame: number,
  flipFrames: number,
  op: number,
) {
  const [bx1, by1, bx2, by2] = ease

  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: staticLayerTransform(),
    shapes: [
      {
        ty: 'gr',
        nm: name,
        it: [
          {
            ty: 'sh',
            nm: 'Face',
            ks: {
              a: 1,
              k: [
                {
                  t: startFrame,
                  s: [scaleShape(coinFaceShape(-1, entrySide))],
                  o: { x: [bx1], y: [by1] },
                  i: { x: [bx2], y: [by2] },
                },
                { t: startFrame + flipFrames, s: [scaleShape(coinFaceShape(1, entrySide))] },
              ],
            },
          },
          fillItem(colorHex),
          staticGroupTransform(),
        ],
      },
    ],
    ip: startFrame,
    op,
    st: 0,
  }
}

/**
 * Builds a standalone Lottie/bodymovin JSON document reproducing the live
 * preview: a two-tone disc turning on its vertical axis, resting `holdSeconds`
 * on each face. The document covers one full turn — back face in, front face
 * back — so it repeats seamlessly.
 *
 * Each half turn is its own pair of layers, scoped with `ip`/`op` so the disc
 * underneath swaps colour on exactly the frame the sweep completes. That beats
 * hold-keyframing a fill colour, which some renderers interpolate anyway.
 */
export function buildCoinFlipLottie(options: CoinFlipLottieOptions) {
  const flipFrames = Math.max(1, Math.round(coinFlipSeconds(options.transition) * FRAME_RATE))
  const holdFrames = Math.max(0, Math.round(options.holdSeconds * FRAME_RATE))
  const halfTurnFrames = flipFrames + holdFrames
  const totalFrames = halfTurnFrames * 2
  const ease = coinFlipEase(options.transition)
  const { entrySide, frontColor, backColor } = options

  return {
    v: '5.9.0',
    fr: FRAME_RATE,
    ip: 0,
    op: totalFrames,
    w: EXPORT_SIZE,
    h: EXPORT_SIZE,
    nm: 'Coin Flip',
    ddd: 0,
    assets: [],
    layers: [
      sweepLayer(1, 'Front Face Sweep', frontColor, entrySide, ease, halfTurnFrames, flipFrames, totalFrames),
      sweepLayer(2, 'Back Face Sweep', backColor, entrySide, ease, 0, flipFrames, halfTurnFrames),
      discLayer(3, 'Back Face Disc', backColor, halfTurnFrames, totalFrames),
      discLayer(4, 'Front Face Disc', frontColor, 0, halfTurnFrames),
    ],
  }
}
