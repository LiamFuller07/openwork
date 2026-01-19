# Global Hotkey Design

## Goal
Add a settings section to configure a global hotkey that toggles app visibility, defaulting to Cmd+; on macOS and Ctrl+; on Windows/Linux, and persist it across restarts.

## Architecture
- Register a global shortcut in the Electron main process via `globalShortcut`.
- Expose IPC handlers to get/set/reset the hotkey from the renderer.
- Persist settings in a JSON file under `app.getPath('userData')`.

## Persistence
- File: `openwork-settings.json` in the user data directory.
- Default: `CommandOrControl+;`.
- On startup:
  - Read and parse JSON.
  - If missing/invalid, fall back to default and rewrite file.

## Hotkey Behavior
- Action: toggle app visibility.
- If window is visible and focused: `win.hide()`.
- If hidden/minimized: `win.show()`, `win.focus()`, and `win.restore()` when needed.
- If `win` is null: recreate window before toggling.

## Settings UI
- New "Global Hotkey" section above provider options.
- Input shows current accelerator (editable).
- Record button captures next key combo and normalizes to Electron accelerator format.
- Save applies via IPC and updates the current value.
- Reset restores default.
- Inline helper text shows default and platform mapping.

## Error Handling
- `set-global-hotkey` validates by attempting `globalShortcut.register`.
- If registration fails (already in use), return an error and keep the previous shortcut.
- If persistence fails, return an error so the UI can display "not saved" state.

## Testing
- Unit tests for hotkey helper logic (toggle behavior, registration failure handling) using injected interfaces.
- UI test for Settings dialog section rendering and error message display on failure.

## Risks / Notes
- Some accelerators are reserved by OS; failure should be surfaced clearly.
- Global shortcuts do not work on some Linux desktop environments if blocked by WM.
