/* @vitest-environment node */
import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_GLOBAL_HOTKEY,
  readHotkeySettings,
  registerGlobalHotkey,
  toggleWindowVisibility,
} from './hotkey';

describe('hotkey helpers', () => {
  it('falls back to default when settings file is missing', () => {
    const readFileSync = vi.fn(() => {
      throw new Error('missing');
    });

    const settings = readHotkeySettings(readFileSync, DEFAULT_GLOBAL_HOTKEY, '/tmp/settings.json');

    expect(settings.globalHotkey).toBe(DEFAULT_GLOBAL_HOTKEY);
  });

  it('toggles visibility by hiding a focused visible window', () => {
    const win = {
      isVisible: () => true,
      isFocused: () => true,
      isMinimized: () => false,
      hide: vi.fn(),
      show: vi.fn(),
      focus: vi.fn(),
      restore: vi.fn(),
    };

    toggleWindowVisibility(win, () => win);

    expect(win.hide).toHaveBeenCalledTimes(1);
    expect(win.show).not.toHaveBeenCalled();
  });

  it('returns error when globalShortcut registration fails', () => {
    const globalShortcut = {
      register: vi.fn(() => false),
      unregister: vi.fn(),
    };

    const result = registerGlobalHotkey(globalShortcut, 'CommandOrControl+;', () => {}, 'CommandOrControl+P');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Hotkey already in use');
  });

  it('rejects empty accelerators', () => {
    const globalShortcut = { register: vi.fn(() => true), unregister: vi.fn() };

    const result = registerGlobalHotkey(globalShortcut, ' ', () => {}, null);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Hotkey cannot be empty');
  });
});
