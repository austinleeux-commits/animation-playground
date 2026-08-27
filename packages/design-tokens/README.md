# @animation-playground/design-tokens

Compiles the "Air" design system's Figma Variables export (Primitives -> Mode
-> Theme) into plain CSS custom properties, framework-agnostic so any future
project can consume it the same way.

## The three collections

- **`tokens/primitives/`** — raw building blocks: color ramps, the 18 named
  brand palettes, spacing, radii, and blur/material values. Exported per
  platform (Web, iOS 18, iOS 26); only `Web.tokens.json` feeds the CSS build
  today.
- **`tokens/mode/`** — `Light Mode.tokens.json` / `Dark Mode.tokens.json`
  resolve every primitive brand palette and neutral to one appearance.
- **`tokens/theme/`** — one file per theme (Default, Indigo, Ruby, ...) that
  picks which brand palette fills each semantic slot (`airAccentBrand`,
  `airBackground*`, `airLabel*`, `airAction*`, `airStatus*`, `airFills`).

Components should only ever reach for the Theme-layer semantic slots
(exposed here as `--air-*` custom properties) — never a primitive hex or a
Mode-layer palette name directly.

## Why a custom build script instead of Style Dictionary

Figma resolves variable aliases at export time, so every token's `$value` is
already a literal — the alias chain only survives as
`$extensions["com.figma.aliasData"]` metadata. Style Dictionary's reference
resolution expects live `{a.b.c}` references inside `$value`, not this
out-of-band metadata, so it can't do the one thing that actually matters
here: re-deriving each theme's **dark**-mode colors. (Each Theme file is a
single flat snapshot taken in whichever Mode was active at export time — in
this export, Light — so its own dark-mode values are simply wrong.)
`scripts/build.mjs` instead follows each theme token's `aliasData` back to
its named slot in the Mode collection and re-resolves it once against each
mode file, producing a correct `[data-theme][data-mode]` pair for all 18
themes.

## Build

```sh
pnpm --filter @animation-playground/design-tokens build
```

Regenerates `dist/tokens.css` and `dist/themes.json` from the `tokens/`
sources. The root app's `predev`/`prebuild` scripts already run this
automatically.

## Output

- `dist/tokens.css` — layered custom properties:
  - `:root` — spacing, radii, blur radius (mode/theme-invariant)
  - `[data-mode="light"|"dark"]` — frosted-glass material tint stops
  - `[data-theme="<id>"][data-mode="light"|"dark"]` — the full semantic set
    (`--air-accent`, `--air-bg*`, `--air-label*`, `--air-action*`,
    `--air-status*`, `--air-fill*`, `--air-separator*`)
- `dist/themes.json` — `{ id, label }[]` for building a theme switcher UI.

Consumers set `data-theme` and `data-mode` attributes (e.g. on `<html>`) to
select a combination; every `--air-*` variable updates via the CSS cascade,
so plain `transition-colors` gets you an animated theme switch for free.

## Updating tokens

Re-export the three collections from Figma as W3C DTCG JSON, drop the files
into `tokens/primitives`, `tokens/mode`, `tokens/theme` (same filenames), and
re-run the build. If a theme adds/removes a semantic slot, update
`SEMANTIC_SLOTS` in `scripts/build.mjs` to match.

## Using in another project

This package has no framework dependency — just copy the `packages/design-tokens`
directory into the new repo's workspace, `pnpm install`, `pnpm build`, and
import `@animation-playground/design-tokens/tokens.css` (rename the package
if it's leaving this monorepo). Map the `--air-*` variables to your own
utility framework's tokens (e.g. a Tailwind `@theme` block) however that
project needs.
