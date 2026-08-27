import { motion } from 'motion/react'
import { useRef } from 'react'
import { Card } from './Card'

export function GlassDemo() {
  const constraintsRef = useRef<HTMLDivElement>(null)

  return (
    <Card
      title="Materials"
      description="Drag the frosted panel — its tint comes from the Mode collection's light/dark glass stops, blurred over the theme's brand gradient."
    >
      <div
        ref={constraintsRef}
        className="relative h-56 w-full overflow-hidden rounded-content"
        style={{
          background: 'linear-gradient(135deg, var(--air-bg-stop-1), var(--air-bg-stop-2))',
        }}
      >
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.15}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="absolute top-8 left-8 flex h-28 w-40 cursor-grab items-center justify-center rounded-2xl border border-white/20 text-sm font-medium text-label-on-accent shadow-lg active:cursor-grabbing"
          style={{
            background:
              'linear-gradient(160deg, var(--air-material-glass-a), var(--air-material-glass-b))',
            backdropFilter: 'blur(min(24px, var(--air-material-blur)))',
          }}
        >
          drag me
        </motion.div>
      </div>
    </Card>
  )
}
