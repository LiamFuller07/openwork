import Anthropic from '@anthropic-ai/sdk';
import { generateId } from '@openwork/core';
import {
  BaseSDKAdapter,
  type AdapterConfig,
  type ExecutionPlan,
  type PlanStep,
  type ProgressCallback,
} from './base-adapter.js';
import type { Tool, ToolResult, Message, ChatChunk, AgentResult } from '@openwork/core';

/**
 * Claude-specific configuration
 */
export interface ClaudeConfig extends AdapterConfig {
  apiKey: string;
  model?: string;
}

/**
 * System prompt for plan mode
 */
const PLAN_SYSTEM_PROMPT = `You are an AI assistant that helps users complete tasks by creating detailed execution plans.

When given a task, analyze it and create a step-by-step plan. Consider:
1. What files or resources are needed
2. What tools will be used for each step
3. Dependencies between steps
4. Potential issues or edge cases

Output your plan as JSON in this format:
{
  "goal": "Brief description of the overall goal",
  "steps": [
    {
      "id": "step_1",
      "description": "What this step accomplishes",
      "toolsNeeded": ["tool_name"],
      "dependencies": []
    }
  ],
  "estimatedComplexity": "low" | "medium" | "high",
  "requiredApprovals": []
}`;

/**
 * System prompt for step execution
 */
const EXECUTE_SYSTEM_PROMPT = `You are an AI assistant that executes tasks step by step.

You have access to various tools to help complete the task. Use them as needed.
Be thorough but efficient. Report your progress clearly.

If you encounter an error, explain what went wrong and suggest solutions.`;

/**
 * Claude SDK Adapter
 *
 * Primary adapter for OpenWork with full plan mode support.
 * Uses Claude Agent SDK patterns for robust task execution.
 */
export class ClaudeAdapter extends BaseSDKAdapter {
  name = 'claude';
  displayName = 'Claude (Anthropic)';
  supportedModels = [
    'claude-opus-4-5-20251101',
    'claude-sonnet-4-20250514',
    'claude-haiku-3-5-20241022',
    'claude-3-5-sonnet-20241022',
  ];

  private client: Anthropic;
  private model: string;

  constructor(config: ClaudeConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
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
    const anthropicMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const anthropicTools = tools ? this.convertTools(tools) : undefined;

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: this.config.maxTokens || 4096,
      messages: anthropicMessages,
      tools: anthropicTools as Anthropic.Tool[] | undefined,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta as { type: string; text?: string };
        if (delta.type === 'text_delta' && delta.text) {
          yield { type: 'text', content: delta.text };
        }
      }
    }

    yield { type: 'done' };
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
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

    const prompt = `${PLAN_SYSTEM_PROMPT}

Available tools:
${toolDescriptions}
${contextInfo}

User task: ${task}

Create a detailed execution plan for this task.`;

    const response = await this.complete(prompt);

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const plan = JSON.parse(jsonMatch[0]);

      // Normalize the plan structure
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
    } catch (error) {
      // Fallback: create a single-step plan
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
    const anthropicTools = this.convertTools(tools);

    let messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Execute this step: ${step.description}

If you need to use tools, use them. When the step is complete, summarize what was done.`,
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

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.config.maxTokens || 4096,
        system: EXECUTE_SYSTEM_PROMPT,
        messages,
        tools: anthropicTools as Anthropic.Tool[],
      });

      // Process response content
      let hasToolUse = false;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          outputs.push(block.text);
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          const tool = toolMap.get(block.name);

          if (tool) {
            onProgress({
              message: `Using tool: ${block.name}`,
              progress: (iteration / maxIterations) * 80 + 10,
            });

            const result = await this.executeTool(tool, block.input);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          } else {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ success: false, error: `Tool not found: ${block.name}` }),
            });
          }
        }
      }

      // If there were tool uses, continue the conversation
      if (hasToolUse && toolResults.length > 0) {
        messages.push({
          role: 'assistant',
          content: response.content,
        });
        messages.push({
          role: 'user',
          content: toolResults,
        });
      }

      // Check if we're done
      if (response.stop_reason === 'end_turn' && !hasToolUse) {
        return {
          success: true,
          output: outputs.join('\n'),
        };
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

  protected convertTools(tools: Tool[]): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));
  }
}

/**
 * Create a Claude adapter instance
 */
export function createClaudeAdapter(config: ClaudeConfig): ClaudeAdapter {
  return new ClaudeAdapter(config);
}
