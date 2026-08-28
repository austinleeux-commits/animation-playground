import { useDialKit } from 'dialkit'
import type { Transition } from 'motion/react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { Thought, TodoItem } from './todoItems'
import { DONE_COUNT, ITEMS } from './todoItems'
import {
  CheckIcon,
  ChevronIcon,
  CircleIcon,
  DotsCircleIcon,
  LightbulbIcon,
  TitleChevronIcon,
} from './icons/AirIcons'

/*
 * Two states from the "AI Chat" Figma file (Thinking Steps 1 → Thinking Steps 2):
 * a 36px status pill that expands into a 656px todo card. Both sit at the same
 * top-left with the same width, so the whole transition is a downward container
 * transform — height, corner radius, and surface, with the content swapped.
 */

/** dialkit hands back whichever shape the transition control is currently set to. */
type DialTransition =
  | {
      type: 'spring'
      stiffness?: number
      damping?: number
      mass?: number
      visualDuration?: number
      bounce?: number
    }
  | { type: 'easing'; duration: number; ease: [number, number, number, number] }

function toTransition(config: DialTransition): Transition {
  return config.type === 'spring'
    ? config
    : { duration: config.duration, ease: config.ease }
}

const CALLOUT = 'text-[14px] leading-5 tracking-[-0.14px]'

type ScrollTiming = { idle: number; fade: number }

const THUMB_MIN = 24

/**
 * Scroll container with its own overlay thumb: hidden at rest, revealed while
 * scrolling, faded back out once it stops. The thumb is drawn rather than
 * styled through `::-webkit-scrollbar`, because that forces a space-taking
 * scrollbar on machines set to always show them, and its pseudo-element can't
 * be reliably transitioned.
 */
function ScrollArea({
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
  emphasized,
}: {
  status: TodoItem['status']
  emphasized: boolean
}) {
  const tone = emphasized ? 'text-label' : 'text-label-secondary'
  if (status === 'active') return <DotsCircleIcon className={`shrink-0 ${tone}`} />
  if (status === 'done') return <CheckIcon className={`shrink-0 ${tone}`} />
  return <CircleIcon className={`shrink-0 ${tone}`} />
}

/** Completed step: hairline thread down the left, no surface behind the text. */
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

function TodoRow({
  item,
  isOpen,
  onToggle,
  sizeTransition,
  fadeTransition,
  scroll,
}: {
  item: TodoItem
  isOpen: boolean
  onToggle: () => void
  sizeTransition: Transition
  fadeTransition: Transition
  scroll: ScrollTiming
}) {
  const expandable = Boolean(item.detail)
  /* The running step stays prominent whether or not its output is showing. */
  const emphasized = isOpen || item.status === 'active'

  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? isOpen : undefined}
        onClick={onToggle}
        className={`flex h-5 w-full items-center justify-between text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent ${
          expandable ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <StatusIcon status={item.status} emphasized={emphasized} />
          <span
            className={`truncate font-medium transition-colors duration-200 ease-out ${CALLOUT} ${
              emphasized ? 'text-label' : 'text-label-secondary'
            }`}
          >
            {item.text}
          </span>
        </span>
        {expandable && (
          <ChevronIcon
            className={`shrink-0 text-label-tertiary transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        )}
      </button>

      {/* Height animates from 0, so Motion has a number to interpolate from. */}
      <AnimatePresence initial={false}>
        {expandable && isOpen && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: sizeTransition, opacity: fadeTransition }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {item.variant === 'panel' ? (
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

export function TodoMorphDemo() {
  const [open, setOpen] = useState(false)
  /*
   * One step's output at a time, so a single id says it all. Starts on the
   * step still running; completed ones stay collapsed.
   */
  const [openRow, setOpenRow] = useState<string | null>(
    () => ITEMS.find((item) => item.status === 'active')?.id ?? null,
  )
  const collapsedRef = useRef<HTMLButtonElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>()
  /*
   * DialKit derives every label from its key (camelCase split and title-cased)
   * and has no description field, so the keys are written to read as the
   * sentence a designer would say out loud. `_collapsed` folds a group shut on
   * load, keeping the panel scannable.
   */
  const p = useDialKit('Todo Card Morph', {
    cardGrowsBy: {
      type: 'select',
      options: ['scaling', 'height'],
      default: 'scaling',
    },
    maxCardHeight: [656, 240, 904, 4],
    cornerRadius: {
      _collapsed: true,
      pill: [8, 0, 24],
      card: [16, 0, 32],
    },
    whenOpening: {
      _collapsed: true,
      cardGrows: { type: 'spring', visualDuration: 0.45, bounce: 0.2 },
      pillFadesOut: {
        type: 'easing',
        duration: 0.12,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
      rowsFadeIn: {
        type: 'easing',
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      rowsWait: [0.06, 0, 0.5],
      betweenRows: [0.03, 0, 0.15],
      rowsSlideFrom: [8, -40, 40],
      colorChange: [0.3, 0, 1.2],
    },
    whenClosing: {
      _collapsed: true,
      cardShrinks: { type: 'spring', visualDuration: 0.35, bounce: 0 },
      rowsFadeOut: {
        type: 'easing',
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
      pillFadesIn: {
        type: 'easing',
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      pillWaits: [0.1, 0, 0.5],
      betweenRows: [0.012, 0, 0.15],
      rowsSlideTo: [8, -40, 40],
      colorChange: [0.2, 0, 1.2],
    },
    openingAStep: {
      _collapsed: true,
      heightChange: { type: 'spring', visualDuration: 0.3, bounce: 0 },
      textFade: {
        type: 'easing',
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
    scrollbar: {
      _collapsed: true,
      hideAfter: [0.9, 0.2, 3],
      fadeSpeed: [0.3, 0, 1],
    },
    chevronTurnsInPlace: true,
    shimmerCycle: [2.4, 0.4, 6],
  })

  const isMorph = p.cardGrowsBy === 'scaling'

  /*
   * The height technique needs a number to animate towards — `height: 'auto'`
   * has nothing to interpolate from on a content-sized box. Measure whichever
   * block is in flow; the container is still at its previous height for the
   * frame in between, so it animates from there rather than snapping.
   */
  useLayoutEffect(() => {
    if (isMorph) return
    const el = open ? expandedRef.current : collapsedRef.current
    if (!el) return
    const measure = () => setContentHeight(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMorph, open])
  /*
   * AnimatePresence keeps rendering an exiting child with the props it had
   * before the swap, so a transition picked with `open` would be a render
   * stale by the time it runs. Each element instead takes the group for the
   * gesture it can only ever appear in: the card content enters on expand and
   * leaves on collapse, the pill the other way round.
   */
  const container = toTransition(
    (open ? p.whenOpening.cardGrows : p.whenClosing.cardShrinks) as DialTransition,
  )
  const expandExit = toTransition(p.whenOpening.pillFadesOut as DialTransition)
  const expandEnter = toTransition(p.whenOpening.rowsFadeIn as DialTransition)
  const collapseExit = toTransition(p.whenClosing.rowsFadeOut as DialTransition)
  const collapseEnter = toTransition(p.whenClosing.pillFadesIn as DialTransition)
  const surfaceFade = open ? p.whenOpening.colorChange : p.whenClosing.colorChange
  const detailSize = toTransition(p.openingAStep.heightChange as DialTransition)
  const detailFade = toTransition(p.openingAStep.textFade as DialTransition)
  const scroll = { idle: p.scrollbar.hideAfter, fade: p.scrollbar.fadeSpeed }

  /* Opening a step closes whichever one was open; clicking it again closes it. */
  const toggleRow = useCallback((id: string) => {
    setOpenRow((current) => (current === id ? null : id))
  }, [])

  /* Rows take their timing from the parent's delayChildren/staggerChildren. */
  const rowVariants = {
    hidden: { opacity: 0, y: p.whenOpening.rowsSlideFrom },
    visible: { opacity: 1, y: 0, transition: expandEnter },
    exit: { opacity: 0, y: p.whenClosing.rowsSlideTo, transition: collapseExit },
  }

  return (
    <div
      className="font-air flex-1 w-full p-6 transition-colors duration-500"
      style={{
        background:
          'linear-gradient(180deg, var(--air-bg-stop-1), var(--air-bg-stop-2))',
      }}
    >
      <div className="mx-auto w-full max-w-[825px]">
        {/* Static context from the frame so the morph is judged in situ. */}
        <div className="flex items-start gap-1">
          <p className="min-w-0 flex-1 truncate text-[28px] font-bold leading-[34px] tracking-[-0.28px] text-label">
            Generate a high-resolution QR code directing to the link:
            airapps.com
          </p>
          <TitleChevronIcon className="shrink-0 text-label-secondary" />
        </div>

        <div className="relative mt-4">
          <motion.div
            /* Remount when the technique changes so the two never interleave. */
            key={p.cardGrowsBy}
            layout={isMorph}
            animate={{
              borderRadius: open ? p.cornerRadius.card : p.cornerRadius.pill,
              ...(isMorph || contentHeight === undefined
                ? {}
                : { height: contentHeight }),
            }}
            transition={container}
            style={{
              transitionProperty: 'background-color, box-shadow',
              transitionDuration: `${surfaceFade}s`,
              transitionTimingFunction: 'ease-out',
            }}
            className={`relative w-full overflow-hidden backdrop-blur-[6px] outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              open
                ? 'bg-surface-secondary shadow-[0_4px_15px_0_rgb(0_0_0_/_0.12),inset_0_0_0_1px_var(--air-separator-non-opaque)]'
                : 'bg-fill-quaternary shadow-[0_0_0_0_rgb(0_0_0_/_0),inset_0_0_0_1px_transparent]'
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {open ? (
                <motion.div
                  key="expanded"
                  ref={expandedRef}
                  layout={isMorph}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        delayChildren: p.whenOpening.rowsWait,
                        staggerChildren: p.whenOpening.betweenRows,
                      },
                    },
                    /* Orchestration only — the rows carry their own fade, so
                       the last row out is the one nearest the container edge. */
                    exit: {
                      transition: {
                        staggerChildren: p.whenClosing.betweenRows,
                        staggerDirection: -1,
                      },
                    },
                  }}
                  style={{ maxHeight: p.maxCardHeight }}
                  className="flex flex-col gap-4 p-4"
                >
                  <motion.button
                    type="button"
                    variants={rowVariants}
                    aria-expanded
                    onClick={() => setOpen(false)}
                    className={`flex h-5 shrink-0 cursor-pointer items-center justify-between text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent font-semibold ${CALLOUT}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-label">Todo list</span>
                      <span className="text-label">•</span>
                      <span className="text-label-secondary">
                        {DONE_COUNT}/{ITEMS.length}
                      </span>
                    </span>
                    {!p.chevronTurnsInPlace && (
                      <ChevronIcon className="shrink-0 rotate-90 text-label-secondary" />
                    )}
                  </motion.button>

                  <div
                    aria-hidden
                    className="h-0 shrink-0"
                    style={{ borderTop: '0.5px solid rgba(0, 0, 0, 0.12)' }}
                  />

                  <ScrollArea
                    timing={scroll}
                    className="min-h-0 flex-1"
                    innerClassName="pl-1 pr-3"
                  >
                    <div className="flex flex-col gap-2">
                      {ITEMS.map((item) => (
                        <motion.div key={item.id} variants={rowVariants}>
                          <TodoRow
                            item={item}
                            isOpen={openRow === item.id}
                            onToggle={() => toggleRow(item.id)}
                            sizeTransition={detailSize}
                            fadeTransition={detailFade}
                            scroll={scroll}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.button
                  key="collapsed"
                  ref={collapsedRef}
                  type="button"
                  aria-expanded={false}
                  onClick={() => setOpen(true)}
                  layout={isMorph}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { ...collapseEnter, delay: p.whenClosing.pillWaits },
                  }}
                  exit={{ opacity: 0, transition: expandExit }}
                  className="flex h-9 w-full cursor-pointer items-center justify-between p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <LightbulbIcon className="shrink-0 text-label" />
                    <span
                      className={`air-shimmer truncate font-semibold ${CALLOUT}`}
                      style={
                        {
                          '--air-shimmer-duration': `${p.shimmerCycle}s`,
                        } as React.CSSProperties
                      }
                    >
                      Processing your request...
                    </span>
                  </span>
                  {!p.chevronTurnsInPlace && (
                    <ChevronIcon className="shrink-0 text-label-secondary" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

          </motion.div>

          {/*
            One chevron across both states, so it turns in place rather than
            cross-fading. It sits outside the card — a child would ride the
            layout projection's transform and appear to fly up from the bottom
            as that unwinds. Only the rotation animates; the 8px inset
            difference between the two frames is applied instantly.
          */}
          {p.chevronTurnsInPlace && (
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={open ? expandEnter : collapseEnter}
              style={{ top: open ? 16 : 8, right: open ? 16 : 8 }}
              className="pointer-events-none absolute z-10 text-label-secondary"
            >
              <ChevronIcon />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
