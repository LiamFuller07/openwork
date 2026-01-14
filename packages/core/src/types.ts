import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Task status enum
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

/**
 * Supported AI providers
 */
export type AIProvider = 'claude' | 'gemini' | 'openai' | 'ollama';

/**
 * Task definition
 */
export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  subtasks: Task[];
  progress: number; // 0-100
  result?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * JSON Schema type for tool input validation
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: string[];
  description?: string;
  default?: unknown;
}

/**
 * Tool result
 */
export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute: (input: unknown) => Promise<ToolResult>;
}

/**
 * Message types for chat
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolCallResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface ToolCallResult {
  toolCallId: string;
  result: ToolResult;
}

/**
 * Chat chunk for streaming
 */
export interface ChatChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'done';
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolCallResult;
}

/**
 * Progress update
 */
export interface ProgressUpdate {
  taskId: string;
  status: TaskStatus;
  progress: number;
  message?: string;
  subtaskId?: string;
}

/**
 * OpenWork session state
 */
export interface OpenWorkSession {
  id: string;
  workingDirectory: string;
  contextFiles: string[];
  tasks: Task[];
  config: AgentConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent result after task completion
 */
export interface AgentResult {
  success: boolean;
  output?: string;
  artifacts?: Artifact[];
  error?: string;
  tokensUsed?: number;
  duration?: number;
}

/**
 * Artifact created during task execution
 */
export interface Artifact {
  type: 'file' | 'url' | 'data';
  name: string;
  path?: string;
  url?: string;
  data?: unknown;
  mimeType?: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);

export const AIProviderSchema = z.enum(['claude', 'gemini', 'openai', 'ollama']);

export const AgentConfigSchema = z.object({
  provider: AIProviderSchema,
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const TaskSchema: z.ZodType<Task> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    description: z.string(),
    status: TaskStatusSchema,
    subtasks: z.array(TaskSchema),
    progress: z.number().min(0).max(100),
    result: z.string().optional(),
    error: z.string().optional(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
);

// ============================================================================
// Quick Action Types
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  promptTemplate: string;
  category: 'productivity' | 'data' | 'creative' | 'communication';
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-file',
    label: 'Create a file',
    description: 'Generate documents, spreadsheets, presentations',
    icon: 'file-plus',
    promptTemplate: 'Create a new {fileType} file named {fileName} with the following content: {content}',
    category: 'productivity',
  },
  {
    id: 'crunch-data',
    label: 'Crunch data',
    description: 'Analyze files, extract insights, create summaries',
    icon: 'bar-chart',
    promptTemplate: 'Analyze the data in {files} and {analysisType}',
    category: 'data',
  },
  {
    id: 'make-prototype',
    label: 'Make a prototype',
    description: 'Design mockups and wireframes',
    icon: 'pencil-ruler',
    promptTemplate: 'Create a prototype for {description}',
    category: 'creative',
  },
  {
    id: 'prep-day',
    label: 'Prep for the day',
    description: 'Review calendar, summarize meetings',
    icon: 'calendar',
    promptTemplate: 'Help me prepare for today by reviewing my schedule and summarizing key meetings',
    category: 'productivity',
  },
  {
    id: 'organize-files',
    label: 'Organize files',
    description: 'Sort, rename, categorize documents',
    icon: 'folder-tree',
    promptTemplate: 'Organize the files in {directory} by {organizationMethod}',
    category: 'productivity',
  },
  {
    id: 'send-message',
    label: 'Send a message',
    description: 'Draft and send emails or messages',
    icon: 'mail',
    promptTemplate: 'Draft a {messageType} to {recipient} about {subject}',
    category: 'communication',
  },
];
