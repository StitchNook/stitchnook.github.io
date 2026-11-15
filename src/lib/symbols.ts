/**
 * Glyph pool for the printed chart. Ordered so the most legible shapes are
 * handed out first, and restricted to characters that survive both a browser
 * canvas and a black-and-white printout.
 */
const POOL = [
  '●', '■', '▲', '◆', '★', '♥', '♦', '♣', '♠', '▼',
  '○', '□', '△', '▽', '☆', '✚', '✖', '✦', '◐', '◑',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
  'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5',
  '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
  'g', 'h', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u',
  'v', 'w', 'y', 'z', '+', '-', '/', '\\', '<', '>',
  '~', '=', '?', '!', '@', '#', '%', '&', '*', '§',
]

/** First glyph of the pool that no existing thread already uses. */
export function nextSymbol(used: Iterable<string>): string {
  const taken = new Set(used)
  for (const symbol of POOL) {
    if (!taken.has(symbol)) return symbol
  }
  // More threads than glyphs: fall back to two-character labels.
  for (const a of POOL) {
    for (const b of POOL) {
      const combo = a + b
      if (!taken.has(combo)) return combo
    }
  }
  return '?'
}

export const SYMBOL_POOL = POOL
