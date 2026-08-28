import type { TransitionConfig } from 'dialkit'
import { useDialKit } from 'dialkit'
import type { Transition } from 'motion/react'
import { useEffect, useState } from 'react'
import { Card } from './Card'
import { LightbulbSparkleIcon } from './icons/LightbulbSparkleIcon'
import { buildLightbulbSparkleLottie, downloadLottieFile } from './lottie/buildLightbulbSparkleLottie'

const toMotionTransition = (c: TransitionConfig): Transition =>
  c.type === 'spring' ? c : { duration: c.duration, ease: c.ease }

export function LightbulbSparkleFlipDemo() {
  const [flipped, setFlipped] = useState(false)

  const p = useDialKit(
    'Lightbulb Sparkle Flip',
    {
      sparkleFlipsEvery: [0.5, 0.15, 2, 0.05],
      flipMotion: { type: 'spring', visualDuration: 0.3, bounce: 0.3 },
      flipAxis: { type: 'select', options: ['Horizontal', 'Vertical'], default: 'Horizontal' },
      bulbColor: { type: 'color', default: '#EDEDED' },
      sparkleColor: { type: 'color', default: '#FFC53D' },
      exportLottie: { type: 'action' },
    },
    {
      onAction: (path) => {
        if (path !== 'exportLottie') return
        downloadLottieFile(
          buildLightbulbSparkleLottie({
            everyIntervalSeconds: p.sparkleFlipsEvery,
            flipAxis: p.flipAxis === 'Vertical' ? 'scaleY' : 'scaleX',
            transition: p.flipMotion,
            bulbColor: p.bulbColor,
            sparkleColor: p.sparkleColor,
          }),
          'lightbulb-sparkle-flip.json',
        )
      },
    },
  )

  useEffect(() => {
    const id = setInterval(() => setFlipped((f) => !f), p.sparkleFlipsEvery * 1000)
    return () => clearInterval(id)
  }, [p.sparkleFlipsEvery])

  return (
    <Card
      title="Lightbulb Sparkle Flip"
      description="The sparkle mirror-flips on a timer — tune the interval, curve, axis, and colors, then export as a Lottie file."
    >
      <LightbulbSparkleIcon
        size={160}
        bulbColor={p.bulbColor}
        sparkleColor={p.sparkleColor}
        flipped={flipped}
        flipAxis={p.flipAxis === 'Vertical' ? 'scaleY' : 'scaleX'}
        transition={toMotionTransition(p.flipMotion)}
      />
    </Card>
  )
}
