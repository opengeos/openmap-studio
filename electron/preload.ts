import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes a secure API to the renderer process.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Menu event listeners (main -> renderer)
  // Note: removeAllListeners is called before adding new listeners to prevent
  // duplicate handlers during Vite HMR (Hot Module Replacement)
  onNewMap: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu:new-map')
    ipcRenderer.on('menu:new-map', () => callback())
  },
  onOpenMap: (callback: (filePath: string, content: string) => void) => {
    ipcRenderer.removeAllListeners('menu:open-map')
    ipcRenderer.on('menu:open-map', (_event, filePath: string, content: string) => {
      callback(filePath, content)
    })
  },
  onSaveMap: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu:save-map')
    ipcRenderer.on('menu:save-map', () => callback())
  },
  onSaveMapAs: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu:save-map-as')
    ipcRenderer.on('menu:save-map-as', () => callback())
  },
  onCloseMap: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu:close-map')
    ipcRenderer.on('menu:close-map', () => callback())
  },

  // File operations (renderer -> main)
  showOpenDialog: () => ipcRenderer.invoke('file:open-dialog'),
  showSaveDialog: (defaultPath?: string) => ipcRenderer.invoke('file:save-dialog', defaultPath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),

  // Menu state management
  updateMenuState: (mapIsOpen: boolean) => {
    ipcRenderer.send('app:update-menu-state', mapIsOpen)
  }
})
