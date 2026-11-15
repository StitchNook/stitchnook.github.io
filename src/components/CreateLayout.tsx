import type { ReactNode } from 'react'

/**
 * Body of the « Créer » window, the same for every source: the shared header
 * stays at the top, the source's content scrolls below (or lays out its own
 * scrolling areas with `scroll={false}`, like the image converter).
 */
export function CreateBody(props: { header: ReactNode; children: ReactNode; scroll?: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {props.header}
      <div className={`min-h-0 flex-1 ${props.scroll === false ? 'flex flex-col' : 'overflow-y-auto pr-1'}`}>
        {props.children}
      </div>
    </div>
  )
}
