import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Send,
  FileText,
  Presentation,
  FolderOpen,
  Globe,
  ChevronDown,
  ChevronUp,
  Maximize2,
  File,
  Image,
  Table,
} from 'lucide-react';
import { useStore, type ProgressStepStatus } from '../store';

/**
 * WorkingView - Three Panel Layout
 *
 * Matches Claude Cowork Screenshot 2:
 * - LEFT: Chat/Response panel with messages and reply input
 * - CENTER: Artifact preview (presentations, documents, etc.)
 * - RIGHT: Progress steps, Artifacts list, Context files
 */
export function WorkingView() {
  const {
    currentTask,
    setViewMode,
    setCurrentTask,
    updateTaskProgress,
    workingDirectory,
    isExecuting,
    setIsExecuting,
    progressSteps,
    setProgressSteps,
    updateProgressStep,
    artifacts,
    addArtifact,
    contextFiles,
    setContextFiles,
    messages,
    addMessage,
    activeArtifactId,
    setActiveArtifactId,
  } = useStore();

  const [replyInput, setReplyInput] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    progress: true,
    artifacts: true,
    context: true,
  });

  // Simulate task execution (in real app, this would call the orchestrator)
  useEffect(() => {
    if (currentTask && currentTask.status === 'pending') {
      simulateTaskExecution();
    }
  }, [currentTask]);

  const simulateTaskExecution = async () => {
    if (!currentTask) return;

    setIsExecuting(true);

    // Set up progress steps
    const steps = [
      { id: '1', label: 'Read meeting recordings', status: 'pending' as ProgressStepStatus, order: 1 },
      { id: '2', label: 'Pull out key points', status: 'pending' as ProgressStepStatus, order: 2 },
      { id: '3', label: 'Find action items', status: 'pending' as ProgressStepStatus, order: 3 },
      { id: '4', label: 'Check Google Calendar', status: 'pending' as ProgressStepStatus, order: 4 },
      { id: '5', label: 'Build standup deck', status: 'pending' as ProgressStepStatus, order: 5 },
      { id: '6', label: 'Write summary', status: 'pending' as ProgressStepStatus, order: 6 },
    ];
    setProgressSteps(steps);

    // Set up context files
    setContextFiles([
      { id: 'c1', name: 'Meeting Transcripts', path: '/docs/meetings', type: 'folder', icon: 'folder' },
      { id: 'c2', name: 'SKILL.md', path: '/SKILL.md', type: 'file', icon: 'file' },
      { id: 'c3', name: 'pptx-patterns.md', path: '/docs/pptx-patterns.md', type: 'file', icon: 'file' },
      { id: 'c4', name: 'css.md', path: '/docs/css.md', type: 'file', icon: 'file' },
      { id: 'c5', name: 'claude in chrome', path: '', type: 'integration', icon: 'globe' },
    ]);

    setCurrentTask({ ...currentTask, status: 'in_progress', subtasks: [] });

    // Simulate progress through steps
    for (let i = 0; i < steps.length; i++) {
      updateProgressStep(steps[i].id, 'in_progress');
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      updateProgressStep(steps[i].id, 'completed');

      // Add artifacts as we go
      if (i === 2) {
        addArtifact({
          id: 'a1',
          type: 'document',
          name: 'Meeting summaries',
          path: '/output/meeting-summary.md',
          icon: 'file-text',
        });
      }
      if (i === 3) {
        addArtifact({
          id: 'a2',
          type: 'document',
          name: 'Action items',
          path: '/output/action-items.md',
          icon: 'file-text',
        });
      }
      if (i === 4) {
        addArtifact({
          id: 'a3',
          type: 'presentation',
          name: 'Team standup deck',
          path: '/output/standup-deck.pptx',
          icon: 'presentation',
        });
        setActiveArtifactId('a3');
      }
    }

    // Final message
    addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `All done! Here's your standup kit for the week:

📁 meeting-summary.md
✅ action-items.md
📊 team-standup-deck.pptx

**Quick highlights:**
• 4 things shipped including API v2 (40% faster!)
• 17 user interviews synthesized — onboarding came up a lot
• Mobile launch postponed to Q2 (captured in the deck)

The deck has 5 slides ready 🌸`,
      timestamp: new Date(),
      artifactIds: ['a1', 'a2', 'a3'],
    });

    updateTaskProgress(currentTask.id, 100, 'completed');
    setIsExecuting(false);
  };

  const handleBack = () => {
    setCurrentTask(null);
    setViewMode('home');
  };

  const handleReply = () => {
    if (!replyInput.trim()) return;

    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: replyInput,
      timestamp: new Date(),
    });
    setReplyInput('');
  };

  const toggleSection = (section: 'progress' | 'artifacts' | 'context') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'presentation':
        return <Presentation className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'data':
        return <Table className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <FolderOpen className="w-4 h-4" />;
      case 'integration':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!currentTask) {
    return null;
  }

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId);

  return (
    <div className="h-full flex bg-[var(--bg-subtle)]">
      {/* LEFT PANEL - Chat/Response */}
      <div className="w-80 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--fg-muted)]" />
          </button>
          <button className="p-2 hover:bg-[var(--bg-subtle)] rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-[var(--fg-muted)]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  message.role === 'assistant'
                    ? 'text-[var(--fg-default)]'
                    : 'text-[var(--fg-muted)] bg-[var(--bg-subtle)] p-3 rounded-xl'
                }`}
              >
                <div
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/📁|✅|📊|🌸/g, '<span class="text-lg">$&</span>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {isExecuting && messages.length === 0 && (
            <div className="flex items-center gap-2 text-[var(--fg-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Working on it...</span>
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="p-4 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-2 bg-[var(--bg-subtle)] rounded-xl px-3 py-2">
            <button className="p-1 hover:bg-[var(--bg-muted)] rounded transition-colors">
              <Plus className="w-4 h-4 text-[var(--fg-muted)]" />
            </button>
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              placeholder="Reply..."
              className="flex-1 bg-transparent text-sm text-[var(--fg-default)] placeholder:text-[var(--fg-subtle)]
                         focus:outline-none"
            />
            <button
              onClick={handleReply}
              disabled={!replyInput.trim()}
              className="p-2 bg-[var(--accent)] text-white rounded-lg
                         hover:bg-[var(--accent-hover)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--fg-muted)]
                         transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER PANEL - Artifact Preview */}
      <div className="flex-1 flex flex-col">
        {activeArtifact ? (
          <>
            {/* Preview Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-base)]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--fg-default)]">
                  {activeArtifact.name}
                </span>
                <span className="text-xs text-[var(--fg-subtle)]">
                  ~{workingDirectory?.split('/').pop()}/outputs
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeArtifact.type === 'presentation' && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-subtle)] rounded-lg text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] transition-colors">
                    <Presentation className="w-3 h-3" />
                    Keynote
                  </button>
                )}
                <button className="p-1.5 hover:bg-[var(--bg-subtle)] rounded transition-colors">
                  <Maximize2 className="w-4 h-4 text-[var(--fg-muted)]" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 p-6 overflow-auto">
              {activeArtifact.type === 'presentation' ? (
                <div className="space-y-6">
                  {/* Slide Preview */}
                  <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-lg">
                    <h1 className="text-3xl font-semibold text-white mb-2">
                      Product Team Standup
                    </h1>
                    <p className="text-slate-400 uppercase tracking-widest text-sm">
                      Week of October 5–9
                    </p>
                    <p className="text-pink-400 mt-8 text-sm">Acme Product Team</p>
                  </div>

                  {/* Stats Section */}
                  <div className="bg-[var(--bg-base)] rounded-2xl p-6 shadow-sm border border-[var(--border-default)]">
                    <h2 className="text-lg font-medium text-[var(--fg-default)] mb-4">
                      This week at a glance...
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: '4', label: 'Features shipped' },
                        { value: '17', label: 'User interviews' },
                        { value: '40%', label: 'Latency improvement' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-pink-400 rounded-xl p-6 text-center"
                        >
                          <div className="text-4xl font-light text-white">
                            {stat.value}
                          </div>
                          <div className="text-sm text-pink-100 mt-1">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--bg-base)] rounded-2xl p-6 shadow-sm border border-[var(--border-default)]">
                  <p className="text-[var(--fg-muted)] text-sm">
                    Preview for {activeArtifact.name}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--fg-muted)]">
            <p className="text-sm">Select an artifact to preview</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Progress/Artifacts/Context */}
      <div className="w-72 border-l border-[var(--border-default)] bg-[var(--bg-base)] overflow-y-auto">
        {/* Progress Section */}
        <div className="border-b border-[var(--border-default)]">
          <button
            onClick={() => toggleSection('progress')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--fg-muted)]">Progress</span>
            {expandedSections.progress ? (
              <ChevronUp className="w-4 h-4 text-[var(--fg-muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--fg-muted)]" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.progress && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-2"
              >
                {progressSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
                    ) : step.status === 'in_progress' ? (
                      <div className="relative">
                        <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin flex-shrink-0" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent)] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                          {step.order}
                        </span>
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-[var(--fg-subtle)] flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        step.status === 'completed'
                          ? 'text-[var(--fg-muted)]'
                          : step.status === 'in_progress'
                          ? 'text-[var(--fg-default)] font-medium'
                          : 'text-[var(--fg-muted)]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Artifacts Section */}
        <div className="border-b border-[var(--border-default)]">
          <button
            onClick={() => toggleSection('artifacts')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--fg-muted)]">Artifacts</span>
            {expandedSections.artifacts ? (
              <ChevronUp className="w-4 h-4 text-[var(--fg-muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--fg-muted)]" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.artifacts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-1"
              >
                {artifacts.length === 0 ? (
                  <p className="text-xs text-[var(--fg-subtle)] py-2">
                    Artifacts will appear here
                  </p>
                ) : (
                  artifacts.map((artifact) => (
                    <button
                      key={artifact.id}
                      onClick={() => setActiveArtifactId(artifact.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeArtifactId === artifact.id
                          ? 'bg-[var(--bg-subtle)]'
                          : 'hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <span className="text-[var(--fg-muted)]">
                        {getArtifactIcon(artifact.type)}
                      </span>
                      <span className="text-sm text-[var(--fg-default)] truncate">
                        {artifact.name}
                      </span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Context Section */}
        <div>
          <button
            onClick={() => toggleSection('context')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--fg-muted)]">Context</span>
            {expandedSections.context ? (
              <ChevronUp className="w-4 h-4 text-[var(--fg-muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--fg-muted)]" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.context && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-1"
              >
                {contextFiles.length === 0 ? (
                  <p className="text-xs text-[var(--fg-subtle)] py-2">
                    Context files will appear here
                  </p>
                ) : (
                  contextFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <span className="text-[var(--fg-muted)]">
                        {getContextIcon(file.type)}
                      </span>
                      <span className="text-sm text-[var(--fg-muted)] truncate">
                        {file.name}
                      </span>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
