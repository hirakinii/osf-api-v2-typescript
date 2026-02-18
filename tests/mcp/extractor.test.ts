import * as path from 'path';
import * as fs from 'fs';
import { SymbolExtractor } from '../../src/mcp/extractor';

describe('SymbolExtractor', () => {
  const testFilePath = path.join(__dirname, 'test-sample.ts');
  const testContent = `
/**
 * A test class.
 */
export class TestClass {
  /**
   * A test method.
   */
  testMethod(param: string): number {
    return 0;
  }
}

export interface TestInterface {
  prop: string;
}

export function testFunction(a: number, b: number): number {
  return a + b;
}

export type TestType = string | number;

export enum TestEnum {
  A,
  B
}

const internalVar = 1;
export const exportedVar = 2;
`;

  let extractor: SymbolExtractor;

  beforeAll(() => {
    fs.writeFileSync(testFilePath, testContent);
    extractor = new SymbolExtractor();
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should extract classes', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const classSymbol = symbols.find(s => s.name === 'TestClass');
    expect(classSymbol).toBeDefined();
    expect(classSymbol?.kind).toBe('Class');
    expect(classSymbol?.jsDoc).toContain('A test class.');
  });

  it('should extract interfaces', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const interfaceSymbol = symbols.find(s => s.name === 'TestInterface');
    expect(interfaceSymbol).toBeDefined();
    expect(interfaceSymbol?.kind).toBe('Interface');
  });

  it('should extract functions', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const functionSymbol = symbols.find(s => s.name === 'testFunction');
    expect(functionSymbol).toBeDefined();
    expect(functionSymbol?.kind).toBe('Function');
    expect(functionSymbol?.signature).toContain('(a: number, b: number): number');
  });

  it('should extract type aliases', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const typeSymbol = symbols.find(s => s.name === 'TestType');
    expect(typeSymbol).toBeDefined();
    expect(typeSymbol?.kind).toBe('TypeAlias');
  });

  it('should extract enums', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const enumSymbol = symbols.find(s => s.name === 'TestEnum');
    expect(enumSymbol).toBeDefined();
    expect(enumSymbol?.kind).toBe('Enum');
  });

  it('should extract exported variables', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const varSymbol = symbols.find(s => s.name === 'exportedVar');
    expect(varSymbol).toBeDefined();
    expect(varSymbol?.kind).toBe('Variable');
  });

  it('should not extract internal variables by default if not exported (optional behavior check)', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const varSymbol = symbols.find(s => s.name === 'internalVar');
    // Depending on implementation, we might only want exported symbols
    expect(varSymbol).toBeUndefined();
  });

  it('should extract methods within classes', () => {
    const symbols = extractor.extractSymbols(testFilePath);
    const methodSymbol = symbols.find(s => s.name === 'TestClass/testMethod');
    expect(methodSymbol).toBeDefined();
    expect(methodSymbol?.kind).toBe('Method');
  });
});
