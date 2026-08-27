import { useDialKit } from 'dialkit'
import type { Transition } from 'motion/react'
import { AnimatePresence, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
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

type TodoItem = {
  id: string
  text: string
  status: 'done' | 'active' | 'todo'
  /** Black label instead of the secondary grey — the step being read. */
  emphasized?: boolean
  chevron?: 'right' | 'down'
  detail?: 'thread' | 'panel'
}

const ITEMS: TodoItem[] = [
  {
    id: 'destination',
    text: 'Choose beach destination and pick travel dates for the weekend',
    status: 'done',
    chevron: 'right',
  },
  {
    id: 'accomodation',
    text: 'Book accomodation (hotel, condo, or beach house for family of 4)',
    status: 'done',
    chevron: 'right',
  },
  {
    id: 'transportation',
    text: 'Arrange transportation (flights, driving, rental car if needed)',
    status: 'done',
    emphasized: true,
    chevron: 'down',
    detail: 'thread',
  },
  {
    id: 'activities',
    text: 'Plan activities and attractions suitable for families',
    status: 'active',
    emphasized: true,
    chevron: 'down',
    detail: 'panel',
  },
  {
    id: 'packing',
    text: 'Create packing list for beach trip essentials',
    status: 'todo',
  },
  {
    id: 'meals',
    text: 'Organize meals and restaurant reservations',
    status: 'todo',
  },
  {
    id: 'budget',
    text: 'Budget the trip and account for all expenses',
    status: 'todo',
  },
  {
    id: 'itinerary',
    text: 'Make final arrangements and create itinerary',
    status: 'todo',
  },
]

const CALLOUT = 'text-[14px] leading-5 tracking-[-0.14px]'

function ThinkingText() {
  return (
    <div className={`${CALLOUT} text-label-secondary`}>
      <p>This is a sample of what AI could be thinking</p>
      <ul className="list-disc ps-[21px]">
        <li>This is the first point of thought</li>
        <li>this is the second point of thought</li>
      </ul>
      <p>&nbsp;</p>
      <p>
        Actually, I&rsquo;m now just realizing blah blah blah blah blah the
        portafilter is the wrong size for the machine described, I&rsquo;ll need
        to clarify that with lorem ipsum.
      </p>
      <p>
        Dolor sit amet consectetur adipiscing elit dolorum temporibus in
        cupidatat eligendi cum aute id provident autem exercitation consectetur
        harum est dolor qui est sunt ducimus ut nisi maxime mollit incididunt
        aute elit repellendus ut aliqua anim est ad animi proident praesentium
        aliquip cum sed eligendi corrupti sint dolor
      </p>
    </div>
  )
}

function StatusIcon({ item }: { item: TodoItem }) {
  const tone = item.emphasized ? 'text-label' : 'text-label-secondary'
  if (item.status === 'active') {
    return <DotsCircleIcon className={`shrink-0 ${tone}`} />
  }
  if (item.status === 'done') {
    return <CheckIcon className={`shrink-0 ${tone}`} />
  }
  return <CircleIcon className={`shrink-0 ${tone}`} />
}

function TodoRow({ item }: { item: TodoItem }) {
  return (
    <div className="flex h-5 items-center justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <StatusIcon item={item} />
        <span
          className={`truncate font-medium ${CALLOUT} ${
            item.emphasized ? 'text-label' : 'text-label-secondary'
          }`}
        >
          {item.text}
        </span>
      </div>
      {item.chevron && (
        <ChevronIcon
          className={`shrink-0 text-label-tertiary ${
            item.chevron === 'down' ? 'rotate-90' : ''
          }`}
        />
      )}
    </div>
  )
}

/** Expanded step: hairline thread down the left, no surface behind the text. */
function ThreadDetail() {
  return (
    <div className="relative flex flex-col items-start pb-4 pl-6">
      <div className="w-full px-4">
        <ThinkingText />
      </div>
      <div className="absolute bottom-4 left-7 top-0 w-px bg-separator-non-opaque" />
    </div>
  )
}

/** In-progress step: filled panel, clipped to 128px with its own scroll thumb. */
function PanelDetail() {
  return (
    <div className="flex flex-col items-start pl-6">
      <div className="relative w-full rounded-2xl bg-fill-quaternary p-4">
        <div className="h-32 overflow-clip">
          <ThinkingText />
        </div>
        <div className="absolute right-2 top-4 h-[83px] w-1 rounded-lg bg-overlay" />
      </div>
    </div>
  )
}

export function TodoMorphDemo() {
  const [open, setOpen] = useState(false)
  const collapsedRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>()
  const p = useDialKit('Todo Card Morph', {
    technique: {
      type: 'select',
      options: ['morph (layout)', 'reveal (height)'],
      default: 'morph (layout)',
    },
    radius: {
      closed: [8, 0, 24],
      open: [16, 0, 32],
    },
    /*
     * The two directions are tuned independently. Within a group, `exit` is
     * whatever is leaving and `enter` is whatever is arriving — on expand that
     * is the pill leaving and the card content arriving, on collapse the
     * reverse. Collapse defaults to no bounce and holds the pill back until the
     * box is nearly closed, so it doesn't land ahead of the container.
     */
    expand: {
      container: { type: 'spring', visualDuration: 0.45, bounce: 0.2 },
      exit: {
        type: 'easing',
        duration: 0.12,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
      enter: {
        type: 'easing',
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      delay: [0.06, 0, 0.5],
      stagger: [0.03, 0, 0.15],
      rise: [8, -40, 40],
      surfaceFade: [0.3, 0, 1.2],
    },
    collapse: {
      container: { type: 'spring', visualDuration: 0.35, bounce: 0 },
      exit: {
        type: 'easing',
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
      enter: {
        type: 'easing',
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      delay: [0.1, 0, 0.5],
      stagger: [0.012, 0, 0.15],
      rise: [8, -40, 40],
      surfaceFade: [0.2, 0, 1.2],
    },
    sharedChevron: true,
    shimmerSpeed: [2.4, 0.4, 6],
  })

  const isMorph = p.technique === 'morph (layout)'

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
    (open ? p.expand.container : p.collapse.container) as DialTransition,
  )
  const expandExit = toTransition(p.expand.exit as DialTransition)
  const expandEnter = toTransition(p.expand.enter as DialTransition)
  const collapseExit = toTransition(p.collapse.exit as DialTransition)
  const collapseEnter = toTransition(p.collapse.enter as DialTransition)
  const surfaceFade = open ? p.expand.surfaceFade : p.collapse.surfaceFade

  /* Rows take their timing from the parent's delayChildren/staggerChildren. */
  const rowVariants = {
    hidden: { opacity: 0, y: p.expand.rise },
    visible: { opacity: 1, y: 0, transition: expandEnter },
    exit: { opacity: 0, y: p.collapse.rise, transition: collapseExit },
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
              key={p.technique}
              role="button"
            tabIndex={0}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setOpen((o) => !o)
              }
            }}
            layout={isMorph}
            animate={{
              borderRadius: open ? p.radius.open : p.radius.closed,
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
            className={`relative w-full cursor-pointer overflow-hidden backdrop-blur-[6px] outline-none focus-visible:ring-2 focus-visible:ring-accent ${
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
                        delayChildren: p.expand.delay,
                        staggerChildren: p.expand.stagger,
                      },
                    },
                    /* Orchestration only — the rows carry their own fade, so
                       the last row out is the one nearest the container edge. */
                    exit: {
                      transition: {
                        staggerChildren: p.collapse.stagger,
                        staggerDirection: -1,
                      },
                    },
                  }}
                  className="flex flex-col gap-4 p-4"
                >
                  <motion.div
                    variants={rowVariants}
                    className="flex h-5 items-center justify-between"
                  >
                    <div
                      className={`flex items-center gap-2 font-semibold ${CALLOUT}`}
                    >
                      <span className="text-label">Todo list</span>
                      <span className="text-label">•</span>
                      <span className="text-label-secondary">3/8</span>
                    </div>
                    {!p.sharedChevron && (
                      <ChevronIcon className="shrink-0 rotate-90 text-label-secondary" />
                    )}
                  </motion.div>

                  <div className="flex flex-col gap-2 pl-1">
                    {ITEMS.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={rowVariants}
                        className="flex flex-col gap-2"
                      >
                        <TodoRow item={item} />
                        {item.detail === 'thread' && <ThreadDetail />}
                        {item.detail === 'panel' && <PanelDetail />}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  ref={collapsedRef}
                  layout={isMorph}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { ...collapseEnter, delay: p.collapse.delay },
                  }}
                  exit={{ opacity: 0, transition: expandExit }}
                  className="flex h-9 items-center justify-between p-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <LightbulbIcon className="shrink-0 text-label" />
                    <span
                      className={`air-shimmer truncate font-semibold ${CALLOUT}`}
                      style={
                        {
                          '--air-shimmer-duration': `${p.shimmerSpeed}s`,
                        } as React.CSSProperties
                      }
                    >
                      Processing your request...
                    </span>
                  </div>
                  {!p.sharedChevron && (
                    <ChevronIcon className="shrink-0 text-label-secondary" />
                  )}
                </motion.div>
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
          {p.sharedChevron && (
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={open ? expandEnter : collapseEnter}
              style={{ top: open ? 16 : 8, right: open ? 16 : 8 }}
              className="absolute z-10 text-label-secondary"
            >
              <ChevronIcon />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
