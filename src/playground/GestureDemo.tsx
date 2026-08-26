import { useDialKit } from 'dialkit'
import type { Transition } from 'motion/react'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { Card } from './Card'

export function GestureDemo() {
  const constraintsRef = useRef(null)
  const p = useDialKit('Drag Gesture', {
    elasticity: [0.2, 0, 1],
    dragScale: [1.08, 1, 1.5],
    spring: { type: 'spring', stiffness: 400, damping: 30 },
  })

  return (
    <Card
      title="Drag Gesture"
      description="Drag the box — tuned by elasticity and the scale-while-dragging."
    >
      <div ref={constraintsRef} className="h-full w-full">
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={p.elasticity}
          whileDrag={{ scale: p.dragScale }}
          transition={p.spring as Transition}
          className="h-24 w-24 cursor-grab rounded-2xl bg-rose-500 active:cursor-grabbing"
        />
      </div>
    </Card>
  )
}
