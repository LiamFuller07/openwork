export const DEFAULT_GLOBAL_HOTKEY = 'CommandOrControl+;';

export type HotkeySettings = {
  globalHotkey: string;
};

export function readHotkeySettings(
  readFileSync: (path: string, encoding: 'utf-8') => string,
  defaultHotkey: string,
  settingsPath: string,
): HotkeySettings {
  try {
    const raw = readFileSync(settingsPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<HotkeySettings>;
    if (parsed.globalHotkey && typeof parsed.globalHotkey === 'string') {
      return { globalHotkey: parsed.globalHotkey };
    }
  } catch {
    // fall through to default
  }
  return { globalHotkey: defaultHotkey };
}

export function registerGlobalHotkey(
  globalShortcut: {
    register: (accelerator: string, callback: () => void) => boolean;
    unregister: (accelerator: string) => void;
  },
  accelerator: string,
  callback: () => void,
  previous: string | null,
): { ok: boolean; active: string; error?: string } {
  if (!accelerator.trim()) {
    return {
      ok: false,
      active: previous ?? DEFAULT_GLOBAL_HOTKEY,
      error: 'Hotkey cannot be empty',
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
      error: 'Hotkey already in use',
    };
  }

  return { ok: true, active: accelerator };
}

export function toggleWindowVisibility<
  T extends {
    isVisible: () => boolean;
    isFocused: () => boolean;
    isMinimized: () => boolean;
    hide: () => void;
    show: () => void;
    focus: () => void;
    restore: () => void;
  },
>(
  win: T | null,
  createWindow: () => T,
): T {
  const target = win ?? createWindow();

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
