import type { ReactNode } from 'react'

/*
 * Chrome for a full-page design exploration — the counterpart to `Card` on the
 * playground grid. Explorations get the whole viewport width instead of a grid
 * cell, since they're judged at their real size.
 */
export function ExplorationPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="max-w-3xl px-6 py-6">
        <h1 className="text-xl font-semibold text-label transition-colors duration-500">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-label-secondary transition-colors duration-500">
          {description}
        </p>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  )
}
