import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useStore, type Task } from '../store';

export function WorkingView() {
  const {
    currentTask,
    setViewMode,
    setCurrentTask,
    updateTaskProgress,
    workingDirectory,
    isExecuting,
    setIsExecuting,
  } = useStore();

  // Simulate task execution (in real app, this would call the orchestrator)
  useEffect(() => {
    if (currentTask && currentTask.status === 'pending') {
      simulateTaskExecution();
    }
  }, [currentTask]);

  const simulateTaskExecution = async () => {
    if (!currentTask) return;

    setIsExecuting(true);

    // Create subtasks
    const subtasks: Task[] = [
      { id: crypto.randomUUID(), description: 'Analyzing request...', status: 'pending', progress: 0, subtasks: [] },
      { id: crypto.randomUUID(), description: 'Reading context files', status: 'pending', progress: 0, subtasks: [] },
      { id: crypto.randomUUID(), description: 'Processing information', status: 'pending', progress: 0, subtasks: [] },
      { id: crypto.randomUUID(), description: 'Generating output', status: 'pending', progress: 0, subtasks: [] },
    ];

    setCurrentTask({ ...currentTask, status: 'in_progress', subtasks });

    // Simulate progress
    for (let i = 0; i < subtasks.length; i++) {
      updateTaskProgress(subtasks[i].id, 0, 'in_progress');

      // Simulate work
      for (let p = 0; p <= 100; p += 10) {
        await new Promise((r) => setTimeout(r, 100));
        updateTaskProgress(subtasks[i].id, p, 'in_progress');
      }

      updateTaskProgress(subtasks[i].id, 100, 'completed');
    }

    updateTaskProgress(currentTask.id, 100, 'completed');
    setIsExecuting(false);
  };

  const handleBack = () => {
    setCurrentTask(null);
    setViewMode('home');
  };

  if (!currentTask) {
    return null;
  }

  return (
    <div className="h-full flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-cream-300/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink-200" />
        </button>
        <h1 className="text-xl font-semibold text-ink-400">
          {currentTask.status === 'completed' ? 'Task Completed' : 'Working...'}
        </h1>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-6">
        {/* Task description and progress */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-cream-300/80 p-6 shadow-sm"
          >
            <h2 className="text-lg font-medium text-ink-400 mb-4">
              {currentTask.description}
            </h2>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-ink-200 mb-2">
                <span>Progress</span>
                <span>{currentTask.progress}%</span>
              </div>
              <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentTask.progress}%` }}
                  className="h-full bg-terracotta-500 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-3">
              {currentTask.subtasks.map((subtask, index) => (
                <motion.div
                  key={subtask.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-cream-50"
                >
                  {subtask.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : subtask.status === 'in_progress' ? (
                    <Loader2 className="w-5 h-5 text-terracotta-500 animate-spin flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-ink-100 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      subtask.status === 'completed'
                        ? 'text-ink-200 line-through'
                        : subtask.status === 'in_progress'
                        ? 'text-ink-400 font-medium'
                        : 'text-ink-200'
                    }`}
                  >
                    {subtask.description}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Context sidebar */}
        <div className="w-72">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-cream-300/80 p-5 shadow-sm"
          >
            <h3 className="text-sm font-medium text-ink-300 mb-4">Context</h3>

            <div className="space-y-2">
              {workingDirectory && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-cream-50 text-sm text-ink-200">
                  <span className="w-2 h-2 bg-terracotta-400 rounded-full" />
                  {workingDirectory.split('/').pop()}
                </div>
              )}
              <div className="text-xs text-ink-100 pt-2">
                Files in working directory will appear here
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
