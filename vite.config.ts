import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  publicDir: 'build',
  resolve: {
    alias: {
      'maplibre-gl-components/style.css': resolve(__dirname, 'node_modules/maplibre-gl-components/dist/maplibre-gl-components.css')
    }
  },
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
              external: ['electron'],
              output: {
                format: 'cjs'
              }
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
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'es',
                entryFileNames: 'preload.mjs'
              }
            }
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
