import { useDialKit } from 'dialkit'
import type { Transition } from 'motion/react'
import { motion } from 'motion/react'
import { Card } from './Card'

export function SpringDemo() {
  const p = useDialKit('Spring Physics', {
    spring: { type: 'spring', stiffness: 300, damping: 20, mass: 1 },
    hoverScale: [1.1, 1, 1.5],
    tapScale: [0.94, 0.5, 1],
  })

  return (
    <Card
      title="Spring Physics"
      description="Hover and tap the box — tuned by stiffness, damping, and mass."
    >
      <motion.div
        whileHover={{ scale: p.hoverScale }}
        whileTap={{ scale: p.tapScale }}
        transition={p.spring as Transition}
        className="h-24 w-24 rounded-2xl bg-sky-500"
      />
    </Card>
  )
}
