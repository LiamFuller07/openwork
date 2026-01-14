import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { SelectionList } from './ui/SelectionList';

/**
 * ClarificationDialog - Plan Mode Clarification UI
 *
 * Based on Claude Agent SDK's AskUserQuestion pattern.
 * Uses SelectionList component for keyboard-accessible option selection.
 *
 * Features:
 * - Grid backdrop with CSS variables
 * - Centered modal dialog
 * - Keyboard navigation via SelectionList
 * - Custom input support
 * - Skip functionality
 */
export function ClarificationDialog() {
  const {
    clarificationQuestion,
    setClarificationQuestion,
    setClarificationResponse,
  } = useStore();

  const handleSelect = (id: string) => {
    setClarificationResponse(id);
    setClarificationQuestion(null);
  };

  const handleCustomSubmit = (value: string) => {
    setClarificationResponse(`custom:${value}`);
    setClarificationQuestion(null);
  };

  const handleSkip = () => {
    setClarificationResponse('skip');
    setClarificationQuestion(null);
  };

  return (
    <AnimatePresence>
      {clarificationQuestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop with grid pattern using CSS variables */}
          <div className="absolute inset-0 bg-[var(--bg-base)]/90 bg-grid" />

          {/* Dialog */}
          <div className="relative">
            <SelectionList
              question={clarificationQuestion.question}
              options={clarificationQuestion.options.map((opt) => ({
                id: opt.id,
                label: opt.label,
                description: opt.description,
                shortcut: opt.shortcut,
              }))}
              onSelect={handleSelect}
              allowCustom={clarificationQuestion.allowCustom}
              onCustomSubmit={handleCustomSubmit}
              allowSkip={clarificationQuestion.allowSkip}
              onSkip={handleSkip}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
