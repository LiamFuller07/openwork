"use strict";
const electron = require("electron");
const openworkAPI = {
  // Directory selection
  selectDirectory: () => {
    return electron.ipcRenderer.invoke("select-directory");
  },
  // App info
  getAppVersion: () => {
    return electron.ipcRenderer.invoke("get-app-version");
  },
  // External links
  openExternal: (url) => {
    return electron.ipcRenderer.invoke("open-external", url);
  },
  // API key management
  storeApiKey: (provider, key) => {
    return electron.ipcRenderer.invoke("store-api-key", provider, key);
  },
  getApiKey: (provider) => {
    return electron.ipcRenderer.invoke("get-api-key", provider);
  },
  clearApiKey: (provider) => {
    return electron.ipcRenderer.invoke("clear-api-key", provider);
  },
  // Global hotkey
  getGlobalHotkey: () => {
    return electron.ipcRenderer.invoke("get-global-hotkey");
  },
  setGlobalHotkey: (hotkey) => {
    return electron.ipcRenderer.invoke("set-global-hotkey", hotkey);
  },
  resetGlobalHotkey: () => {
    return electron.ipcRenderer.invoke("reset-global-hotkey");
  },
  // Development mode check
  isDev: () => {
    return electron.ipcRenderer.invoke("is-dev");
  },
  // Platform info
  platform: process.platform
};
electron.contextBridge.exposeInMainWorld("openwork", openworkAPI);
