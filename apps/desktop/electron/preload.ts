import { contextBridge, ipcRenderer } from 'electron';

/**
 * OpenWork API exposed to the renderer process
 */
const openworkAPI = {
  // Directory selection
  selectDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke('select-directory');
  },

  // App info
  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke('get-app-version');
  },

  // External links
  openExternal: (url: string): Promise<void> => {
    return ipcRenderer.invoke('open-external', url);
  },

  // API key management
  storeApiKey: (provider: string, key: string): Promise<boolean> => {
    return ipcRenderer.invoke('store-api-key', provider, key);
  },

  getApiKey: (provider: string): Promise<string | null> => {
    return ipcRenderer.invoke('get-api-key', provider);
  },

  clearApiKey: (provider: string): Promise<boolean> => {
    return ipcRenderer.invoke('clear-api-key', provider);
  },

  // Development mode check
  isDev: (): Promise<boolean> => {
    return ipcRenderer.invoke('is-dev');
  },

  // Ollama models
  fetchOllamaModels: (): Promise<{ success: boolean; models: string[]; error?: string }> => {
    return ipcRenderer.invoke('fetch-ollama-models');
  },

  // Platform info
  platform: process.platform,
};

// Expose the API to the renderer
contextBridge.exposeInMainWorld('openwork', openworkAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    openwork: typeof openworkAPI;
  }
}
