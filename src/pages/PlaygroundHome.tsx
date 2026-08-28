import { FadeDemo } from '../playground/FadeDemo'
import { GestureDemo } from '../playground/GestureDemo'
import { GlassDemo } from '../playground/GlassDemo'
import { LayoutDemo } from '../playground/LayoutDemo'
import { LightbulbSparkleFlipDemo } from '../playground/LightbulbSparkleFlipDemo'
import { SpringDemo } from '../playground/SpringDemo'
import { StaggerDemo } from '../playground/StaggerDemo'
import { ThemeDemo } from '../playground/ThemeDemo'

export function PlaygroundHome() {
  return (
    <main className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
      <ThemeDemo />
      <GlassDemo />
      <FadeDemo />
      <SpringDemo />
      <StaggerDemo />
      <LayoutDemo />
      <GestureDemo />
      <LightbulbSparkleFlipDemo />
    </main>
  )
}
