import { Ollama } from 'ollama';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseSDKAdapter,
  type AdapterConfig,
  type ExecutionPlan,
  type PlanStep,
  type ProgressCallback,
} from './base-adapter.js';
import type { Tool, Message, ChatChunk, AgentResult } from '@openwork/core';

/**
 * Ollama-specific configuration
 */
export interface OllamaConfig extends AdapterConfig {
  host?: string;
  model?: string;
}

/**
 * Ollama SDK Adapter
 *
 * Integrates with local Ollama models.
 * Perfect for privacy-focused users or offline usage.
 */
export class OllamaAdapter extends BaseSDKAdapter {
  name = 'ollama';
  displayName = 'Ollama (Local)';
  supportedModels = [
    'llama3.3',
    'llama3.2',
    'qwen2.5',
    'deepseek-r1',
    'codellama',
    'mistral',
    'mixtral',
  ];

  private client: Ollama;
  private model: string;

  constructor(config: OllamaConfig = {}) {
    super(config);
    this.client = new Ollama({ host: config.host || 'http://localhost:11434' });
    this.model = config.model || 'llama3.3';
  }

  isConfigured(): boolean {
    // Ollama doesn't require API key, just needs to be running
    return true;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List available local models
   */
  async listLocalModels(): Promise<string[]> {
    try {
      const response = await this.client.list();
      return response.models.map((m) => m.name);
    } catch {
      return [];
    }
  }

  async *chat(messages: Message[], tools?: Tool[]): AsyncGenerator<ChatChunk> {
    const ollamaMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Note: Ollama tool support is model-dependent
    const response = await this.client.chat({
      model: this.model,
      messages: ollamaMessages,
      stream: true,
    });

    for await (const chunk of response) {
      if (chunk.message?.content) {
        yield { type: 'text', content: chunk.message.content };
      }
    }

    yield { type: 'done' };
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.generate({
      model: this.model,
      prompt,
      stream: false,
    });

    return response.response;
  }

  async createPlan(
    task: string,
    tools: Tool[],
    context?: { workingDirectory?: string; contextFiles?: string[] }
  ): Promise<ExecutionPlan> {
    const toolDescriptions = tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    const contextInfo = context
      ? `\nWorking directory: ${context.workingDirectory || 'Not specified'}
Context files: ${context.contextFiles?.join(', ') || 'None'}`
      : '';

    const prompt = `You are an AI that creates execution plans. Output only valid JSON.

Available tools:
${toolDescriptions}
${contextInfo}

Task: ${task}

Create a plan as JSON:
{
  "goal": "description",
  "steps": [{"id": "step_1", "description": "...", "toolsNeeded": [], "dependencies": []}],
  "estimatedComplexity": "medium",
  "requiredApprovals": []
}

JSON only:`;

    const response = await this.complete(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const plan = JSON.parse(jsonMatch[0]);
      return {
        goal: plan.goal || task,
        steps: (plan.steps || []).map((step: Partial<PlanStep>, index: number) => ({
          id: step.id || `step_${index + 1}`,
          description: step.description || 'Execute step',
          toolsNeeded: step.toolsNeeded || [],
          dependencies: step.dependencies || [],
          status: 'pending' as const,
        })),
        estimatedComplexity: plan.estimatedComplexity || 'medium',
        requiredApprovals: plan.requiredApprovals || [],
      };
    } catch {
      return {
        goal: task,
        steps: [
          {
            id: 'step_1',
            description: task,
            toolsNeeded: [],
            dependencies: [],
            status: 'pending',
          },
        ],
        estimatedComplexity: 'medium',
        requiredApprovals: [],
      };
    }
  }

  async executeStep(
    step: PlanStep,
    tools: Tool[],
    onProgress: ProgressCallback
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    // Ollama doesn't have native tool calling for most models
    // We'll use a ReAct-style approach
    const toolMap = new Map(tools.map((t) => [t.name, t]));
    const toolList = tools.map((t) => `${t.name}: ${t.description}`).join('\n');

    let context = `You are executing a task step by step.

Available tools (call with TOOL: tool_name({"arg": "value"})):
${toolList}

Task: ${step.description}

Think through what you need to do, then either:
1. Use a tool: TOOL: tool_name({"arg": "value"})
2. Complete with: DONE: your final response

Begin:`;

    let iteration = 0;
    const maxIterations = 10;
    const outputs: string[] = [];

    while (iteration < maxIterations) {
      iteration++;
      onProgress({
        message: `Executing step (iteration ${iteration})...`,
        progress: (iteration / maxIterations) * 80,
      });

      const response = await this.complete(context);
      outputs.push(response);

      // Check for tool call
      const toolMatch = response.match(/TOOL:\s*(\w+)\s*\(([\s\S]*?)\)/);
      if (toolMatch) {
        const [, toolName, argsStr] = toolMatch;
        const tool = toolMap.get(toolName);

        if (tool) {
          try {
            onProgress({
              message: `Using tool: ${toolName}`,
              progress: (iteration / maxIterations) * 80 + 10,
            });

            const args = JSON.parse(argsStr);
            const result = await this.executeTool(tool, args);

            context += `\n\nTool ${toolName} result: ${JSON.stringify(result)}\n\nContinue:`;
          } catch (e) {
            context += `\n\nTool ${toolName} error: ${e}\n\nContinue:`;
          }
        } else {
          context += `\n\nTool ${toolName} not found. Available: ${tools.map((t) => t.name).join(', ')}\n\nContinue:`;
        }
      }

      // Check for done
      if (response.includes('DONE:')) {
        const doneMatch = response.match(/DONE:\s*([\s\S]*)/);
        if (doneMatch) {
          outputs.push(doneMatch[1].trim());
        }
        break;
      }

      // Check if model stopped without explicit DONE (natural completion)
      if (!toolMatch && !response.includes('TOOL:')) {
        break;
      }
    }

    return {
      success: true,
      output: outputs.join('\n'),
    };
  }

  protected async executeDirectly(
    task: string,
    tools: Tool[],
    onProgress: ProgressCallback
  ): Promise<AgentResult> {
    onProgress({ message: 'Executing task directly...', progress: 10 });

    const result = await this.executeStep(
      {
        id: 'direct',
        description: task,
        toolsNeeded: [],
        dependencies: [],
        status: 'in_progress',
      },
      tools,
      onProgress
    );

    onProgress({ message: 'Task completed', progress: 100 });

    return {
      success: result.success,
      output: result.output,
      error: result.error,
    };
  }

  protected convertTools(tools: Tool[]): unknown {
    // Ollama uses different formats depending on model
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }
}

/**
 * Create an Ollama adapter instance
 */
export function createOllamaAdapter(config: OllamaConfig = {}): OllamaAdapter {
  return new OllamaAdapter(config);
}
