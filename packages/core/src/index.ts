/**
 * @openwork/core
 *
 * Core agent orchestration engine for OpenWork.
 * Provides task planning, progress tracking, and SDK adapter integration.
 */

// Types
export type {
  Task,
  TaskStatus,
  AIProvider,
  AgentConfig,
  JSONSchema,
  Tool,
  ToolResult,
  Message,
  MessageRole,
  ToolCall,
  ToolCallResult,
  ChatChunk,
  ProgressUpdate,
  OpenWorkSession,
  AgentResult,
  Artifact,
  QuickAction,
  // Plan mode types
  ClarificationQuestion,
  ClarificationOption,
  TaskArtifact,
  ProgressStep,
  ProgressStepStatus,
  Skill,
  SkillParameter,
  ArtifactType,
} from './types.js';

// Schemas for validation
export {
  TaskStatusSchema,
  AIProviderSchema,
  AgentConfigSchema,
  TaskSchema,
  DEFAULT_QUICK_ACTIONS,
} from './types.js';

// Core classes
export { AgentOrchestrator } from './orchestrator.js';
export type {
  SDKAdapter,
  Skill as OrchestratorSkill,
  SkillContext,
  SkillResult,
  PlanModeState,
  OrchestratorCallbacks,
} from './orchestrator.js';

// Plan mode prompts
export {
  PLAN_MODE_SYSTEM_PROMPT,
  getProviderPromptAdditions,
} from './orchestrator.js';

export { TaskPlanner } from './task-planner.js';
export { ProgressTracker } from './progress-tracker.js';

// Re-export commonly used utilities
export { v4 as generateId } from 'uuid';

/**
 * Create a new OpenWork orchestrator with default configuration
 */
export function createOrchestrator(config?: {
  provider?: 'claude' | 'openai' | 'ollama';
  model?: string;
  apiKey?: string;
}): AgentOrchestrator {
  const { AgentOrchestrator } = require('./orchestrator.js');
  return new AgentOrchestrator(config);
}

/**
 * Create a tool definition helper
 */
export function createTool(definition: {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute: (input: unknown) => Promise<ToolResult>;
}): Tool {
  return definition;
}

/**
 * Create a skill definition helper
 */
export function createSkill(definition: {
  name: string;
  description: string;
  category: string;
  execute: (context: SkillContext) => Promise<SkillResult>;
}): Skill {
  return definition;
}
