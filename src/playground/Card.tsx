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
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="shrink-0 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
