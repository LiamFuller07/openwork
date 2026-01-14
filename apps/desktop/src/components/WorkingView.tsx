import { useEffect, useState, useRef } from 'react';
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
import { useStore } from '../store';

/**
 * MessageContent - Safe rendering of message content without dangerouslySetInnerHTML
 * Parses markdown-like syntax and renders as React elements to prevent XSS
 */
function MessageContent({ content }: { content: string }) {
  // Parse content into segments: text, bold, and emojis
  const parseContent = (text: string) => {
    const segments: Array<{ type: 'text' | 'bold' | 'emoji' | 'break'; content: string }> = [];
    let remaining = text;

    while (remaining.length > 0) {
      // Check for newlines
      if (remaining.startsWith('\n')) {
        segments.push({ type: 'break', content: '' });
        remaining = remaining.slice(1);
        continue;
      }

      // Check for bold text
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        segments.push({ type: 'bold', content: boldMatch[1] });
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for emojis
      const emojiMatch = remaining.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2705}]|[\u{274C}]|[\u{1F4C1}]|[\u{1F4CA}]|[\u{1F338}]|[\u{2714}])/u);
      if (emojiMatch) {
        segments.push({ type: 'emoji', content: emojiMatch[0] });
        remaining = remaining.slice(emojiMatch[0].length);
        continue;
      }

      // Regular text - consume until next special char
      const nextSpecial = remaining.search(/\*\*|\n|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2705}]|[\u{274C}]|[\u{1F4C1}]|[\u{1F4CA}]|[\u{1F338}]|[\u{2714}]/u);
      if (nextSpecial === -1) {
        segments.push({ type: 'text', content: remaining });
        break;
      } else if (nextSpecial > 0) {
        segments.push({ type: 'text', content: remaining.slice(0, nextSpecial) });
        remaining = remaining.slice(nextSpecial);
      } else {
        // Edge case: consume one char to avoid infinite loop
        segments.push({ type: 'text', content: remaining[0] });
        remaining = remaining.slice(1);
      }
    }

    return segments;
  };

  const segments = parseContent(content);

  return (
    <div className="text-sm whitespace-pre-wrap">
      {segments.map((segment, i) => {
        switch (segment.type) {
          case 'bold':
            return <strong key={i}>{segment.content}</strong>;
          case 'emoji':
            return <span key={i} className="text-lg">{segment.content}</span>;
          case 'break':
            return <br key={i} />;
          default:
            return <span key={i}>{segment.content}</span>;
        }
      })}
    </div>
  );
}

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
    workingDirectory,
    isExecuting,
    progressSteps,
    artifacts,
    contextFiles,
    messages,
    addMessage,
    activeArtifactId,
    setActiveArtifactId,
    resetSession,
  } = useStore();

  const [replyInput, setReplyInput] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    progress: true,
    artifacts: true,
    context: true,
  });

  // Track which task we've initialized to prevent duplicates (React StrictMode runs effects twice)
  const initializedTaskRef = useRef<string | null>(null);

  // Add initial task as the first user message when entering working view
  useEffect(() => {
    if (
      currentTask &&
      currentTask.status === 'pending' &&
      initializedTaskRef.current !== currentTask.id
    ) {
      // Mark as initialized to prevent duplicate runs
      initializedTaskRef.current = currentTask.id;

      // Add the user's task as the first message
      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: currentTask.description,
        timestamp: new Date(),
      });

      // Mark task as in progress (waiting for orchestrator)
      setCurrentTask({ ...currentTask, status: 'in_progress', subtasks: [] });

      // Add placeholder assistant message
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'll help you with that. Let me analyze what needs to be done...

**Your request:** ${currentTask.description}

🔧 *The orchestrator integration is not yet connected. This is where the AI agent would:*
• Break down your task into steps
• Access files in your working directory
• Execute tools and show progress
• Generate artifacts as output

For now, you can continue chatting and I'll respond when the backend is connected.`,
        timestamp: new Date(),
      });
    }
  }, [currentTask?.id]); // Only run when task ID changes

  const handleBack = () => {
    resetSession();
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
                <MessageContent content={message.content} />
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
