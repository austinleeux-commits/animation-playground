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

## Todo Card Morph

Built from two frames in the "AI Chat" Figma file — `Thinking Steps 1` (a 36px status pill) and `Thinking Steps 2` (the 656px todo card). Both frames place the element at the same position and width, so the whole transition is a downward container transform.

Icons are inlined in `src/playground/icons/AirIcons.tsx` from the Figma exports kept alongside them in that folder. The path data and the 16px/34px boxes are unchanged; only the fixed stroke colors became `currentColor`, so each icon inherits its row's token-driven text color.

The card hugs its content up to `Max Card Height`, then the step list scrolls inside it. Steps behave as an accordion — one open at a time, starting on whichever step is still running. Completed steps expand their reasoning on the same hairline-thread treatment; the in-progress step keeps the filled panel, scrolling its own output. Both scroll areas draw their own thumb (hidden at rest, revealed while scrolling, faded out after) rather than styling `::-webkit-scrollbar`, which would force a space-taking scrollbar on machines set to always show them.

The `Card Grows By` dial switches between the two ways to build this transition:

- **Scaling** — Motion's `layout` projection. The card's *visual* size animates while its DOM height changes instantly, so anything below it snaps to the new position immediately.
- **Height** — the container's measured height animates. Slower to set up, but content below the card moves with it.

Geometry (radius, spring, stagger) is animated by Motion; the surface swap (pill fill → elevated surface, plus the shadow and hairline) is a CSS transition, because Motion can't interpolate between two `var()` values.
