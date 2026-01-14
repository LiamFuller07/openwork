import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSandbox } from './sandbox.js';
import type { Tool, ToolResult, JSONSchema } from '@openwork/core';

/**
 * Write file tool input schema
 */
const WRITE_FILE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path where to write the file (relative to working directory)',
    },
    content: {
      type: 'string',
      description: 'Content to write to the file',
    },
    encoding: {
      type: 'string',
      description: 'File encoding (default: utf-8)',
      enum: ['utf-8', 'utf-16', 'ascii'],
      default: 'utf-8',
    },
    createDirectories: {
      type: 'boolean',
      description: 'Create parent directories if they do not exist',
      default: true,
    },
    overwrite: {
      type: 'boolean',
      description: 'Overwrite if file exists (default: true)',
      default: true,
    },
  },
  required: ['path', 'content'],
};

interface WriteFileInput {
  path: string;
  content: string;
  encoding?: BufferEncoding;
  createDirectories?: boolean;
  overwrite?: boolean;
}

/**
 * Create a write file tool
 */
export function createWriteFileTool(sandbox: FileSandbox): Tool {
  return {
    name: 'write_file',
    description: 'Write content to a file. Creates the file if it does not exist. Creates a backup before overwriting.',
    inputSchema: WRITE_FILE_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const {
        path: filePath,
        content,
        encoding = 'utf-8',
        createDirectories = true,
        overwrite = true,
      } = input as WriteFileInput;

      try {
        const resolvedPath = sandbox.resolvePath(filePath);

        // Check if file exists and overwrite is disabled
        const exists = await sandbox.exists(filePath);
        if (exists && !overwrite) {
          return {
            success: false,
            error: `File already exists and overwrite is disabled: ${filePath}`,
          };
        }

        // Create backup if file exists
        if (exists) {
          await sandbox.createBackup(filePath);
        }

        // Create parent directories if needed
        if (createDirectories) {
          await sandbox.ensureParentDirectory(filePath);
        }

        // Write the file
        await fs.writeFile(resolvedPath, content, encoding);

        // Get file stats
        const stats = await fs.stat(resolvedPath);

        return {
          success: true,
          output: {
            path: filePath,
            size: stats.size,
            created: !exists,
            overwritten: exists,
            encoding,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to write file',
        };
      }
    },
  };
}

/**
 * Append to file tool schema
 */
const APPEND_FILE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file (relative to working directory)',
    },
    content: {
      type: 'string',
      description: 'Content to append to the file',
    },
    newline: {
      type: 'boolean',
      description: 'Add a newline before appending (default: true)',
      default: true,
    },
  },
  required: ['path', 'content'],
};

interface AppendFileInput {
  path: string;
  content: string;
  newline?: boolean;
}

/**
 * Create an append file tool
 */
export function createAppendFileTool(sandbox: FileSandbox): Tool {
  return {
    name: 'append_file',
    description: 'Append content to the end of a file.',
    inputSchema: APPEND_FILE_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: filePath, content, newline = true } = input as AppendFileInput;

      try {
        const resolvedPath = sandbox.resolvePath(filePath);

        // Check if file exists
        const exists = await sandbox.exists(filePath);
        if (!exists) {
          return {
            success: false,
            error: `File not found: ${filePath}`,
          };
        }

        // Create backup
        await sandbox.createBackup(filePath);

        // Append content
        const contentToAppend = newline ? `\n${content}` : content;
        await fs.appendFile(resolvedPath, contentToAppend, 'utf-8');

        // Get updated stats
        const stats = await fs.stat(resolvedPath);

        return {
          success: true,
          output: {
            path: filePath,
            appendedBytes: Buffer.byteLength(contentToAppend, 'utf-8'),
            newSize: stats.size,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to append to file',
        };
      }
    },
  };
}

/**
 * Create directory tool schema
 */
const CREATE_DIR_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to create (relative to working directory)',
    },
    recursive: {
      type: 'boolean',
      description: 'Create parent directories if needed',
      default: true,
    },
  },
  required: ['path'],
};

interface CreateDirInput {
  path: string;
  recursive?: boolean;
}

/**
 * Create a create directory tool
 */
export function createCreateDirTool(sandbox: FileSandbox): Tool {
  return {
    name: 'create_directory',
    description: 'Create a new directory.',
    inputSchema: CREATE_DIR_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: dirPath, recursive = true } = input as CreateDirInput;

      try {
        const resolvedPath = sandbox.resolvePath(dirPath);

        // Check if already exists
        if (await sandbox.exists(dirPath)) {
          const isDir = await sandbox.isDirectory(dirPath);
          if (isDir) {
            return {
              success: true,
              output: {
                path: dirPath,
                created: false,
                message: 'Directory already exists',
              },
            };
          }
          return {
            success: false,
            error: `Path exists but is not a directory: ${dirPath}`,
          };
        }

        // Create directory
        await fs.mkdir(resolvedPath, { recursive });

        return {
          success: true,
          output: {
            path: dirPath,
            created: true,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create directory',
        };
      }
    },
  };
}

/**
 * Delete file tool schema
 */
const DELETE_FILE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to delete (relative to working directory)',
    },
    recursive: {
      type: 'boolean',
      description: 'For directories, delete contents recursively',
      default: false,
    },
  },
  required: ['path'],
};

interface DeleteFileInput {
  path: string;
  recursive?: boolean;
}

/**
 * Create a delete file tool
 */
export function createDeleteFileTool(sandbox: FileSandbox): Tool {
  return {
    name: 'delete_file',
    description: 'Delete a file or directory. Creates a backup before deletion.',
    inputSchema: DELETE_FILE_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: targetPath, recursive = false } = input as DeleteFileInput;

      try {
        const resolvedPath = sandbox.resolvePath(targetPath);

        // Check if exists
        if (!(await sandbox.exists(targetPath))) {
          return {
            success: false,
            error: `Path not found: ${targetPath}`,
          };
        }

        // Create backup before deletion
        if (await sandbox.isFile(targetPath)) {
          await sandbox.createBackup(targetPath);
        }

        // Delete
        const isDir = await sandbox.isDirectory(targetPath);
        if (isDir) {
          if (!recursive) {
            return {
              success: false,
              error: 'Cannot delete directory without recursive flag',
            };
          }
          await fs.rm(resolvedPath, { recursive: true });
        } else {
          await fs.unlink(resolvedPath);
        }

        return {
          success: true,
          output: {
            path: targetPath,
            deleted: true,
            type: isDir ? 'directory' : 'file',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete',
        };
      }
    },
  };
}
