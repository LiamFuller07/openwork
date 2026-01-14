import { create } from 'zustand';

export type AIProvider = 'claude' | 'gemini' | 'openai' | 'ollama';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type ViewMode = 'home' | 'working' | 'settings';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  progress: number;
  subtasks: Task[];
}

export interface ApiKeyConfig {
  claude?: string;
  gemini?: string;
  openai?: string;
}

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

  // Reset
  reset: () => void;
}

const initialState = {
  viewMode: 'home' as ViewMode,
  workingDirectory: null,
  selectedProvider: 'claude' as AIProvider,
  selectedModel: 'claude-sonnet-4',
  apiKeys: {},
  currentTask: null,
  inputValue: '',
  isExecuting: false,
};

export const useStore = create<OpenWorkState>((set, get) => ({
  ...initialState,

  setViewMode: (mode) => set({ viewMode: mode }),

  setWorkingDirectory: (dir) => set({ workingDirectory: dir }),

  setSelectedProvider: (provider) => {
    const modelMap: Record<AIProvider, string> = {
      claude: 'claude-sonnet-4',
      gemini: 'gemini-2.5-pro',
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

  reset: () => set(initialState),
}));

// Provider info
export const PROVIDERS = [
  { id: 'claude' as const, name: 'Claude', company: 'Anthropic', requiresKey: true },
  { id: 'gemini' as const, name: 'Gemini', company: 'Google', requiresKey: true },
  { id: 'openai' as const, name: 'GPT', company: 'OpenAI', requiresKey: true },
  { id: 'ollama' as const, name: 'Local', company: 'Ollama', requiresKey: false },
];

export const MODELS: Record<AIProvider, string[]> = {
  claude: ['claude-opus-4.5', 'claude-sonnet-4', 'claude-haiku-3.5'],
  gemini: ['gemini-3-pro', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  openai: ['gpt-5', 'gpt-4o', 'o3', 'o1'],
  ollama: ['llama3.3', 'qwen2.5', 'deepseek-r1', 'codellama'],
};
