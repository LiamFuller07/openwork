import { Settings } from 'lucide-react';
import { ReactNode } from 'react';

interface TitleBarProps {
  onSettingsClick: () => void;
  children?: ReactNode;
}

/**
 * TitleBar Component
 *
 * macOS-style title bar with:
 * - Traffic lights space (left)
 * - App title (center)
 * - Settings + theme controls (right)
 *
 * Props:
 * - onSettingsClick: Handler for settings button
 * - children: Optional content (e.g. ThemeToggle)
 */
export function TitleBar({ onSettingsClick, children }: TitleBarProps) {
  return (
    <div className="h-12 flex items-center justify-between px-4 drag-region border-b border-[var(--border-default)]">
      {/* macOS traffic lights space */}
      <div className="w-20" />

      {/* App title */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--fg-default)] font-medium">OpenWork</span>
      </div>

      {/* Settings button + theme controls */}
      <div className="w-auto flex items-center gap-2 no-drag">
        {children}
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-[var(--fg-muted)]" />
        </button>
      </div>
    </div>
  );
}
