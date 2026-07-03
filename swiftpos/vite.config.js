import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Capacitor loads the built app from the local filesystem (capacitor://
  // on Android), so keep asset URLs relative rather than absolute.
  base: './',
  build: {
    outDir: 'dist',
  },
});
