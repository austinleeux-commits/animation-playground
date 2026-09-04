import type { Transition } from 'motion/react'
import type { CSSProperties } from 'react'

/** dialkit hands back whichever shape the transition control is currently set to. */
export type DialTransition =
  | {
      type: 'spring'
      stiffness?: number
      damping?: number
      mass?: number
      visualDuration?: number
      bounce?: number
    }
  | { type: 'easing'; duration: number; ease: [number, number, number, number] }

export function toTransition(config: DialTransition): Transition {
  return config.type === 'spring'
    ? config
    : { duration: config.duration, ease: config.ease }
}

/**
 * The same dial as a CSS transition, for the parts of a component that reveal
 * on `:hover` — a state Motion can't drive. A spring has no CSS equivalent, so
 * it falls back to its visual duration on an ease-out.
 */
export function toCssTransition(
  config: DialTransition,
  properties: string,
): CSSProperties {
  return {
    transitionProperty: properties,
    transitionDuration: `${config.type === 'easing' ? config.duration : (config.visualDuration ?? 0.2)}s`,
    transitionTimingFunction:
      config.type === 'easing' ? `cubic-bezier(${config.ease.join(', ')})` : 'ease-out',
  }
}
