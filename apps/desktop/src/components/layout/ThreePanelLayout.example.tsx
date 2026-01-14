import { MessageSquare, FileText, Sidebar } from 'lucide-react';
import { ThreePanelLayout } from './ThreePanelLayout';

/**
 * Example usage of ThreePanelLayout
 *
 * This demonstrates the three-panel layout with:
 * - Chat panel on the left
 * - Preview panel in the center
 * - Context/sidebar panel on the right
 */

export function ThreePanelLayoutExample() {
  return (
    <div className="h-screen">
      <ThreePanelLayout
        // Left panel: Chat/Messages
        leftPanel={
          <div className="p-4 space-y-4">
            <div className="text-sm text-ink-300">
              <p className="font-medium mb-2">Chat Messages</p>
              <div className="space-y-3">
                <div className="bg-cream-50 p-3 rounded-lg">
                  <p className="text-ink-400 text-sm">
                    Create a standup deck for this week
                  </p>
                </div>
                <div className="text-ink-300 text-sm">
                  <p>
                    Sure! I'll create a standup deck. Let me pull the key
                    highlights from this week...
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        leftTitle="Chat"
        leftIcon={<MessageSquare className="w-4 h-4" />}
        defaultLeftCollapsed={false}
        onLeftCollapseChange={(collapsed) => {
          console.log('Left panel collapsed:', collapsed);
        }}
        // Center panel: Main content/preview
        centerPanel={
          <div className="h-full flex flex-col">
            <div className="h-12 px-4 border-b border-cream-200/60 bg-white flex items-center">
              <span className="text-sm font-medium text-ink-400">
                Preview: Team Standup Deck
              </span>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              {/* Preview content */}
              <div className="bg-slate-800 rounded-2xl p-12 text-center shadow-lg">
                <h1 className="text-4xl font-semibold text-white mb-4">
                  Product Team Standup
                </h1>
                <p className="text-slate-400 uppercase tracking-widest text-sm">
                  Week of January 13-17
                </p>
                <p className="text-pink-400 mt-8 text-sm">
                  Acme Product Team
                </p>
              </div>
            </div>
          </div>
        }
        // Right panel: Context/Sidebar
        rightPanel={
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-ink-300 uppercase tracking-wider mb-2">
                Progress
              </p>
              <div className="space-y-2 text-sm text-ink-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Read meeting notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Extract highlights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-terracotta-500 rounded-full animate-pulse-soft" />
                  <span>Build presentation</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-ink-300 uppercase tracking-wider mb-2">
                Artifacts
              </p>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-50 transition-colors text-left">
                  <FileText className="w-4 h-4 text-ink-200" />
                  <span className="text-sm text-ink-400">
                    standup-deck.pptx
                  </span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-ink-300 uppercase tracking-wider mb-2">
                Context
              </p>
              <div className="space-y-1 text-sm text-ink-300">
                <div className="flex items-center gap-2 px-3 py-2">
                  <FileText className="w-4 h-4 text-ink-200" />
                  <span>meeting-notes.md</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <FileText className="w-4 h-4 text-ink-200" />
                  <span>calendar-events.json</span>
                </div>
              </div>
            </div>
          </div>
        }
        rightTitle="Context"
        rightIcon={<Sidebar className="w-4 h-4" />}
        defaultRightCollapsed={false}
        onRightCollapseChange={(collapsed) => {
          console.log('Right panel collapsed:', collapsed);
        }}
        // Unique ID for localStorage
        layoutId="main-workspace"
      />
    </div>
  );
}

/**
 * USAGE NOTES:
 *
 * 1. Keyboard Shortcuts:
 *    - Press '[' to toggle left panel
 *    - Press ']' to toggle right panel
 *
 * 2. State Persistence:
 *    - Collapse state is saved to localStorage
 *    - Key format: threePanelLayout-{layoutId}-{left|right}
 *
 * 3. Responsive Behavior:
 *    - Desktop (>1024px): All three panels visible
 *    - Tablet (768-1024px): Left + center, right auto-collapsed
 *    - Mobile (<768px): Tab navigation between panels
 *
 * 4. Optional Panels:
 *    - Both leftPanel and rightPanel are optional
 *    - Only centerPanel is required
 *
 * 5. Customization:
 *    - Use onLeftCollapseChange/onRightCollapseChange for custom behavior
 *    - Set defaultLeftCollapsed/defaultRightCollapsed for initial state
 *    - Provide icons and titles for better UX
 */
