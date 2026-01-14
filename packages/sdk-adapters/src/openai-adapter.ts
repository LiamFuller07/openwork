import OpenAI from 'openai';
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
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends AdapterConfig {
  apiKey: string;
  model?: string;
  organization?: string;
}

/**
 * OpenAI SDK Adapter
 *
 * Integrates with OpenAI's models including GPT-5 and Codex.
 * Supports plan mode and function calling.
 */
export class OpenAIAdapter extends BaseSDKAdapter {
  name = 'openai';
  displayName = 'OpenAI (GPT)';
  supportedModels = [
    'gpt-5',
    'gpt-5-codex',
    'gpt-4o',
    'gpt-4-turbo',
    'o3',
    'o1',
  ];

  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });
    this.model = config.model || 'gpt-4o';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  async *chat(messages: Message[], tools?: Tool[]): AsyncGenerator<ChatChunk> {
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const openaiTools = tools ? this.convertTools(tools) : undefined;

    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 4096,
      messages: openaiMessages,
      tools: openaiTools,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { type: 'text', content: delta.content };
      }
    }

    yield { type: 'done' };
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content || '';
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are an AI that creates execution plans. Output only valid JSON.`,
        },
        {
          role: 'user',
          content: `Create a plan for: ${task}

Available tools:
${toolDescriptions}
${contextInfo}

Output format:
{
  "goal": "description",
  "steps": [{"id": "step_1", "description": "...", "toolsNeeded": [], "dependencies": []}],
  "estimatedComplexity": "low" | "medium" | "high",
  "requiredApprovals": []
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    try {
      const plan = JSON.parse(response.choices[0]?.message?.content || '{}');
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
    const toolMap = new Map(tools.map((t) => [t.name, t]));
    const openaiTools = this.convertTools(tools);

    let messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that executes tasks using available tools.',
      },
      {
        role: 'user',
        content: `Execute this step: ${step.description}`,
      },
    ];

    let iteration = 0;
    const maxIterations = 10;
    const outputs: string[] = [];

    while (iteration < maxIterations) {
      iteration++;
      onProgress({
        message: `Executing step (iteration ${iteration})...`,
        progress: (iteration / maxIterations) * 80,
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: openaiTools,
        max_tokens: this.config.maxTokens || 4096,
      });

      const choice = response.choices[0];
      const message = choice?.message;

      if (message?.content) {
        outputs.push(message.content);
      }

      if (choice?.finish_reason === 'tool_calls' && message?.tool_calls) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const tool = toolMap.get(toolCall.function.name);

          if (tool) {
            onProgress({
              message: `Using tool: ${toolCall.function.name}`,
              progress: (iteration / maxIterations) * 80 + 10,
            });

            const args = JSON.parse(toolCall.function.arguments);
            const result = await this.executeTool(tool, args);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          }
        }
      } else if (choice?.finish_reason === 'stop') {
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

  protected convertTools(tools: Tool[]): OpenAI.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }
}

/**
 * Create an OpenAI adapter instance
 */
export function createOpenAIAdapter(config: OpenAIConfig): OpenAIAdapter {
  return new OpenAIAdapter(config);
}
