import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

// Props interface
interface SelectionOption {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
}

interface SelectionListProps {
  question: string;
  options: SelectionOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  onCustomSubmit?: (value: string) => void;
  allowSkip?: boolean;
  onSkip?: () => void;
  onClose?: () => void;
}

/**
 * SelectionList - Ultra-minimal choice dialog component
 *
 * Matches Claude Cowork clarification dialog design with:
 * - Radio-style selection indicators
 * - Keyboard shortcuts (1-9)
 * - Arrow key navigation
 * - Optional custom input
 * - Optional skip action
 *
 * Usage:
 * ```tsx
 * <SelectionList
 *   question="How would you like to proceed?"
 *   options={[
 *     { id: '1', label: 'Quick summary', description: 'Key points and action items', shortcut: '1' },
 *     { id: '2', label: 'Detailed notes', description: 'Full breakdown with context', shortcut: '2' }
 *   ]}
 *   onSelect={(id) => console.log('Selected:', id)}
 *   allowSkip
 *   onSkip={() => console.log('Skipped')}
 * />
 * ```
 */
export const SelectionList: React.FC<SelectionListProps> = ({
  question,
  options,
  selectedId,
  onSelect,
  allowCustom = false,
  customPlaceholder = 'Type something else...',
  onCustomSubmit,
  allowSkip = false,
  onSkip,
  onClose,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [customValue, setCustomValue] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total items (options + custom if enabled)
  const totalItems = options.length + (allowCustom ? 1 : 0);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Number key shortcuts (1-9)
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (index < options.length) {
          e.preventDefault();
          onSelect(options[index].id);
        } else if (index === options.length && allowCustom) {
          // Activate custom input
          e.preventDefault();
          setFocusedIndex(index);
          setIsCustomMode(true);
        }
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % totalItems);
        setIsCustomMode(false);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        setIsCustomMode(false);
      }

      // Enter to select
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isCustomMode && allowCustom && onCustomSubmit && customValue.trim()) {
          onCustomSubmit(customValue.trim());
        } else if (focusedIndex < options.length) {
          onSelect(options[focusedIndex].id);
        } else if (focusedIndex === options.length && allowCustom) {
          setIsCustomMode(true);
        }
      }

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isCustomMode) {
          setIsCustomMode(false);
          setCustomValue('');
        } else if (onClose) {
          onClose();
        }
      }
    },
    [
      options,
      focusedIndex,
      totalItems,
      allowCustom,
      isCustomMode,
      customValue,
      onSelect,
      onCustomSubmit,
      onClose,
    ]
  );

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus custom input when entering custom mode
  useEffect(() => {
    if (isCustomMode && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isCustomMode]);

  // Handle option click
  const handleOptionClick = (optionId: string, index: number) => {
    setFocusedIndex(index);
    onSelect(optionId);
  };

  // Handle custom option click
  const handleCustomClick = () => {
    setFocusedIndex(options.length);
    setIsCustomMode(true);
  };

  // Handle custom input submit
  const handleCustomSubmit = () => {
    if (onCustomSubmit && customValue.trim()) {
      onCustomSubmit(customValue.trim());
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[480px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-lg animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-labelledby="selection-question"
    >
      {/* Question Header */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <h2 id="selection-question" className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
          {question}
        </h2>
      </div>

      {/* Options List */}
      <div className="flex flex-col" role="listbox" aria-activedescendant={`option-${focusedIndex}`}>
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isFocused = focusedIndex === index && !isCustomMode;

          return (
            <div
              key={option.id}
              id={`option-${index}`}
              className={cn(
                "flex items-start min-h-[64px] px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors duration-150 relative last:border-b-0",
                isFocused && "bg-neutral-50 dark:bg-neutral-800",
                "hover:bg-neutral-50 dark:hover:bg-neutral-800"
              )}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleOptionClick(option.id, index)}
              tabIndex={-1}
            >
              {/* Radio Indicator */}
              <div className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0 mt-0.5">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-150",
                  isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "border-neutral-300 dark:border-neutral-600 bg-transparent"
                )}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">{option.label}</div>
                <div className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-snug">{option.description}</div>
              </div>

              {/* Shortcut Badge */}
              {option.shortcut && (
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 flex-shrink-0 ml-3 mt-0.5"
                  aria-label={`Shortcut key ${option.shortcut}`}
                >
                  {option.shortcut}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Input Option */}
        {allowCustom && (
          <div
            id={`option-${options.length}`}
            className={cn(
              "flex items-center min-h-[64px] px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors duration-150 last:border-b-0",
              focusedIndex === options.length && "bg-neutral-50 dark:bg-neutral-800",
              "hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
            role="option"
            aria-selected={false}
            onClick={handleCustomClick}
            tabIndex={-1}
          >
            {/* Radio Indicator */}
            <div className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0">
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-150",
                isCustomMode
                  ? "bg-blue-500 border-blue-500"
                  : "border-neutral-300 dark:border-neutral-600 bg-transparent"
              )}>
                {isCustomMode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-1 min-w-0 pr-10">
              {!isCustomMode ? (
                <>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">{customPlaceholder}</div>
                  <div className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-snug">Enter your own response</div>
                </>
              ) : (
                <input
                  ref={customInputRef}
                  type="text"
                  className="w-full px-3 py-2 text-sm font-normal text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md outline-none transition-colors duration-150 focus:border-blue-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={customPlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubmit();
                    }
                  }}
                  aria-label="Custom input"
                />
              )}
            </div>

            {/* Shortcut Badge */}
            {!isCustomMode && (
              <div
                className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 flex-shrink-0 ml-3"
                aria-label={`Shortcut key ${options.length + 1}`}
              >
                {options.length + 1}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Skip Button */}
      {allowSkip && (
        <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-start">
          <button
            className="px-4 py-2 text-[13px] font-medium text-neutral-500 dark:text-neutral-400 bg-transparent border-none rounded-md cursor-pointer transition-all duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 active:scale-[0.98]"
            onClick={onSkip}
            type="button"
            aria-label="Skip this question"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectionList;
