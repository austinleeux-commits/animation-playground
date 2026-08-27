// Compiles the exported Figma DTCG token collections (Primitives -> Mode ->
// Theme) into a single layered CSS file plus a theme manifest.
//
// Figma resolves aliases at export time, so every token's `$value` is already
// a literal (not a `{reference}`) — the alias chain only survives as metadata
// in `$extensions["com.figma.aliasData"]`. The Theme collection is exported
// as one flat snapshot per theme (whichever Mode-collection mode was active
// when it was exported — here, Light), so a theme file's own $value is wrong
// for dark mode. To get correct light *and* dark values per theme, we follow
// each theme token's aliasData back to its named slot in the Mode collection
// and re-resolve it once against Light Mode.tokens.json and once against
// Dark Mode.tokens.json.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokensDir = join(root, 'tokens')
const distDir = join(root, 'dist')

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

function getPath(node, path) {
  for (const key of path.split('/')) {
    if (node == null || typeof node !== 'object' || !(key in node)) return undefined
    node = node[key]
  }
  return node
}

function isLeaf(node) {
  return node != null && typeof node === 'object' && '$value' in node && '$type' in node
}

/** A handful of tokens alias another token *within the same collection*
 * (e.g. Mode's `sheet-primary` = `{Colors.backgrounds (base).neutral-primary}`),
 * which Figma exports as a literal reference string instead of a resolved
 * value. Follow those before reading `$value`. */
function resolveIntraFileAlias(leaf, root) {
  if (typeof leaf.$value === 'string' && leaf.$value.startsWith('{')) {
    const target = getPath(root, leaf.$value.slice(1, -1).replaceAll('.', '/'))
    if (!isLeaf(target)) throw new Error(`Unresolved intra-file alias: ${leaf.$value}`)
    return resolveIntraFileAlias(target, root)
  }
  return leaf
}

/** Renders a DTCG `$value` as a CSS value: hex for opaque colors, modern
 * `rgb(r g b / a)` for translucent ones, otherwise the raw number/string. */
function toCssValue(leaf) {
  const { $type, $value } = leaf
  if ($type === 'color') {
    const [r, g, b] = $value.components.map((c) => Math.round(c * 255))
    return $value.alpha >= 1 ? $value.hex : `rgb(${r} ${g} ${b} / ${round($value.alpha)})`
  }
  if ($type === 'number') return `${$value}px`
  return String($value)
}

function round(n) {
  return Math.round(n * 1000) / 1000
}

function kebabId(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
}

function camelToKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function cssBlock(selector, entries) {
  const lines = entries.map(([name, value]) => `  --air-${name}: ${value};`)
  return `${selector} {\n${lines.join('\n')}\n}`
}

/** Theme-leaf path -> generated CSS custom property name. `null` = skip
 * (radii are covered by the mode/theme-independent primitives below). */
const SEMANTIC_SLOTS = [
  ['airAccentBrand', 'accent'],
  ['airSmallRadius', null],
  ['airLargeRadius', null],
  ['airXLargeRadius', null],
  ['Backgrounds/airBackground', 'bg'],
  ['Backgrounds/airBackgroundSecondary', 'bg-secondary'],
  ['Backgrounds/airBackgroundTertiary', 'bg-tertiary'],
  ['Backgrounds/airBackgroundQuaternary', 'bg-quaternary'],
  ['Backgrounds/airBgStop1', 'bg-stop-1'],
  ['Backgrounds/airBgStop2', 'bg-stop-2'],
  ['Backgrounds/airBackgroundSheet', 'bg-sheet'],
  ['Backgrounds/airBackgroundPure', 'bg-pure'],
  ['Separators/airSeparator', 'separator'],
  ['Separators/airSeparatorNonOpaque', 'separator-non-opaque'],
  ['Separators/airOverlay', 'overlay'],
  ['Labels/airLabel', 'label'],
  ['Labels/airLabelSecondary', 'label-secondary'],
  ['Labels/airLabelTertiary', 'label-tertiary'],
  ['Labels/airLabelQuaternary', 'label-quaternary'],
  ['Labels/airForegroundLabel', 'label-on-accent'],
  ['Labels/airSelectedTabLabel', 'label-selected-tab'],
  ['Actions/airAction', 'action'],
  ['Actions/airLabelDisabled', 'label-disabled'],
  ['Actions/airActionGreen', 'action-green'],
  ['Actions/airActionOrange', 'action-orange'],
  ['Actions/airActionBlue', 'action-blue'],
  ['Actions/airActionBlue20', 'action-blue-20'],
  ['Actions/airActionRed', 'action-red'],
  ['Actions/airActionIndigo', 'action-indigo'],
  ['Actions/airActionPurple', 'action-purple'],
  ['System/airContextMenuBackground', 'context-menu-bg'],
  ['Fills/airPrimaryFill', 'fill'],
  ['Fills/airSecondaryFill', 'fill-secondary'],
  ['Fills/airTertiaryFill', 'fill-tertiary'],
  ['Fills/airQuaternaryFill', 'fill-quaternary'],
  ['Fills/airSegmentedSelection', 'fill-segmented-selection'],
  ['Status/airStatusSuccess', 'status-success'],
  ['Status/airStatusWarning', 'status-warning'],
  ['Status/airStatusError', 'status-error'],
  ['Status/airStatusInfo', 'status-info'],
]

async function build() {
  const primitives = await readJson(join(tokensDir, 'primitives', 'Web.tokens.json'))
  const modeByAppearance = {
    light: await readJson(join(tokensDir, 'mode', 'Light Mode.tokens.json')),
    dark: await readJson(join(tokensDir, 'mode', 'Dark Mode.tokens.json')),
  }

  const sections = [
    '/* Generated by packages/design-tokens/scripts/build.mjs — do not edit by hand. */',
  ]

  // --- Primitives: spacing + radii (mode- and theme-invariant) ---
  const spacings = primitives['Spacings and Radii'].Spacings
  const radii = primitives['Spacings and Radii'].Radii
  const rootEntries = [
    ...Object.entries(spacings).map(([k, v]) => [`space-${camelToKebab(k.replace(/^air/, ''))}`, toCssValue(v)]),
    ...Object.entries(radii).map(([k, v]) => [`radius-${k.replace(/-radius$/, '')}`, toCssValue(v)]),
    ['material-blur', toCssValue(primitives.Materials.materialBlur)],
    ['material-blur-chrome', toCssValue(primitives.Materials.materialBlurChrome)],
  ]
  sections.push(cssBlock(':root', rootEntries))

  // --- Mode: frosted-glass material tint stops (light/dark only, no theme) ---
  for (const [appearance, suffix] of [['light', 'Light'], ['dark', 'Dark']]) {
    const materials = modeByAppearance[appearance].Materials
    const entries = [
      ['material-glass-a', toCssValue(materials[`regular26${suffix}A`])],
      ['material-glass-b', toCssValue(materials[`regular26${suffix}B`])],
    ]
    sections.push(cssBlock(`[data-mode="${appearance}"]`, entries))
  }

  // --- Theme: semantic slots, resolved per theme x mode ---
  const themeDir = join(tokensDir, 'theme')
  const themeFiles = (await readdir(themeDir)).filter((f) => f.endsWith('.tokens.json')).sort()
  const manifest = []

  for (const file of themeFiles) {
    const name = file.replace(/\.tokens\.json$/, '')
    const id = kebabId(name)
    const theme = await readJson(join(themeDir, file))
    manifest.push({ id, label: name })

    for (const appearance of ['light', 'dark']) {
      const mode = modeByAppearance[appearance]
      const entries = []

      for (const [path, varName] of SEMANTIC_SLOTS) {
        if (varName === null) continue
        const leaf = getPath(theme, path)
        if (!isLeaf(leaf)) throw new Error(`${file}: missing token at ${path}`)

        const alias = leaf.$extensions?.['com.figma.aliasData']
        let resolved
        if (!alias) {
          resolved = leaf // detached literal (same value in every mode/theme)
        } else if (alias.targetVariableSetName === 'Mode') {
          resolved = getPath(mode, alias.targetVariableName)
          if (!isLeaf(resolved)) throw new Error(`${file}: unresolved Mode alias ${alias.targetVariableName}`)
          resolved = resolveIntraFileAlias(resolved, mode)
        } else if (alias.targetVariableSetName === 'Primitives' && /^Colors\/(light|dark)\//.test(alias.targetVariableName)) {
          // A couple of themes alias straight into a Primitives appearance
          // slice instead of going through Mode — swap in the mode we're
          // building for rather than the "light" (or "dark") it was authored with.
          const target = alias.targetVariableName.replace(/^Colors\/(light|dark)\//, `Colors/${appearance}/`)
          resolved = getPath(primitives, target)
          if (!isLeaf(resolved)) throw new Error(`${file}: unresolved Primitives alias ${target}`)
        } else {
          throw new Error(`${file}: unexpected alias target ${alias.targetVariableSetName}/${alias.targetVariableName}`)
        }
        entries.push([varName, toCssValue(resolved)])
      }

      sections.push(cssBlock(`[data-theme="${id}"][data-mode="${appearance}"]`, entries))
    }
  }

  // Pin "Default" first, then alphabetical — everything else is arbitrary order.
  manifest.sort((a, b) => (a.id === 'default' ? -1 : b.id === 'default' ? 1 : a.label.localeCompare(b.label)))

  await mkdir(distDir, { recursive: true })
  await writeFile(join(distDir, 'tokens.css'), `${sections.join('\n\n')}\n`)
  await writeFile(join(distDir, 'themes.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  console.log(`Wrote dist/tokens.css (${themeFiles.length} themes x 2 modes) and dist/themes.json`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
