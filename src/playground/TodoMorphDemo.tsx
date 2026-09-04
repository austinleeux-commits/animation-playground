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
 * Two states from the "AI Chat" Figma file (Thinking Steps 1 → Thinking Steps 2):
 * a 36px status pill that expands into a 656px todo card. Both sit at the same
 * top-left with the same width, so the whole transition is the container
 * growing downwards — height, corner radius, and surface, with the content
 * swapped. What the card holds lives in `todoCard.tsx`, shared with the hugged
 * pill variant.
 */

export function TodoMorphDemo() {
  const [open, setOpen] = useState(false)
  /*
   * Nesting rules out a single open id — opening a sub-step has to leave its
   * ancestors open — so the set holds every open row and the toggle keeps one
   * open per level. Nothing starts open: a row that did would sit there wearing
   * the revealed state, and the list reads as one thing at rest.
   */
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const cardRef = useRef<HTMLDivElement>(null)
  const collapsedRef = useRef<HTMLButtonElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  /* Set by `morphCard` on the click, read once by the height effect below. */
  const morphFrom = useRef<number | undefined>(undefined)
  /*
   * DialKit derives every label from its key (camelCase split and title-cased)
   * and has no description field, so the keys are written to read as the
   * sentence a designer would say out loud. `_collapsed` folds a group shut on
   * load, keeping the panel scannable.
   */
  const p = useDialKit('Todo Card Morph', {
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
   * The gesture's own transition, held for the height effect below. Declared
   * first, so it lands before that effect runs on the same commit and reads
   * the spring picked for the gesture that triggered it. Taking it through a
   * ref also keeps a dial edited mid-flight from restarting a run that is
   * already going — it lands on the next gesture instead.
   */
  const gesture = useRef(container)
  useLayoutEffect(() => {
    gesture.current = container
  })

  /*
   * The card animates its height across the pill ⇄ card swap and then hands
   * that height back to the content. Everything after that — a step opening, a
   * step closing — resizes the card in the same frame as the row that caused
   * it, on that row's own spring. A card that instead followed a measured
   * height would always be a spring behind its own content.
   *
   * The starting height has to be taken on the click: popLayout pulls the
   * outgoing block out of flow before layout effects run, so by then the card
   * has already snapped to whatever is left.
   */
  const morphCard = useCallback((next: boolean) => {
    morphFrom.current = cardRef.current?.offsetHeight
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
   * `auto` between gestures is the whole point, and it has to be written by
   * the card's own motion value: an imperative animation on the same element
   * lands in the same store, so the last pixel height it left would be
   * re-asserted over anything set on the node directly.
   */
  const cardHeight = useMotionValue<number | 'auto'>('auto')
  useLayoutEffect(() => {
    const child = open ? expandedRef.current : collapsedRef.current
    const from = morphFrom.current
    /* Consumed once, so a re-render on its own can't restart the swap. */
    morphFrom.current = undefined
    if (!child || from === undefined) return
    cardHeight.jump(from)
    const controls = animate(cardHeight, child.offsetHeight, {
      ...gesture.current,
      /* Not called when the run is stopped, so the release can't land late. */
      onComplete: () => cardHeight.jump('auto'),
    })
    return () => {
      controls.stop()
      cardHeight.jump('auto')
    }
  }, [cardHeight, open])

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

        <div className="mt-4">
          <motion.div
            ref={cardRef}
            animate={{
              borderRadius: open ? p.cornerRadius.card : p.cornerRadius.pill,
            }}
            transition={container}
            style={{
              height: cardHeight,
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
                <motion.button
                  key="collapsed"
                  ref={collapsedRef}
                  type="button"
                  aria-expanded={false}
                  onClick={() => morphCard(true)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { ...collapseEnter, delay: p.whenClosing.pillWaits },
                  }}
                  exit={{ opacity: 0, transition: expandExit }}
                  className="flex h-9 w-full cursor-pointer items-center gap-2 p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <LightbulbIcon className="shrink-0 text-label" />
                  <span className={`truncate font-semibold text-label ${CALLOUT}`}>
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
