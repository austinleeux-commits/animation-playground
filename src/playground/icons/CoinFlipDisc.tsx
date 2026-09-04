import { useEffect, useRef, useState } from 'react'
import { cubicBezierEase } from '../easing'
import { bezierShapeToSvgPath } from '../lottie/lottie'
import { COIN_CENTER, COIN_RADIUS, COIN_VIEWBOX, coinFaceShape, type CoinEntrySide } from './coinFlipGeometry'

export type CoinFlipDiscProps = {
  size?: number
  frontColor: string
  backColor: string
  entrySide: CoinEntrySide
  /** Seconds for one face to sweep across the disc. */
  flipSeconds: number
  /** Seconds the disc rests on a face before turning again. */
  holdSeconds: number
  ease: [number, number, number, number]
}

/*
 * Half a turn is a sweep followed by a hold, and the two halves are identical
 * apart from which colour is underneath — so the whole loop is one crescent
 * over one plain disc, with the two colours swapped at the halfway mark. The
 * swap is invisible because it lands on the frame where the crescent covers
 * everything (u = +1) and is redrawn at u = -1, covering nothing.
 */
export function CoinFlipDisc({
  size = 160,
  frontColor,
  backColor,
  entrySide,
  flipSeconds,
  holdSeconds,
  ease,
}: CoinFlipDiscProps) {
  const [frame, setFrame] = useState({ turned: false, u: -1 })

  // The clock reads the latest dial values instead of restarting on each
  // change, so tuning a control never jump-cuts the loop back to the top.
  const latest = useRef({ flipSeconds, holdSeconds, ease })
  useEffect(() => {
    latest.current = { flipSeconds, holdSeconds, ease }
  })

  useEffect(() => {
    let raf = 0
    let previous = performance.now()
    let phase = 0

    const tick = (now: number) => {
      const { flipSeconds: flip, holdSeconds: hold, ease: curve } = latest.current
      const halfTurn = Math.max(flip, 0.01) + hold

      phase = (phase + (now - previous) / 1000 / (halfTurn * 2)) % 1
      previous = now

      const turned = phase >= 0.5
      const elapsed = (turned ? phase - 0.5 : phase) * halfTurn * 2
      const swept = flip <= 0 ? 1 : cubicBezierEase(curve)(elapsed / flip)

      setFrame({ turned, u: Math.min(1, Math.max(-1, swept * 2 - 1)) })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${COIN_VIEWBOX} ${COIN_VIEWBOX}`}
      fill="none"
      aria-hidden
    >
      <circle
        cx={COIN_CENTER}
        cy={COIN_CENTER}
        r={COIN_RADIUS}
        fill={frame.turned ? backColor : frontColor}
      />
      <path
        d={bezierShapeToSvgPath(coinFaceShape(frame.u, entrySide))}
        fill={frame.turned ? frontColor : backColor}
      />
    </svg>
  )
}
