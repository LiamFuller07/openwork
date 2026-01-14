import { GoogleGenerativeAI, type GenerativeModel, type Part, type Content } from '@google/generative-ai';
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
 * Gemini-specific configuration
 */
export interface GeminiConfig extends AdapterConfig {
  apiKey: string;
  model?: string;
}

/**
 * Gemini SDK Adapter
 *
 * Integrates with Google's Gemini models via their SDK.
 * Supports Gemini 2.5 Pro and Gemini 3 Pro with plan mode.
 */
export class GeminiAdapter extends BaseSDKAdapter {
  name = 'gemini';
  displayName = 'Gemini (Google)';
  supportedModels = [
    'gemini-2.5-pro',
    'gemini-3-pro',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
  ];

  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;

  constructor(config: GeminiConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-2.5-pro';
    this.model = this.client.getGenerativeModel({ model: this.modelName });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.model.generateContent('Hello');
      return true;
    } catch {
      return false;
    }
  }

  async *chat(messages: Message[], tools?: Tool[]): AsyncGenerator<ChatChunk> {
    const history: Content[] = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = this.model.startChat({
      history,
      tools: tools ? [{ functionDeclarations: this.convertTools(tools) }] : undefined,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { type: 'text', content: text };
      }
    }

    yield { type: 'done' };
  }

  async complete(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    return result.response.text();
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

    const prompt = `You are an AI assistant that creates execution plans for tasks.

Available tools:
${toolDescriptions}
${contextInfo}

User task: ${task}

Create a JSON execution plan:
{
  "goal": "Brief goal description",
  "steps": [
    {
      "id": "step_1",
      "description": "Step description",
      "toolsNeeded": ["tool_name"],
      "dependencies": []
    }
  ],
  "estimatedComplexity": "low" | "medium" | "high",
  "requiredApprovals": []
}

Output only the JSON, no other text.`;

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
    const toolMap = new Map(tools.map((t) => [t.name, t]));

    const chat = this.model.startChat({
      tools: [{ functionDeclarations: this.convertTools(tools) }],
    });

    let iteration = 0;
    const maxIterations = 10;
    const outputs: string[] = [];

    let response = await chat.sendMessage(
      `Execute this step: ${step.description}\n\nUse the available tools as needed.`
    );

    while (iteration < maxIterations) {
      iteration++;
      onProgress({
        message: `Executing step (iteration ${iteration})...`,
        progress: (iteration / maxIterations) * 80,
      });

      const candidate = response.response.candidates?.[0];
      if (!candidate) break;

      const parts = candidate.content.parts;
      let hasToolCall = false;

      for (const part of parts) {
        if ('text' in part && part.text) {
          outputs.push(part.text);
        } else if ('functionCall' in part && part.functionCall) {
          hasToolCall = true;
          const funcCall = part.functionCall;
          const tool = toolMap.get(funcCall.name);

          if (tool) {
            onProgress({
              message: `Using tool: ${funcCall.name}`,
              progress: (iteration / maxIterations) * 80 + 10,
            });

            const result = await this.executeTool(tool, funcCall.args);

            // Send function response back
            response = await chat.sendMessage([
              {
                functionResponse: {
                  name: funcCall.name,
                  response: result,
                },
              },
            ]);
          }
        }
      }

      if (!hasToolCall) {
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

  protected convertTools(tools: Tool[]): Array<{
    name: string;
    description: string;
    parameters: unknown;
  }> {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));
  }
}

/**
 * Create a Gemini adapter instance
 */
export function createGeminiAdapter(config: GeminiConfig): GeminiAdapter {
  return new GeminiAdapter(config);
}
