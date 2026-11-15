import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/embed.tsx',
      formats: ['es'],
      fileName: () => 'morrow-chat.js',
    },
    outDir: 'dist/embed',
    emptyOutDir: false,
  },
})
