import React, { useState, useCallback, useEffect, useRef } from 'react';

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
      className="selection-list"
      role="dialog"
      aria-labelledby="selection-question"
    >
      {/* Question Header */}
      <div className="selection-list__header">
        <h2 id="selection-question" className="selection-list__question">
          {question}
        </h2>
      </div>

      {/* Options List */}
      <div className="selection-list__options" role="listbox" aria-activedescendant={`option-${focusedIndex}`}>
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isFocused = focusedIndex === index && !isCustomMode;

          return (
            <div
              key={option.id}
              id={`option-${index}`}
              className={`selection-list__option ${isFocused ? 'selection-list__option--focused' : ''}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleOptionClick(option.id, index)}
              tabIndex={-1}
            >
              {/* Radio Indicator */}
              <div className="selection-list__radio">
                <div className={`selection-list__radio-outer ${isSelected ? 'selection-list__radio-outer--selected' : ''}`}>
                  {isSelected && <div className="selection-list__radio-inner" />}
                </div>
              </div>

              {/* Content */}
              <div className="selection-list__content">
                <div className="selection-list__label">{option.label}</div>
                <div className="selection-list__description">{option.description}</div>
              </div>

              {/* Shortcut Badge */}
              {option.shortcut && (
                <div className="selection-list__shortcut" aria-label={`Shortcut key ${option.shortcut}`}>
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
            className={`selection-list__option selection-list__option--custom ${
              focusedIndex === options.length ? 'selection-list__option--focused' : ''
            }`}
            role="option"
            aria-selected={false}
            onClick={handleCustomClick}
            tabIndex={-1}
          >
            {/* Radio Indicator */}
            <div className="selection-list__radio">
              <div className="selection-list__radio-outer">
                {isCustomMode && <div className="selection-list__radio-inner" />}
              </div>
            </div>

            {/* Content */}
            <div className="selection-list__content selection-list__content--full">
              {!isCustomMode ? (
                <>
                  <div className="selection-list__label">{customPlaceholder}</div>
                  <div className="selection-list__description">Enter your own response</div>
                </>
              ) : (
                <input
                  ref={customInputRef}
                  type="text"
                  className="selection-list__custom-input"
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
              <div className="selection-list__shortcut" aria-label={`Shortcut key ${options.length + 1}`}>
                {options.length + 1}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Skip Button */}
      {allowSkip && (
        <div className="selection-list__footer">
          <button
            className="selection-list__skip"
            onClick={onSkip}
            type="button"
            aria-label="Skip this question"
          >
            Skip
          </button>
        </div>
      )}

      <style jsx>{`
        .selection-list {
          width: 100%;
          max-width: 480px;
          background: var(--bg-elevated, #ffffff);
          border: 1px solid var(--border-default, #e5e5e5);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: scaleIn 0.2s ease;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Header */
        .selection-list__header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border-subtle, #f0f0f0);
        }

        .selection-list__question {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: var(--fg-default, #0a0a0a);
          line-height: 1.5;
        }

        /* Options Container */
        .selection-list__options {
          display: flex;
          flex-direction: column;
        }

        /* Option Item */
        .selection-list__option {
          display: flex;
          align-items: flex-start;
          min-height: 64px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle, #f0f0f0);
          cursor: pointer;
          transition: background-color 150ms ease;
          position: relative;
        }

        .selection-list__option:last-child {
          border-bottom: none;
        }

        .selection-list__option:hover {
          background-color: var(--bg-hover, #f9f9f9);
        }

        .selection-list__option--focused {
          background-color: var(--bg-hover, #f9f9f9);
        }

        .selection-list__option--custom {
          align-items: center;
        }

        /* Radio Button */
        .selection-list__radio {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-right: 12px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .selection-list__radio-outer {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid var(--border-default, #d4d4d4);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 150ms ease;
        }

        .selection-list__radio-outer--selected {
          background: var(--accent, #3b82f6);
          border-color: var(--accent, #3b82f6);
        }

        .selection-list__radio-inner {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
        }

        /* Content */
        .selection-list__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .selection-list__content--full {
          padding-right: 40px;
        }

        .selection-list__label {
          font-size: 14px;
          font-weight: 500;
          color: var(--fg-default, #0a0a0a);
          line-height: 1.4;
        }

        .selection-list__description {
          font-size: 13px;
          font-weight: 400;
          color: var(--fg-muted, #737373);
          line-height: 1.4;
        }

        /* Custom Input */
        .selection-list__custom-input {
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;
          font-family: inherit;
          color: var(--fg-default, #0a0a0a);
          background: var(--bg-default, #ffffff);
          border: 1px solid var(--border-default, #d4d4d4);
          border-radius: 6px;
          outline: none;
          transition: border-color 150ms ease;
        }

        .selection-list__custom-input:focus {
          border-color: var(--accent, #3b82f6);
        }

        .selection-list__custom-input::placeholder {
          color: var(--fg-muted, #a3a3a3);
        }

        /* Shortcut Badge */
        .selection-list__shortcut {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--bg-subtle, #f5f5f5);
          border: 1px solid var(--border-subtle, #e5e5e5);
          font-size: 12px;
          font-family: 'SF Mono', 'JetBrains Mono', 'Consolas', monospace;
          font-weight: 500;
          color: var(--fg-muted, #737373);
          flex-shrink: 0;
          margin-left: 12px;
          margin-top: 2px;
        }

        /* Footer */
        .selection-list__footer {
          padding: 12px 20px;
          border-top: 1px solid var(--border-subtle, #f0f0f0);
          display: flex;
          justify-content: flex-start;
        }

        .selection-list__skip {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--fg-muted, #737373);
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .selection-list__skip:hover {
          background: var(--bg-hover, #f5f5f5);
          color: var(--fg-default, #0a0a0a);
        }

        .selection-list__skip:active {
          transform: scale(0.98);
        }

        /* Accessibility */
        .selection-list__option:focus-visible {
          outline: 2px solid var(--accent, #3b82f6);
          outline-offset: -2px;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .selection-list {
            background: var(--bg-elevated, #171717);
            border-color: var(--border-default, #262626);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }

          .selection-list__header {
            border-bottom-color: var(--border-subtle, #262626);
          }

          .selection-list__question {
            color: var(--fg-default, #fafafa);
          }

          .selection-list__option {
            border-bottom-color: var(--border-subtle, #262626);
          }

          .selection-list__option:hover,
          .selection-list__option--focused {
            background-color: var(--bg-hover, #1f1f1f);
          }

          .selection-list__label {
            color: var(--fg-default, #fafafa);
          }

          .selection-list__description {
            color: var(--fg-muted, #a3a3a3);
          }

          .selection-list__custom-input {
            background: var(--bg-default, #0a0a0a);
            border-color: var(--border-default, #404040);
            color: var(--fg-default, #fafafa);
          }

          .selection-list__shortcut {
            background: var(--bg-subtle, #262626);
            border-color: var(--border-subtle, #404040);
            color: var(--fg-muted, #a3a3a3);
          }

          .selection-list__skip:hover {
            background: var(--bg-hover, #262626);
            color: var(--fg-default, #fafafa);
          }
        }
      `}</style>
    </div>
  );
};

export default SelectionList;
