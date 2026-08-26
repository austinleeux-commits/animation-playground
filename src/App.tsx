import { Agentation } from 'agentation'
import { DialRoot } from 'dialkit'
import { FadeDemo } from './playground/FadeDemo'
import { GestureDemo } from './playground/GestureDemo'
import { LayoutDemo } from './playground/LayoutDemo'
import { SpringDemo } from './playground/SpringDemo'
import { StaggerDemo } from './playground/StaggerDemo'

function App() {
  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Animation Playground
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Tune each demo live with the dial panel in the corner. Use
          Agentation to annotate anything worth a note.
        </p>
      </header>

      <main className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        <FadeDemo />
        <SpringDemo />
        <StaggerDemo />
        <LayoutDemo />
        <GestureDemo />
      </main>

      <DialRoot position="top-right" />
      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}

export default App
