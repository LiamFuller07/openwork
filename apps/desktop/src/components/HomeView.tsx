import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  BarChart3,
  Layout,
  Sunrise,
  FolderOpen,
  MessageSquare,
  Folder,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../store';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

/**
 * Quick action configuration
 */
const QUICK_ACTIONS = [
  {
    id: 'create-file',
    label: 'Create a file',
    icon: FileSpreadsheet,
  },
  {
    id: 'crunch-data',
    label: 'Crunch data',
    icon: BarChart3,
  },
  {
    id: 'make-prototype',
    label: 'Make a prototype',
    icon: Layout,
  },
  {
    id: 'prep-day',
    label: 'Prep for the day',
    icon: Sunrise,
  },
  {
    id: 'organize-files',
    label: 'Organize files',
    icon: FolderOpen,
  },
  {
    id: 'send-message',
    label: 'Send a message',
    icon: MessageSquare,
  },
];

/**
 * HomeView - Ultra-Minimal Design System Migration
 *
 * Key Design System Principles:
 * - ONE accent element per view (the main CTA button)
 * - Typography hierarchy through weight contrast (300 vs 700)
 * - Generous whitespace (4px grid)
 * - CSS variables for all colors
 * - Interactive states using border-strong on hover
 *
 * @component
 */
export function HomeView() {
  const {
    setViewMode,
    setCurrentTask,
    inputValue,
    setInputValue,
    workingDirectory,
    setWorkingDirectory,
  } = useStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    // Create initial task
    setCurrentTask({
      id: crypto.randomUUID(),
      description: inputValue,
      status: 'pending',
      progress: 0,
      subtasks: [],
    });

    // Switch to working view
    setViewMode('working');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (actionId: string) => {
    const prompts: Record<string, string> = {
      'create-file': 'Create a new document that...',
      'crunch-data': 'Analyze the data in this folder and...',
      'make-prototype': 'Create a prototype for...',
      'prep-day':
        "Review my schedule and prepare a summary of today's meetings and action items.",
      'organize-files': 'Organize the files in this folder by...',
      'send-message': 'Draft a message to...',
    };
    setInputValue(prompts[actionId] || '');
  };

  const handleSelectFolder = async () => {
    const dir = await window.openwork?.selectDirectory();
    if (dir) {
      setWorkingDirectory(dir);
    }
  };

  const folderName = workingDirectory
    ? workingDirectory.split('/').pop() || workingDirectory
    : null;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Headline */}
        <h1
          className="text-[var(--text-3xl)] font-bold text-[var(--fg-default)] mb-6"
          style={{ fontSize: 'var(--text-3xl)' }}
        >
          Let's knock something off your list
        </h1>

        {/* Quick Actions Grid */}
        <Card
          variant="base"
          className="p-5 mb-3 animate-fade-in"
        >
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => handleQuickAction(action.id)}
                  className={cn(
                    /* Base styles - 72px height */
                    'flex items-center gap-3 h-[72px] px-4',
                    'rounded-lg border border-[var(--border-default)]',
                    'bg-[var(--bg-subtle)] text-left',
                    /* Hover state - border-strong */
                    'hover:border-[var(--border-strong)]',
                    'hover:bg-[var(--bg-muted)]',
                    /* Transition */
                    'transition-all duration-[var(--transition-normal)]',
                    /* Interactive feedback */
                    'active:scale-[0.98]',
                    'group'
                  )}
                  aria-label={action.label}
                >
                  {/* Icon container */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg',
                      'bg-[var(--bg-base)] border border-[var(--border-default)]',
                      'flex items-center justify-center flex-shrink-0',
                      'group-hover:border-[var(--border-strong)]',
                      'transition-colors duration-[var(--transition-normal)]'
                    )}
                  >
                    <Icon className="w-5 h-5 text-[var(--fg-muted)]" />
                  </div>

                  {/* Label */}
                  <span className="text-sm font-medium text-[var(--fg-default)]">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* Main Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="base" className="p-5 animate-fade-in">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Summarize my meetings from this week and find action items. Where do you think I can be more efficient?"
              className={cn(
                'w-full resize-none',
                'bg-transparent',
                'text-[var(--fg-default)] placeholder:text-[var(--fg-subtle)]',
                'text-base leading-relaxed',
                'focus:outline-none',
                'min-h-[60px]'
              )}
              rows={2}
              aria-label="Task description"
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-default)]">
              {/* Left side - folder selector and add button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectFolder}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2',
                    'rounded-lg border border-[var(--border-default)]',
                    'bg-[var(--bg-base)]',
                    'hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]',
                    'transition-all duration-[var(--transition-normal)]',
                    'text-sm'
                  )}
                  aria-label={folderName ? `Working in ${folderName}` : 'Select working folder'}
                >
                  <Folder className="w-4 h-4 text-[var(--fg-muted)]" />
                  <span className="text-[var(--fg-default)]">
                    {folderName || 'Work in a folder'}
                  </span>
                </button>

                <button
                  className={cn(
                    'p-2 rounded-lg',
                    'border border-[var(--border-default)]',
                    'bg-[var(--bg-base)]',
                    'hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]',
                    'transition-all duration-[var(--transition-normal)]'
                  )}
                  title="Add context"
                  aria-label="Add context"
                >
                  <Plus className="w-4 h-4 text-[var(--fg-muted)]" />
                </button>
              </div>

              {/* Right side - THE ONE ACCENT ELEMENT */}
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="font-semibold"
              >
                Let's go
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
