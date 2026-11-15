import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the build also loads inside Electron.
  base: './',
  plugins: [react(), tailwindcss()],
  // Projects live in localStorage, which is scoped per origin (port included).
  // Never fall back to another port, or saved projects seem to vanish.
  server: { port: 5173, strictPort: true },
})
