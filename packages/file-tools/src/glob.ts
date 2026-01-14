import fg from 'fast-glob';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { FileSandbox } from './sandbox.js';
import type { Tool, ToolResult, JSONSchema } from '@openwork/core';

/**
 * Glob tool schema - for finding files by pattern
 */
const GLOB_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    pattern: {
      type: 'string',
      description: 'Glob pattern to match files (e.g., "**/*.ts", "src/**/*.{js,ts}")',
    },
    ignore: {
      type: 'array',
      description: 'Patterns to ignore',
      items: { type: 'string' },
    },
    onlyFiles: {
      type: 'boolean',
      description: 'Only return files (default: true)',
      default: true,
    },
    onlyDirectories: {
      type: 'boolean',
      description: 'Only return directories (default: false)',
      default: false,
    },
    deep: {
      type: 'number',
      description: 'Maximum directory depth to search',
    },
  },
  required: ['pattern'],
};

interface GlobInput {
  pattern: string;
  ignore?: string[];
  onlyFiles?: boolean;
  onlyDirectories?: boolean;
  deep?: number;
}

/**
 * Create a glob files tool
 */
export function createGlobTool(sandbox: FileSandbox): Tool {
  return {
    name: 'glob_files',
    description: 'Find files matching a glob pattern. Useful for searching the codebase.',
    inputSchema: GLOB_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const {
        pattern,
        ignore = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.openwork-backups/**'],
        onlyFiles = true,
        onlyDirectories = false,
        deep,
      } = input as GlobInput;

      try {
        const cwd = sandbox.getAllowedDirectory();

        const matches = await fg(pattern, {
          cwd,
          ignore,
          onlyFiles,
          onlyDirectories,
          deep,
          absolute: false,
          dot: false,
        });

        // Sort by path
        matches.sort();

        // Get additional info for each match
        const results = await Promise.all(
          matches.map(async (match) => {
            const fullPath = path.join(cwd, match);
            try {
              const stats = await fs.stat(fullPath);
              return {
                path: match,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
              };
            } catch {
              return {
                path: match,
                type: 'unknown',
              };
            }
          })
        );

        return {
          success: true,
          output: {
            pattern,
            matchCount: matches.length,
            matches: results,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to glob files',
        };
      }
    },
  };
}

/**
 * Search file content tool schema
 */
const SEARCH_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    pattern: {
      type: 'string',
      description: 'Regular expression pattern to search for',
    },
    filePattern: {
      type: 'string',
      description: 'Glob pattern for files to search (default: "**/*")',
      default: '**/*',
    },
    caseSensitive: {
      type: 'boolean',
      description: 'Case-sensitive search (default: false)',
      default: false,
    },
    maxResults: {
      type: 'number',
      description: 'Maximum number of results to return (default: 50)',
      default: 50,
    },
  },
  required: ['pattern'],
};

interface SearchInput {
  pattern: string;
  filePattern?: string;
  caseSensitive?: boolean;
  maxResults?: number;
}

interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
}

/**
 * Create a search file content tool
 */
export function createSearchTool(sandbox: FileSandbox): Tool {
  return {
    name: 'search_files',
    description: 'Search for a pattern in file contents. Returns matching lines with context.',
    inputSchema: SEARCH_SCHEMA,
    execute: async (input: unknown): Promise<ToolResult> => {
      const {
        pattern,
        filePattern = '**/*',
        caseSensitive = false,
        maxResults = 50,
      } = input as SearchInput;

      try {
        const cwd = sandbox.getAllowedDirectory();
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(pattern, flags);

        // Find files to search
        const files = await fg(filePattern, {
          cwd,
          ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.openwork-backups/**'],
          onlyFiles: true,
          absolute: false,
        });

        const results: SearchResult[] = [];
        let totalMatches = 0;

        for (const file of files) {
          if (results.length >= maxResults) break;

          const fullPath = path.join(cwd, file);

          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length && results.length < maxResults; i++) {
              const line = lines[i];
              const matches = line.match(regex);

              if (matches) {
                totalMatches += matches.length;

                // Get context (surrounding lines)
                const contextStart = Math.max(0, i - 1);
                const contextEnd = Math.min(lines.length - 1, i + 1);
                const context = lines.slice(contextStart, contextEnd + 1).join('\n');

                results.push({
                  file,
                  line: i + 1,
                  column: line.indexOf(matches[0]) + 1,
                  match: matches[0],
                  context,
                });
              }
            }
          } catch {
            // Skip binary or unreadable files
            continue;
          }
        }

        return {
          success: true,
          output: {
            pattern,
            filePattern,
            totalMatches,
            resultsReturned: results.length,
            truncated: totalMatches > maxResults,
            results,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search files',
        };
      }
    },
  };
}
