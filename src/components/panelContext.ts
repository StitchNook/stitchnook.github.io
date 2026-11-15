import { createContext } from 'react'

/** Inside a container that already shows a title (the tool panel), panels drop their own header. */
export const PanelHeaderContext = createContext(true)
