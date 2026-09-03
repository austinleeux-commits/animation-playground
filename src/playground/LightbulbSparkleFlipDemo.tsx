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
      sparkleFlipsEvery: [1.1, 0.15, 2, 0.05],
      flipMotion: { type: 'spring', visualDuration: 0.25, bounce: 0.3 },
      flipAxis: { type: 'select', options: ['Horizontal', 'Vertical'], default: 'Horizontal' },
      iconBobsEvery: [0.5, 0.4, 3, 0.05],
      bulbColor: { type: 'color', default: '#8a8a8e' },
      sparkleColor: { type: 'color', default: '#8a8a8e' },
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
            bobEverySeconds: p.iconBobsEvery,
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
      description="The sparkle mirror-flips on a timer while the whole icon bobs — tune the interval, curve, axis, bob rate, and colors, then export as a Lottie file."
    >
      <LightbulbSparkleIcon
        size={160}
        bulbColor={p.bulbColor}
        sparkleColor={p.sparkleColor}
        flipped={flipped}
        flipAxis={p.flipAxis === 'Vertical' ? 'scaleY' : 'scaleX'}
        transition={toMotionTransition(p.flipMotion)}
        bobEverySeconds={p.iconBobsEvery}
      />
    </Card>
  )
}
