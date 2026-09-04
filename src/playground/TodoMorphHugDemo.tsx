import { useDialKit } from 'dialkit'
import { animate, AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TodoItem } from './todoItems'
import { collectIds, DONE_COUNT, ITEMS } from './todoItems'
import type { DialTransition } from './dialTransition'
import { toCssTransition, toTransition } from './dialTransition'
import { CALLOUT, ScrollArea, TodoRow } from './todoCard'
import { formatElapsed, useElapsedSeconds } from './thinkingTimer'
import { CloseIcon, LightbulbIcon, TitleChevronIcon } from './icons/AirIcons'

/*
 * Same two Figma frames as TodoMorphDemo (Thinking Steps 1 → Thinking Steps
 * 2), but the collapsed pill hugs its content instead of matching the card's
 * width. That means the container's width has to animate alongside its
 * height, rather than staying fixed at `w-full` for both states. What the card
 * holds lives in `todoCard.tsx`, shared with the full-width variant.
 */

export function TodoMorphHugDemo() {
  const [open, setOpen] = useState(false)
  /*
   * Nesting rules out a single open id — opening a sub-step has to leave its
   * ancestors open — so the set holds every open row and the toggle keeps one
   * open per level. Nothing starts open: a row that did would sit there wearing
   * the revealed state, and the list reads as one thing at rest.
   */
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  /* Stable width to expand back into — unlike the card, unaffected by its own animation. */
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const collapsedRef = useRef<HTMLButtonElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  /* Set by `morphCard` on the click, read once by the size effect below. */
  const morphFrom = useRef<{ width: number; height: number } | undefined>(undefined)
  /*
   * DialKit derives every label from its key (camelCase split and title-cased)
   * and has no description field, so the keys are written to read as the
   * sentence a designer would say out loud. `_collapsed` folds a group shut on
   * load, keeping the panel scannable.
   */
  const p = useDialKit('Todo Card Morph — Hugged Pill', {
    /* Diagonal grows both axes at once; Sideways First stretches the pill to
       the column and only then unfurls it downward. */
    expandOrder: {
      type: 'select',
      options: [
        { value: 'diagonal', label: 'Diagonal' },
        { value: 'sideways', label: 'Sideways First' },
      ],
      default: 'diagonal',
    },
    maxCardHeight: [656, 240, 904, 4],
    cornerRadius: {
      _collapsed: true,
      pill: [8, 0, 24],
      card: [16, 0, 32],
    },
    whenOpening: {
      _collapsed: true,
      cardGrows: { type: 'spring', visualDuration: 0.25, bounce: 0.2 },
      /* Sideways First only: the stretch, and how long the unfurl holds off. */
      widthGrows: {
        type: 'easing',
        duration: 0.34,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      heightStartsAfter: [0.26, 0, 0.8],
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
      cardShrinks: { type: 'spring', visualDuration: 0.15, bounce: 0 },
      /* Mirrors the open: the card drops to pill height first, then narrows. */
      widthShrinks: {
        type: 'easing',
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      widthStartsAfter: [0.22, 0, 0.8],
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
      betweenRows: [0.01, 0, 0.15],
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
    whenHoveringARow: {
      _collapsed: true,
      chevronAndTimerAppear: {
        type: 'easing',
        duration: 0.15,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
      timerAlsoAppears: true,
    },
    nestedTaskLists: {
      _collapsed: true,
      rowsIndent: [24, 0, 48, 1],
      betweenRows: [10, 0, 24, 1],
      threadLineShows: true,
    },
    scrollbar: {
      _collapsed: true,
      hideAfter: [0.9, 0.2, 3],
      fadeSpeed: [0.3, 0, 1],
    },
  })

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
  const thinkingFor = useElapsedSeconds(!open)
  const rowLayout = {
    indent: p.nestedTaskLists.rowsIndent,
    nestedGap: p.nestedTaskLists.betweenRows,
    reveal: toCssTransition(
      p.whenHoveringARow.chevronAndTimerAppear as DialTransition,
      'opacity, color, transform',
    ),
    showsTimer: p.whenHoveringARow.timerAlsoAppears,
    showsThreadLine: p.nestedTaskLists.threadLineShows,
  }
  /*
   * Sideways First splits the morph in two: the pill stretches to the column
   * on its own transition, then the card unfurls downward; closing reverses
   * the pair. These are how long the second leg holds off — and, like the
   * transitions above, each belongs to the one gesture it can occur in, so an
   * exiting child reading it can't be handed the wrong direction's number.
   * Both are 0 on Diagonal, which leaves that reading untouched.
   */
  const sequenced = p.expandOrder === 'sideways'
  const openingHold = sequenced ? p.whenOpening.heightStartsAfter : 0
  const closingHold = sequenced ? p.whenClosing.widthStartsAfter : 0
  const widthTransition = sequenced
    ? toTransition(
        (open
          ? p.whenOpening.widthGrows
          : p.whenClosing.widthShrinks) as DialTransition,
      )
    : container

  /*
   * How the gesture drives the two axes — a transition and a start offset
   * each — held for the size effect below. Declared first, so it lands before
   * that effect runs on the same commit and reads the timings picked for the
   * gesture that triggered it. Taking it through a ref also keeps a dial
   * edited mid-flight from restarting a run that is already going — it lands
   * on the next gesture instead.
   */
  const plan = {
    width: widthTransition,
    height: container,
    widthDelay: open ? 0 : closingHold,
    heightDelay: open ? openingHold : 0,
  }
  const gesture = useRef(plan)
  useLayoutEffect(() => {
    gesture.current = plan
  })

  /*
   * The card animates its width and height across the pill ⇄ card swap and
   * then hands both back to the content. Everything after that — a step
   * opening, a step closing — resizes the card in the same frame as the row
   * that caused it, on that row's own spring. A card that instead followed a
   * measured size would always be a spring behind its own content.
   *
   * The starting size has to be taken on the click: popLayout pulls the
   * outgoing block out of flow before layout effects run, so by then the card
   * has already snapped to whatever is left.
   */
  const morphCard = useCallback((next: boolean) => {
    const el = cardRef.current
    morphFrom.current = el
      ? { width: el.offsetWidth, height: el.offsetHeight }
      : undefined
    setOpen(next)
  }, [])

  /*
   * Clicking anywhere off the card puts it back to the pill. The listener sits
   * on the exploration's own area rather than the document, so reaching for the
   * dial panel to tune the expanded state doesn't collapse the thing you are
   * tuning.
   */
  const pageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const page = pageRef.current
    if (!open || !page) return
    const collapseIfOutside = (event: PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node)) morphCard(false)
    }
    page.addEventListener('pointerdown', collapseIfOutside)
    return () => page.removeEventListener('pointerdown', collapseIfOutside)
  }, [open, morphCard])


  /*
   * Height settles on `auto` between gestures, same as TodoMorphDemo. Width
   * can't use the same trick: an unset width on a block element resolves
   * against its parent, so it would just echo whatever the card's own
   * in-flight width happens to be. It settles on the CSS value that means the
   * same thing without that circularity — `fit-content` for the pill hugging
   * its row, `100%` for the card matching `containerRef`, which is sized
   * independently by the page column.
   *
   * Both are written by the card's own motion values: an imperative animation
   * on the same element lands in the same store, so the last pixel size it
   * left would be re-asserted over anything set on the node directly.
   */
  const cardWidth = useMotionValue<number | string>(open ? '100%' : 'fit-content')
  const cardHeight = useMotionValue<number | 'auto'>('auto')
  useLayoutEffect(() => {
    const child = open ? expandedRef.current : collapsedRef.current
    const from = morphFrom.current
    /* Consumed once, so a re-render on its own can't restart the swap. */
    morphFrom.current = undefined
    if (!child || !from) return
    /* Expanding targets the stable column width, not the child's own —
       measuring `expandedRef` here would just read back the pill's width,
       since it has no width of its own to grow into yet. */
    const targetWidth = open
      ? (containerRef.current?.offsetWidth ?? child.offsetWidth)
      : child.offsetWidth
    const g = gesture.current
    /*
     * Sizing goes back to the content once *both* legs have landed — which
     * one that is depends on the order and on what the dials are set to, and
     * releasing on the wrong one would hand a still-running spring's axis
     * back to CSS mid-flight. Not called for a leg that was stopped, so an
     * interrupted gesture can't release late either.
     */
    let running = 2
    const release = () => {
      if (--running > 0) return
      cardWidth.jump(open ? '100%' : 'fit-content')
      cardHeight.jump('auto')
    }
    cardWidth.jump(from.width)
    cardHeight.jump(from.height)
    /* A delayed run holds the value where `jump` left it until the delay is
       up, which is what gives the two legs their gap. */
    const widthControls = animate(cardWidth, targetWidth, {
      ...g.width,
      delay: g.widthDelay,
      onComplete: release,
    })
    const heightControls = animate(cardHeight, child.offsetHeight, {
      ...g.height,
      delay: g.heightDelay,
      onComplete: release,
    })
    return () => {
      widthControls.stop()
      heightControls.stop()
      cardWidth.jump(open ? '100%' : 'fit-content')
      cardHeight.jump('auto')
    }
  }, [cardWidth, cardHeight, open])

  /* Opening a step closes whichever sibling was open, and everything inside it. */
  const toggleRow = useCallback((item: TodoItem, siblings: TodoItem[]) => {
    setOpenIds((current) => {
      const next = new Set(current)
      const close = (target: TodoItem) => {
        for (const id of collectIds([target])) next.delete(id)
      }
      if (next.has(item.id)) {
        close(item)
        return next
      }
      siblings.forEach(close)
      next.add(item.id)
      return next
    })
  }, [])

  /* Rows take their timing from the parent's delayChildren/staggerChildren. */
  const rowVariants = {
    hidden: { opacity: 0, y: p.whenOpening.rowsSlideFrom },
    visible: { opacity: 1, y: 0, transition: expandEnter },
    exit: { opacity: 0, y: p.whenClosing.rowsSlideTo, transition: collapseExit },
  }

  /*
   * The card header and the pill are the same band of the card in two states,
   * so they hand off to each other rather than queue. Left on the row stagger
   * the header would be last out — it is the first child, and the exit runs in
   * reverse — which holds "Todo list" on screen while "Processing your
   * request..." is already fading in underneath it, and you read both at once.
   * Its own delay overrides the one the stagger would hand down.
   */
  const headerVariants = {
    ...rowVariants,
    exit: { ...rowVariants.exit, transition: { ...collapseExit, delay: 0 } },
  }

  return (
    <div
      ref={pageRef}
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
            Generate a Photosynthesis study guide
          </p>
          <TitleChevronIcon className="shrink-0 text-label-secondary" />
        </div>

        <div ref={containerRef} className="relative mt-4">
          <motion.div
            ref={cardRef}
            animate={{
              borderRadius: open ? p.cornerRadius.card : p.cornerRadius.pill,
            }}
            transition={container}
            style={{
              height: cardHeight,
              width: cardWidth,
              transitionProperty: 'background-color, box-shadow',
              transitionDuration: `${surfaceFade}s`,
              transitionTimingFunction: 'ease-out',
            }}
            className={`relative overflow-hidden backdrop-blur-[6px] outline-none focus-visible:ring-2 focus-visible:ring-accent ${
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
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        delayChildren: p.whenOpening.rowsWait + openingHold,
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
                  <motion.div
                    variants={headerVariants}
                    className={`flex shrink-0 flex-col gap-2 ${CALLOUT}`}
                  >
                    <div className="flex h-5 items-center justify-between">
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        <span className="truncate text-label">Creating photosynthesis guide</span>
                        <span className="text-label">•</span>
                        <span className="shrink-0 font-normal text-label-secondary">
                          {DONE_COUNT}/{ITEMS.length}
                        </span>
                      </span>
                      {/* The card's one control now that the rows have none. */}
                      <button
                        type="button"
                        aria-label="Collapse the todo list"
                        onClick={() => morphCard(false)}
                        className="-m-1 shrink-0 cursor-pointer rounded-sm p-1 text-label outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    <div
                      aria-hidden
                      className="h-0"
                      style={{ borderTop: '0.5px solid var(--air-separator-non-opaque)' }}
                    />
                  </motion.div>

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
                            siblings={ITEMS}
                            openIds={openIds}
                            onToggle={toggleRow}
                            layout={rowLayout}
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
                /*
                 * Collapsed pill hugs its row instead of stretching to the
                 * card's width: a single flex line (icon, text, chevron) with
                 * one 8px gap doing the spacing throughout, and `w-fit` so the
                 * button — and the surface behind it — is only as wide as
                 * that content.
                 */
                <motion.button
                  key="collapsed"
                  ref={collapsedRef}
                  type="button"
                  aria-expanded={false}
                  onClick={() => morphCard(true)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: {
                      ...collapseEnter,
                      delay: p.whenClosing.pillWaits + closingHold,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { ...expandExit, delay: openingHold },
                  }}
                  className="flex h-9 w-fit cursor-pointer items-center gap-2 p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <LightbulbIcon className="shrink-0 text-label" />
                  <span className={`whitespace-nowrap font-semibold text-label ${CALLOUT}`}>
                    Processing your request...
                  </span>
                  {/* How long it has been thinking, in place of the chevron. */}
                  <span
                    className={`flex shrink-0 items-center gap-2 text-label-secondary ${CALLOUT}`}
                  >
                    <span className="font-medium">•</span>
                    <span>{formatElapsed(thinkingFor)}</span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
