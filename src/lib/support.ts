import { IS_ELECTRON } from './platform'

/** Tip page (Ko-fi). Same value as KOFI in scripts/build-landing.mjs. */
export const KOFI_URL = 'https://ko-fi.com/stitchnook'

/** Tips are a website thing: the desktop build shows no Ko-fi button, card or line. */
export const SUPPORT_ENABLED = !IS_ELECTRON
