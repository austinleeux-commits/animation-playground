import type { TransitionConfig } from 'dialkit'
import {
  LIGHTBULB_ICON_VIEWBOX,
  LIGHTBULB_LOTTIE_SHAPES,
  LIGHTBULB_SPARKLE_CENTER,
  type LottieBezierShape,
} from '../icons/lightbulbSparklePaths'

const EXPORT_SIZE = 512
const EXPORT_SCALE = EXPORT_SIZE / LIGHTBULB_ICON_VIEWBOX
const FRAME_RATE = 60
const STROKE_WIDTH = EXPORT_SCALE // 1 unit stroke in the 16-unit source

/** Lottie keyframe easing can't encode mass/stiffness/damping, so a spring's flip is approximated with a snappy overshoot curve. */
const SPRING_EASE_BEZIER: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

export type LightbulbSparkleLottieOptions = {
  everyIntervalSeconds: number
  flipAxis: 'scaleX' | 'scaleY'
  transition: TransitionConfig
  bulbColor: string
  sparkleColor: string
}

function hexToLottieColor(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b, 1]
}

function easeBezierFor(transition: TransitionConfig): [number, number, number, number] {
  return transition.type === 'easing' ? transition.ease : SPRING_EASE_BEZIER
}

function flipDurationSeconds(transition: TransitionConfig): number {
  return transition.type === 'easing' ? transition.duration : (transition.visualDuration ?? 0.3)
}

function scalePoint([x, y]: [number, number]): [number, number] {
  return [x * EXPORT_SCALE, y * EXPORT_SCALE]
}

function shapePathItem(shape: LottieBezierShape) {
  return {
    ty: 'sh',
    ks: {
      a: 0,
      k: {
        c: shape.closed,
        v: shape.vertices.map((pt) => scalePoint(pt.v)),
        i: shape.vertices.map((pt) => scalePoint(pt.i)),
        o: shape.vertices.map((pt) => scalePoint(pt.o)),
      },
    },
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

function staticLayerTransform() {
  return {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: [0, 0, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [100, 100, 100] },
  }
}

function strokeLayer(ind: number, name: string, shape: LottieBezierShape, colorHex: string, totalFrames: number) {
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
          shapePathItem(shape),
          {
            ty: 'st',
            nm: 'Stroke',
            c: { a: 0, k: hexToLottieColor(colorHex) },
            o: { a: 0, k: 100 },
            w: { a: 0, k: STROKE_WIDTH },
            lc: 2,
            lj: 2,
          },
          staticGroupTransform(),
        ],
      },
    ],
    ip: 0,
    op: totalFrames,
    st: 0,
  }
}

function sparkleFlipLayer(
  ind: number,
  shape: LottieBezierShape,
  colorHex: string,
  options: LightbulbSparkleLottieOptions,
  totalFrames: number,
) {
  const center = scalePoint([LIGHTBULB_SPARKLE_CENTER.x, LIGHTBULB_SPARKLE_CENTER.y])
  const [bx1, by1, bx2, by2] = easeBezierFor(options.transition)
  const flipFrames = Math.max(
    1,
    Math.min(
      Math.round(flipDurationSeconds(options.transition) * FRAME_RATE),
      Math.round(options.everyIntervalSeconds * FRAME_RATE * 0.9),
    ),
  )
  const intervalFrames = Math.round(options.everyIntervalSeconds * FRAME_RATE)

  const restScale: [number, number] = [100, 100]
  const flippedScale: [number, number] =
    options.flipAxis === 'scaleX' ? [-100, 100] : [100, -100]

  const out = { x: [bx1, bx1], y: [by1, by1] }
  const into = { x: [bx2, bx2], y: [by2, by2] }

  const keyframes = [
    { t: 0, s: restScale, o: out, i: into },
    { t: flipFrames, s: flippedScale, o: out, i: into },
    { t: intervalFrames, s: flippedScale, o: out, i: into },
    { t: intervalFrames + flipFrames, s: restScale, o: out, i: into },
    { t: totalFrames, s: restScale },
  ]

  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: 'Sparkle',
    sr: 1,
    ks: staticLayerTransform(),
    shapes: [
      {
        ty: 'gr',
        nm: 'Sparkle',
        it: [
          shapePathItem(shape),
          { ty: 'fl', nm: 'Fill', c: { a: 0, k: hexToLottieColor(colorHex) }, o: { a: 0, k: 100 } },
          {
            ty: 'tr',
            p: { a: 0, k: center },
            a: { a: 0, k: center },
            s: { a: 1, k: keyframes },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op: totalFrames,
    st: 0,
  }
}

/**
 * Builds a standalone Lottie/bodymovin JSON document reproducing the live
 * preview: the bulb outline and base line held static, the sparkle
 * mirror-flipping on `flipAxis` every `everyIntervalSeconds`. The loop covers
 * exactly one flip-out-and-back cycle so it repeats seamlessly.
 */
export function buildLightbulbSparkleLottie(options: LightbulbSparkleLottieOptions) {
  const totalFrames = Math.round(options.everyIntervalSeconds * 2 * FRAME_RATE)

  return {
    v: '5.9.0',
    fr: FRAME_RATE,
    ip: 0,
    op: totalFrames,
    w: EXPORT_SIZE,
    h: EXPORT_SIZE,
    nm: 'Lightbulb Sparkle Flip',
    ddd: 0,
    assets: [],
    layers: [
      sparkleFlipLayer(1, LIGHTBULB_LOTTIE_SHAPES.sparkle, options.sparkleColor, options, totalFrames),
      strokeLayer(2, 'Base Line', LIGHTBULB_LOTTIE_SHAPES.baseLine, options.bulbColor, totalFrames),
      strokeLayer(3, 'Bulb Outline', LIGHTBULB_LOTTIE_SHAPES.bulbOutline, options.bulbColor, totalFrames),
    ],
  }
}

export function downloadLottieFile(lottie: object, filename: string) {
  const blob = new Blob([JSON.stringify(lottie, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
