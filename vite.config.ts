import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import pxtorem from 'postcss-pxtorem'
import { apiCockpit } from './server/api.ts'

// Les styles sont écrits en pixels d'une maquette de 1280 × 820, puis convertis en rem :
// sur ordinateur, tout le tableau de bord grandit ou rétrécit avec la fenêtre (voir html dans styles.css).
export default defineConfig(({ mode }) => ({
  plugins: [react(), apiCockpit(loadEnv(mode, process.cwd(), ''))],
  css: {
    postcss: {
      plugins: [pxtorem({ rootValue: 16, propList: ['*'], minPixelValue: 1.5, selectorBlackList: ['html'] })],
    },
  },
  server: { port: 5180 },
  preview: { port: 5180 },
}))
