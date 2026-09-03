import type { Transition } from 'motion/react'
import { motion } from 'motion/react'
import {
  LIGHTBULB_BASE_LINE_PATH,
  LIGHTBULB_OUTLINE_PATH,
  LIGHTBULB_SPARKLE_PATH,
} from './lightbulbSparklePaths'

/** Vertical travel of the bob, in the icon's native 16-unit coordinate space. */
const BOB_DISTANCE = 1

type LightbulbSparkleIconProps = {
  size?: number
  bulbColor?: string
  sparkleColor?: string
  flipped: boolean
  flipAxis: 'scaleX' | 'scaleY'
  transition: Transition
  bobEverySeconds: number
  className?: string
}

export function LightbulbSparkleIcon({
  size = 16,
  bulbColor = 'currentColor',
  sparkleColor = 'currentColor',
  flipped,
  flipAxis,
  transition,
  bobEverySeconds,
  className,
}: LightbulbSparkleIconProps) {
  const flip = flipped ? -1 : 1

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <motion.g
        key={bobEverySeconds}
        animate={{ y: [0, -BOB_DISTANCE, 0] }}
        transition={{ duration: bobEverySeconds, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d={LIGHTBULB_OUTLINE_PATH}
          stroke={bulbColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={LIGHTBULB_BASE_LINE_PATH}
          stroke={bulbColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          d={LIGHTBULB_SPARKLE_PATH}
          fill={sparkleColor}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
          animate={{
            scaleX: flipAxis === 'scaleX' ? flip : 1,
            scaleY: flipAxis === 'scaleY' ? flip : 1,
          }}
          transition={transition}
        />
      </motion.g>
    </svg>
  )
}
