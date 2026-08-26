import { useDialKit } from 'dialkit'
import type { Transition } from 'motion/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Card } from './Card'

const ITEMS = [0, 1, 2, 3, 4, 5]

export function LayoutDemo() {
  const [grid, setGrid] = useState(true)
  const p = useDialKit('Layout Animation', {
    gap: [8, 0, 32],
    radius: [12, 0, 32],
    spring: { type: 'spring', visualDuration: 0.4, bounce: 0.2 },
  })

  return (
    <Card
      title="Layout Animation"
      description="Toggle arrangement — spacing and corner radius come from the dials."
      onReplay={() => setGrid((g) => !g)}
    >
      <motion.ul
        layout
        style={{ gap: p.gap }}
        className={
          grid ? 'grid w-full grid-cols-3' : 'flex w-full flex-col'
        }
      >
        {ITEMS.map((item) => (
          <motion.li
            key={item}
            layout
            transition={p.spring as Transition}
            style={{ borderRadius: p.radius }}
            className={`bg-amber-500 ${grid ? 'aspect-square' : 'h-10'}`}
          />
        ))}
      </motion.ul>
    </Card>
  )
}
