import type { ComponentType } from 'react'
import { PlaygroundHome } from './pages/PlaygroundHome'
import { TodoMorphPage } from './pages/TodoMorphPage'
import { TodoMorphHugPage } from './pages/TodoMorphHugPage'

export type Exploration = {
  path: string
  label: string
  /** Shown under the page title; also the nav item's tooltip. */
  description: string
  Component: ComponentType
}

/*
 * The one place a design exploration is registered. Adding an entry here puts
 * it in the top nav and gives it a shareable URL — nothing else to wire up.
 */
export const EXPLORATIONS: Exploration[] = [
  {
    path: '/',
    label: 'Playground',
    description:
      'Capability demos — durations, easings, springs, layout, gestures, stagger, tokens, and materials.',
    Component: PlaygroundHome,
  },
  {
    path: '/todo-card-morph',
    label: 'Todo Card Morph',
    description:
      'A status pill expanding into a todo card, from the AI Chat "Thinking Steps" frames.',
    Component: TodoMorphPage,
  },
  {
    path: '/todo-card-morph-hug',
    label: 'Todo Card Morph (Hug)',
    description:
      'Same morph, but the collapsed pill hugs its content width — and the two axes can grow together or sideways first.',
    Component: TodoMorphHugPage,
  },
]
