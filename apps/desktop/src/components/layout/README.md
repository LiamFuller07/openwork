# ThreePanelLayout Component

A flexible, accessible three-panel layout component with collapsible sidebars, keyboard shortcuts, and responsive design.

## Features

- **Collapsible Panels**: Smooth animations for left and right panel collapse
- **Keyboard Shortcuts**: `[` for left panel, `]` for right panel
- **State Persistence**: Collapse state saved to localStorage
- **Responsive Design**: Adapts to desktop, tablet, and mobile viewports
- **Full Accessibility**: ARIA labels, screen reader support, keyboard navigation
- **Performance Optimized**: GPU-accelerated animations, minimal re-renders

## Installation

```tsx
import { ThreePanelLayout } from '@/components/layout';
```

## Basic Usage

```tsx
import { MessageSquare, Sidebar } from 'lucide-react';
import { ThreePanelLayout } from '@/components/layout';

function App() {
  return (
    <ThreePanelLayout
      leftPanel={<ChatPanel />}
      centerPanel={<PreviewPanel />}
      rightPanel={<ContextPanel />}
      leftTitle="Chat"
      rightTitle="Context"
      leftIcon={<MessageSquare className="w-4 h-4" />}
      rightIcon={<Sidebar className="w-4 h-4" />}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `centerPanel` | `ReactNode` | Yes | - | Main content area (always visible) |
| `leftPanel` | `ReactNode` | No | - | Left sidebar content |
| `rightPanel` | `ReactNode` | No | - | Right sidebar content |
| `leftTitle` | `string` | No | - | Title for left panel header |
| `rightTitle` | `string` | No | - | Title for right panel header |
| `leftIcon` | `ReactNode` | No | - | Icon for left panel header |
| `rightIcon` | `ReactNode` | No | - | Icon for right panel header |
| `defaultLeftCollapsed` | `boolean` | No | `false` | Initial collapse state for left panel |
| `defaultRightCollapsed` | `boolean` | No | `false` | Initial collapse state for right panel |
| `onLeftCollapseChange` | `(collapsed: boolean) => void` | No | - | Callback when left panel collapse state changes |
| `onRightCollapseChange` | `(collapsed: boolean) => void` | No | - | Callback when right panel collapse state changes |
| `layoutId` | `string` | No | `'default'` | Unique ID for localStorage persistence |

## Panel Specifications

| Panel | Default Width | Collapsed Width | Min Width | Max Width |
|-------|---------------|-----------------|-----------|-----------|
| Left | 280px | 48px | 240px | 400px |
| Center | 1fr (flexible) | - | 400px | - |
| Right | 360px | 48px | 280px | 440px |

## Keyboard Shortcuts

- **`[`** - Toggle left panel collapse/expand
- **`]`** - Toggle right panel collapse/expand

Shortcuts are disabled when focus is in:
- `<input>` elements
- `<textarea>` elements
- `contenteditable` elements

## Responsive Behavior

### Desktop (>1024px)
All three panels are visible. Users can collapse/expand sidebars.

### Tablet (768-1024px)
Left and center panels visible. Right panel auto-collapses by default.

### Mobile (<768px)
Single panel view with tab navigation to switch between panels.

## State Persistence

Collapse state is automatically saved to localStorage with the following keys:

```
threePanelLayout-{layoutId}-left
threePanelLayout-{layoutId}-right
```

To use different layouts on the same page:

```tsx
<ThreePanelLayout layoutId="workspace-1" ... />
<ThreePanelLayout layoutId="workspace-2" ... />
```

## Accessibility

### ARIA Attributes
- `aria-expanded` on collapse buttons
- `aria-label` with keyboard shortcut hints
- `role="status"` for screen reader announcements

### Keyboard Navigation
- Full keyboard support (Tab, Shift+Tab)
- Focus indicators on interactive elements
- Skip keyboard shortcuts in form fields

### Screen Readers
- Collapse state changes are announced
- Panel titles are properly labeled
- Semantic HTML structure

## Animation Details

- **Duration**: 300ms
- **Easing**: Cubic bezier (0.4, 0, 0.2, 1)
- **Properties**: Width (GPU-accelerated)
- **Fade**: Content fades during collapse (200ms delay)

## Examples

### Minimal Setup (Center Only)

```tsx
<ThreePanelLayout
  centerPanel={<MainContent />}
/>
```

### With Collapse Callbacks

```tsx
function App() {
  const handleLeftCollapse = (collapsed: boolean) => {
    console.log('Left panel:', collapsed ? 'collapsed' : 'expanded');
  };

  return (
    <ThreePanelLayout
      leftPanel={<Sidebar />}
      centerPanel={<Main />}
      onLeftCollapseChange={handleLeftCollapse}
    />
  );
}
```

### Pre-collapsed Panels

```tsx
<ThreePanelLayout
  leftPanel={<Chat />}
  centerPanel={<Preview />}
  rightPanel={<Context />}
  defaultLeftCollapsed={false}
  defaultRightCollapsed={true} // Start with right panel collapsed
/>
```

### Custom Icons and Titles

```tsx
import { MessageCircle, FileCode, Settings } from 'lucide-react';

<ThreePanelLayout
  leftPanel={<ConversationPanel />}
  leftTitle="Conversations"
  leftIcon={<MessageCircle className="w-4 h-4" />}

  centerPanel={<CodeEditor />}

  rightPanel={<SettingsPanel />}
  rightTitle="Settings"
  rightIcon={<Settings className="w-4 h-4" />}
/>
```

## Performance Tips

1. **Memoize Panel Content**: Use `React.memo()` for expensive panels
2. **Lazy Load**: Use `React.lazy()` for heavy panel components
3. **Virtualize Lists**: Use react-window for long lists in panels
4. **Debounce Handlers**: Debounce collapse callbacks if doing expensive operations

```tsx
import { memo, lazy, Suspense } from 'react';

const HeavyPanel = lazy(() => import('./HeavyPanel'));
const MemoizedChat = memo(ChatPanel);

<ThreePanelLayout
  leftPanel={<MemoizedChat />}
  centerPanel={
    <Suspense fallback={<Loading />}>
      <HeavyPanel />
    </Suspense>
  }
/>
```

## Styling Customization

The component uses Tailwind classes from your project's theme:

- `bg-cream-100` - Background color
- `border-cream-300/60` - Panel borders
- `text-ink-400` - Primary text
- `text-ink-200` - Secondary text
- `hover:bg-cream-100` - Hover states

To customize, update your Tailwind config or wrap in a custom container with theme overrides.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern mobile browsers

Uses CSS transforms and Framer Motion for animations (no legacy support).

## Testing

Run the test suite:

```bash
npm test ThreePanelLayout.test.tsx
```

Test coverage includes:
- Panel rendering
- Collapse/expand functionality
- Keyboard shortcuts
- localStorage persistence
- Accessibility (ARIA)

## Troubleshooting

### Panels not collapsing smoothly

Ensure Framer Motion is installed:
```bash
npm install framer-motion
```

### Keyboard shortcuts not working

Check if focus is in an input field. Shortcuts are intentionally disabled in form elements.

### LocalStorage not persisting

Verify `layoutId` prop is stable across renders. Don't use random or dynamic IDs.

### Mobile view not showing tabs

The mobile view renders at <768px viewport width. Check your viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

## Changelog

### v1.0.0 (2026-01-13)
- Initial release
- Three-panel layout with collapsible sidebars
- Keyboard shortcuts ([, ])
- localStorage persistence
- Responsive design
- Full accessibility support
