/**
 * @openwork/sdk-adapters
 *
 * Multi-provider SDK adapters for OpenWork.
 * Supports Claude (recommended), OpenAI, and Ollama with unified interface.
 *
 * Default mode is 'plan' - creates execution plans before acting.
 */

// Base adapter
export {
  BaseSDKAdapter,
  type AdapterConfig,
  type AgentMode,
  type ExecutionPlan,
  type PlanStep,
  type ProgressCallback,
} from './base-adapter.js';

// Claude adapter (primary, recommended)
export { ClaudeAdapter, createClaudeAdapter, type ClaudeConfig } from './claude-adapter.js';

// OpenAI adapter
export { OpenAIAdapter, createOpenAIAdapter, type OpenAIConfig } from './openai-adapter.js';

// Ollama adapter (local models)
export { OllamaAdapter, createOllamaAdapter, type OllamaConfig } from './ollama-adapter.js';

import type { AIProvider } from '@openwork/core';
import { ClaudeAdapter, type ClaudeConfig } from './claude-adapter.js';
import { OpenAIAdapter, type OpenAIConfig } from './openai-adapter.js';
import { OllamaAdapter, type OllamaConfig } from './ollama-adapter.js';
import type { BaseSDKAdapter, AgentMode } from './base-adapter.js';

/**
 * Adapter configuration union type
 */
export type AnyAdapterConfig = ClaudeConfig | OpenAIConfig | OllamaConfig;

/**
 * Create an adapter based on provider type
 */
export function createAdapter(
  provider: AIProvider,
  config: AnyAdapterConfig & { mode?: AgentMode }
): BaseSDKAdapter {
  switch (provider) {
    case 'claude':
      return new ClaudeAdapter(config as ClaudeConfig);
    case 'openai':
      return new OpenAIAdapter(config as OpenAIConfig);
    case 'ollama':
      return new OllamaAdapter(config as OllamaConfig);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get supported models for a provider
 */
export function getSupportedModels(provider: AIProvider): string[] {
  switch (provider) {
    case 'claude':
      return [
        'claude-opus-4-5-20251101',
        'claude-sonnet-4-20250514',
        'claude-haiku-3-5-20241022',
      ];
    case 'openai':
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'o3',
        'o3-mini',
      ];
    case 'ollama':
      return [
        'llama3.3',
        'llama3.2',
        'qwen2.5',
        'deepseek-r1',
        'codellama',
        'mistral',
      ];
    default:
      return [];
  }
}

/**
 * Get all supported providers
 */
export const SUPPORTED_PROVIDERS: { id: AIProvider; name: string; requiresApiKey: boolean; description: string }[] = [
  {
    id: 'claude',
    name: 'Claude',
    requiresApiKey: true,
    description: 'Anthropic\'s Claude models (recommended for best results)'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    description: 'OpenAI GPT and reasoning models'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    requiresApiKey: false,
    description: 'Run local models - no API key needed'
  },
];

/**
 * Check if a provider is available (has valid configuration)
 */
export async function isProviderAvailable(
  provider: AIProvider,
  config: AnyAdapterConfig
): Promise<boolean> {
  try {
    const adapter = createAdapter(provider, config);
    return await adapter.validateApiKey();
  } catch {
    return false;
  }
}

/**
 * Universal plan mode system prompt
 * This prompt works across all providers to enable consistent planning behavior
 */
export const UNIVERSAL_PLAN_MODE_PROMPT = `You are an AI assistant in PLAN MODE. Before taking any actions, you must:

1. UNDERSTAND the request fully
2. GATHER information by asking clarifying questions when needed
3. CREATE a step-by-step execution plan
4. PRESENT the plan for user approval
5. Only EXECUTE after approval

## Clarifying Questions

When the request is ambiguous or has multiple valid approaches, ask the user using this format:

QUESTION: [Your question]
OPTIONS:
1. [Option 1 label] - [Brief description]
2. [Option 2 label] - [Brief description]
3. [Option 3 label] - [Brief description]
4. Type something else...

SKIP: [yes/no - whether the user can skip this question]

Wait for the user's response before proceeding.

## Execution Plan Format

Once you understand the requirements, present your plan:

PLAN: [Brief title]

STEPS:
1. [Step description] - Tools: [tool names]
2. [Step description] - Tools: [tool names]
3. [Step description] - Tools: [tool names]

ARTIFACTS: [List of files/outputs that will be created]

CONTEXT NEEDED: [List of files/info you need access to]

---

Ask "Should I proceed with this plan?" and wait for approval before executing.

## During Execution

Report progress as you complete each step:
✓ Step 1: [Description] - Complete
→ Step 2: [Description] - In progress...
○ Step 3: [Description] - Pending

## Important Rules

- NEVER execute actions without a plan being approved
- ALWAYS ask clarifying questions when requirements are unclear
- ALWAYS report progress on each step
- If something fails, explain what went wrong and ask how to proceed
`;

/**
 * Get provider-specific plan mode prompt
 */
export function getPlanModePrompt(provider: AIProvider): string {
  // Base prompt works for all providers
  let prompt = UNIVERSAL_PLAN_MODE_PROMPT;

  // Add provider-specific enhancements
  switch (provider) {
    case 'claude':
      prompt += `\n\n## Claude-Specific Guidelines
- Use your extended thinking capability for complex planning
- Leverage your strong file analysis capabilities
- Take advantage of your large context window for comprehensive understanding`;
      break;

    case 'openai':
      prompt += `\n\n## OpenAI-Specific Guidelines
- Use structured outputs when presenting plans
- Leverage function calling for precise tool execution
- Break complex tasks into smaller, verifiable steps`;
      break;

    case 'ollama':
      prompt += `\n\n## Local Model Guidelines
- Keep plans concise due to smaller context windows
- Prefer simple, direct tool usage
- Ask for clarification early to avoid wasted computation`;
      break;
  }

  return prompt;
}
