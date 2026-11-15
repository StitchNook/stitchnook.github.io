import { DEFAULT_DISPLAY_UNIT, createProject } from '../hooks/useProject'
import { nextSymbol } from './symbols'
import type { ImportedPattern } from './pdfImport'
import type { Project } from './types'

/** Turn the PDF reading into a project (symbols are ours, codes are DMC). */
export function patternToProject(pattern: ImportedPattern, name: string): Project {
  const base = createProject({
    name,
    width: pattern.width,
    height: pattern.height,
    fabric: { count: pattern.perInch ?? 14, countUnit: 'in', displayUnit: DEFAULT_DISPLAY_UNIT },
  })
  const palette: Project['palette'] = []
  for (const thread of pattern.threads) {
    palette.push({ code: thread.code, symbol: nextSymbol(palette.map((t) => t.symbol)) })
  }
  return { ...base, palette, cells: new Int16Array(pattern.cells) }
}

