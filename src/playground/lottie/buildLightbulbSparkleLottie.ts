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

/** Must match LightbulbSparkleIcon's BOB_DISTANCE (1 native unit). */
const BOB_DISTANCE = 1 * EXPORT_SCALE

/** Lottie keyframe easing can't encode mass/stiffness/damping, so a spring's flip is approximated with a snappy overshoot curve. */
const SPRING_EASE_BEZIER: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

/** Matches Motion's 'easeInOut', used for the bob (not a tunable dial, so no transition config to read). */
const BOB_EASE_BEZIER: [number, number, number, number] = [0.42, 0, 0.58, 1]

/** Above this, an exact LCM loop would need an impractical number of keyframes — fall back to looping on the flip alone. */
const MAX_LOOP_FRAMES = 1800

export type LightbulbSparkleLottieOptions = {
  everyIntervalSeconds: number
  flipAxis: 'scaleX' | 'scaleY'
  transition: TransitionConfig
  bobEverySeconds: number
  bulbColor: string
  sparkleColor: string
}

type Keyframe = {
  t: number
  s: number[]
  o?: { x: number[]; y: number[] }
  i?: { x: number[]; y: number[] }
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

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b
}

/** Tiles a cycle's local-time keyframes across the full loop, then closes the loop with a final keyframe. */
function tileCycle(perCyclePoints: Keyframe[], cycleFrames: number, totalFrames: number): Keyframe[] {
  const numCycles = Math.round(totalFrames / cycleFrames)
  const keyframes: Keyframe[] = []
  for (let cycle = 0; cycle < numCycles; cycle++) {
    for (const kf of perCyclePoints) {
      keyframes.push({ ...kf, t: kf.t + cycle * cycleFrames })
    }
  }
  keyframes.push({ t: totalFrames, s: perCyclePoints[0].s })
  return keyframes
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

/** Layer transform bobbing in lockstep with every other layer — same keyframes, so nothing drifts out of sync. */
function bobbingLayerTransform(bobKeyframes: Keyframe[]) {
  return {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 1, k: bobKeyframes },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [100, 100, 100] },
  }
}

function bobKeyframesFor(bobEverySeconds: number, totalFrames: number): Keyframe[] {
  const [bx1, by1, bx2, by2] = BOB_EASE_BEZIER
  const out = { x: [bx1, bx1, bx1], y: [by1, by1, by1] }
  const into = { x: [bx2, bx2, bx2], y: [by2, by2, by2] }
  const bobFrames = Math.max(2, Math.round(bobEverySeconds * FRAME_RATE))
  const halfFrames = Math.round(bobFrames / 2)

  const perCycle: Keyframe[] = [
    { t: 0, s: [0, 0, 0], o: out, i: into },
    { t: halfFrames, s: [0, -BOB_DISTANCE, 0], o: out, i: into },
  ]
  return tileCycle(perCycle, bobFrames, totalFrames)
}

function strokeLayer(
  ind: number,
  name: string,
  shape: LottieBezierShape,
  colorHex: string,
  bobKeyframes: Keyframe[],
  totalFrames: number,
) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: bobbingLayerTransform(bobKeyframes),
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
  bobKeyframes: Keyframe[],
  flipPeriodFrames: number,
  totalFrames: number,
) {
  const center = scalePoint([LIGHTBULB_SPARKLE_CENTER.x, LIGHTBULB_SPARKLE_CENTER.y])
  const [bx1, by1, bx2, by2] = easeBezierFor(options.transition)
  const intervalFrames = Math.round(options.everyIntervalSeconds * FRAME_RATE)
  const flipFrames = Math.max(1, Math.min(Math.round(flipDurationSeconds(options.transition) * FRAME_RATE), Math.round(intervalFrames * 0.9)))

  const restScale = [100, 100]
  const flippedScale = options.flipAxis === 'scaleX' ? [-100, 100] : [100, -100]
  const out = { x: [bx1, bx1], y: [by1, by1] }
  const into = { x: [bx2, bx2], y: [by2, by2] }

  const perCycle: Keyframe[] = [
    { t: 0, s: restScale, o: out, i: into },
    { t: flipFrames, s: flippedScale, o: out, i: into },
    { t: intervalFrames, s: flippedScale, o: out, i: into },
    { t: intervalFrames + flipFrames, s: restScale, o: out, i: into },
  ]
  const flipKeyframes = tileCycle(perCycle, flipPeriodFrames, totalFrames)

  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: 'Sparkle',
    sr: 1,
    ks: bobbingLayerTransform(bobKeyframes),
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
            s: { a: 1, k: flipKeyframes },
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
 * preview: the sparkle mirror-flipping on `flipAxis` every
 * `everyIntervalSeconds`, while the whole icon (bulb, base line, and sparkle
 * together) bobs every `bobEverySeconds`. The loop length is the LCM of the
 * two cycles' frame counts, so both repeat in phase with no seam — unless
 * that LCM would need an impractical number of keyframes, in which case the
 * loop covers one flip cycle and the bob's phase may jump slightly at the seam.
 */
export function buildLightbulbSparkleLottie(options: LightbulbSparkleLottieOptions) {
  const flipPeriodFrames = Math.round(options.everyIntervalSeconds * 2 * FRAME_RATE)
  const bobPeriodFrames = Math.max(2, Math.round(options.bobEverySeconds * FRAME_RATE))
  const exactLoopFrames = lcm(flipPeriodFrames, bobPeriodFrames)
  const totalFrames = exactLoopFrames <= MAX_LOOP_FRAMES ? exactLoopFrames : flipPeriodFrames

  const bobKeyframes = bobKeyframesFor(options.bobEverySeconds, totalFrames)

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
      sparkleFlipLayer(
        1,
        LIGHTBULB_LOTTIE_SHAPES.sparkle,
        options.sparkleColor,
        options,
        bobKeyframes,
        flipPeriodFrames,
        totalFrames,
      ),
      strokeLayer(2, 'Base Line', LIGHTBULB_LOTTIE_SHAPES.baseLine, options.bulbColor, bobKeyframes, totalFrames),
      strokeLayer(3, 'Bulb Outline', LIGHTBULB_LOTTIE_SHAPES.bulbOutline, options.bulbColor, bobKeyframes, totalFrames),
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
