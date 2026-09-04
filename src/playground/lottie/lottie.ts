/*
 * Shared Lottie/bodymovin interop: the bezier shape format the icons compile
 * to, the conversion back out to an SVG `d` string so the live preview and the
 * exported file draw from the same geometry, and colour/file plumbing.
 */

export type LottieBezierVertex = {
  /** Anchor point. */
  v: [number, number]
  /** Incoming control-point handle, relative to `v`. */
  i: [number, number]
  /** Outgoing control-point handle, relative to `v`. */
  o: [number, number]
}

export type LottieBezierShape = {
  closed: boolean
  vertices: LottieBezierVertex[]
}

export function hexToLottieColor(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b, 1]
}

/** Renders a Lottie bezier shape as an SVG path `d` string. */
export function bezierShapeToSvgPath(shape: LottieBezierShape): string {
  const { vertices, closed } = shape
  if (vertices.length === 0) return ''

  const segments: string[] = [`M${vertices[0].v[0]} ${vertices[0].v[1]}`]
  const lastIndex = closed ? vertices.length : vertices.length - 1

  for (let index = 0; index < lastIndex; index++) {
    const from = vertices[index]
    const to = vertices[(index + 1) % vertices.length]
    const c1 = [from.v[0] + from.o[0], from.v[1] + from.o[1]]
    const c2 = [to.v[0] + to.i[0], to.v[1] + to.i[1]]
    segments.push(`C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${to.v[0]} ${to.v[1]}`)
  }

  if (closed) segments.push('Z')
  return segments.join(' ')
}

export function downloadLottieFile(lottie: object, filename: string) {
  const blob = new Blob([JSON.stringify(lottie, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
