---
name: dialkit-controls
description: Naming and structuring DialKit controls so a designer can tell what each one does. Use when adding or editing a `useDialKit` config anywhere in the codebase, when building a demo or experiment with tunable parameters, or when someone says the dial panel is confusing, unclear, or hard to read.
---

# Writing DialKit controls a designer can read

## The constraint that drives everything

DialKit builds every control's label from its **key**, and nothing else:

```js
formatLabel(key) // "pillFadesOut" -> "Pill Fades Out"
// key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()
```

There is **no `label`, `description`, or tooltip field** on sliders, toggles,
selects, transitions, or folders. The only exception is `{ type: 'action' }`,
which accepts `label`.

So the key *is* the UI copy. Write it as the phrase you want a designer to
read, not as an internal name.

## Rules

**Name the visible effect, not the mechanism.** The reader is watching the
screen, not the code.

| Don't | Do | Renders as |
| --- | --- | --- |
| `container` | `cardGrows` | Card Grows |
| `exit` | `pillFadesOut` | Pill Fades Out |
| `delay` | `rowsWait` | Rows Wait |
| `stagger` | `betweenRows` | Between Rows |
| `rise` | `rowsSlideFrom` | Rows Slide From |
| `surfaceFade` | `colorChange` | Color Change |

**Name a group for the moment it covers, not the concept.** `expand` →
`whenOpening` ("When Opening"). `detail` → `openingAStep` ("Opening A Step").
A designer scanning the panel is looking for *when* something happens.

**Mirror the two directions.** If opening has `cardGrows` / `pillFadesOut` /
`rowsFadeIn`, closing should have `cardShrinks` / `rowsFadeOut` /
`pillFadesIn`. Symmetry makes the panel self-explaining.

**Collapse every group.** Add `_collapsed: true` to each folder so the panel
opens as a short list to drill into rather than a wall of sliders. It is
DialKit's only meta key and is stripped from the resolved values.

```ts
whenOpening: {
  _collapsed: true,
  cardGrows: { type: 'spring', visualDuration: 0.45, bounce: 0.2 },
  ...
}
```

## Gotchas

**Keep select options short.** The label and value share one row with no
wrapping. `technique: { options: ['transform (page snaps)', ...] }` renders as
`TechniqueTransform (Page Snaps)` — they collide. Put the explanation in the
README and keep the option to one or two words. String options are
title-cased.

**Pass an explicit slider step when the default matters.** Sliders are
`[default, min, max, step?]`, and an omitted step is inferred from the range:

| range | step |
| --- | --- |
| ≤ 1 | 0.01 |
| ≤ 10 | 0.1 |
| ≤ 100 | 1 |
| > 100 | 10 |

`[656, 240, 900]` has a range of 660, so the step is 10 and the default
quantizes to **660**, not 656. `[656, 240, 904, 4]` gives back exactly 656.
Check the value the component actually receives, not the one you typed.

**Transitions come back as a union.** A `{ type: 'spring' }` or
`{ type: 'easing' }` dial can be switched between Easing / Time / Physics in
the panel, so narrow before handing it to Motion — `type: 'easing'` is not a
valid Motion transition type:

```ts
const toTransition = (c: DialTransition): Transition =>
  c.type === 'spring' ? c : { duration: c.duration, ease: c.ease }
```

## Checklist

- [ ] Every key reads as a phrase describing what the viewer sees
- [ ] Group keys name a moment (`whenOpening`), not a concept (`expand`)
- [ ] Opening and closing groups mirror each other
- [ ] Every group has `_collapsed: true`
- [ ] Select options are short enough not to collide with their label
- [ ] Sliders whose default must be exact pass a step
- [ ] Read the panel back: does each row say what it does without the code?

## A worked example

```ts
// Before — the panel reads: Container, Exit, Enter, Delay, Stagger, Rise
const p = useDialKit('Card', {
  expand: {
    container: { type: 'spring', visualDuration: 0.45, bounce: 0.2 },
    exit: { type: 'easing', duration: 0.12, ease: [0.4, 0, 1, 1] },
    delay: [0.06, 0, 0.5],
    stagger: [0.03, 0, 0.15],
    rise: [8, -40, 40],
  },
})

// After — the panel reads: When Opening > Card Grows, Pill Fades Out,
// Rows Wait, Between Rows, Rows Slide From
const p = useDialKit('Card', {
  whenOpening: {
    _collapsed: true,
    cardGrows: { type: 'spring', visualDuration: 0.45, bounce: 0.2 },
    pillFadesOut: { type: 'easing', duration: 0.12, ease: [0.4, 0, 1, 1] },
    rowsWait: [0.06, 0, 0.5],
    betweenRows: [0.03, 0, 0.15],
    rowsSlideFrom: [8, -40, 40],
  },
})
```
