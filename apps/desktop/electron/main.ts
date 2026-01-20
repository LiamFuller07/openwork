import { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_GLOBAL_HOTKEY,
  readHotkeySettings,
  registerGlobalHotkey,
  toggleWindowVisibility,
} from './hotkey';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment setup
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
let currentHotkey = DEFAULT_GLOBAL_HOTKEY;

const getSettingsPath = () => path.join(app.getPath('userData'), 'openwork-settings.json');

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // macOS native title bar
    backgroundColor: '#F5F3EE', // Cream background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

  return win;
}

function saveHotkeySetting(hotkey: string) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify({ globalHotkey: hotkey }, null, 2));
}

function registerHotkey(hotkey: string) {
  const result = registerGlobalHotkey(globalShortcut, hotkey, () => {
    win = toggleWindowVisibility(win, createWindow);
  }, currentHotkey);

  if (!result.ok) {
    return result;
  }

  try {
    saveHotkeySetting(result.active);
    currentHotkey = result.active;
    return result;
  } catch (error) {
    console.error('Failed to persist global hotkey:', error);
    currentHotkey = result.active;
    return { ok: false, active: result.active, error: 'Failed to persist hotkey' };
  }
}

// App lifecycle
app.whenReady().then(() => {
  win = createWindow();

  const { globalHotkey } = readHotkeySettings(
    fs.readFileSync,
    DEFAULT_GLOBAL_HOTKEY,
    getSettingsPath(),
  );
  currentHotkey = globalHotkey;
  registerHotkey(currentHotkey);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ============================================================================
// IPC Handlers
// ============================================================================

// Select working directory
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Working Folder',
    buttonLabel: 'Work in this folder',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Open external link - validate URL before opening
ipcMain.handle('open-external', async (_, url: string) => {
  // Validate URL to prevent arbitrary protocol handlers
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      console.warn(`Blocked attempt to open non-http(s) URL: ${url}`);
      return false;
    }
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('Invalid URL provided to open-external:', error);
    return false;
  }
});

// Store API keys securely (in production, use keychain)
const apiKeys: Record<string, string> = {};

ipcMain.handle('store-api-key', async (_, provider: string, key: string) => {
  apiKeys[provider] = key;
  return true;
});

ipcMain.handle('get-api-key', async (_, provider: string) => {
  return apiKeys[provider] || null;
});

ipcMain.handle('clear-api-key', async (_, provider: string) => {
  delete apiKeys[provider];
  return true;
});

// Check if running in development
ipcMain.handle('is-dev', () => {
  return !!VITE_DEV_SERVER_URL;
});

ipcMain.handle('get-global-hotkey', () => {
  return currentHotkey;
});

ipcMain.handle('set-global-hotkey', (_, hotkey: string) => {
  return registerHotkey(hotkey);
});

ipcMain.handle('reset-global-hotkey', () => {
  return registerHotkey(DEFAULT_GLOBAL_HOTKEY);
});
