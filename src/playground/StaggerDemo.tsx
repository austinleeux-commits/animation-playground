import { useDialKit } from 'dialkit'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Card } from './Card'

const ITEMS = [0, 1, 2, 3, 4]

const DIRECTION_OFFSET: Record<string, { x?: number; y?: number }> = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
}

export function StaggerDemo() {
  const [key, setKey] = useState(0)
  const p = useDialKit('Staggered List', {
    staggerDelay: [0.08, 0, 0.4],
    itemDuration: [0.35, 0.1, 1],
    direction: {
      type: 'select',
      options: ['up', 'down', 'left', 'right'],
      default: 'up',
    },
  })

  const offset = DIRECTION_OFFSET[p.direction]

  return (
    <Card
      title="Staggered List"
      description="Children reveal in sequence, tuned by stagger delay, duration, and direction."
      onReplay={() => setKey((k) => k + 1)}
    >
      <motion.ul
        key={key}
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: p.staggerDelay } },
        }}
        className="flex w-full flex-col gap-2"
      >
        {ITEMS.map((item) => (
          <motion.li
            key={item}
            variants={{
              hidden: { opacity: 0, ...offset },
              visible: {
                opacity: 1,
                x: 0,
                y: 0,
                transition: { duration: p.itemDuration },
              },
            }}
            className="h-8 rounded-lg bg-emerald-500"
          />
        ))}
      </motion.ul>
    </Card>
  )
}
