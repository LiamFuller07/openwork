import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder, Plus, ArrowRight } from 'lucide-react';
import { useStore } from '../../store';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  workingDirectory: string | null;
}

export function ChatInput({ value, onChange, onSubmit, workingDirectory }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setWorkingDirectory } = useStore();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSelectFolder = async () => {
    try {
      const dir = await window.openwork?.selectDirectory();
      if (dir) {
        setWorkingDirectory(dir);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      // Could show toast notification here in future
    }
  };

  const folderName = workingDirectory
    ? workingDirectory.split('/').pop() || workingDirectory
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-cream-300/80 p-5 shadow-sm"
    >
      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Summarize my meetings from this week and find action items. Where do you think I can be more efficient?"
        className="w-full resize-none bg-transparent text-ink-400 placeholder:text-ink-100
                   text-base leading-relaxed focus:outline-none min-h-[60px]"
        rows={2}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-200">
        {/* Left side - folder selector and add button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectFolder}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cream-300/60
                       hover:bg-cream-100 hover:border-cream-400/60 transition-all text-sm"
          >
            <Folder className="w-4 h-4 text-ink-200" />
            <span className="text-ink-300">
              {folderName || 'Work in a folder'}
            </span>
          </button>

          <button
            className="p-2 rounded-lg border border-cream-300/60
                       hover:bg-cream-100 hover:border-cream-400/60 transition-all"
            title="Add context"
          >
            <Plus className="w-4 h-4 text-ink-200" />
          </button>
        </div>

        {/* Right side - submit button */}
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                     bg-terracotta-500 hover:bg-terracotta-600
                     disabled:bg-cream-400 disabled:cursor-not-allowed
                     transition-colors text-white font-medium"
        >
          Let's go
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
