# Animation Playground

A designer-friendly sandbox for testing web animation capabilities — durations, easings, springs, layout transitions, gestures, and stagger — with live, tweakable controls instead of code edits.

## Stack

- **React + Vite + TypeScript** — app shell
- **Tailwind CSS v4** — styling
- **[Motion](https://motion.dev)** (`motion/react`) — animation engine
- **[Dialkit](https://github.com/joshpuckett/dialkit)** — the floating panel (top-right) that exposes each demo's parameters (duration, spacing, easing, spring physics, etc.) as live sliders/selects
- **[React Router](https://reactrouter.com)** — one route per exploration, so each has a shareable URL
- **[Agentation](https://agentation.com)** — click any element to annotate it and copy agent-readable context (selectors, styles, position) for pasting into an AI coding tool
- **`@animation-playground/design-tokens`** — the Air design system's Figma Variables, compiled to `--air-*` custom properties and mapped onto Tailwind theme keys in `src/index.css`

## Getting started

```bash
pnpm install
pnpm dev
```

Open the app, expand the **DialKit** panel in the top-right corner, and tune any demo's parameters in real time. Click the **Agentation** toggle in the bottom-right to leave notes on specific elements.

## Pages

The top nav is driven entirely by `src/explorations.ts`. Every entry there becomes both a nav item and a route:

- **Playground** (`/`) — the grid of capability demos.
- **Design explorations** (e.g. `/todo-card-morph`) — one page per design, given the full viewport width because they're judged at their real size.

## Adding a new demo

Each demo lives in `src/playground/` as a self-contained component that calls `useDialKit(name, config)` for its tunable parameters and renders a `motion.*` element driven by the returned values. Add it to `src/pages/PlaygroundHome.tsx` to put it on the grid.

## Adding a design exploration

1. Build the component in `src/playground/`, using design-system utilities (`bg-surface-secondary`, `text-label-secondary`, `bg-fill-quaternary`, `rounded-content`, …) rather than raw hexes, so it follows the Theme & Mode dial.
2. Wrap it in a page under `src/pages/` using `ExplorationPage` for the title/description chrome.
3. Add one entry to `EXPLORATIONS` in `src/explorations.ts`. Nav and routing follow automatically.

If the design needs a semantic slot that isn't mapped yet, add it to the `@theme inline` block in `src/index.css` (pointing at the matching `--air-*` variable) rather than hardcoding the color — the token package already carries every slot for all 18 themes in both modes.

## Naming DialKit controls

DialKit builds each control's label from its key — splitting camelCase and title-casing it — and has no description or tooltip field. The key *is* the UI copy, so write it as the phrase a designer should read (`pillFadesOut`, `rowsSlideFrom`, `betweenRows`) rather than as an internal name, and give every group `_collapsed: true` so the panel opens as a short list to drill into.

The full convention and its gotchas live in the **`dialkit-controls`** skill (`.claude/skills/dialkit-controls/SKILL.md`). Follow it whenever you add or edit a `useDialKit` config.

## Coin Flip

`src/playground/CoinFlipDemo.tsx` recreates a screen recording of a two-tone disc turning on its vertical axis. The silhouette never changes size — only the boundary between the two faces moves, and it moves as an ellipse pinned to the top and bottom of the rim (a moon's terminator). Measured off the recording: the terminator crosses at a *constant* rate rather than easing in and out, taking ~0.8s, and the disc rests ~0.2s on each face, so a full turn is ~2s.

The whole animation is one number — the terminator's offset, `-1` (nothing showing) through `0` (a straight edge down the middle) to `+1` (the face has swept the disc). Every vertex and bezier handle in `coinFlipGeometry.ts` is affine in it, which is why the Lottie export needs only two path keyframes per half turn: Lottie interpolates vertices and tangents linearly, and for this shape that is exact rather than an approximation.

The preview runs on its own `requestAnimationFrame` clock rather than Motion, so the frames it draws and the frames the exported file draws come from the same function. The clock reads dial values through a ref instead of restarting on each change, so tuning a control doesn't jump-cut the loop back to the top.

**Export Lottie** writes a 512px, 60fps document covering one full turn. Each half turn gets its own disc and sweep layer, scoped with `ip`/`op` so the disc underneath swaps colour on exactly the frame its sweep completes — hold-keyframing a single fill colour is the obvious alternative, but some renderers interpolate it anyway. Shared Lottie plumbing (the bezier shape format, colour conversion, the SVG `d` round-trip, the download) lives in `src/playground/lottie/lottie.ts`.

## Todo Card Morph

Built from two frames in the "AI Chat" Figma file — `Thinking Steps 1` (a 36px status pill) and `Thinking Steps 2` (the 656px todo card). Both frames place the element at the same position and width, so the whole transition is the container growing downwards.

Icons are inlined in `src/playground/icons/AirIcons.tsx` from the Figma exports kept alongside them in that folder. The path data and the 16px/34px boxes are unchanged; only the fixed stroke colors became `currentColor`, so each icon inherits its row's token-driven text color.

The card hugs its content up to `Max Card Height`, then the step list scrolls inside it. Steps behave as an accordion — one open per level, and nothing open on load. Both scroll areas draw their own thumb (hidden at rest, revealed while scrolling, faded out after) rather than styling `::-webkit-scrollbar`, which would force a space-taking scrollbar on machines set to always show them.

The card's height animates across the pill ⇄ card swap and is then handed back to the content, so opening or closing a step resizes the card in the same frame as the row, on that row's own spring — `Opening A Step > Height Change`. `When Opening > Card Grows` and `When Closing > Card Shrinks` govern only the swap itself. Motion's `layout` projection was the other candidate here and is deliberately not used: it animates the card's *visual* size while its DOM height changes instantly, so anything below the card snaps to the new position a beat early.

Geometry (radius, spring, stagger) is animated by Motion; the surface swap (pill fill → elevated surface, plus the shadow and hairline) is a CSS transition, because Motion can't interpolate between two `var()` values.

### Expanded state

Traced from `Thinking Steps 34`. A row carries no permanent affordance — the chevron that used to sit at its right edge is gone. Hovering swaps the row's status marker for a chevron and brings in how long the step took; clicking pins both revealed and turns the chevron down. Everything that changes is opacity or colour on boxes that are always in the layout, so the timer never pushes the label around and nothing reflows under the pointer. Every row rests identically — status marker, grey label, no timer — including the step still running, so nothing is wearing the revealed state before you point at it, and nothing starts open. Only the card keeps a permanent control: the close **×** in the top right, which the header chevron used to be. Clicking anywhere off the card collapses it too; that listener sits on the exploration's own area rather than the document, so reaching for the dial panel to tune the expanded state doesn't collapse the thing you are tuning.

A step opens into one of three things, all present in `todoItems.ts` so they can be judged against each other: the prose reasoning that produced it on a hairline thread, the filled panel that scrolls its own output while the step is still streaming, or a **nested list of sub-steps**. Nesting recurses — `Create packing list` opens into six sub-steps, one of which opens into three more, and another of which opens into prose at that same depth. Each nested list threads back to the marker of the row above it: the line sits at 7.5px, the centre of that row's 16px icon, so the indent reads as hanging off the parent rather than as a second margin.

Nesting is why the open state is a set of ids rather than one — opening a sub-step has to leave its ancestors open. The toggle still keeps one row open per level, and closing a row closes everything it contained. Row heights animate on `Opening A Step > Height Change` at every depth; because Motion returns a finished `height: auto` animation to the literal `auto`, an ancestor grows continuously with whatever opens inside it instead of needing its own animation.

The collapsed pill ends on a live thinking timer rather than a chevron — `Processing your request... • 29s`, counting for as long as the request is still being worked on. It only re-renders while the pill is the thing on screen; the elapsed time is read back off a start timestamp, so parking it while the card is expanded doesn't lose the seconds that passed.

Both morph pages render the same card, so its insides live in `src/playground/todoCard.tsx` and the two demos keep only the part they actually differ on — how the container gets to that size.

### Hugged pill

`/todo-card-morph-hug` is the same morph with the collapsed pill hugging its content instead of matching the card's width, so the container has to animate width alongside height. Height still settles on `auto` between gestures; width can't, because an unset width on a block element resolves against its parent and would just echo the card's own in-flight width — it settles on `fit-content` for the pill and `100%` for the card, and expands toward the page column's width rather than the mounted content's.

`Expand Order` picks how the two axes are timed. **Diagonal** starts both in the same frame, as before. **Sideways First** stretches the pill out to the column on `When Opening > Width Grows`, holds the vertical leg for `Height Starts After`, and only then unfurls the card downward on `Card Grows`; closing mirrors it — the card drops to pill height on `Card Shrinks`, then narrows on `Width Shrinks` after `Width Starts After`. The row stagger and the pill's own fade shift by the same offsets, so the pill is still on screen through the stretch instead of leaving a wide empty bar, and the rows only stagger in once the card is actually growing to make room for them.
