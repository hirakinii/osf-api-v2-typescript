import { Project, SourceFile, Node, FunctionDeclaration, MethodDeclaration } from 'ts-morph';
import { SymbolInfo } from './types';

/**
 * Extracts symbol information from TypeScript source files using ts-morph.
 */
export class SymbolExtractor {
  private project: Project;

  constructor() {
    this.project = new Project({
      compilerOptions: {
        allowJs: true,
        declaration: false,
      },
      skipAddingFilesFromTsConfig: true,
    });
  }

  /**
   * Extract exported symbols from a TypeScript file.
   */
  extractSymbols(filePath: string): SymbolInfo[] {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    try {
      return this.extractFromSourceFile(sourceFile);
    } finally {
      this.project.removeSourceFile(sourceFile);
    }
  }

  private extractFromSourceFile(sourceFile: SourceFile): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const filePath = sourceFile.getFilePath();

    for (const cls of sourceFile.getClasses()) {
      if (!cls.isExported()) continue;
      const name = cls.getName();
      if (!name) continue;

      symbols.push({
        name,
        kind: 'Class',
        filePath,
        startLine: cls.getStartLineNumber(),
        endLine: cls.getEndLineNumber(),
        jsDoc: this.getJsDoc(cls),
      });

      for (const method of cls.getMethods()) {
        const methodName = method.getName();
        symbols.push({
          name: `${name}/${methodName}`,
          kind: 'Method',
          filePath,
          startLine: method.getStartLineNumber(),
          endLine: method.getEndLineNumber(),
          signature: this.getMethodSignature(method),
          jsDoc: this.getJsDoc(method),
        });
      }
    }

    for (const iface of sourceFile.getInterfaces()) {
      if (!iface.isExported()) continue;
      const name = iface.getName();

      symbols.push({
        name,
        kind: 'Interface',
        filePath,
        startLine: iface.getStartLineNumber(),
        endLine: iface.getEndLineNumber(),
        jsDoc: this.getJsDoc(iface),
      });
    }

    for (const func of sourceFile.getFunctions()) {
      if (!func.isExported()) continue;
      const name = func.getName();
      if (!name) continue;

      symbols.push({
        name,
        kind: 'Function',
        filePath,
        startLine: func.getStartLineNumber(),
        endLine: func.getEndLineNumber(),
        signature: this.getFunctionSignature(func),
        jsDoc: this.getJsDoc(func),
      });
    }

    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (!typeAlias.isExported()) continue;

      symbols.push({
        name: typeAlias.getName(),
        kind: 'TypeAlias',
        filePath,
        startLine: typeAlias.getStartLineNumber(),
        endLine: typeAlias.getEndLineNumber(),
        jsDoc: this.getJsDoc(typeAlias),
      });
    }

    for (const enumDecl of sourceFile.getEnums()) {
      if (!enumDecl.isExported()) continue;

      symbols.push({
        name: enumDecl.getName(),
        kind: 'Enum',
        filePath,
        startLine: enumDecl.getStartLineNumber(),
        endLine: enumDecl.getEndLineNumber(),
        jsDoc: this.getJsDoc(enumDecl),
      });
    }

    for (const varStatement of sourceFile.getVariableStatements()) {
      if (!varStatement.isExported()) continue;

      for (const decl of varStatement.getDeclarations()) {
        symbols.push({
          name: decl.getName(),
          kind: 'Variable',
          filePath,
          startLine: varStatement.getStartLineNumber(),
          endLine: varStatement.getEndLineNumber(),
          jsDoc: this.getJsDoc(varStatement),
        });
      }
    }

    return symbols;
  }

  private getJsDoc(node: Node): string | undefined {
    if (!('getJsDocs' in node)) return undefined;
    const jsDocs = (node as Node & { getJsDocs(): { getDescription(): string }[] }).getJsDocs();
    if (jsDocs.length === 0) return undefined;
    return jsDocs.map((doc) => doc.getDescription().trim()).join('\n');
  }

  private getFunctionSignature(func: FunctionDeclaration | MethodDeclaration): string {
    const params = func
      .getParameters()
      .map((p) => `${p.getName()}: ${p.getType().getText()}`)
      .join(', ');
    const returnType = func.getReturnType().getText();
    return `(${params}): ${returnType}`;
  }

  private getMethodSignature(method: MethodDeclaration): string {
    return this.getFunctionSignature(method);
  }
}
