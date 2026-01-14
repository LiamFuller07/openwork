import type { Task, TaskStatus, ProgressUpdate } from './types.js';

/**
 * Event emitter type for progress updates
 */
type ProgressCallback = (update: ProgressUpdate) => void;

/**
 * ProgressTracker - Manages task state and emits progress updates
 */
export class ProgressTracker {
  private tasks: Map<string, Task>;
  private callbacks: Set<ProgressCallback>;
  private rootTaskId: string | null;

  constructor() {
    this.tasks = new Map();
    this.callbacks = new Set();
    this.rootTaskId = null;
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(callback: ProgressCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Emit a progress update to all subscribers
   */
  private emit(update: ProgressUpdate): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  /**
   * Register a task tree for tracking
   */
  registerTask(task: Task, isRoot = true): void {
    this.tasks.set(task.id, task);

    if (isRoot) {
      this.rootTaskId = task.id;
    }

    // Register all subtasks recursively
    task.subtasks.forEach((subtask) => {
      this.registerTask(subtask, false);
    });
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get the root task
   */
  getRootTask(): Task | undefined {
    return this.rootTaskId ? this.tasks.get(this.rootTaskId) : undefined;
  }

  /**
   * Get all tasks as a flat array
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Update task status
   */
  updateStatus(taskId: string, status: TaskStatus, message?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Task not found: ${taskId}`);
      return;
    }

    const previousStatus = task.status;
    task.status = status;

    // Update timestamps
    if (status === 'in_progress' && previousStatus === 'pending') {
      task.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      task.completedAt = new Date();
    }

    // Update progress based on status
    if (status === 'completed') {
      task.progress = 100;
    } else if (status === 'failed' || status === 'cancelled') {
      // Keep current progress
    } else if (status === 'in_progress') {
      task.progress = Math.max(task.progress, 10); // At least 10% when started
    }

    // Recalculate parent progress
    this.recalculateProgress();

    // Emit update
    this.emit({
      taskId,
      status,
      progress: task.progress,
      message,
    });
  }

  /**
   * Update task progress (0-100)
   */
  updateProgress(taskId: string, progress: number, message?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Task not found: ${taskId}`);
      return;
    }

    task.progress = Math.min(100, Math.max(0, progress));

    // Auto-update status based on progress
    if (progress >= 100 && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
    } else if (progress > 0 && task.status === 'pending') {
      task.status = 'in_progress';
      task.startedAt = new Date();
    }

    // Recalculate parent progress
    this.recalculateProgress();

    // Emit update
    this.emit({
      taskId,
      status: task.status,
      progress: task.progress,
      message,
    });
  }

  /**
   * Set task result
   */
  setResult(taskId: string, result: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.result = result;
    }
  }

  /**
   * Set task error
   */
  setError(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.error = error;
      task.status = 'failed';
      task.completedAt = new Date();

      this.emit({
        taskId,
        status: 'failed',
        progress: task.progress,
        message: error,
      });
    }
  }

  /**
   * Recalculate progress for parent tasks based on children
   */
  private recalculateProgress(): void {
    const rootTask = this.getRootTask();
    if (rootTask) {
      this.calculateTaskProgress(rootTask);
    }
  }

  /**
   * Recursively calculate task progress
   */
  private calculateTaskProgress(task: Task): number {
    if (task.subtasks.length === 0) {
      return task.progress;
    }

    // Calculate based on subtask progress
    const totalProgress = task.subtasks.reduce((sum, subtask) => {
      return sum + this.calculateTaskProgress(subtask);
    }, 0);

    task.progress = Math.round(totalProgress / task.subtasks.length);
    return task.progress;
  }

  /**
   * Get a summary of current progress
   */
  getSummary(): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    overallProgress: number;
  } {
    const tasks = this.getAllTasks();
    const rootTask = this.getRootTask();

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
      overallProgress: rootTask?.progress || 0,
    };
  }

  /**
   * Reset all tasks to pending state
   */
  reset(): void {
    this.tasks.forEach((task) => {
      task.status = 'pending';
      task.progress = 0;
      task.result = undefined;
      task.error = undefined;
      task.startedAt = undefined;
      task.completedAt = undefined;
    });
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks.clear();
    this.rootTaskId = null;
  }
}
