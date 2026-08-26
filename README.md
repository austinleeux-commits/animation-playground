# Animation Playground

A designer-friendly sandbox for testing web animation capabilities — durations, easings, springs, layout transitions, gestures, and stagger — with live, tweakable controls instead of code edits.

## Stack

- **React + Vite + TypeScript** — app shell
- **Tailwind CSS v4** — styling
- **[Motion](https://motion.dev)** (`motion/react`) — animation engine
- **[Dialkit](https://github.com/joshpuckett/dialkit)** — the floating panel (top-right) that exposes each demo's parameters (duration, spacing, easing, spring physics, etc.) as live sliders/selects
- **[Agentation](https://agentation.com)** — click any element to annotate it and copy agent-readable context (selectors, styles, position) for pasting into an AI coding tool

## Getting started

```bash
pnpm install
pnpm dev
```

Open the app, expand the **DialKit** panel in the top-right corner, and tune any demo's parameters in real time. Click the **Agentation** toggle in the bottom-right to leave notes on specific elements.

## Adding a new demo

Each demo lives in `src/playground/` as a self-contained component that calls `useDialKit(name, config)` for its tunable parameters and renders a `motion.*` element driven by the returned values. Register new demos in `src/App.tsx`.
