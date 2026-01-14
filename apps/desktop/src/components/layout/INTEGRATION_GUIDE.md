# ThreePanelLayout Integration Guide

This guide shows how to integrate the ThreePanelLayout component into your existing OpenWork desktop app.

## Quick Start: Refactor WorkingView

The current `WorkingView.tsx` has a hardcoded three-panel layout. Here's how to refactor it to use `ThreePanelLayout`:

### Before (Current Implementation)

```tsx
// WorkingView.tsx - Current structure
<div className="h-full flex bg-cream-100">
  {/* LEFT PANEL - Chat/Response */}
  <div className="w-80 flex flex-col border-r border-cream-300/60 bg-white">
    {/* ... chat content ... */}
  </div>

  {/* CENTER PANEL - Artifact Preview */}
  <div className="flex-1 flex flex-col">
    {/* ... preview content ... */}
  </div>

  {/* RIGHT PANEL - Progress/Artifacts/Context */}
  <div className="w-72 border-l border-cream-300/60 bg-white overflow-y-auto">
    {/* ... sidebar content ... */}
  </div>
</div>
```

### After (Using ThreePanelLayout)

```tsx
import { ThreePanelLayout } from './layout';
import { MessageSquare, Sidebar, Plus } from 'lucide-react';

export function WorkingView() {
  // ... existing state and logic ...

  return (
    <ThreePanelLayout
      // LEFT PANEL - Chat
      leftPanel={<ChatPanel />}
      leftTitle="Chat"
      leftIcon={<MessageSquare className="w-4 h-4" />}

      // CENTER PANEL - Preview
      centerPanel={<PreviewPanel />}

      // RIGHT PANEL - Context
      rightPanel={<ContextSidebar />}
      rightTitle="Context"
      rightIcon={<Sidebar className="w-4 h-4" />}

      // Configuration
      layoutId="working-view"
      defaultLeftCollapsed={false}
      defaultRightCollapsed={false}
    />
  );
}

// Extract panels into separate components for clarity
function ChatPanel() {
  const { messages, replyInput, setReplyInput, handleReply, handleBack, isExecuting } = useStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-cream-200/60 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-ink-200" />
        </button>
        <button className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-ink-300" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ... message rendering ... */}
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-cream-200/60">
        {/* ... input UI ... */}
      </div>
    </div>
  );
}

function PreviewPanel() {
  const { activeArtifact, workingDirectory } = useStore();

  return (
    <div className="flex-1 flex flex-col">
      {activeArtifact ? (
        <>
          <div className="h-12 px-4 flex items-center justify-between border-b border-cream-200/60 bg-white">
            {/* ... preview header ... */}
          </div>
          <div className="flex-1 p-6 overflow-auto">
            {/* ... preview content ... */}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-200">
          <p className="text-sm">Select an artifact to preview</p>
        </div>
      )}
    </div>
  );
}

function ContextSidebar() {
  const {
    progressSteps,
    artifacts,
    contextFiles,
    activeArtifactId,
    setActiveArtifactId,
  } = useStore();

  const [expandedSections, setExpandedSections] = useState({
    progress: true,
    artifacts: true,
    context: true,
  });

  return (
    <div className="h-full overflow-y-auto">
      {/* Progress Section */}
      <ProgressSection
        steps={progressSteps}
        expanded={expandedSections.progress}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, progress: !prev.progress }))}
      />

      {/* Artifacts Section */}
      <ArtifactsSection
        artifacts={artifacts}
        activeId={activeArtifactId}
        onSelect={setActiveArtifactId}
        expanded={expandedSections.artifacts}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, artifacts: !prev.artifacts }))}
      />

      {/* Context Section */}
      <ContextSection
        files={contextFiles}
        expanded={expandedSections.context}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, context: !prev.context }))}
      />
    </div>
  );
}
```

## Benefits of This Refactor

1. **Keyboard Shortcuts**: Users can now press `[` and `]` to toggle panels
2. **Collapsible Panels**: More screen space when needed
3. **State Persistence**: Panel collapse state saves to localStorage
4. **Responsive**: Automatic adaptation for tablet/mobile
5. **Accessibility**: Built-in ARIA labels and screen reader support
6. **Cleaner Code**: Separation of concerns between layout and content

## Migration Steps

### Step 1: Install Dependencies (if needed)

```bash
npm install framer-motion lucide-react
```

### Step 2: Update WorkingView.tsx

Replace the existing three-panel structure with the `ThreePanelLayout` component.

### Step 3: Extract Panel Components

Move each panel's content into separate components (`ChatPanel`, `PreviewPanel`, `ContextSidebar`) for better organization.

### Step 4: Test Keyboard Shortcuts

- Press `[` to toggle left panel (Chat)
- Press `]` to toggle right panel (Context)

### Step 5: Test Responsive Behavior

- Resize window to tablet size (768-1024px) - right panel should auto-collapse
- Resize to mobile (<768px) - should show tab navigation

## Advanced Customization

### Custom Panel Widths

If you need different panel widths, you can modify the component or wrap it with custom styles:

```tsx
<div className="custom-layout-wrapper">
  <style>{`
    .custom-layout-wrapper [style*="width: 280px"] {
      width: 320px !important; /* Wider left panel */
    }
  `}</style>
  <ThreePanelLayout ... />
</div>
```

### Conditional Panel Rendering

Hide panels based on app state:

```tsx
<ThreePanelLayout
  leftPanel={showChat ? <ChatPanel /> : undefined}
  centerPanel={<PreviewPanel />}
  rightPanel={showContext ? <ContextSidebar /> : undefined}
/>
```

### Custom Collapse Handlers

Track analytics or trigger side effects:

```tsx
<ThreePanelLayout
  onLeftCollapseChange={(collapsed) => {
    analytics.track('panel_toggled', {
      panel: 'chat',
      collapsed,
    });
  }}
  onRightCollapseChange={(collapsed) => {
    // Save to user preferences
    saveUserPreference('context_panel_collapsed', collapsed);
  }}
/>
```

## Compatibility Notes

- **Framer Motion**: Required for smooth animations
- **Lucide React**: For icons (already used in the app)
- **Tailwind CSS**: Uses your existing theme colors
- **TypeScript**: Fully typed component
- **React 18+**: Uses modern hooks (useState, useEffect)

## Performance Tips

1. **Memoize Heavy Components**: Wrap expensive panels with `React.memo()`
2. **Lazy Load**: Use `React.lazy()` for panels not immediately visible
3. **Virtual Lists**: Use react-window for long lists in panels
4. **Debounce Callbacks**: Debounce collapse handlers if they're expensive

```tsx
import { memo } from 'react';

const ChatPanel = memo(function ChatPanel() {
  // ... expensive chat rendering ...
});

<ThreePanelLayout
  leftPanel={<ChatPanel />}
  // ...
/>
```

## Testing

Add tests for your refactored components:

```tsx
import { render, screen } from '@testing-library/react';
import { WorkingView } from './WorkingView';

it('renders three-panel layout', () => {
  render(<WorkingView />);

  expect(screen.getByText('Chat')).toBeInTheDocument();
  expect(screen.getByText('Context')).toBeInTheDocument();
  // Center panel content
  expect(screen.getByText('Select an artifact to preview')).toBeInTheDocument();
});
```

## Troubleshooting

### Panels not appearing

Check that you're passing content to the panel props:

```tsx
// ❌ Wrong - passing undefined
leftPanel={undefined}

// ✅ Correct - passing actual content
leftPanel={<div>Chat content</div>}
```

### Keyboard shortcuts not working

Ensure you're not inside an input field when pressing the keys. Shortcuts are intentionally disabled in form fields.

### Layout breaking on resize

Make sure your center panel has enough min-width (400px default). Adjust if needed:

```css
.center-panel-wrapper {
  min-width: 600px; /* Custom minimum */
}
```

## Next Steps

1. Implement the refactor in `WorkingView.tsx`
2. Test keyboard shortcuts and responsiveness
3. Consider adding resize handles (future enhancement)
4. Add analytics to track panel usage
5. Gather user feedback on the collapsible behavior

---

**Questions?** Check the main [README.md](./README.md) for full API documentation.
