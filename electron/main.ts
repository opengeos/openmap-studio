import { app, BrowserWindow, Menu, dialog, ipcMain, MenuItemConstructorOptions } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null
let mapIsOpen = false

/**
 * Creates the application menu with File menu items.
 */
function createMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Map',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-map')
          }
        },
        {
          label: 'Open Map...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            await handleOpenMap()
          }
        },
        { type: 'separator' },
        {
          id: 'save-map',
          label: 'Save Map',
          accelerator: 'CmdOrCtrl+S',
          enabled: mapIsOpen,
          click: () => {
            mainWindow?.webContents.send('menu:save-map')
          }
        },
        {
          id: 'save-map-as',
          label: 'Save Map As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          enabled: mapIsOpen,
          click: () => {
            mainWindow?.webContents.send('menu:save-map-as')
          }
        },
        { type: 'separator' },
        {
          id: 'close-map',
          label: 'Close Map',
          accelerator: 'CmdOrCtrl+W',
          enabled: mapIsOpen,
          click: () => {
            mainWindow?.webContents.send('menu:close-map')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const }
        ])
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    },
    // Help menu
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = await import('electron')
            await shell.openExternal('https://github.com/opengeos/openmap-studio')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * Updates menu item enabled states based on map open state.
 *
 * @param isOpen - Whether a map is currently open.
 */
function updateMenuState(isOpen: boolean): void {
  mapIsOpen = isOpen
  // Rebuild the menu with updated enabled states
  createMenu()
}

/**
 * Handles the Open Map menu action - shows dialog and sends file to renderer.
 */
async function handleOpenMap(): Promise<void> {
  if (!mainWindow) return

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Map',
    filters: [
      { name: 'OpenMap Files', extensions: ['openmap'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled || !result.filePaths[0]) return

  const filePath = result.filePaths[0]
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    mainWindow.webContents.send('menu:open-map', filePath, content)
  } catch (error) {
    dialog.showErrorBox('Error Opening File', `Failed to read file: ${(error as Error).message}`)
  }
}

/**
 * Sets up IPC handlers for file operations.
 */
function setupIpcHandlers(): void {
  // Handle open dialog request from renderer
  ipcMain.handle('file:open-dialog', async () => {
    if (!mainWindow) return { canceled: true }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Map',
      filters: [
        { name: 'OpenMap Files', extensions: ['openmap'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true }
    }

    const filePath = result.filePaths[0]
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { canceled: false, filePath, content }
    } catch (error) {
      dialog.showErrorBox('Error Opening File', `Failed to read file: ${(error as Error).message}`)
      return { canceled: true }
    }
  })

  // Handle save dialog request from renderer
  ipcMain.handle('file:save-dialog', async (_event, defaultPath?: string) => {
    if (!mainWindow) return { canceled: true }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Map As',
      defaultPath: defaultPath || 'untitled.openmap',
      filters: [
        { name: 'OpenMap Files', extensions: ['openmap'] }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    return { canceled: false, filePath: result.filePath }
  })

  // Handle file write request from renderer
  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
    } catch (error) {
      dialog.showErrorBox('Error Saving File', `Failed to save file: ${(error as Error).message}`)
      throw error
    }
  })

  // Handle menu state update from renderer
  ipcMain.on('app:update-menu-state', (_event, isOpen: boolean) => {
    updateMenuState(isOpen)
  })

  // Save-before-leave dialog when user clicks Home with unsaved changes
  ipcMain.handle('dialog:save-before-leave', async () => {
    if (!mainWindow) return 'cancel'
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Unsaved changes',
      message: 'Save map before going to the start page?',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    })
    const choice = result.response
    if (choice === 0) return 'save'
    if (choice === 1) return 'dontSave'
    return 'cancel'
  })
}

/**
 * Creates the main application window.
 */
function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.mjs')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false
    }
  })

  // Forward renderer console messages to terminal for debugging
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    if (message.startsWith('[')) {
      console.log('[Renderer]', message)
    }
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createMenu()
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
