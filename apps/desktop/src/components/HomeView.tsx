import { motion } from 'framer-motion';
import { useStore } from '../store';
import { QuickActions } from './QuickActions/QuickActions';
import { ChatInput } from './ChatInput/ChatInput';

export function HomeView() {
  const { setViewMode, setCurrentTask, inputValue, setInputValue, workingDirectory } = useStore();

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

  const handleQuickAction = (action: string) => {
    // Set input based on action
    const prompts: Record<string, string> = {
      'create-file': 'Create a new document that...',
      'crunch-data': 'Analyze the data in this folder and...',
      'make-prototype': 'Create a prototype for...',
      'prep-day': 'Review my schedule and prepare a summary of today\'s meetings and action items.',
      'organize-files': 'Organize the files in this folder by...',
      'send-message': 'Draft a message to...',
    };
    setInputValue(prompts[action] || '');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Quick Actions */}
        <QuickActions onActionClick={handleQuickAction} />

        {/* Chat Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          workingDirectory={workingDirectory}
        />
      </motion.div>
    </div>
  );
}
