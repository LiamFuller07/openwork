"use strict";
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const url = require("url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const DEFAULT_GLOBAL_HOTKEY = "CommandOrControl+;";
function readHotkeySettings(readFileSync, defaultHotkey, settingsPath) {
  try {
    const raw = readFileSync(settingsPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.globalHotkey && typeof parsed.globalHotkey === "string") {
      return { globalHotkey: parsed.globalHotkey };
    }
  } catch {
  }
  return { globalHotkey: defaultHotkey };
}
function registerGlobalHotkey(globalShortcut, accelerator, callback, previous) {
  if (!accelerator.trim()) {
    return {
      ok: false,
      active: previous ?? DEFAULT_GLOBAL_HOTKEY,
      error: "Hotkey cannot be empty"
    };
  }
  if (previous && previous !== accelerator) {
    globalShortcut.unregister(previous);
  }
  const success = globalShortcut.register(accelerator, callback);
  if (!success) {
    if (previous && previous !== accelerator) {
      globalShortcut.register(previous, callback);
    }
    return {
      ok: false,
      active: previous ?? DEFAULT_GLOBAL_HOTKEY,
      error: "Hotkey already in use"
    };
  }
  return { ok: true, active: accelerator };
}
function toggleWindowVisibility(win2, createWindow2) {
  const target = win2 ?? createWindow2();
  if (target.isMinimized()) {
    target.restore();
    target.show();
    target.focus();
    return target;
  }
  if (target.isVisible() && target.isFocused()) {
    target.hide();
    return target;
  }
  target.show();
  target.focus();
  return target;
}
const __dirname$1 = path.dirname(url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
let currentHotkey = DEFAULT_GLOBAL_HOTKEY;
const getSettingsPath = () => path.join(electron.app.getPath("userData"), "openwork-settings.json");
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    // macOS native title bar
    backgroundColor: "#F5F3EE",
    // Cream background
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
  return win;
}
function saveHotkeySetting(hotkey) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify({ globalHotkey: hotkey }, null, 2));
}
function registerHotkey(hotkey) {
  const result = registerGlobalHotkey(electron.globalShortcut, hotkey, () => {
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
    console.error("Failed to persist global hotkey:", error);
    currentHotkey = result.active;
    return { ok: false, active: result.active, error: "Failed to persist hotkey" };
  }
}
electron.app.whenReady().then(() => {
  win = createWindow();
  const { globalHotkey } = readHotkeySettings(
    fs.readFileSync,
    DEFAULT_GLOBAL_HOTKEY,
    getSettingsPath()
  );
  currentHotkey = globalHotkey;
  registerHotkey(currentHotkey);
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
electron.ipcMain.handle("select-directory", async () => {
  const result = await electron.dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Select Working Folder",
    buttonLabel: "Work in this folder"
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
electron.ipcMain.handle("get-app-version", () => {
  return electron.app.getVersion();
});
electron.ipcMain.handle("open-external", async (_, url2) => {
  try {
    const parsedUrl = new URL(url2);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      console.warn(`Blocked attempt to open non-http(s) URL: ${url2}`);
      return false;
    }
    await electron.shell.openExternal(url2);
    return true;
  } catch (error) {
    console.error("Invalid URL provided to open-external:", error);
    return false;
  }
});
const apiKeys = {};
electron.ipcMain.handle("store-api-key", async (_, provider, key) => {
  apiKeys[provider] = key;
  return true;
});
electron.ipcMain.handle("get-api-key", async (_, provider) => {
  return apiKeys[provider] || null;
});
electron.ipcMain.handle("clear-api-key", async (_, provider) => {
  delete apiKeys[provider];
  return true;
});
electron.ipcMain.handle("is-dev", () => {
  return !!VITE_DEV_SERVER_URL;
});
electron.ipcMain.handle("get-global-hotkey", () => {
  return currentHotkey;
});
electron.ipcMain.handle("set-global-hotkey", (_, hotkey) => {
  return registerHotkey(hotkey);
});
electron.ipcMain.handle("reset-global-hotkey", () => {
  return registerHotkey(DEFAULT_GLOBAL_HOTKEY);
});
