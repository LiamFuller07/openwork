import { create } from 'zustand';

// ============================================================================
// Core Types
// ============================================================================

export type AIProvider = 'claude' | 'openai' | 'ollama';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type ViewMode = 'home' | 'working' | 'settings' | 'clarification';
export type ProgressStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  progress: number;
  subtasks: Task[];
}

export interface ApiKeyConfig {
  claude?: string;
  openai?: string;
}

// ============================================================================
// Progress & Artifacts (Working View)
// ============================================================================

export interface ProgressStep {
  id: string;
  label: string;
  status: ProgressStepStatus;
  order: number;
}

export interface Artifact {
  id: string;
  type: 'file' | 'presentation' | 'document' | 'data';
  name: string;
  path?: string;
  icon?: string;
}

export interface ContextFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder' | 'integration';
  icon?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  artifactIds?: string[];
}

// ============================================================================
// Clarification Dialog (Plan Mode)
// ============================================================================

export interface ClarificationOption {
  id: string;
  label: string;
  description: string;
  shortcut: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: ClarificationOption[];
  allowCustom: boolean;
  allowSkip: boolean;
}

// ============================================================================
// Store State
// ============================================================================

interface OpenWorkState {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Working directory
  workingDirectory: string | null;
  setWorkingDirectory: (dir: string | null) => void;

  // Provider configuration
  selectedProvider: AIProvider;
  setSelectedProvider: (provider: AIProvider) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // API Keys
  apiKeys: ApiKeyConfig;
  setApiKey: (provider: AIProvider, key: string) => void;

  // Current task
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  updateTaskProgress: (taskId: string, progress: number, status?: TaskStatus) => void;

  // Input state
  inputValue: string;
  setInputValue: (value: string) => void;

  // Loading state
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;

  // Progress steps (Working View)
  progressSteps: ProgressStep[];
  setProgressSteps: (steps: ProgressStep[]) => void;
  updateProgressStep: (stepId: string, status: ProgressStepStatus) => void;

  // Artifacts (Working View)
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;

  // Context files (Working View)
  contextFiles: ContextFile[];
  setContextFiles: (files: ContextFile[]) => void;
  addContextFile: (file: ContextFile) => void;

  // Messages (Chat Panel)
  messages: AgentMessage[];
  addMessage: (message: AgentMessage) => void;
  clearMessages: () => void;

  // Clarification dialog
  clarificationQuestion: ClarificationQuestion | null;
  setClarificationQuestion: (question: ClarificationQuestion | null) => void;
  clarificationResponse: string | null;
  setClarificationResponse: (response: string | null) => void;

  // Active artifact preview
  activeArtifactId: string | null;
  setActiveArtifactId: (id: string | null) => void;

  // Reset
  reset: () => void;
  resetSession: () => void;
}

const initialState = {
  viewMode: 'home' as ViewMode,
  workingDirectory: null,
  selectedProvider: 'claude' as AIProvider,
  selectedModel: 'claude-sonnet-4-20250514',
  apiKeys: {},
  currentTask: null,
  inputValue: '',
  isExecuting: false,
  progressSteps: [],
  artifacts: [],
  contextFiles: [],
  messages: [],
  clarificationQuestion: null,
  clarificationResponse: null,
  activeArtifactId: null,
};

export const useStore = create<OpenWorkState>((set, get) => ({
  ...initialState,

  setViewMode: (mode) => set({ viewMode: mode }),

  setWorkingDirectory: (dir) => set({ workingDirectory: dir }),

  setSelectedProvider: (provider) => {
    const modelMap: Record<AIProvider, string> = {
      claude: 'claude-sonnet-4-20250514',
      openai: 'gpt-4o',
      ollama: 'llama3.3',
    };
    set({ selectedProvider: provider, selectedModel: modelMap[provider] });
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  setApiKey: (provider, key) => {
    set({ apiKeys: { ...get().apiKeys, [provider]: key } });
  },

  setCurrentTask: (task) => set({ currentTask: task }),

  updateTaskProgress: (taskId, progress, status) => {
    const { currentTask } = get();
    if (!currentTask) return;

    const updateTask = (task: Task): Task => {
      if (task.id === taskId) {
        return { ...task, progress, status: status || task.status };
      }
      return {
        ...task,
        subtasks: task.subtasks.map(updateTask),
      };
    };

    set({ currentTask: updateTask(currentTask) });
  },

  setInputValue: (value) => set({ inputValue: value }),

  setIsExecuting: (executing) => set({ isExecuting: executing }),

  // Progress steps
  setProgressSteps: (steps) => set({ progressSteps: steps }),
  updateProgressStep: (stepId, status) => {
    const { progressSteps } = get();
    set({
      progressSteps: progressSteps.map((step) =>
        step.id === stepId ? { ...step, status } : step
      ),
    });
  },

  // Artifacts
  setArtifacts: (artifacts) => set({ artifacts }),
  addArtifact: (artifact) => {
    set({ artifacts: [...get().artifacts, artifact] });
  },

  // Context files
  setContextFiles: (files) => set({ contextFiles: files }),
  addContextFile: (file) => {
    set({ contextFiles: [...get().contextFiles, file] });
  },

  // Messages
  addMessage: (message) => {
    set({ messages: [...get().messages, message] });
  },
  clearMessages: () => set({ messages: [] }),

  // Clarification
  setClarificationQuestion: (question) => set({ clarificationQuestion: question }),
  setClarificationResponse: (response) => set({ clarificationResponse: response }),

  // Active artifact
  setActiveArtifactId: (id) => set({ activeArtifactId: id }),

  // Reset entire state
  reset: () => set(initialState),

  // Reset just the working session (preserves settings)
  resetSession: () =>
    set({
      currentTask: null,
      isExecuting: false,
      progressSteps: [],
      artifacts: [],
      contextFiles: [],
      messages: [],
      activeArtifactId: null,
      clarificationQuestion: null,
      clarificationResponse: null,
      inputValue: '',
    }),
}));

// ============================================================================
// Provider Configuration
// ============================================================================

export const PROVIDERS = [
  {
    id: 'claude' as const,
    name: 'Claude',
    company: 'Anthropic',
    requiresKey: true,
    description: 'Best for complex reasoning and file analysis',
  },
  {
    id: 'openai' as const,
    name: 'GPT',
    company: 'OpenAI',
    requiresKey: true,
    description: 'Fast and capable general-purpose models',
  },
  {
    id: 'ollama' as const,
    name: 'Local',
    company: 'Ollama',
    requiresKey: false,
    description: 'Run AI locally - no API key needed',
  },
];

export const MODELS: Record<AIProvider, string[]> = {
  claude: ['claude-opus-4-5-20251101', 'claude-sonnet-4-20250514', 'claude-haiku-3-5-20241022'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini'],
  ollama: ['llama3.3', 'llama3.2', 'qwen2.5', 'deepseek-r1', 'codellama', 'mistral'],
};
