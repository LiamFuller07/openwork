/**
 * @openwork/file-tools
 *
 * Sandboxed file system operations for OpenWork.
 * All file operations are restricted to a specified working directory.
 */

// Core sandbox
export { FileSandbox } from './sandbox.js';

// File tools
export { createReadFileTool, createReadDirTool } from './read.js';
export { createWriteFileTool, createAppendFileTool, createCreateDirTool, createDeleteFileTool } from './write.js';
export { createEditFileTool, createInsertLineTool, createReplaceLinesTool } from './edit.js';
export { createGlobTool, createSearchTool } from './glob.js';

import type { Tool } from '@openwork/core';
import { FileSandbox } from './sandbox.js';
import { createReadFileTool, createReadDirTool } from './read.js';
import { createWriteFileTool, createAppendFileTool, createCreateDirTool, createDeleteFileTool } from './write.js';
import { createEditFileTool, createInsertLineTool, createReplaceLinesTool } from './edit.js';
import { createGlobTool, createSearchTool } from './glob.js';

/**
 * Create all file tools with a shared sandbox
 */
export function createFileTools(workingDirectory: string, options?: { enableBackups?: boolean }): {
  sandbox: FileSandbox;
  tools: Tool[];
} {
  const sandbox = new FileSandbox(workingDirectory, options);

  const tools: Tool[] = [
    // Read operations
    createReadFileTool(sandbox),
    createReadDirTool(sandbox),

    // Write operations
    createWriteFileTool(sandbox),
    createAppendFileTool(sandbox),
    createCreateDirTool(sandbox),
    createDeleteFileTool(sandbox),

    // Edit operations
    createEditFileTool(sandbox),
    createInsertLineTool(sandbox),
    createReplaceLinesTool(sandbox),

    // Search operations
    createGlobTool(sandbox),
    createSearchTool(sandbox),
  ];

  return { sandbox, tools };
}

/**
 * Get tool descriptions for documentation
 */
export function getToolDescriptions(): { name: string; description: string }[] {
  return [
    { name: 'read_file', description: 'Read the contents of a file' },
    { name: 'read_directory', description: 'List files and directories' },
    { name: 'write_file', description: 'Write content to a file (creates backup)' },
    { name: 'append_file', description: 'Append content to end of file' },
    { name: 'create_directory', description: 'Create a new directory' },
    { name: 'delete_file', description: 'Delete a file or directory (creates backup)' },
    { name: 'edit_file', description: 'Find and replace text in a file' },
    { name: 'insert_line', description: 'Insert content at a specific line' },
    { name: 'replace_lines', description: 'Replace a range of lines' },
    { name: 'glob_files', description: 'Find files matching a glob pattern' },
    { name: 'search_files', description: 'Search for patterns in file contents' },
  ];
}
