import * as fs from 'node:fs/promises';
import { FileSandbox } from './sandbox.js';
import type { Tool, ToolResult, JSONSchema } from '@openwork/core';

/**
 * Edit file tool schema - for making targeted edits to files
 */
const EDIT_FILE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file to edit (relative to working directory)',
    },
    oldText: {
      type: 'string',
      description: 'The exact text to find and replace',
    },
    newText: {
      type: 'string',
      description: 'The text to replace with',
    },
    replaceAll: {
      type: 'boolean',
      description: 'Replace all occurrences (default: false, only first)',
      default: false,
    },
  },
  required: ['path', 'oldText', 'newText'],
};

interface EditFileInput {
  path: string;
  oldText: string;
  newText: string;
  replaceAll?: boolean;
}

/**
 * Create an edit file tool (search and replace)
 */
export function createEditFileTool(sandbox: FileSandbox): Tool {
  return {
    name: 'edit_file',
    description: 'Edit a file by finding and replacing text. Creates a backup before editing.',
    inputSchema: EDIT_FILE_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: filePath, oldText, newText, replaceAll = false } = input as EditFileInput;

      try {
        const resolvedPath = sandbox.resolvePath(filePath);

        // Check if file exists
        if (!(await sandbox.exists(filePath))) {
          return {
            success: false,
            error: `File not found: ${filePath}`,
          };
        }

        // Read current content
        const content = await fs.readFile(resolvedPath, 'utf-8');

        // Check if old text exists
        if (!content.includes(oldText)) {
          return {
            success: false,
            error: `Text not found in file: "${oldText.substring(0, 50)}${oldText.length > 50 ? '...' : ''}"`,
          };
        }

        // Create backup
        await sandbox.createBackup(filePath);

        // Perform replacement
        let newContent: string;
        let replacementCount: number;

        if (replaceAll) {
          const parts = content.split(oldText);
          replacementCount = parts.length - 1;
          newContent = parts.join(newText);
        } else {
          replacementCount = 1;
          newContent = content.replace(oldText, newText);
        }

        // Write updated content
        await fs.writeFile(resolvedPath, newContent, 'utf-8');

        return {
          success: true,
          output: {
            path: filePath,
            replacements: replacementCount,
            originalLength: content.length,
            newLength: newContent.length,
            diff: newContent.length - content.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to edit file',
        };
      }
    },
  };
}

/**
 * Insert at line tool schema
 */
const INSERT_LINE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file (relative to working directory)',
    },
    lineNumber: {
      type: 'number',
      description: 'Line number to insert at (1-indexed)',
    },
    content: {
      type: 'string',
      description: 'Content to insert',
    },
  },
  required: ['path', 'lineNumber', 'content'],
};

interface InsertLineInput {
  path: string;
  lineNumber: number;
  content: string;
}

/**
 * Create an insert at line tool
 */
export function createInsertLineTool(sandbox: FileSandbox): Tool {
  return {
    name: 'insert_line',
    description: 'Insert content at a specific line number in a file.',
    inputSchema: INSERT_LINE_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: filePath, lineNumber, content } = input as InsertLineInput;

      try {
        const resolvedPath = sandbox.resolvePath(filePath);

        // Check if file exists
        if (!(await sandbox.exists(filePath))) {
          return {
            success: false,
            error: `File not found: ${filePath}`,
          };
        }

        // Read current content
        const fileContent = await fs.readFile(resolvedPath, 'utf-8');
        const lines = fileContent.split('\n');

        // Validate line number
        if (lineNumber < 1 || lineNumber > lines.length + 1) {
          return {
            success: false,
            error: `Invalid line number: ${lineNumber}. File has ${lines.length} lines.`,
          };
        }

        // Create backup
        await sandbox.createBackup(filePath);

        // Insert content
        lines.splice(lineNumber - 1, 0, content);
        const newContent = lines.join('\n');

        // Write updated content
        await fs.writeFile(resolvedPath, newContent, 'utf-8');

        return {
          success: true,
          output: {
            path: filePath,
            insertedAt: lineNumber,
            newLineCount: lines.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to insert line',
        };
      }
    },
  };
}

/**
 * Replace lines tool schema
 */
const REPLACE_LINES_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file (relative to working directory)',
    },
    startLine: {
      type: 'number',
      description: 'First line to replace (1-indexed, inclusive)',
    },
    endLine: {
      type: 'number',
      description: 'Last line to replace (1-indexed, inclusive)',
    },
    content: {
      type: 'string',
      description: 'Content to replace the lines with',
    },
  },
  required: ['path', 'startLine', 'endLine', 'content'],
};

interface ReplaceLinesInput {
  path: string;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Create a replace lines tool
 */
export function createReplaceLinesTool(sandbox: FileSandbox): Tool {
  return {
    name: 'replace_lines',
    description: 'Replace a range of lines in a file with new content.',
    inputSchema: REPLACE_LINES_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const { path: filePath, startLine, endLine, content } = input as ReplaceLinesInput;

      try {
        const resolvedPath = sandbox.resolvePath(filePath);

        // Check if file exists
        if (!(await sandbox.exists(filePath))) {
          return {
            success: false,
            error: `File not found: ${filePath}`,
          };
        }

        // Read current content
        const fileContent = await fs.readFile(resolvedPath, 'utf-8');
        const lines = fileContent.split('\n');

        // Validate line numbers
        if (startLine < 1 || endLine > lines.length || startLine > endLine) {
          return {
            success: false,
            error: `Invalid line range: ${startLine}-${endLine}. File has ${lines.length} lines.`,
          };
        }

        // Create backup
        await sandbox.createBackup(filePath);

        // Replace lines
        const newLines = content.split('\n');
        const linesRemoved = endLine - startLine + 1;
        lines.splice(startLine - 1, linesRemoved, ...newLines);
        const newContent = lines.join('\n');

        // Write updated content
        await fs.writeFile(resolvedPath, newContent, 'utf-8');

        return {
          success: true,
          output: {
            path: filePath,
            replacedRange: `${startLine}-${endLine}`,
            linesRemoved,
            linesAdded: newLines.length,
            newLineCount: lines.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to replace lines',
        };
      }
    },
  };
}
