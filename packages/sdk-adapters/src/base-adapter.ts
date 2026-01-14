import type { Tool, ToolResult, Message, ChatChunk, AgentResult } from '@openwork/core';

/**
 * Agent execution mode
 */
export type AgentMode = 'plan' | 'execute' | 'auto';

/**
 * Plan step from task planning
 */
export interface PlanStep {
  id: string;
  description: string;
  toolsNeeded: string[];
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Execution plan
 */
export interface ExecutionPlan {
  goal: string;
  steps: PlanStep[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  requiredApprovals: string[];
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: {
  message: string;
  progress: number;
  step?: PlanStep;
  planUpdate?: ExecutionPlan;
}) => void;

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  mode?: AgentMode;
  planApprovalRequired?: boolean;
}

/**
 * Base SDK Adapter interface
 *
 * All SDK adapters must implement this interface.
 * The default mode is 'plan' which creates an execution plan before acting.
 */
export abstract class BaseSDKAdapter {
  abstract name: string;
  abstract displayName: string;
  abstract supportedModels: string[];

  protected config: AdapterConfig;
  protected mode: AgentMode;

  constructor(config: AdapterConfig = {}) {
    this.config = config;
    this.mode = config.mode || 'plan'; // Default to plan mode (like Claude Agent SDK)
  }

  /**
   * Get the current mode
   */
  getMode(): AgentMode {
    return this.mode;
  }

  /**
   * Set the execution mode
   */
  setMode(mode: AgentMode): void {
    this.mode = mode;
  }

  /**
   * Check if this adapter is properly configured
   */
  abstract isConfigured(): boolean;

  /**
   * Validate the API key
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * Stream chat completion
   */
  abstract chat(messages: Message[], tools?: Tool[]): AsyncGenerator<ChatChunk>;

  /**
   * Single completion (non-streaming)
   */
  abstract complete(prompt: string): Promise<string>;

  /**
   * Create an execution plan for a task
   * This is the core of plan mode - creates a plan before execution
   */
  abstract createPlan(
    task: string,
    tools: Tool[],
    context?: { workingDirectory?: string; contextFiles?: string[] }
  ): Promise<ExecutionPlan>;

  /**
   * Execute a single plan step
   */
  abstract executeStep(
    step: PlanStep,
    tools: Tool[],
    onProgress: ProgressCallback
  ): Promise<{ success: boolean; output?: string; error?: string }>;

  /**
   * Run the agent with the configured mode
   *
   * In 'plan' mode (default):
   *   1. Creates an execution plan
   *   2. Optionally waits for user approval
   *   3. Executes steps sequentially
   *   4. Reports progress for each step
   *
   * In 'execute' mode:
   *   Executes directly without planning
   *
   * In 'auto' mode:
   *   Decides based on task complexity
   */
  async runAgent(
    task: string,
    tools: Tool[],
    onProgress: ProgressCallback,
    options?: {
      context?: { workingDirectory?: string; contextFiles?: string[] };
      onPlanCreated?: (plan: ExecutionPlan) => Promise<boolean>; // Returns true to approve
    }
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Determine execution mode
      let effectiveMode = this.mode;
      if (effectiveMode === 'auto') {
        effectiveMode = await this.determineMode(task);
      }

      if (effectiveMode === 'plan') {
        // Plan mode: Create plan first
        onProgress({ message: 'Creating execution plan...', progress: 5 });

        const plan = await this.createPlan(task, tools, options?.context);

        onProgress({
          message: `Plan created with ${plan.steps.length} steps`,
          progress: 10,
          planUpdate: plan,
        });

        // Check if approval is needed
        if (this.config.planApprovalRequired && options?.onPlanCreated) {
          const approved = await options.onPlanCreated(plan);
          if (!approved) {
            return {
              success: false,
              error: 'Plan was not approved by user',
            };
          }
        }

        // Execute each step
        const progressPerStep = 80 / plan.steps.length;
        let currentProgress = 15;
        const outputs: string[] = [];

        for (const step of plan.steps) {
          step.status = 'in_progress';
          onProgress({
            message: `Executing: ${step.description}`,
            progress: currentProgress,
            step,
            planUpdate: plan,
          });

          const result = await this.executeStep(step, tools, (stepProgress) => {
            onProgress({
              ...stepProgress,
              progress: currentProgress + (stepProgress.progress / 100) * progressPerStep,
              step,
              planUpdate: plan,
            });
          });

          if (result.success) {
            step.status = 'completed';
            if (result.output) {
              outputs.push(result.output);
            }
          } else {
            step.status = 'failed';
            return {
              success: false,
              error: result.error || `Step failed: ${step.description}`,
              duration: Date.now() - startTime,
            };
          }

          currentProgress += progressPerStep;
        }

        onProgress({ message: 'Task completed successfully', progress: 100 });

        return {
          success: true,
          output: outputs.join('\n\n'),
          duration: Date.now() - startTime,
        };
      } else {
        // Execute mode: Direct execution
        return await this.executeDirectly(task, tools, onProgress);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Determine the best mode for a task
   */
  protected async determineMode(task: string): Promise<'plan' | 'execute'> {
    // Simple heuristic: use plan mode for complex tasks
    const complexIndicators = [
      'create', 'build', 'implement', 'refactor', 'analyze',
      'multiple', 'several', 'all', 'each', 'every',
      'then', 'after', 'first', 'finally',
    ];

    const taskLower = task.toLowerCase();
    const complexityScore = complexIndicators.reduce(
      (score, indicator) => score + (taskLower.includes(indicator) ? 1 : 0),
      0
    );

    return complexityScore >= 2 ? 'plan' : 'execute';
  }

  /**
   * Execute task directly without planning
   */
  protected abstract executeDirectly(
    task: string,
    tools: Tool[],
    onProgress: ProgressCallback
  ): Promise<AgentResult>;

  /**
   * Convert tools to provider-specific format
   */
  protected abstract convertTools(tools: Tool[]): unknown;

  /**
   * Execute a tool call
   */
  protected async executeTool(tool: Tool, input: unknown): Promise<ToolResult> {
    try {
      return await tool.execute(input);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }
}
