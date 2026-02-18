import * as path from 'path';
import * as fs from 'fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer, collectTsFiles } from '../../src/mcp/server';

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
