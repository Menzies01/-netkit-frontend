import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.0.195:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://192.168.0.195:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
})