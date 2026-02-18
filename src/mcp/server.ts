import * as path from 'path';
import * as fs from 'fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SymbolExtractor } from './extractor';
import { SymbolInfo, SymbolKind } from './types';

const SYMBOL_KINDS: SymbolKind[] = ['Class', 'Interface', 'Function', 'TypeAlias', 'Enum', 'Variable', 'Method'];

const DEFAULT_LIMIT = 100;
const MAX_RECURSION_DEPTH = 20;

/**
 * Resolve and validate the source directory path.
 * Ensures the resolved path is within the project root to prevent path traversal.
 */
export function resolveSrcDir(srcDir: string, projectRoot: string): string {
  const resolvedRoot = fs.realpathSync(projectRoot);
  const absolute = path.isAbsolute(srcDir) ? srcDir : path.join(resolvedRoot, srcDir);

  let resolved: string;
  try {
    resolved = fs.realpathSync(absolute);
  } catch {
    throw new Error(`Source directory does not exist: ${absolute}`);
  }

  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error(`Source directory must be within the project root: ${resolvedRoot}`);
  }

  return resolved;
}

/**
 * Collect all TypeScript files under a directory recursively.
 * Skips symlinks and respects a maximum recursion depth.
 */
export function collectTsFiles(dir: string, depth: number = 0): string[] {
  if (depth >= MAX_RECURSION_DEPTH) return [];

  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...collectTsFiles(fullPath, depth + 1));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.spec.ts')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Create an MCP server that exposes code symbol tools.
 */
export function createMcpServer(srcDir: string): McpServer {
  const server = new McpServer({
    name: 'osf-api-v2-code-symbols',
    version: '1.0.0',
  });

  const extractor = new SymbolExtractor();

  // Cache of extracted symbols per file
  let symbolCache: SymbolInfo[] | null = null;

  function getAllSymbols(): SymbolInfo[] {
    if (symbolCache) return symbolCache;

    const files = collectTsFiles(srcDir);
    const allSymbols: SymbolInfo[] = [];
    for (const file of files) {
      try {
        allSymbols.push(...extractor.extractSymbols(file));
      } catch {
        // Skip files that fail to parse
      }
    }
    symbolCache = allSymbols;
    return allSymbols;
  }

  server.tool(
    'list_symbols',
    'List code symbols from the project source files. Filter by file path, symbol kind, or name pattern.',
    {
      filePath: z.string().optional().describe('Filter by file path (substring match)'),
      kind: z
        .enum(SYMBOL_KINDS as [string, ...string[]])
        .optional()
        .describe('Filter by symbol kind'),
      pattern: z.string().optional().describe('Filter by name pattern (case-insensitive substring match)'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .describe('Maximum number of results to return (default: 100)'),
    },
    async (args) => {
      let symbols = getAllSymbols();

      if (args.filePath) {
        const filterPath = args.filePath;
        symbols = symbols.filter((s) => s.filePath.includes(filterPath));
      }

      if (args.kind) {
        const filterKind = args.kind;
        symbols = symbols.filter((s) => s.kind === filterKind);
      }

      if (args.pattern) {
        const lowerPattern = args.pattern.toLowerCase();
        symbols = symbols.filter((s) => s.name.toLowerCase().includes(lowerPattern));
      }

      const limit = args.limit ?? DEFAULT_LIMIT;
      symbols = symbols.slice(0, limit);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              symbols.map((s) => ({
                name: s.name,
                kind: s.kind,
                filePath: s.filePath,
                startLine: s.startLine,
                endLine: s.endLine,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    'get_symbol_details',
    'Get detailed information about a specific symbol by name.',
    {
      name: z.string().describe('The exact name of the symbol'),
      filePath: z.string().optional().describe('Narrow search to a specific file path (substring match)'),
    },
    async (args) => {
      let symbols = getAllSymbols();

      symbols = symbols.filter((s) => s.name === args.name);

      if (args.filePath) {
        const filterPath = args.filePath;
        symbols = symbols.filter((s) => s.filePath.includes(filterPath));
      }

      if (symbols.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No symbol found with name "${args.name}"`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(symbols, null, 2),
          },
        ],
      };
    },
  );

  server.tool('refresh_symbols', 'Refresh the symbol cache by re-scanning source files.', async () => {
    symbolCache = null;
    const symbols = getAllSymbols();
    return {
      content: [
        {
          type: 'text' as const,
          text: `Symbol cache refreshed. Found ${symbols.length} symbols.`,
        },
      ],
    };
  });

  return server;
}
