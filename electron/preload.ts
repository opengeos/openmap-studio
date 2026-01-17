import { contextBridge } from 'electron'

/**
 * Exposes a secure API to the renderer process.
 * Add any IPC methods here as needed.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
})
