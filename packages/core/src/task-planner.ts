import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus, Tool } from './types.js';

/**
 * System prompt for task planning
 */
const TASK_PLANNING_PROMPT = `You are an AI task planner. Your job is to break down user requests into actionable subtasks.

For each user request, analyze what needs to be done and create a structured task plan.

Guidelines:
1. Break complex tasks into 3-7 manageable subtasks
2. Each subtask should be independently completable
3. Order subtasks logically (dependencies first)
4. Be specific about what each subtask accomplishes
5. Consider what tools/resources are needed

Return your plan as a JSON array of tasks with the following structure:
{
  "tasks": [
    {
      "description": "Clear description of what to do",
      "dependencies": [], // IDs of tasks that must complete first
      "estimatedComplexity": "low" | "medium" | "high",
      "requiredTools": ["tool_name"]
    }
  ]
}`;

/**
 * Task plan from LLM
 */
interface TaskPlanItem {
  description: string;
  dependencies: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  requiredTools: string[];
}

interface TaskPlan {
  tasks: TaskPlanItem[];
}

/**
 * TaskPlanner - Breaks down user requests into actionable subtasks
 */
export class TaskPlanner {
  private availableTools: Map<string, Tool>;

  constructor(tools: Tool[] = []) {
    this.availableTools = new Map(tools.map((t) => [t.name, t]));
  }

  /**
   * Register a tool for the planner to consider
   */
  registerTool(tool: Tool): void {
    this.availableTools.set(tool.name, tool);
  }

  /**
   * Get the list of available tools for planning context
   */
  getToolDescriptions(): string {
    const tools = Array.from(this.availableTools.values());
    return tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');
  }

  /**
   * Create a task tree from a user request
   * This is called by the orchestrator with the LLM response
   */
  createTaskTree(userRequest: string, planItems: TaskPlanItem[]): Task {
    const rootTask = this.createTask(userRequest);
    const taskMap = new Map<number, Task>();

    // Create all subtasks
    planItems.forEach((item, index) => {
      const subtask = this.createTask(item.description);
      subtask.metadata = {
        complexity: item.estimatedComplexity,
        requiredTools: item.requiredTools,
        originalIndex: index,
      };
      taskMap.set(index, subtask);
    });

    // Build dependency tree (simplified - all are children of root for now)
    taskMap.forEach((subtask) => {
      rootTask.subtasks.push(subtask);
    });

    return rootTask;
  }

  /**
   * Create a single task object
   */
  createTask(description: string, status: TaskStatus = 'pending'): Task {
    return {
      id: uuidv4(),
      description,
      status,
      subtasks: [],
      progress: 0,
    };
  }

  /**
   * Get the planning system prompt with available tools
   */
  getPlanningPrompt(): string {
    const toolList = this.getToolDescriptions();
    return `${TASK_PLANNING_PROMPT}

Available tools:
${toolList || 'No tools registered yet.'}`;
  }

  /**
   * Parse the LLM response into a task plan
   */
  parsePlanResponse(response: string): TaskPlan {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid task plan structure');
      }

      return parsed as TaskPlan;
    } catch (error) {
      // Fallback: create a single task from the entire request
      console.warn('Failed to parse task plan, using fallback:', error);
      return {
        tasks: [
          {
            description: 'Complete the requested task',
            dependencies: [],
            estimatedComplexity: 'medium',
            requiredTools: [],
          },
        ],
      };
    }
  }

  /**
   * Estimate total progress based on subtask completion
   */
  calculateProgress(task: Task): number {
    if (task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0;
    }

    const weights: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };

    let totalWeight = 0;
    let completedWeight = 0;

    task.subtasks.forEach((subtask) => {
      const complexity = (subtask.metadata?.complexity as string) || 'medium';
      const weight = weights[complexity] || 2;
      totalWeight += weight;

      if (subtask.status === 'completed') {
        completedWeight += weight;
      } else if (subtask.status === 'in_progress') {
        completedWeight += weight * 0.5;
      }
    });

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Get the next pending subtask to work on
   */
  getNextSubtask(task: Task): Task | null {
    // Find the first pending subtask
    for (const subtask of task.subtasks) {
      if (subtask.status === 'pending') {
        return subtask;
      }
      // Check nested subtasks
      const nested = this.getNextSubtask(subtask);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  /**
   * Check if all subtasks are complete
   */
  isComplete(task: Task): boolean {
    if (task.subtasks.length === 0) {
      return task.status === 'completed';
    }
    return task.subtasks.every((subtask) => this.isComplete(subtask));
  }
}
