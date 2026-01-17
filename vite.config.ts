import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  publicDir: 'build',
  plugins: [
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    renderer()
  ],
  build: {
    outDir: 'dist'
  }
})
