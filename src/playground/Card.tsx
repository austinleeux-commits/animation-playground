import type { ReactNode } from 'react'

export function Card({
  title,
  description,
  onReplay,
  children,
}: {
  title: string
  description: string
  onReplay?: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border border-separator bg-surface-secondary transition-colors duration-500">
      <div className="flex items-start justify-between gap-4 border-b border-separator p-4 transition-colors duration-500">
        <div>
          <h2 className="text-sm font-medium text-label transition-colors duration-500">
            {title}
          </h2>
          <p className="mt-1 text-sm text-label-secondary transition-colors duration-500">
            {description}
          </p>
        </div>
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="shrink-0 rounded-md border border-separator px-2.5 py-1 text-xs font-medium text-label-secondary transition-colors hover:bg-surface-tertiary"
          >
            Replay
          </button>
        )}
      </div>
      <div className="flex min-h-56 items-center justify-center overflow-hidden p-6">
        {children}
      </div>
    </div>
  )
}
