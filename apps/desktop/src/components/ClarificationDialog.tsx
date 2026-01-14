import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type ClarificationOption } from '../store';

/**
 * ClarificationDialog - Plan Mode Clarification UI
 *
 * Based on Claude Agent SDK's AskUserQuestion pattern.
 * Shows numbered options for quick keyboard selection.
 *
 * UI matches Screenshot 3:
 * - Modal with rounded corners on grid background
 * - Numbered options with title + description
 * - "Type something else..." custom option
 * - Skip button
 */
export function ClarificationDialog() {
  const {
    clarificationQuestion,
    setClarificationQuestion,
    setClarificationResponse,
  } = useStore();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!clarificationQuestion) return;

      const options = clarificationQuestion.options;
      const num = parseInt(e.key);

      // Number keys 1-4 for quick selection
      if (num >= 1 && num <= options.length) {
        setSelectedIndex(num - 1);
        setShowCustomInput(false);
      }

      // Last number for custom input
      if (clarificationQuestion.allowCustom && num === options.length + 1) {
        setShowCustomInput(true);
        setSelectedIndex(null);
      }

      // Enter to confirm selection
      if (e.key === 'Enter' && !showCustomInput) {
        if (selectedIndex !== null) {
          handleSelect(options[selectedIndex]);
        }
      }

      // Escape to skip
      if (e.key === 'Escape' && clarificationQuestion.allowSkip) {
        handleSkip();
      }
    },
    [clarificationQuestion, selectedIndex, showCustomInput]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (option: ClarificationOption) => {
    setClarificationResponse(option.id);
    setClarificationQuestion(null);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setClarificationResponse(`custom:${customInput.trim()}`);
      setClarificationQuestion(null);
      setCustomInput('');
    }
  };

  const handleSkip = () => {
    setClarificationResponse('skip');
    setClarificationQuestion(null);
  };

  if (!clarificationQuestion) return null;

  const { question, options, allowCustom, allowSkip } = clarificationQuestion;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop with grid pattern */}
        <div
          className="absolute inset-0 bg-cream-100/95"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-cream-300/60 overflow-hidden"
        >
          {/* Question Header */}
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-xl font-semibold text-ink-400">{question}</h2>
          </div>

          {/* Options List */}
          <div className="px-4 pb-4">
            {options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => {
                  setSelectedIndex(index);
                  setShowCustomInput(false);
                }}
                className={`w-full text-left px-4 py-4 rounded-xl transition-all flex items-center justify-between group ${
                  selectedIndex === index
                    ? 'bg-cream-100'
                    : 'hover:bg-cream-50'
                }`}
              >
                <div>
                  <div className="font-medium text-ink-400">{option.label}</div>
                  <div className="text-sm text-ink-200">{option.description}</div>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    selectedIndex === index
                      ? 'bg-ink-400 text-white'
                      : 'bg-cream-200 text-ink-300 group-hover:bg-cream-300'
                  }`}
                >
                  {option.shortcut || index + 1}
                </div>
              </button>
            ))}

            {/* Custom Input Option */}
            {allowCustom && (
              <div className="mt-1">
                {!showCustomInput ? (
                  <button
                    onClick={() => {
                      setShowCustomInput(true);
                      setSelectedIndex(null);
                    }}
                    onMouseEnter={() => {
                      setSelectedIndex(null);
                    }}
                    className="w-full text-left px-4 py-4 rounded-xl transition-all flex items-center justify-between hover:bg-cream-50"
                  >
                    <div>
                      <div className="font-medium text-ink-300">
                        Type something else...
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-cream-200 text-ink-300">
                      {options.length + 1}
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-3">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomSubmit();
                        }
                        if (e.key === 'Escape') {
                          setShowCustomInput(false);
                          e.stopPropagation();
                        }
                      }}
                      placeholder="Type your preference..."
                      autoFocus
                      className="w-full px-4 py-3 border border-cream-300/60 rounded-xl
                                 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500/20
                                 text-ink-400 placeholder:text-ink-100"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setShowCustomInput(false)}
                        className="px-4 py-2 text-sm text-ink-200 hover:text-ink-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCustomSubmit}
                        disabled={!customInput.trim()}
                        className="px-4 py-2 text-sm bg-terracotta-500 text-white rounded-lg
                                   hover:bg-terracotta-600 disabled:bg-cream-300 disabled:text-ink-200
                                   transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skip Button */}
          {allowSkip && !showCustomInput && (
            <div className="px-8 pb-6">
              <button
                onClick={handleSkip}
                className="px-6 py-2.5 text-sm font-medium text-ink-300 bg-cream-100
                           hover:bg-cream-200 rounded-xl transition-colors"
              >
                Skip
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
