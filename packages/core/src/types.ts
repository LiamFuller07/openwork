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
 * Note: Gemini removed - focusing on Claude (recommended), OpenAI, and Ollama (local)
 */
export type AIProvider = 'claude' | 'openai' | 'ollama';

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

export const AIProviderSchema = z.enum(['claude', 'openai', 'ollama']);

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

// ============================================================================
// Clarification Dialog Types (Plan Mode)
// ============================================================================

/**
 * Option in a clarification dialog
 * Based on Claude Agent SDK's AskUserQuestion pattern
 */
export interface ClarificationOption {
  id: string;
  label: string;
  description: string;
  shortcut?: string; // Keyboard shortcut (e.g., "1", "2", "3")
}

/**
 * Clarification question from the agent
 * Used during plan mode to gather user preferences
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  options: ClarificationOption[];
  allowCustom: boolean; // Allow "Type something else..."
  allowSkip: boolean;
  defaultOption?: string;
}

/**
 * User response to a clarification question
 */
export interface ClarificationResponse {
  questionId: string;
  selectedOptionId?: string;
  customResponse?: string;
  skipped: boolean;
}

/**
 * Common clarification templates
 */
export const CLARIFICATION_TEMPLATES = {
  detailLevel: {
    question: 'How detailed do you want this?',
    options: [
      { id: 'quick', label: 'Quick summary', description: 'Key points and action items', shortcut: '1' },
      { id: 'detailed', label: 'Detailed notes', description: 'Full breakdown with context', shortcut: '2' },
      { id: 'actions-only', label: 'Just the action items', description: 'To-dos only, nothing else', shortcut: '3' },
    ],
  },
  outputFormat: {
    question: 'What format should I use?',
    options: [
      { id: 'markdown', label: 'Markdown', description: 'Plain text with formatting', shortcut: '1' },
      { id: 'doc', label: 'Document', description: 'Word/Google Doc format', shortcut: '2' },
      { id: 'slides', label: 'Presentation', description: 'PowerPoint/Keynote slides', shortcut: '3' },
    ],
  },
  confirmAction: {
    question: 'Should I proceed with this action?',
    options: [
      { id: 'yes', label: 'Yes, proceed', description: 'Execute the planned action', shortcut: '1' },
      { id: 'modify', label: 'Modify first', description: 'Let me adjust the plan', shortcut: '2' },
      { id: 'cancel', label: 'Cancel', description: "Don't do this", shortcut: '3' },
    ],
  },
} as const;

// ============================================================================
// Progress & Artifacts Types (Working View)
// ============================================================================

/**
 * Progress step status
 */
export type ProgressStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Progress step in the execution
 */
export interface ProgressStep {
  id: string;
  label: string;
  status: ProgressStepStatus;
  order: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Artifact type
 */
export type ArtifactType = 'file' | 'url' | 'presentation' | 'spreadsheet' | 'document' | 'image' | 'data';

/**
 * Artifact created during task execution
 * Enhanced version with more metadata
 */
export interface TaskArtifact {
  id: string;
  type: ArtifactType;
  name: string;
  path?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  preview?: string; // Base64 preview image or text excerpt
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Context file used as input
 */
export interface ContextFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder' | 'url' | 'integration';
  icon?: string;
  selected: boolean;
}

/**
 * Working view state
 * Represents the full state of the "working" UI panel
 */
export interface WorkingViewState {
  // Progress panel
  progressSteps: ProgressStep[];
  currentStepId?: string;
  overallProgress: number; // 0-100

  // Artifacts panel
  artifacts: TaskArtifact[];

  // Context panel
  contextFiles: ContextFile[];

  // Chat/Response panel
  messages: AgentMessage[];
  isThinking: boolean;

  // Preview panel
  activeArtifactId?: string;
}

/**
 * Agent message in the chat
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  artifacts?: string[]; // Artifact IDs referenced
  isStreaming?: boolean;
}

// ============================================================================
// Plan Mode Types
// ============================================================================

/**
 * Execution plan created during plan mode
 */
export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
}

/**
 * Step in an execution plan
 */
export interface PlanStep {
  id: string;
  order: number;
  description: string;
  tools: string[]; // Tool names that will be used
  status: ProgressStepStatus;
  result?: string;
  error?: string;
}

// ============================================================================
// Skills System Types
// ============================================================================

/**
 * Skill definition
 * Skills are reusable capabilities that work across all providers
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'file' | 'browser' | 'data' | 'communication' | 'custom';
  requiredTools: string[];
  promptTemplate: string;
  parameters: SkillParameter[];
  examples: string[];
}

/**
 * Skill parameter
 */
export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'files';
  description: string;
  required: boolean;
  default?: unknown;
}

/**
 * Skill execution context
 */
export interface SkillContext {
  skillId: string;
  parameters: Record<string, unknown>;
  workingDirectory: string;
  contextFiles: string[];
}

/**
 * Skill execution result
 */
export interface SkillResult {
  success: boolean;
  output?: string;
  artifacts?: TaskArtifact[];
  error?: string;
  duration: number;
}

// ============================================================================
// Default Skills
// ============================================================================

export const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'summarize-meetings',
    name: 'Summarize Meetings',
    description: 'Extract key points and action items from meeting transcripts',
    category: 'data',
    requiredTools: ['read_file', 'write_file'],
    promptTemplate: `Analyze the meeting transcripts and create:
1. A summary document with key discussion points
2. A list of action items with owners and due dates
3. Any decisions that were made

Input files: {files}
Output format: {format}
Detail level: {detailLevel}`,
    parameters: [
      { name: 'files', type: 'files', description: 'Meeting transcript files', required: true },
      { name: 'format', type: 'string', description: 'Output format (markdown, doc, slides)', required: false, default: 'markdown' },
      { name: 'detailLevel', type: 'string', description: 'Level of detail', required: false, default: 'detailed' },
    ],
    examples: [
      'Summarize my meetings from this week',
      'Create action items from the Q4 planning meeting',
      'What were the key decisions from yesterday\'s standup?',
    ],
  },
  {
    id: 'create-presentation',
    name: 'Create Presentation',
    description: 'Generate a presentation from content or data',
    category: 'creative',
    requiredTools: ['read_file', 'write_file'],
    promptTemplate: `Create a presentation with the following:
- Topic: {topic}
- Audience: {audience}
- Number of slides: {slides}
- Style: {style}

Use the provided context files for data and content.`,
    parameters: [
      { name: 'topic', type: 'string', description: 'Presentation topic', required: true },
      { name: 'audience', type: 'string', description: 'Target audience', required: false, default: 'general' },
      { name: 'slides', type: 'number', description: 'Number of slides', required: false, default: 5 },
      { name: 'style', type: 'string', description: 'Visual style', required: false, default: 'professional' },
    ],
    examples: [
      'Create a standup deck for this week',
      'Make a presentation about our Q4 results',
      'Build a pitch deck for the new feature',
    ],
  },
  {
    id: 'analyze-data',
    name: 'Analyze Data',
    description: 'Analyze data files and generate insights',
    category: 'data',
    requiredTools: ['read_file', 'write_file'],
    promptTemplate: `Analyze the provided data and:
1. Identify key trends and patterns
2. Generate summary statistics
3. Create visualizations or charts as needed
4. Provide actionable insights

Data files: {files}
Analysis type: {analysisType}
Output format: {format}`,
    parameters: [
      { name: 'files', type: 'files', description: 'Data files to analyze', required: true },
      { name: 'analysisType', type: 'string', description: 'Type of analysis', required: false, default: 'general' },
      { name: 'format', type: 'string', description: 'Output format', required: false, default: 'markdown' },
    ],
    examples: [
      'Crunch the numbers from the sales report',
      'Analyze user feedback from the survey',
      'What trends do you see in this data?',
    ],
  },
];
