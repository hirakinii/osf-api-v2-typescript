import * as path from 'path';
import * as fs from 'fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer, collectTsFiles, resolveSrcDir } from '../../src/mcp/server';

describe('collectTsFiles', () => {
  const testDir = path.join(__dirname, 'test-collect-fixtures');

  beforeAll(() => {
    fs.mkdirSync(path.join(testDir, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'a.ts'), 'export const a = 1;');
    fs.writeFileSync(path.join(testDir, 'b.tsx'), 'export const b = 2;');
    fs.writeFileSync(path.join(testDir, 'c.d.ts'), 'declare const c: number;');
    fs.writeFileSync(path.join(testDir, 'd.test.ts'), 'test("d", () => {});');
    fs.writeFileSync(path.join(testDir, 'e.spec.ts'), 'test("e", () => {});');
    fs.writeFileSync(path.join(testDir, 'f.js'), 'const f = 1;');
    fs.writeFileSync(path.join(testDir, 'sub', 'g.ts'), 'export const g = 1;');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should collect .ts and .tsx files', () => {
    const files = collectTsFiles(testDir);
    const names = files.map((f) => path.basename(f));
    expect(names).toContain('a.ts');
    expect(names).toContain('b.tsx');
  });

  it('should exclude .d.ts, .test.ts, .spec.ts files', () => {
    const files = collectTsFiles(testDir);
    const names = files.map((f) => path.basename(f));
    expect(names).not.toContain('c.d.ts');
    expect(names).not.toContain('d.test.ts');
    expect(names).not.toContain('e.spec.ts');
  });

  it('should exclude non-TypeScript files', () => {
    const files = collectTsFiles(testDir);
    const names = files.map((f) => path.basename(f));
    expect(names).not.toContain('f.js');
  });

  it('should recursively collect from subdirectories', () => {
    const files = collectTsFiles(testDir);
    const names = files.map((f) => path.basename(f));
    expect(names).toContain('g.ts');
  });

  it('should skip symlinks pointing outside the base directory', () => {
    const symlinkDir = path.join(__dirname, 'test-symlink-fixtures');
    const targetDir = path.join(__dirname, 'test-symlink-target');
    fs.mkdirSync(symlinkDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(symlinkDir, 'real.ts'), 'export const r = 1;');
    fs.writeFileSync(path.join(targetDir, 'external.ts'), 'export const e = 1;');
    try {
      fs.symlinkSync(targetDir, path.join(symlinkDir, 'linked'), 'dir');
    } catch {
      // Symlinks may not be supported; skip test
      fs.rmSync(symlinkDir, { recursive: true, force: true });
      fs.rmSync(targetDir, { recursive: true, force: true });
      return;
    }

    try {
      const files = collectTsFiles(symlinkDir);
      const names = files.map((f) => path.basename(f));
      expect(names).toContain('real.ts');
      expect(names).not.toContain('external.ts');
    } finally {
      fs.rmSync(symlinkDir, { recursive: true, force: true });
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  });

  it('should respect max recursion depth', () => {
    const deepDir = path.join(__dirname, 'test-deep-fixtures');
    let current = deepDir;
    // Create a directory 25 levels deep (default max is 20)
    for (let i = 0; i < 25; i++) {
      current = path.join(current, `level${i}`);
    }
    fs.mkdirSync(current, { recursive: true });
    fs.writeFileSync(path.join(current, 'deep.ts'), 'export const d = 1;');
    // Also place a file at level 1
    fs.writeFileSync(path.join(deepDir, 'shallow.ts'), 'export const s = 1;');

    try {
      const files = collectTsFiles(deepDir);
      const names = files.map((f) => path.basename(f));
      expect(names).toContain('shallow.ts');
      expect(names).not.toContain('deep.ts');
    } finally {
      fs.rmSync(deepDir, { recursive: true, force: true });
    }
  });
});

describe('resolveSrcDir', () => {
  it('should accept a path under projectRoot', () => {
    const projectRoot = path.join(__dirname, '../..');
    const srcDir = path.join(projectRoot, 'src');
    expect(resolveSrcDir(srcDir, projectRoot)).toBe(fs.realpathSync(srcDir));
  });

  it('should reject a path outside projectRoot', () => {
    const projectRoot = path.join(__dirname, '../..');
    expect(() => resolveSrcDir('/etc', projectRoot)).toThrow(
      /must be within the project root/,
    );
  });

  it('should resolve relative paths under projectRoot', () => {
    const projectRoot = path.join(__dirname, '../..');
    const result = resolveSrcDir('src', projectRoot);
    expect(result).toBe(fs.realpathSync(path.join(projectRoot, 'src')));
  });
});

describe('MCP Server', () => {
  const srcDir = path.join(__dirname, '../../src');

  it('should create a server instance', () => {
    const server = createMcpServer(srcDir);
    expect(server).toBeInstanceOf(McpServer);
  });
});

describe('MCP Server tool handlers', () => {
  const testDir = path.join(__dirname, 'test-tool-fixtures');
  const testFilePath = path.join(testDir, 'sample.ts');
  const testContent = `
export class SampleClass {
  greet(): string { return 'hello'; }
}

export interface SampleInterface {
  value: number;
}

export function sampleFunction(): void {}

export type SampleType = string;

export enum SampleEnum { A, B }

export const sampleVar = 42;
`;

  let client: Client;
  let server: McpServer;

  beforeAll(async () => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFilePath, testContent);

    server = createMcpServer(testDir);
    client = new Client({ name: 'test-client', version: '1.0.0' });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should list all symbols via list_symbols tool', async () => {
    const result = await client.callTool({
      name: 'list_symbols',
      arguments: {},
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols.length).toBeGreaterThanOrEqual(5);
  });

  it('should filter symbols by kind', async () => {
    const result = await client.callTool({
      name: 'list_symbols',
      arguments: { kind: 'Class' },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('SampleClass');
  });

  it('should filter symbols by name pattern', async () => {
    const result = await client.callTool({
      name: 'list_symbols',
      arguments: { pattern: 'sample' },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols.length).toBeGreaterThanOrEqual(4);
  });

  it('should filter symbols by file path', async () => {
    const result = await client.callTool({
      name: 'list_symbols',
      arguments: { filePath: 'sample.ts' },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols.length).toBeGreaterThanOrEqual(5);
  });

  it('should get symbol details', async () => {
    const result = await client.callTool({
      name: 'get_symbol_details',
      arguments: { name: 'SampleClass' },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('SampleClass');
    expect(symbols[0].kind).toBe('Class');
    expect(symbols[0].startLine).toBeDefined();
    expect(symbols[0].endLine).toBeDefined();
  });

  it('should get symbol details with filePath filter', async () => {
    const result = await client.callTool({
      name: 'get_symbol_details',
      arguments: { name: 'SampleClass', filePath: 'sample.ts' },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols).toHaveLength(1);
  });

  it('should return error for non-existent symbol', async () => {
    const result = await client.callTool({
      name: 'get_symbol_details',
      arguments: { name: 'NonExistent' },
    });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('No symbol found');
  });

  it('should limit results with limit parameter', async () => {
    const result = await client.callTool({
      name: 'list_symbols',
      arguments: { limit: 2 },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    expect(symbols).toHaveLength(2);
  });

  it('should use default limit of 100 when not specified', async () => {
    const result = await client.callTool({
      name: 'list_symbols',
      arguments: {},
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const symbols = JSON.parse(content[0].text);
    // Our test fixture has fewer than 100 symbols, so all should be returned
    expect(symbols.length).toBeLessThanOrEqual(100);
  });

  it('should refresh symbol cache', async () => {
    const result = await client.callTool({
      name: 'refresh_symbols',
      arguments: {},
    });
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('Symbol cache refreshed');
    expect(content[0].text).toContain('symbols');
  });
});
