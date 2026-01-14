import { v4 as uuidv4 } from 'uuid';
import { TaskPlanner } from './task-planner.js';
import { ProgressTracker } from './progress-tracker.js';
import type {
  Task,
  Tool,
  ToolResult,
  AgentConfig,
  OpenWorkSession,
  AgentResult,
  ProgressUpdate,
  Message,
  ChatChunk,
} from './types.js';

/**
 * SDK Adapter interface - implemented by sdk-adapters package
 */
export interface SDKAdapter {
  name: string;
  supportedModels: string[];

  chat(messages: Message[], tools?: Tool[]): AsyncGenerator<ChatChunk>;
  complete(prompt: string): Promise<string>;
  runAgent(
    task: string,
    tools: Tool[],
    onProgress: (progress: { message: string; progress: number }) => void
  ): Promise<AgentResult>;
}

/**
 * Skill definition - extensible actions
 */
export interface Skill {
  name: string;
  description: string;
  category: string;
  execute: (context: SkillContext) => Promise<SkillResult>;
}

export interface SkillContext {
  session: OpenWorkSession;
  tools: Map<string, Tool>;
  adapter: SDKAdapter;
  input: Record<string, unknown>;
}

export interface SkillResult {
  success: boolean;
  output?: string;
  artifacts?: { type: string; name: string; data: unknown }[];
  error?: string;
}

/**
 * AgentOrchestrator - Main coordinator for OpenWork
 *
 * Responsibilities:
 * - Task planning and decomposition
 * - Tool registration and execution
 * - Progress tracking and reporting
 * - SDK adapter management
 * - Skill system coordination
 */
export class AgentOrchestrator {
  private session: OpenWorkSession;
  private adapter: SDKAdapter | null;
  private tools: Map<string, Tool>;
  private skills: Map<string, Skill>;
  private taskPlanner: TaskPlanner;
  private progressTracker: ProgressTracker;
  private isRunning: boolean;

  constructor(config?: Partial<AgentConfig>) {
    this.session = this.createSession(config);
    this.adapter = null;
    this.tools = new Map();
    this.skills = new Map();
    this.taskPlanner = new TaskPlanner();
    this.progressTracker = new ProgressTracker();
    this.isRunning = false;
  }

  /**
   * Create a new session
   */
  private createSession(config?: Partial<AgentConfig>): OpenWorkSession {
    return {
      id: uuidv4(),
      workingDirectory: process.cwd(),
      contextFiles: [],
      tasks: [],
      config: {
        provider: config?.provider || 'claude',
        model: config?.model || 'claude-sonnet-4',
        apiKey: config?.apiKey,
        baseUrl: config?.baseUrl,
        maxTokens: config?.maxTokens || 4096,
        temperature: config?.temperature || 0.7,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Set the SDK adapter
   */
  setAdapter(adapter: SDKAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get current adapter
   */
  getAdapter(): SDKAdapter | null {
    return this.adapter;
  }

  /**
   * Set working directory
   */
  setWorkingDirectory(path: string): void {
    this.session.workingDirectory = path;
    this.session.updatedAt = new Date();
  }

  /**
   * Get working directory
   */
  getWorkingDirectory(): string {
    return this.session.workingDirectory;
  }

  /**
   * Add context files
   */
  addContextFiles(files: string[]): void {
    this.session.contextFiles.push(...files);
    this.session.updatedAt = new Date();
  }

  /**
   * Clear context files
   */
  clearContextFiles(): void {
    this.session.contextFiles = [];
    this.session.updatedAt = new Date();
  }

  /**
   * Register a tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.taskPlanner.registerTool(tool);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: Tool[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Get registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Register a skill
   */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  /**
   * Get registered skills
   */
  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Execute a skill by name
   */
  async executeSkill(skillName: string, input: Record<string, unknown>): Promise<SkillResult> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      return { success: false, error: `Skill not found: ${skillName}` };
    }

    if (!this.adapter) {
      return { success: false, error: 'No SDK adapter configured' };
    }

    const context: SkillContext = {
      session: this.session,
      tools: this.tools,
      adapter: this.adapter,
      input,
    };

    try {
      return await skill.execute(context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (update: ProgressUpdate) => void): () => void {
    return this.progressTracker.subscribe(callback);
  }

  /**
   * Plan a task (break into subtasks)
   */
  async planTask(userRequest: string): Promise<Task> {
    if (!this.adapter) {
      throw new Error('No SDK adapter configured. Call setAdapter() first.');
    }

    // Get planning prompt with available tools
    const planningPrompt = this.taskPlanner.getPlanningPrompt();
    const fullPrompt = `${planningPrompt}

User request: ${userRequest}

Working directory: ${this.session.workingDirectory}
Context files: ${this.session.contextFiles.join(', ') || 'None'}

Please analyze this request and create a task plan.`;

    // Get plan from LLM
    const planResponse = await this.adapter.complete(fullPrompt);
    const plan = this.taskPlanner.parsePlanResponse(planResponse);

    // Create task tree
    const rootTask = this.taskPlanner.createTaskTree(userRequest, plan.tasks);

    // Register with progress tracker
    this.progressTracker.registerTask(rootTask);

    // Store in session
    this.session.tasks.push(rootTask);
    this.session.updatedAt = new Date();

    return rootTask;
  }

  /**
   * Execute a task and its subtasks
   */
  async executeTask(taskId: string): Promise<AgentResult> {
    if (!this.adapter) {
      throw new Error('No SDK adapter configured. Call setAdapter() first.');
    }

    const task = this.progressTracker.getTask(taskId);
    if (!task) {
      return { success: false, error: `Task not found: ${taskId}` };
    }

    if (this.isRunning) {
      return { success: false, error: 'Another task is already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Mark task as in progress
      this.progressTracker.updateStatus(taskId, 'in_progress', 'Starting task execution');

      // Execute subtasks sequentially
      if (task.subtasks.length > 0) {
        for (const subtask of task.subtasks) {
          const result = await this.executeSubtask(subtask);
          if (!result.success) {
            this.progressTracker.setError(taskId, result.error || 'Subtask failed');
            return result;
          }
        }
      } else {
        // Single task - execute directly with agent
        const result = await this.adapter.runAgent(
          task.description,
          Array.from(this.tools.values()),
          (progress) => {
            this.progressTracker.updateProgress(taskId, progress.progress, progress.message);
          }
        );

        if (!result.success) {
          this.progressTracker.setError(taskId, result.error || 'Task failed');
          return result;
        }

        this.progressTracker.setResult(taskId, result.output || '');
      }

      // Mark as completed
      this.progressTracker.updateStatus(taskId, 'completed', 'Task completed successfully');

      return {
        success: true,
        output: task.result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.progressTracker.setError(taskId, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute a single subtask
   */
  private async executeSubtask(subtask: Task): Promise<AgentResult> {
    if (!this.adapter) {
      return { success: false, error: 'No adapter configured' };
    }

    this.progressTracker.updateStatus(subtask.id, 'in_progress');

    try {
      const result = await this.adapter.runAgent(
        subtask.description,
        Array.from(this.tools.values()),
        (progress) => {
          this.progressTracker.updateProgress(subtask.id, progress.progress, progress.message);
        }
      );

      if (result.success) {
        this.progressTracker.updateStatus(subtask.id, 'completed');
        this.progressTracker.setResult(subtask.id, result.output || '');
      } else {
        this.progressTracker.setError(subtask.id, result.error || 'Failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.progressTracker.setError(subtask.id, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute a tool directly
   */
  async executeTool(toolName: string, input: unknown): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool not found: ${toolName}` };
    }

    try {
      return await tool.execute(input);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current progress
   */
  getProgress(): ReturnType<ProgressTracker['getSummary']> {
    return this.progressTracker.getSummary();
  }

  /**
   * Get current session
   */
  getSession(): OpenWorkSession {
    return { ...this.session };
  }

  /**
   * Update session config
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.session.config = { ...this.session.config, ...config };
    this.session.updatedAt = new Date();
  }

  /**
   * Cancel current task execution
   */
  cancel(): void {
    if (this.isRunning) {
      this.isRunning = false;
      const rootTask = this.progressTracker.getRootTask();
      if (rootTask) {
        this.progressTracker.updateStatus(rootTask.id, 'cancelled', 'Task cancelled by user');
      }
    }
  }

  /**
   * Reset the orchestrator
   */
  reset(): void {
    this.isRunning = false;
    this.progressTracker.clear();
    this.session.tasks = [];
    this.session.contextFiles = [];
    this.session.updatedAt = new Date();
  }
}
