# ThreePanelLayout Architecture

Visual diagrams and technical architecture for the ThreePanelLayout component.

---

## Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     ThreePanelLayout                            │
│                                                                 │
│  ┌────────────┬──────────────────────┬────────────────────┐    │
│  │            │                      │                    │    │
│  │   Left     │       Center         │       Right        │    │
│  │   Panel    │       Panel          │       Panel        │    │
│  │            │                      │                    │    │
│  │  ┌──────┐  │                      │  ┌──────────────┐  │    │
│  │  │Icon  │  │                      │  │Toggle Button │  │    │
│  │  │Title │  │                      │  │Title    Icon │  │    │
│  │  │Toggle│  │                      │  └──────────────┘  │    │
│  │  └──────┘  │                      │                    │    │
│  │            │                      │                    │    │
│  │  Content   │      Main Content    │     Sidebar        │    │
│  │  (Chat)    │      (Preview)       │     (Context)      │    │
│  │            │                      │                    │    │
│  │  280px     │         1fr          │      360px         │    │
│  │  (default) │      (flexible)      │    (default)       │    │
│  │            │                      │                    │    │
│  │  Collapses │    Always visible    │    Collapses       │    │
│  │  to 48px   │                      │    to 48px         │    │
│  │            │                      │                    │    │
│  └────────────┴──────────────────────┴────────────────────┘    │
│                                                                 │
│  Keyboard: [  for left    ]  for right                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Interaction                          │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ├─► Click Toggle Button
               │
               ├─► Press [ key (left)
               │
               └─► Press ] key (right)
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      State Management                            │
│                                                                  │
│  useState(leftCollapsed)  ◄──┐                                  │
│  useState(rightCollapsed) ◄──┼──► localStorage                  │
│                              │                                  │
│  useEffect(() => {           │                                  │
│    localStorage.setItem(...) ├──► Persist state                 │
│    onCollapseChange(...)    ─┼──► Notify parent                 │
│  })                          │                                  │
│                              │                                  │
│  Framer Motion animate={...} ├──► Trigger animation             │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Visual Update                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ motion.div                                              │    │
│  │   animate={{ width: collapsed ? 48 : 280 }}            │    │
│  │   transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ AnimatePresence                                         │    │
│  │   Content fades in/out (200ms delay)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Screen Reader Announcement                              │    │
│  │   role="status" aria-live="polite"                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop View (>1024px)

```
┌────────────┬──────────────────────┬────────────────┐
│   280px    │         1fr          │     360px      │
│            │                      │                │
│   Left     │       Center         │     Right      │
│   Panel    │       Panel          │     Panel      │
│            │                      │                │
│ Expanded   │    Always visible    │   Expanded     │
│            │                      │                │
│ ◄── 48px   │                      │   48px ──►     │
│ (collapsed)│                      │ (collapsed)    │
└────────────┴──────────────────────┴────────────────┘
```

### Tablet View (768-1024px)

```
┌────────────┬──────────────────────┬────┐
│   280px    │         1fr          │48px│
│            │                      │    │
│   Left     │       Center         │ R  │
│   Panel    │       Panel          │ i  │
│            │                      │ g  │
│ Expanded   │    Always visible    │ h  │
│            │                      │ t  │
│            │                      │    │
│            │                      │Auto│
│            │                      │Coll│
└────────────┴──────────────────────┴────┘
```

### Mobile View (<768px)

```
┌──────────────────────────────────────┐
│  Tabs: [ Left | Center | Right ]    │
├──────────────────────────────────────┤
│                                      │
│                                      │
│         Active Panel Content         │
│         (Full Width)                 │
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

---

## Component Hierarchy

```
ThreePanelLayout
│
├── Responsive Detection
│   ├── isMobile (useState)
│   └── isTablet (useState)
│
├── State Management
│   ├── leftCollapsed (useState + localStorage)
│   ├── rightCollapsed (useState + localStorage)
│   └── useEffect (persistence + callbacks)
│
├── Event Handlers
│   ├── Keyboard listener ([ and ])
│   ├── Toggle button handlers
│   └── Screen reader announcer
│
├── Left Panel (optional)
│   ├── motion.div (width animation)
│   ├── Header
│   │   ├── Icon + Title (AnimatePresence)
│   │   └── Toggle Button (ChevronLeft/Right)
│   └── Content (AnimatePresence)
│       ├── Expanded: Full content
│       └── Collapsed: Icon only
│
├── Center Panel (required)
│   └── Content (always visible)
│
├── Right Panel (optional)
│   ├── motion.div (width animation)
│   ├── Header
│   │   ├── Toggle Button (ChevronLeft/Right)
│   │   └── Icon + Title (AnimatePresence)
│   └── Content (AnimatePresence)
│       ├── Expanded: Full content
│       └── Collapsed: Icon only
│
└── Screen Reader Region
    └── <div role="status" aria-live="polite" />
```

---

## Animation Timeline

### Panel Collapse Animation (300ms total)

```
Time    │ Width          │ Content Opacity │ Event
────────┼────────────────┼─────────────────┼─────────────────────
0ms     │ 280px          │ 1.0             │ User clicks toggle
        │ ▼              │ ▼               │
50ms    │ 230px          │ 0.7             │ Content fading out
100ms   │ 180px          │ 0.3             │ Width shrinking
150ms   │ 120px          │ 0.0             │ Content hidden
        │ (AnimatePresence exit complete)  │
200ms   │ 80px           │ -               │ Width continuing
250ms   │ 60px           │ -               │
300ms   │ 48px           │ -               │ Animation complete
        │ (AnimatePresence enter starts)   │
350ms   │ 48px           │ 0.3             │ Icon fading in
400ms   │ 48px           │ 0.7             │
450ms   │ 48px           │ 1.0             │ Icon fully visible
```

### Panel Expand Animation (300ms total)

```
Time    │ Width          │ Content Opacity │ Event
────────┼────────────────┼─────────────────┼─────────────────────
0ms     │ 48px           │ Icon: 1.0       │ User clicks toggle
        │ ▼              │ Icon ▼          │
50ms    │ 48px           │ Icon: 0.7       │ Icon fading out
100ms   │ 48px           │ Icon: 0.0       │ Icon hidden
        │ (AnimatePresence exit complete)  │
150ms   │ 100px          │ -               │ Width expanding
200ms   │ 170px          │ -               │
250ms   │ 240px          │ -               │
300ms   │ 280px          │ -               │ Width complete
        │ (AnimatePresence enter starts)   │
350ms   │ 280px          │ 0.3             │ Content fading in
400ms   │ 280px          │ 0.7             │
450ms   │ 280px          │ 1.0             │ Content fully visible
```

---

## Data Flow

### localStorage Persistence

```
┌──────────────────────────────────────────────────────────────┐
│  Component Mount                                             │
│  ────────────────────────────────────────────────────────    │
│                                                              │
│  1. Check localStorage                                       │
│     Key: "threePanelLayout-{layoutId}-left"                  │
│     Key: "threePanelLayout-{layoutId}-right"                 │
│                                                              │
│  2. Initialize state                                         │
│     const [leftCollapsed, set] = useState(() => {            │
│       stored || defaultLeftCollapsed                         │
│     });                                                      │
│                                                              │
│  3. On state change                                          │
│     useEffect(() => {                                        │
│       localStorage.setItem(key, collapsed)                   │
│       onCollapseChange?.(collapsed)                          │
│     }, [collapsed]);                                         │
└──────────────────────────────────────────────────────────────┘

Example localStorage state:
{
  "threePanelLayout-working-view-left": "false",
  "threePanelLayout-working-view-right": "true",
  "threePanelLayout-settings-left": "true",
  "threePanelLayout-settings-right": "false"
}
```

### Keyboard Event Flow

```
Window Keydown Event
        │
        ▼
    Is target an input/textarea?
    ┌───Yes───► Ignore (return early)
    │
   No
    │
    ▼
Is key '[' or ']'?
    │
    ├─► '[' ──► Toggle leftCollapsed
    │           │
    │           ▼
    │       Announce to screen reader
    │       "Left panel collapsed/expanded"
    │
    └─► ']' ──► Toggle rightCollapsed
                │
                ▼
            Announce to screen reader
            "Right panel collapsed/expanded"
```

---

## Performance Considerations

### Render Optimization

```typescript
// ✅ Optimized - Panel content memoized
const MemoizedChatPanel = memo(ChatPanel);

<ThreePanelLayout
  leftPanel={<MemoizedChatPanel />}
  // ...
/>

// ✅ Optimized - Lazy loaded
const HeavyPanel = lazy(() => import('./HeavyPanel'));

<ThreePanelLayout
  rightPanel={
    <Suspense fallback={<Spinner />}>
      <HeavyPanel />
    </Suspense>
  }
/>

// ❌ Unoptimized - Re-creates on every render
<ThreePanelLayout
  leftPanel={<div>New component every render</div>}
/>
```

### Animation Performance

- Uses CSS transforms (GPU-accelerated)
- Framer Motion optimizes for 60fps
- Width changes trigger reflow (can't avoid)
- Content fade uses opacity (GPU-accelerated)

### Memory Management

- localStorage is lightweight (< 1KB per layout)
- Event listeners cleaned up in useEffect return
- No memory leaks from refs
- AnimatePresence properly unmounts

---

## Accessibility Architecture

### ARIA Landmarks

```html
<div role="complementary" aria-label="Chat panel">
  <!-- Left panel content -->
</div>

<main role="main">
  <!-- Center panel content -->
</main>

<aside role="complementary" aria-label="Context sidebar">
  <!-- Right panel content -->
</aside>
```

### Screen Reader Flow

1. User navigates to toggle button
2. Screen reader announces: "Collapse Chat panel, button, Keyboard shortcut: ["
3. User presses button or keyboard shortcut
4. Panel animates closed
5. Screen reader announces: "Chat panel collapsed" (via live region)
6. Focus remains on toggle button (now shows "Expand")

---

## Edge Cases Handled

1. **Missing Panels**: Component works with only centerPanel
2. **localStorage Unavailable**: Falls back to defaultCollapsed props
3. **Rapid Toggling**: Framer Motion queues animations smoothly
4. **Keyboard in Input**: Shortcuts disabled, doesn't interfere with typing
5. **Mobile Resize**: Detects breakpoint changes, auto-adjusts
6. **Content Overflow**: Each panel has overflow-y-auto
7. **Focus Management**: Toggle buttons maintain focus after click
8. **Reduced Motion**: Respects prefers-reduced-motion (via Framer Motion)

---

## Type Safety

```typescript
// Full TypeScript coverage
interface ThreePanelLayoutProps {
  leftPanel?: ReactNode;
  centerPanel: ReactNode; // Required
  rightPanel?: ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  defaultLeftCollapsed?: boolean;
  defaultRightCollapsed?: boolean;
  onLeftCollapseChange?: (collapsed: boolean) => void;
  onRightCollapseChange?: (collapsed: boolean) => void;
  layoutId?: string;
}

// Usage TypeScript validation
<ThreePanelLayout
  // ✅ Valid - centerPanel is required
  centerPanel={<div>Content</div>}

  // ✅ Valid - optional panels
  leftPanel={<div>Left</div>}

  // ✅ Valid - typed callback
  onLeftCollapseChange={(collapsed: boolean) => {
    console.log(collapsed);
  }}

  // ❌ Error - centerPanel is required
  leftPanel={<div>Only left</div>}
/>
```

---

## Browser Compatibility Matrix

| Browser        | Version | Support | Notes                          |
|----------------|---------|---------|--------------------------------|
| Chrome         | 90+     | ✅ Full  | Recommended                    |
| Edge           | 90+     | ✅ Full  | Chromium-based                 |
| Firefox        | 88+     | ✅ Full  | Tested                         |
| Safari         | 14+     | ✅ Full  | Webkit prefix handled          |
| Safari iOS     | 14+     | ✅ Full  | Touch events work              |
| Chrome Android | 90+     | ✅ Full  | Mobile responsive              |
| IE 11          | -       | ❌ None  | Not supported (no polyfills)   |

**Required Browser Features**:
- CSS Grid
- CSS Flexbox
- localStorage
- ES6+ (let/const, arrow functions)
- React 18 hooks
- Framer Motion animation engine

---

This architecture ensures a robust, performant, and accessible three-panel layout component.
