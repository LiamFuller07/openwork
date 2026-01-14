import { Settings } from 'lucide-react';

interface TitleBarProps {
  onSettingsClick: () => void;
}

export function TitleBar({ onSettingsClick }: TitleBarProps) {
  return (
    <div className="h-12 flex items-center justify-between px-4 drag-region border-b border-cream-300/50">
      {/* macOS traffic lights space */}
      <div className="w-20" />

      {/* App title */}
      <div className="flex items-center gap-2">
        <span className="text-ink-300 font-medium">OpenWork</span>
      </div>

      {/* Settings button */}
      <div className="w-20 flex justify-end no-drag">
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-cream-300/50 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-ink-200" />
        </button>
      </div>
    </div>
  );
}
