/**
 * Result from file open dialog.
 */
export interface OpenDialogResult {
  /** Whether the dialog was canceled */
  canceled: boolean;
  /** Path to the selected file (if not canceled) */
  filePath?: string;
  /** Contents of the selected file (if not canceled) */
  content?: string;
}

/**
 * Result from file save dialog.
 */
export interface SaveDialogResult {
  /** Whether the dialog was canceled */
  canceled: boolean;
  /** Path where the file should be saved (if not canceled) */
  filePath?: string;
}

/**
 * Electron API exposed to the renderer process via contextBridge.
 */
export interface ElectronAPI {
  /** Current platform (darwin, win32, linux) */
  platform: string;

  // Menu event listeners (main -> renderer)
  /** Register callback for New Map menu command */
  onNewMap: (callback: () => void) => void;
  /** Register callback for Open Map menu command */
  onOpenMap: (callback: (filePath: string, content: string) => void) => void;
  /** Register callback for Save Map menu command */
  onSaveMap: (callback: () => void) => void;
  /** Register callback for Save Map As menu command */
  onSaveMapAs: (callback: () => void) => void;
  /** Register callback for Close Map menu command */
  onCloseMap: (callback: () => void) => void;

  // File operations (renderer -> main)
  /** Show native open file dialog */
  showOpenDialog: () => Promise<OpenDialogResult>;
  /** Show native save file dialog */
  showSaveDialog: (defaultPath?: string) => Promise<SaveDialogResult>;
  /** Write content to a file */
  writeFile: (filePath: string, content: string) => Promise<void>;

  // Menu state management
  /** Update menu item enabled states based on whether a map is open */
  updateMenuState: (mapIsOpen: boolean) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
