"use strict";
const electron = require("electron");
const path = require("path");
const url = require("url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const __dirname$1 = path.dirname(url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
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
}
electron.app.whenReady().then(createWindow);
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
