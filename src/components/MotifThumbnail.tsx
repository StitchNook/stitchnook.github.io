import { useEffect, useRef } from 'react'
import { dmcByCode } from '../lib/dmc'
import { drawThumbnail } from '../lib/motifs'
import type { Project } from '../lib/types'

/** One motif, drawn small. */
export function Thumbnail(props: { project: Project; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { project, size = 64 } = props
  useEffect(() => {
    if (!ref.current) return
    drawThumbnail(ref.current, project, project.palette.map((thread) => dmcByCode(thread.code).hex), size)
  }, [project, size])
  return <canvas ref={ref} className="max-h-full max-w-full [image-rendering:pixelated]" />
}

