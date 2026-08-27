import { motion } from 'motion/react'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Card } from './Card'

const swatches = [
  { name: 'Accent', varName: '--air-accent' },
  { name: 'Success', varName: '--air-status-success' },
  { name: 'Warning', varName: '--air-status-warning' },
  { name: 'Error', varName: '--air-status-error' },
  { name: 'Info', varName: '--air-status-info' },
] as const

export function ThemeDemo() {
  const { theme, mode } = useThemeMode()

  return (
    <Card
      title="Design Tokens"
      description="Accent and status colors, driven by the Theme & Mode dial — every swatch is a --air-* custom property from @animation-playground/design-tokens."
    >
      <div className="grid grid-cols-5 gap-3">
        {swatches.map((s) => (
          <motion.div
            key={`${s.name}-${theme}-${mode}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="h-12 w-12 rounded-full border border-separator shadow-sm transition-colors duration-500"
              style={{ backgroundColor: `var(${s.varName})` }}
            />
            <span className="text-xs text-label-tertiary">{s.name}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
