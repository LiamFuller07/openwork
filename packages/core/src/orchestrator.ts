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
  ClarificationQuestion,
  ClarificationOption,
  TaskArtifact,
  ProgressStep,
  AIProvider,
} from './types.js';

// ============================================================================
// Universal Plan Mode Prompt
// ============================================================================

/**
 * Universal plan mode prompt that works across all providers (Claude, OpenAI, Ollama)
 * Based on Claude Agent SDK's AskUserQuestion pattern
 */
export const PLAN_MODE_SYSTEM_PROMPT = `You are an AI assistant in PLAN MODE. Before taking any actions, you must:

1. **UNDERSTAND** the user's request fully
2. **ANALYZE** what information is needed
3. **ASK** clarifying questions when needed (use the clarification format below)
4. **PLAN** a step-by-step execution approach
5. **PRESENT** the plan for user approval
6. **EXECUTE** only after receiving explicit approval

## Clarification Questions

When you need user input, output a clarification question in this exact JSON format:

\`\`\`json
{
  "type": "clarification",
  "question": "Your question here?",
  "options": [
    { "id": "opt1", "label": "Option Label", "description": "What this option means", "shortcut": "1" },
    { "id": "opt2", "label": "Another Option", "description": "What this means", "shortcut": "2" }
  ],
  "allowCustom": true,
  "allowSkip": false
}
\`\`\`

Guidelines for options:
- Provide 2-4 options maximum
- First option should be your recommendation (add "Recommended" to description)
- Each option needs a unique shortcut (1, 2, 3, 4)
- Set allowCustom:true to let user type their own response
- Set allowSkip:true only if the question is optional

## Execution Plan Format

After gathering requirements, output your plan in this format:

\`\`\`json
{
  "type": "plan",
  "title": "Brief plan title",
  "steps": [
    { "id": "step1", "label": "Step description", "order": 1 },
    { "id": "step2", "label": "Another step", "order": 2 }
  ],
  "estimatedArtifacts": [
    { "type": "file", "name": "output.csv", "description": "The processed data" }
  ]
}
\`\`\`

## Progress Reporting

During execution, report progress:

\`\`\`json
{
  "type": "progress",
  "stepId": "step1",
  "status": "in_progress" | "completed" | "failed",
  "message": "What you're doing"
}
\`\`\`

## Artifact Creation

When you create an artifact:

\`\`\`json
{
  "type": "artifact",
  "artifact": {
    "id": "unique-id",
    "type": "file" | "presentation" | "document" | "data",
    "name": "artifact name",
    "path": "/path/to/file",
    "preview": "optional preview content"
  }
}
\`\`\`

## Important Rules

1. ALWAYS start by understanding the request - don't assume
2. Ask clarifying questions BEFORE planning when requirements are unclear
3. Break complex tasks into 3-7 clear steps
4. Report progress on each step as you work
5. Create artifacts for any files, documents, or outputs generated
6. If something goes wrong, report the error and suggest alternatives`;

/**
 * Get provider-specific system prompt additions
 */
export function getProviderPromptAdditions(provider: AIProvider): string {
  const additions: Record<AIProvider, string> = {
    claude: `
## Claude-Specific Notes
- You have access to Claude's extended thinking capabilities
- Use artifacts for rich content (documents, code, visualizations)
- Leverage tool use for file operations and browser automation`,

    openai: `
## OpenAI-Specific Notes
- Use function calling for structured tool interactions
- GPT models excel at following structured output formats
- Use the specified JSON formats exactly as shown`,

    ollama: `
## Local Model Notes
- Optimize prompts for efficiency on local hardware
- Keep responses focused and avoid unnecessary verbosity
- JSON output should be clean and parseable`,
  };

  return additions[provider] || '';
}

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
 * Plan Mode state for clarification flow
 */
export interface PlanModeState {
  isActive: boolean;
  phase: 'understanding' | 'clarifying' | 'planning' | 'awaiting_approval' | 'executing';
  pendingClarification: ClarificationQuestion | null;
  clarificationResponses: Map<string, string>;
  currentPlan: ProgressStep[] | null;
  estimatedArtifacts: Array<{ type: string; name: string; description: string }>;
}

/**
 * Event callbacks for UI integration
 */
export interface OrchestratorCallbacks {
  onClarificationNeeded?: (question: ClarificationQuestion) => void;
  onPlanReady?: (steps: ProgressStep[]) => void;
  onProgressUpdate?: (stepId: string, status: string, message?: string) => void;
  onArtifactCreated?: (artifact: TaskArtifact) => void;
  onMessage?: (role: 'user' | 'assistant', content: string) => void;
  onError?: (error: string) => void;
}

/**
 * AgentOrchestrator - Main coordinator for OpenWork
 *
 * Responsibilities:
 * - Task planning and decomposition with clarification flow
 * - Universal plan mode across all providers
 * - Tool registration and execution
 * - Progress tracking and reporting
 * - SDK adapter management
 * - Skill system coordination
 * - Artifact management
 */
export class AgentOrchestrator {
  private session: OpenWorkSession;
  private adapter: SDKAdapter | null;
  private tools: Map<string, Tool>;
  private skills: Map<string, Skill>;
  private taskPlanner: TaskPlanner;
  private progressTracker: ProgressTracker;
  private isRunning: boolean;

  // Plan mode state
  private planMode: PlanModeState;
  private artifacts: Map<string, TaskArtifact>;
  private callbacks: OrchestratorCallbacks;

  constructor(config?: Partial<AgentConfig>) {
    this.session = this.createSession(config);
    this.adapter = null;
    this.tools = new Map();
    this.skills = new Map();
    this.taskPlanner = new TaskPlanner();
    this.progressTracker = new ProgressTracker();
    this.isRunning = false;

    // Initialize plan mode state
    this.planMode = {
      isActive: true, // Plan mode is default
      phase: 'understanding',
      pendingClarification: null,
      clarificationResponses: new Map(),
      currentPlan: null,
      estimatedArtifacts: [],
    };
    this.artifacts = new Map();
    this.callbacks = {};
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
    this.resetPlanMode();
  }

  // ============================================================================
  // Plan Mode Methods
  // ============================================================================

  /**
   * Set UI callbacks for event handling
   */
  setCallbacks(callbacks: OrchestratorCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get full system prompt for current provider
   */
  getSystemPrompt(): string {
    const provider = this.session.config.provider as AIProvider;
    return PLAN_MODE_SYSTEM_PROMPT + getProviderPromptAdditions(provider);
  }

  /**
   * Start a new task with plan mode (default behavior)
   */
  async startTask(userRequest: string): Promise<void> {
    if (!this.adapter) {
      this.callbacks.onError?.('No SDK adapter configured');
      throw new Error('No SDK adapter configured');
    }

    // Reset plan mode for new task
    this.resetPlanMode();
    this.planMode.isActive = true;
    this.planMode.phase = 'understanding';

    // Emit user message
    this.callbacks.onMessage?.('user', userRequest);

    // Build initial prompt
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildUserPrompt(userRequest);

    // Get initial response from LLM
    const response = await this.adapter.complete(`${systemPrompt}\n\n${userPrompt}`);

    // Parse and handle response
    await this.handleLLMResponse(response);
  }

  /**
   * Respond to a clarification question
   */
  async respondToClarification(response: string): Promise<void> {
    if (!this.planMode.pendingClarification) {
      return;
    }

    const questionId = this.planMode.pendingClarification.id;
    this.planMode.clarificationResponses.set(questionId, response);
    this.planMode.pendingClarification = null;

    // Continue the conversation with the response
    if (this.adapter) {
      const continuationPrompt = `User selected: ${response}\n\nPlease continue with the planning process.`;
      const llmResponse = await this.adapter.complete(continuationPrompt);
      await this.handleLLMResponse(llmResponse);
    }
  }

  /**
   * Approve the current plan and start execution
   */
  async approvePlan(): Promise<void> {
    if (this.planMode.phase !== 'awaiting_approval' || !this.planMode.currentPlan) {
      return;
    }

    this.planMode.phase = 'executing';

    // Execute the plan
    for (const step of this.planMode.currentPlan) {
      this.callbacks.onProgressUpdate?.(step.id, 'in_progress', `Working on: ${step.label}`);

      if (this.adapter) {
        const stepPrompt = `Execute step: ${step.label}\n\nReport progress and create artifacts as needed.`;
        const response = await this.adapter.complete(stepPrompt);
        await this.handleLLMResponse(response);
      }

      this.callbacks.onProgressUpdate?.(step.id, 'completed');
    }
  }

  /**
   * Reject the current plan and request modifications
   */
  async rejectPlan(feedback: string): Promise<void> {
    if (this.planMode.phase !== 'awaiting_approval') {
      return;
    }

    this.planMode.phase = 'planning';

    if (this.adapter) {
      const revisionPrompt = `The user has requested changes to the plan:\n\n${feedback}\n\nPlease revise the plan accordingly.`;
      const response = await this.adapter.complete(revisionPrompt);
      await this.handleLLMResponse(response);
    }
  }

  /**
   * Get current plan mode state
   */
  getPlanModeState(): PlanModeState {
    return { ...this.planMode };
  }

  /**
   * Get all artifacts
   */
  getArtifacts(): TaskArtifact[] {
    return Array.from(this.artifacts.values());
  }

  /**
   * Reset plan mode to initial state
   */
  private resetPlanMode(): void {
    this.planMode = {
      isActive: true,
      phase: 'understanding',
      pendingClarification: null,
      clarificationResponses: new Map(),
      currentPlan: null,
      estimatedArtifacts: [],
    };
    this.artifacts.clear();
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(userRequest: string): string {
    return `User Request: ${userRequest}

Working Directory: ${this.session.workingDirectory}
Context Files: ${this.session.contextFiles.join(', ') || 'None'}
Available Tools: ${Array.from(this.tools.keys()).join(', ') || 'None'}

Please analyze this request and proceed with the plan mode workflow.`;
  }

  /**
   * Handle LLM response and extract structured data
   */
  private async handleLLMResponse(response: string): Promise<void> {
    // Emit assistant message
    this.callbacks.onMessage?.('assistant', response);

    // Try to extract JSON blocks from response
    const jsonBlocks = this.extractJsonBlocks(response);

    for (const block of jsonBlocks) {
      try {
        const data = JSON.parse(block);
        await this.processStructuredOutput(data);
      } catch {
        // Not valid JSON, ignore
      }
    }
  }

  /**
   * Extract JSON code blocks from response
   */
  private extractJsonBlocks(response: string): string[] {
    const blocks: string[] = [];
    const jsonRegex = /```json\s*([\s\S]*?)```/g;
    let match;

    while ((match = jsonRegex.exec(response)) !== null) {
      blocks.push(match[1].trim());
    }

    // Also try to find inline JSON objects
    const inlineRegex = /\{[\s\S]*?"type"\s*:\s*"(clarification|plan|progress|artifact)"[\s\S]*?\}/g;
    while ((match = inlineRegex.exec(response)) !== null) {
      if (!blocks.includes(match[0])) {
        blocks.push(match[0]);
      }
    }

    return blocks;
  }

  /**
   * Process structured output from LLM
   */
  private async processStructuredOutput(data: Record<string, unknown>): Promise<void> {
    const type = data.type as string;

    switch (type) {
      case 'clarification':
        await this.handleClarification(data);
        break;
      case 'plan':
        await this.handlePlan(data);
        break;
      case 'progress':
        await this.handleProgress(data);
        break;
      case 'artifact':
        await this.handleArtifact(data);
        break;
    }
  }

  /**
   * Handle clarification question from LLM
   */
  private async handleClarification(data: Record<string, unknown>): Promise<void> {
    this.planMode.phase = 'clarifying';

    const question: ClarificationQuestion = {
      id: uuidv4(),
      question: data.question as string,
      options: (data.options as ClarificationOption[]) || [],
      allowCustom: (data.allowCustom as boolean) ?? true,
      allowSkip: (data.allowSkip as boolean) ?? false,
    };

    this.planMode.pendingClarification = question;
    this.callbacks.onClarificationNeeded?.(question);
  }

  /**
   * Handle plan from LLM
   */
  private async handlePlan(data: Record<string, unknown>): Promise<void> {
    this.planMode.phase = 'awaiting_approval';

    const stepsData = data.steps as Array<{ id: string; label: string; order: number }>;
    const steps: ProgressStep[] = stepsData.map((s, i) => ({
      id: s.id || uuidv4(),
      label: s.label,
      status: 'pending' as const,
      order: s.order || i + 1,
    }));

    this.planMode.currentPlan = steps;
    this.planMode.estimatedArtifacts = (data.estimatedArtifacts as Array<{
      type: string;
      name: string;
      description: string;
    }>) || [];

    this.callbacks.onPlanReady?.(steps);
  }

  /**
   * Handle progress update from LLM
   */
  private async handleProgress(data: Record<string, unknown>): Promise<void> {
    const stepId = data.stepId as string;
    const status = data.status as string;
    const message = data.message as string | undefined;

    this.callbacks.onProgressUpdate?.(stepId, status, message);

    // Update plan mode state
    if (this.planMode.currentPlan) {
      const step = this.planMode.currentPlan.find((s) => s.id === stepId);
      if (step) {
        step.status = status as ProgressStep['status'];
      }
    }
  }

  /**
   * Handle artifact creation from LLM
   */
  private async handleArtifact(data: Record<string, unknown>): Promise<void> {
    const artifactData = data.artifact as Record<string, unknown>;
    const artifact: TaskArtifact = {
      id: (artifactData.id as string) || uuidv4(),
      type: artifactData.type as TaskArtifact['type'],
      name: artifactData.name as string,
      path: artifactData.path as string | undefined,
      preview: artifactData.preview as string | undefined,
      createdAt: new Date(),
    };

    this.artifacts.set(artifact.id, artifact);
    this.callbacks.onArtifactCreated?.(artifact);
  }
}
