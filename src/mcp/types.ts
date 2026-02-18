/**
 * Supported symbol kinds for extraction.
 */
export type SymbolKind =
  | 'Class'
  | 'Interface'
  | 'Function'
  | 'TypeAlias'
  | 'Enum'
  | 'Variable'
  | 'Method';

/**
 * Information about a code symbol.
 */
export interface SymbolInfo {
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  endLine: number;
  signature?: string;
  jsDoc?: string;
}

/**
 * Request parameters for listing symbols.
 */
export interface ListSymbolsArgs {
  filePath?: string;
  kind?: SymbolKind;
  pattern?: string;
}

/**
 * Request parameters for getting symbol details.
 */
export interface GetSymbolDetailsArgs {
  name: string;
  filePath?: string;
}
