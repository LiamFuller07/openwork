/**
 * Global type declarations for the OpenWork desktop application
 */

/**
 * OpenWork API exposed to the renderer process via Electron's contextBridge
 */
interface OpenworkAPI {
  // Directory selection
  selectDirectory: () => Promise<string | null>;

  // App info
  getAppVersion: () => Promise<string>;

  // External links
  openExternal: (url: string) => Promise<void>;

  // API key management
  storeApiKey: (provider: string, key: string) => Promise<boolean>;
  getApiKey: (provider: string) => Promise<string | null>;
  clearApiKey: (provider: string) => Promise<boolean>;

  // Global hotkey
  getGlobalHotkey: () => Promise<string>;
  setGlobalHotkey: (hotkey: string) => Promise<{ ok: boolean; active: string; error?: string }>;
  resetGlobalHotkey: () => Promise<{ ok: boolean; active: string; error?: string }>;

  // Development mode check
  isDev: () => Promise<boolean>;

  // Platform info
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    openwork?: OpenworkAPI;
  }
}

export {};
