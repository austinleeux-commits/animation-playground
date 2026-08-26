import { useDialKit } from 'dialkit'
import type { Easing } from 'motion/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Card } from './Card'

export function FadeDemo() {
  const [key, setKey] = useState(0)
  const p = useDialKit('Fade & Slide', {
    duration: [0.5, 0.1, 2],
    distance: [24, 0, 120],
    delay: [0, 0, 1],
    easing: {
      type: 'select',
      options: ['easeOut', 'easeInOut', 'linear', 'backOut', 'circOut'],
      default: 'easeOut',
    },
  })

  return (
    <Card
      title="Fade & Slide"
      description="Entrance transition, tuned by duration, distance, delay, and easing."
      onReplay={() => setKey((k) => k + 1)}
    >
      <motion.div
        key={key}
        initial={{ opacity: 0, y: p.distance }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          ease: p.easing as Easing,
        }}
        className="h-24 w-24 rounded-2xl bg-violet-500"
      />
    </Card>
  )
}
