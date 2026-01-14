# Manual Testing Guide

Quick reference for testing OpenWork locally.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start the app
pnpm dev:desktop

# 3. App opens at localhost:5174 (also in Electron window)
```

## Test Checklist

### Home View
- [ ] App launches without errors
- [ ] Quick action cards are visible (6 cards)
- [ ] "Work in a folder" button works
- [ ] Text input accepts text
- [ ] "Let's go" button submits task

### Working View
- [ ] Task appears as user message
- [ ] Placeholder assistant message shows
- [ ] Back arrow returns to home
- [ ] New task clears previous messages

### Settings
- [ ] Gear icon opens settings dialog
- [ ] Provider dropdown works (Claude, GPT, Local)
- [ ] Model dropdown updates per provider
- [ ] API key input saves
- [ ] Close button works

### Styling
- [ ] Dark theme renders correctly
- [ ] No white/unstyled elements
- [ ] Fonts load properly
- [ ] Icons display

---

## What's Working vs Placeholder

| Feature | Status |
|---------|--------|
| Navigation (Home ↔ Working) | ✅ Works |
| Task input & submission | ✅ Works |
| Provider/model selection | ✅ Works |
| API key storage | ✅ Works |
| Chat message display | ✅ Works |
| AI responses | ⏳ Placeholder (not connected) |
| Progress steps | ⏳ UI ready, needs orchestrator |
| Clarification cards | ⏳ UI ready, needs orchestrator |
| Artifacts display | ⏳ UI ready, needs orchestrator |
| Context sidebar | ⏳ UI ready, needs orchestrator |

---

## Expected AI Behavior (When Connected)

When the orchestrator is connected, the AI will:

1. **Receive the task** and analyze it
2. **Ask clarifying questions** if needed (shows as cards)
3. **Present a plan** with numbered steps
4. **Wait for approval** before executing
5. **Show progress** as each step completes
6. **Create artifacts** (files, documents) as output

### JSON Formats the AI Uses

**Clarification:**
```json
{"type": "clarification", "question": "...", "options": [...]}
```

**Plan:**
```json
{"type": "plan", "title": "...", "steps": [...]}
```

**Progress:**
```json
{"type": "progress", "stepId": "...", "status": "completed"}
```

**Artifact:**
```json
{"type": "artifact", "artifact": {"name": "...", "path": "..."}}
```

---

## Debugging

### Check Console
```bash
# In browser dev tools (F12 or Cmd+Option+I)
# Look for errors in Console tab
```

### Check Network
If API calls fail, check:
1. API key is entered correctly
2. Provider is selected
3. Network is available

### Reset State
If the app gets stuck:
1. Refresh the page (Cmd+R)
2. Or restart: `pnpm dev:desktop`

---

## File Locations

| File | Purpose |
|------|---------|
| `apps/desktop/src/App.tsx` | Main app router |
| `apps/desktop/src/store.ts` | Zustand state management |
| `apps/desktop/src/components/HomeView.tsx` | Home screen |
| `apps/desktop/src/components/WorkingView.tsx` | Task execution view |
| `apps/desktop/src/components/SettingsDialog.tsx` | Settings modal |
| `packages/core/src/orchestrator.ts` | AI orchestration (not connected yet) |

---

## Running Tests

```bash
# Unit tests
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Build check
pnpm build
```
