import type { Transition } from 'motion/react'
import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { Thought, TodoItem } from './todoItems'
import { CheckIcon, ChevronIcon, CircleIcon, DotsCircleIcon } from './icons/AirIcons'

/*
 * The inside of the expanded todo card, shared by both morph explorations —
 * they differ in how the container gets to this size, not in what it holds.
 */

export const CALLOUT = 'text-[14px] leading-5 tracking-[-0.14px]'

export type ScrollTiming = { idle: number; fade: number }

const THUMB_MIN = 24

/**
 * Scroll container with its own overlay thumb: hidden at rest, revealed while
 * scrolling, faded back out once it stops. The thumb is drawn rather than
 * styled through `::-webkit-scrollbar`, because that forces a space-taking
 * scrollbar on machines set to always show them, and its pseudo-element can't
 * be reliably transitioned.
 */
export function ScrollArea({
  timing,
  className,
  innerClassName,
  children,
}: {
  timing: ScrollTiming
  className?: string
  innerClassName?: string
  children: ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const idleTimer = useRef<number | undefined>(undefined)
  const [scrolling, setScrolling] = useState(false)
  const [thumb, setThumb] = useState({ height: 0, top: 0, overflowing: false })

  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollHeight, clientHeight, scrollTop } = el
    if (scrollHeight <= clientHeight) {
      setThumb((t) => ({ ...t, overflowing: false }))
      return
    }
    const height = Math.max(THUMB_MIN, (clientHeight / scrollHeight) * clientHeight)
    const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - height)
    setThumb({ height, top, overflowing: true })
  }, [])

  const handleScroll = useCallback(() => {
    measure()
    setScrolling(true)
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(
      () => setScrolling(false),
      timing.idle * 1000,
    )
  }, [measure, timing.idle])

  /* Content grows when a step opens, so watch it as well as the viewport. */
  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (scrollRef.current) observer.observe(scrollRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    return () => {
      observer.disconnect()
      window.clearTimeout(idleTimer.current)
    }
  }, [measure])

  return (
    <div className={`relative flex flex-col ${className ?? ''}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`air-scroll min-h-0 flex-1 overflow-y-auto ${innerClassName ?? ''}`}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      <motion.div
        aria-hidden
        animate={{ opacity: scrolling && thumb.overflowing ? 1 : 0 }}
        transition={{ duration: timing.fade, ease: 'easeOut' }}
        style={{ height: thumb.height, top: thumb.top }}
        className="pointer-events-none absolute right-0 w-1 rounded-full bg-overlay"
      />
    </div>
  )
}

function Thinking({ blocks }: { blocks: Thought[] }) {
  return (
    <div className={`${CALLOUT} flex flex-col gap-3 text-label-secondary`}>
      {blocks.map((block) =>
        typeof block === 'string' ? (
          <p key={block}>{block}</p>
        ) : (
          <div key={block.bullets.join('|')}>
            {block.text && <p>{block.text}</p>}
            <ul className="list-disc ps-[21px]">
              {block.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}

function StatusIcon({
  status,
  className,
  style,
}: {
  status: TodoItem['status']
  className?: string
  style?: CSSProperties
}) {
  if (status === 'active') return <DotsCircleIcon className={`text-label ${className}`} style={style} />
  /* Done steps carry the design's action green rather than a label tone. */
  if (status === 'done') return <CheckIcon className={`text-status-success ${className}`} style={style} />
  return <CircleIcon className={`text-label-secondary ${className}`} style={style} />
}

/** Step that opened into prose: hairline thread down the left, no surface behind the text. */
function ThreadDetail({ blocks }: { blocks: Thought[] }) {
  return (
    <div className="relative flex flex-col items-start pb-4 pl-6">
      <div className="w-full px-4">
        <Thinking blocks={blocks} />
      </div>
      <div className="absolute bottom-4 left-7 top-0 w-px bg-separator-non-opaque" />
    </div>
  )
}

/** In-progress step: filled panel clipped to 128px, scrolling its own output. */
function PanelDetail({
  blocks,
  scroll,
}: {
  blocks: Thought[]
  scroll: ScrollTiming
}) {
  return (
    <div className="flex flex-col items-start pl-6">
      <div className="w-full rounded-2xl bg-fill-quaternary p-4">
        <ScrollArea timing={scroll} className="h-32" innerClassName="pr-2">
          <Thinking blocks={blocks} />
        </ScrollArea>
      </div>
    </div>
  )
}

/** Everything about a row that the dial panel owns. */
export type RowLayout = {
  /** px a nested list steps in from the row that owns it. */
  indent: number
  /** px between rows inside a nested list. */
  nestedGap: number
  /** How the chevron, timer, and label tone arrive on hover. */
  reveal: CSSProperties
  showsTimer: boolean
  showsThreadLine: boolean
}

export type RowProps = {
  openIds: Set<string>
  onToggle: (item: TodoItem, siblings: TodoItem[]) => void
  layout: RowLayout
  sizeTransition: Transition
  fadeTransition: Transition
  scroll: ScrollTiming
}

/**
 * A step's sub-steps, threaded to the icon of the row above. The line sits at
 * 7.5px — the centre of that row's 16px marker — so the indent reads as
 * hanging off the parent rather than as a second margin.
 */
function NestedList({
  items,
  ...props
}: RowProps & {
  items: TodoItem[]
}) {
  return (
    <div className="relative" style={{ paddingLeft: props.layout.indent }}>
      {props.layout.showsThreadLine && (
        <div
          aria-hidden
          className="absolute bottom-0 left-[7.5px] top-0 w-px bg-separator-non-opaque"
        />
      )}
      <div className="flex flex-col" style={{ gap: props.layout.nestedGap }}>
        {items.map((child) => (
          <TodoRow key={child.id} item={child} siblings={items} {...props} />
        ))}
      </div>
    </div>
  )
}

/*
 * A row carries no permanent affordance, and every row rests the same way —
 * status marker, grey label, no timer — whatever its status. Hovering swaps the
 * marker for a chevron and brings in the time the step took; clicking holds
 * both revealed and turns the chevron down. Everything that changes is opacity
 * or colour on the same box, so nothing reflows and the timer never pushes the
 * label around.
 */
export function TodoRow({
  item,
  siblings,
  openIds,
  onToggle,
  layout,
  sizeTransition,
  fadeTransition,
  scroll,
}: RowProps & {
  item: TodoItem
  siblings: TodoItem[]
}) {
  const nested = item.children ?? []
  const expandable = Boolean(item.detail || nested.length)
  const isOpen = expandable && openIds.has(item.id)
  const showsTimer = layout.showsTimer && Boolean(item.duration)

  /* Open pins the revealed state on; otherwise the row waits for a pointer. */
  const onReveal = isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
  const offReveal = isOpen ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'

  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? isOpen : undefined}
        onClick={() => onToggle(item, siblings)}
        className={`group flex h-5 w-full items-center gap-2 text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent ${
          expandable ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <span className="relative size-4 shrink-0">
          <StatusIcon
            status={item.status}
            className={`pointer-events-none absolute inset-0 ${expandable ? offReveal : ''}`}
            style={layout.reveal}
          />
          {expandable && (
            <ChevronIcon
              className={`pointer-events-none absolute inset-0 text-label-secondary ${onReveal} ${
                isOpen ? 'rotate-90' : ''
              }`}
              style={layout.reveal}
            />
          )}
        </span>

        <span
          className={`truncate font-medium ${CALLOUT} ${
            isOpen
              ? 'text-label'
              : expandable
                ? 'text-label-secondary group-hover:text-label'
                : 'text-label-secondary'
          }`}
          style={layout.reveal}
        >
          {item.text}
        </span>

        {showsTimer && (
          <span
            className={`flex shrink-0 items-center gap-2 text-label-secondary ${CALLOUT} ${onReveal}`}
            style={layout.reveal}
          >
            <span className="font-medium">•</span>
            <span>{item.duration}</span>
          </span>
        )}
      </button>

      {/* Height animates from 0, so Motion has a number to interpolate from. */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: sizeTransition, opacity: fadeTransition }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {nested.length > 0 ? (
                <NestedList
                  items={nested}
                  openIds={openIds}
                  onToggle={onToggle}
                  layout={layout}
                  sizeTransition={sizeTransition}
                  fadeTransition={fadeTransition}
                  scroll={scroll}
                />
              ) : item.variant === 'panel' ? (
                <PanelDetail blocks={item.detail!} scroll={scroll} />
              ) : (
                <ThreadDetail blocks={item.detail!} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
