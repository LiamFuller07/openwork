/**
 * @openwork/sdk-adapters
 *
 * Multi-provider SDK adapters for OpenWork.
 * Supports Claude, Gemini, OpenAI, and Ollama with unified interface.
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

// Gemini adapter
export { GeminiAdapter, createGeminiAdapter, type GeminiConfig } from './gemini-adapter.js';

// OpenAI adapter
export { OpenAIAdapter, createOpenAIAdapter, type OpenAIConfig } from './openai-adapter.js';

// Ollama adapter (local models)
export { OllamaAdapter, createOllamaAdapter, type OllamaConfig } from './ollama-adapter.js';

import type { AIProvider } from '@openwork/core';
import { ClaudeAdapter, type ClaudeConfig } from './claude-adapter.js';
import { GeminiAdapter, type GeminiConfig } from './gemini-adapter.js';
import { OpenAIAdapter, type OpenAIConfig } from './openai-adapter.js';
import { OllamaAdapter, type OllamaConfig } from './ollama-adapter.js';
import type { BaseSDKAdapter, AgentMode } from './base-adapter.js';

/**
 * Adapter configuration union type
 */
export type AnyAdapterConfig = ClaudeConfig | GeminiConfig | OpenAIConfig | OllamaConfig;

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
    case 'gemini':
      return new GeminiAdapter(config as GeminiConfig);
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
      return ClaudeAdapter.prototype.supportedModels || [
        'claude-opus-4-5-20251101',
        'claude-sonnet-4-20250514',
        'claude-haiku-3-5-20241022',
      ];
    case 'gemini':
      return GeminiAdapter.prototype.supportedModels || [
        'gemini-2.5-pro',
        'gemini-3-pro',
        'gemini-2.0-flash',
      ];
    case 'openai':
      return OpenAIAdapter.prototype.supportedModels || [
        'gpt-5',
        'gpt-5-codex',
        'gpt-4o',
        'o3',
      ];
    case 'ollama':
      return OllamaAdapter.prototype.supportedModels || [
        'llama3.3',
        'qwen2.5',
        'deepseek-r1',
        'codellama',
      ];
    default:
      return [];
  }
}

/**
 * Get all supported providers
 */
export const SUPPORTED_PROVIDERS: { id: AIProvider; name: string; requiresApiKey: boolean }[] = [
  { id: 'claude', name: 'Claude (Anthropic)', requiresApiKey: true },
  { id: 'gemini', name: 'Gemini (Google)', requiresApiKey: true },
  { id: 'openai', name: 'OpenAI (GPT)', requiresApiKey: true },
  { id: 'ollama', name: 'Ollama (Local)', requiresApiKey: false },
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
