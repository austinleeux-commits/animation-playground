import { Agentation } from 'agentation'
import { DialRoot } from 'dialkit'
import { FadeDemo } from './playground/FadeDemo'
import { GestureDemo } from './playground/GestureDemo'
import { GlassDemo } from './playground/GlassDemo'
import { LayoutDemo } from './playground/LayoutDemo'
import { SpringDemo } from './playground/SpringDemo'
import { StaggerDemo } from './playground/StaggerDemo'
import { ThemeDemo } from './playground/ThemeDemo'
import { ThemeProvider } from './theme/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-svh bg-surface transition-colors duration-500">
        <header className="border-b border-separator px-6 py-5 transition-colors duration-500">
          <h1 className="text-lg font-semibold text-label transition-colors duration-500">
            Animation Playground
          </h1>
          <p className="mt-1 text-sm text-label-secondary transition-colors duration-500">
            Tune each demo live with the dial panel in the corner. Use
            Agentation to annotate anything worth a note.
          </p>
        </header>

        <main className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          <ThemeDemo />
          <GlassDemo />
          <FadeDemo />
          <SpringDemo />
          <StaggerDemo />
          <LayoutDemo />
          <GestureDemo />
        </main>

        <DialRoot position="top-right" />
        {import.meta.env.DEV && <Agentation />}
      </div>
    </ThemeProvider>
  )
}

export default App
