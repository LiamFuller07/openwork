import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * Security sandbox for file operations
 * Ensures all file access is within the allowed directory
 */
export class FileSandbox {
  private allowedDirectory: string;
  private backupsEnabled: boolean;
  private backupDirectory: string;

  constructor(allowedDirectory: string, options?: { enableBackups?: boolean }) {
    this.allowedDirectory = path.resolve(allowedDirectory);
    this.backupsEnabled = options?.enableBackups ?? true;
    this.backupDirectory = path.join(this.allowedDirectory, '.openwork-backups');
  }

  /**
   * Get the allowed directory
   */
  getAllowedDirectory(): string {
    return this.allowedDirectory;
  }

  /**
   * Validate that a path is within the sandbox
   */
  validatePath(targetPath: string): { valid: boolean; resolvedPath: string; error?: string } {
    try {
      const resolved = path.resolve(this.allowedDirectory, targetPath);

      // Security check: ensure resolved path is within allowed directory
      if (!resolved.startsWith(this.allowedDirectory + path.sep) && resolved !== this.allowedDirectory) {
        return {
          valid: false,
          resolvedPath: resolved,
          error: `Path escapes sandbox: ${targetPath}`,
        };
      }

      // Check for suspicious patterns
      if (targetPath.includes('..') && !resolved.startsWith(this.allowedDirectory)) {
        return {
          valid: false,
          resolvedPath: resolved,
          error: `Path traversal detected: ${targetPath}`,
        };
      }

      return { valid: true, resolvedPath: resolved };
    } catch (error) {
      return {
        valid: false,
        resolvedPath: '',
        error: `Invalid path: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Resolve a path within the sandbox
   */
  resolvePath(targetPath: string): string {
    const validation = this.validatePath(targetPath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    return validation.resolvedPath;
  }

  /**
   * Check if a path exists within the sandbox
   */
  async exists(targetPath: string): Promise<boolean> {
    const resolved = this.resolvePath(targetPath);
    return existsSync(resolved);
  }

  /**
   * Get file stats
   */
  async stat(targetPath: string): Promise<fs.FileHandle | null> {
    const resolved = this.resolvePath(targetPath);
    try {
      const stats = await fs.stat(resolved);
      return stats as unknown as fs.FileHandle;
    } catch {
      return null;
    }
  }

  /**
   * Create a backup of a file before modification
   */
  async createBackup(targetPath: string): Promise<string | null> {
    if (!this.backupsEnabled) {
      return null;
    }

    const resolved = this.resolvePath(targetPath);

    if (!existsSync(resolved)) {
      return null;
    }

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDirectory, { recursive: true });

      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const relativePath = path.relative(this.allowedDirectory, resolved);
      const backupPath = path.join(
        this.backupDirectory,
        `${relativePath.replace(/\//g, '_')}_${timestamp}`
      );

      // Copy file to backup location
      await fs.copyFile(resolved, backupPath);

      return backupPath;
    } catch (error) {
      console.warn('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * List files in a directory within the sandbox
   */
  async listDirectory(targetPath: string = '.'): Promise<string[]> {
    const resolved = this.resolvePath(targetPath);
    const entries = await fs.readdir(resolved);

    // Filter out backup directory
    return entries.filter((entry) => entry !== '.openwork-backups');
  }

  /**
   * Check if path is a directory
   */
  async isDirectory(targetPath: string): Promise<boolean> {
    const resolved = this.resolvePath(targetPath);
    try {
      const stats = await fs.stat(resolved);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if path is a file
   */
  async isFile(targetPath: string): Promise<boolean> {
    const resolved = this.resolvePath(targetPath);
    try {
      const stats = await fs.stat(resolved);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Ensure parent directory exists
   */
  async ensureParentDirectory(targetPath: string): Promise<void> {
    const resolved = this.resolvePath(targetPath);
    const parentDir = path.dirname(resolved);
    await fs.mkdir(parentDir, { recursive: true });
  }

  /**
   * Get relative path from sandbox root
   */
  getRelativePath(absolutePath: string): string {
    return path.relative(this.allowedDirectory, absolutePath);
  }

  /**
   * Clean up old backups (keep last N)
   */
  async cleanupBackups(keepCount: number = 10): Promise<void> {
    if (!existsSync(this.backupDirectory)) {
      return;
    }

    const backups = await fs.readdir(this.backupDirectory);
    const sortedBackups = backups.sort().reverse();

    // Delete old backups
    for (let i = keepCount; i < sortedBackups.length; i++) {
      const backupPath = path.join(this.backupDirectory, sortedBackups[i]);
      await fs.unlink(backupPath);
    }
  }
}
