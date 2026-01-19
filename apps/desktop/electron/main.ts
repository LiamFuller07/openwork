import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment setup
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

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
}

// App lifecycle
app.whenReady().then(createWindow);

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

// Fetch Ollama models
ipcMain.handle('fetch-ollama-models', async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const modelNames = data.models?.map((model: any) => model.name) || [];
    return { success: true, models: modelNames };
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return { success: false, models: [], error: String(error) };
  }
});
