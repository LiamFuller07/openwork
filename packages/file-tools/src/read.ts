import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as mimeTypes from 'mime-types';
import { FileSandbox } from './sandbox.js';
import type { Tool, ToolResult, JSONSchema } from '@openwork/core';

/**
 * Read file tool input schema
 */
const READ_FILE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file to read (relative to working directory)',
    },
    encoding: {
      type: 'string',
      description: 'File encoding (default: utf-8)',
      enum: ['utf-8', 'utf-16', 'ascii', 'base64', 'binary'],
      default: 'utf-8',
    },
    maxLines: {
      type: 'number',
      description: 'Maximum number of lines to read (default: unlimited)',
    },
    startLine: {
      type: 'number',
      description: 'Start reading from this line number (1-indexed)',
      default: 1,
    },
  },
  required: ['path'],
};

interface ReadFileInput {
  path: string;
  encoding?: BufferEncoding;
  maxLines?: number;
  startLine?: number;
}

/**
 * Create a read file tool
 */
export function createReadFileTool(sandbox: FileSandbox): Tool {
  return {
    name: 'read_file',
    description: 'Read the contents of a file. Supports text files with various encodings.',
    inputSchema: READ_FILE_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: filePath, encoding = 'utf-8', maxLines, startLine = 1 } = input as ReadFileInput;

      try {
        const resolvedPath = sandbox.resolvePath(filePath);

        // Check if file exists
        if (!(await sandbox.exists(filePath))) {
          return {
            success: false,
            error: `File not found: ${filePath}`,
          };
        }

        // Check if it's a file
        if (!(await sandbox.isFile(filePath))) {
          return {
            success: false,
            error: `Path is not a file: ${filePath}`,
          };
        }

        // Read file content
        let content = await fs.readFile(resolvedPath, encoding);

        // Apply line filtering if specified
        if (maxLines || startLine > 1) {
          const lines = content.split('\n');
          const startIndex = Math.max(0, startLine - 1);
          const endIndex = maxLines ? startIndex + maxLines : lines.length;
          content = lines.slice(startIndex, endIndex).join('\n');
        }

        // Get file metadata
        const stats = await fs.stat(resolvedPath);
        const mimeType = mimeTypes.lookup(filePath) || 'text/plain';

        return {
          success: true,
          output: {
            content,
            path: filePath,
            size: stats.size,
            mimeType,
            encoding,
            lineCount: content.split('\n').length,
            lastModified: stats.mtime.toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read file',
        };
      }
    },
  };
}

/**
 * Read directory tool schema
 */
const READ_DIR_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the directory (relative to working directory)',
      default: '.',
    },
    recursive: {
      type: 'boolean',
      description: 'Include files from subdirectories',
      default: false,
    },
    pattern: {
      type: 'string',
      description: 'Glob pattern to filter files (e.g., "*.ts")',
    },
  },
};

interface ReadDirInput {
  path?: string;
  recursive?: boolean;
  pattern?: string;
}

/**
 * Create a read directory tool
 */
export function createReadDirTool(sandbox: FileSandbox): Tool {
  return {
    name: 'read_directory',
    description: 'List files and directories in a directory.',
    inputSchema: READ_DIR_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: dirPath = '.', recursive = false } = input as ReadDirInput;

      try {
        const resolvedPath = sandbox.resolvePath(dirPath);

        // Check if it's a directory
        if (!(await sandbox.isDirectory(dirPath))) {
          return {
            success: false,
            error: `Path is not a directory: ${dirPath}`,
          };
        }

        const entries: Array<{
          name: string;
          path: string;
          type: 'file' | 'directory';
          size?: number;
        }> = [];

        const readDir = async (dir: string, basePath: string) => {
          const items = await fs.readdir(dir, { withFileTypes: true });

          for (const item of items) {
            // Skip hidden files and backup directory
            if (item.name.startsWith('.')) {
              continue;
            }

            const itemPath = path.join(basePath, item.name);
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
              entries.push({
                name: item.name,
                path: itemPath,
                type: 'directory',
              });

              if (recursive) {
                await readDir(fullPath, itemPath);
              }
            } else if (item.isFile()) {
              const stats = await fs.stat(fullPath);
              entries.push({
                name: item.name,
                path: itemPath,
                type: 'file',
                size: stats.size,
              });
            }
          }
        };

        await readDir(resolvedPath, dirPath === '.' ? '' : dirPath);

        return {
          success: true,
          output: {
            directory: dirPath,
            entries,
            totalFiles: entries.filter((e) => e.type === 'file').length,
            totalDirectories: entries.filter((e) => e.type === 'directory').length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read directory',
        };
      }
    },
  };
}
