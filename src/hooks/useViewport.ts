import { useCallback, useState } from 'react'
import type { Point } from '../lib/types'

/** `scale` is CSS pixels per stitch; `x`/`y` place the grid origin in the canvas. */
export type Viewport = { scale: number; x: number; y: number }

export const MIN_SCALE = 1.5
export const MAX_SCALE = 64

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

export function useViewport() {
  const [viewport, setViewport] = useState<Viewport>({ scale: 12, x: 0, y: 0 })

  /** Zoom around a point given in canvas-relative CSS pixels. */
  const zoomAt = useCallback((anchor: Point, factor: number) => {
    setViewport((current) => {
      const scale = clampScale(current.scale * factor)
      if (scale === current.scale) return current
      const ratio = scale / current.scale
      return {
        scale,
        x: anchor.x - (anchor.x - current.x) * ratio,
        y: anchor.y - (anchor.y - current.y) * ratio,
      }
    })
  }, [])

  /** Zoom on the centre of a viewport of the given CSS size. */
  const zoomBy = useCallback(
    (factor: number, size: { width: number; height: number }) => {
      zoomAt({ x: size.width / 2, y: size.height / 2 }, factor)
    },
    [zoomAt],
  )

  const panBy = useCallback((dx: number, dy: number) => {
    setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy }))
  }, [])

  /** Centre a grid of `cols` x `rows` stitches inside a viewport, with margin. */
  const fit = useCallback(
    (cols: number, rows: number, size: { width: number; height: number }) => {
      if (size.width <= 0 || size.height <= 0) return
      const margin = 48
      const scale = clampScale(
        Math.min((size.width - margin) / cols, (size.height - margin) / rows),
      )
      setViewport({
        scale,
        x: (size.width - cols * scale) / 2,
        y: (size.height - rows * scale) / 2,
      })
    },
    [],
  )

  return { viewport, setViewport, zoomAt, zoomBy, panBy, fit }
}

export type ViewportApi = ReturnType<typeof useViewport>
