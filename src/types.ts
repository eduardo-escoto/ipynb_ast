/**
 * Type definitions for ipynb-ast (Jupyter Notebook AST)
 * Follows the unist (Universal Syntax Tree) specification
 */

// ============================================================================
// Unist Base Types
// ============================================================================

/**
 * Base node interface - all nodes in the AST extend this
 */
export interface Node {
  type: string;
  data?: Data;
  position?: Position;
}

/**
 * Parent node interface - nodes that contain other nodes
 */
export interface Parent extends Node {
  children: Node[];
}

/**
 * Literal node interface - nodes that contain a value
 */
export interface Literal extends Node {
  value: string;
}

/**
 * Data can contain any information and is guaranteed to never be specified by ipynb-ast
 */
export interface Data {
  [key: string]: unknown;
}

/**
 * Position information for source mapping
 */
export interface Position {
  start: Point;
  end: Point;
}

/**
 * Point represents a position in the source
 */
export interface Point {
  line: number;      // 1-indexed line number
  column: number;    // 1-indexed column number
  offset: number;    // 0-indexed character offset
}

// ============================================================================
// Jupyter Notebook Input Types (for parsing .ipynb files)
// ============================================================================

/**
 * Jupyter notebook cell types
 */
export type JupyterCellType = 'code' | 'markdown' | 'raw';

/**
 * Jupyter notebook output types
 */
export type JupyterOutputType = 'stream' | 'display_data' | 'execute_result' | 'error';

/**
 * Base interface for Jupyter notebook cells
 */
export interface JupyterCell {
  cell_type: JupyterCellType;
  metadata: CellMetadata;
  source: string | string[];
}

/**
 * Jupyter code cell
 */
export interface JupyterCodeCell extends JupyterCell {
  cell_type: 'code';
  execution_count: number | null;
  outputs: JupyterOutput[];
}

/**
 * Jupyter markdown cell
 */
export interface JupyterMarkdownCell extends JupyterCell {
  cell_type: 'markdown';
}

/**
 * Jupyter raw cell
 */
export interface JupyterRawCell extends JupyterCell {
  cell_type: 'raw';
}

/**
 * Jupyter cell output (discriminated union)
 */
export type JupyterOutput =
  | JupyterStreamOutput
  | JupyterDisplayDataOutput
  | JupyterExecuteResultOutput
  | JupyterErrorOutput;

/**
 * Jupyter stream output
 */
export interface JupyterStreamOutput {
  output_type: 'stream';
  name: 'stdout' | 'stderr';
  text: string | string[];
}

/**
 * Jupyter display data output
 */
export interface JupyterDisplayDataOutput {
  output_type: 'display_data';
  data: MIMEBundle;
  metadata?: OutputMetadata;
}

/**
 * Jupyter execute result output
 */
export interface JupyterExecuteResultOutput {
  output_type: 'execute_result';
  execution_count: number | null;
  data: MIMEBundle;
  metadata?: OutputMetadata;
}

/**
 * Jupyter error output
 */
export interface JupyterErrorOutput {
  output_type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

/**
 * Jupyter notebook format
 */
export interface JupyterNotebook {
  cells: (JupyterCodeCell | JupyterMarkdownCell | JupyterRawCell)[];
  metadata: NotebookMetadata;
  nbformat: number;
  nbformat_minor: number;
}

// ============================================================================
// AST Node Types
// ============================================================================

/**
 * Root node representing an entire Jupyter notebook
 */
export interface Root extends Parent {
  type: 'root';
  children: Cell[];
  metadata: NotebookMetadata;
  nbformat: number;
  nbformat_minor: number;
}

/**
 * Cell node types (discriminated union)
 */
export type Cell = CodeCell | MarkdownCell | RawCell;

/**
 * Base cell interface
 */
export interface BaseCell extends Parent {
  type: 'cell';
  cellType: JupyterCellType;
  metadata?: CellMetadata;
}

/**
 * Code cell node
 */
export interface CodeCell extends BaseCell {
  cellType: 'code';
  children: [Code, ...Output[]];
  executionCount: number | null;
}

/**
 * Markdown cell node
 */
export interface MarkdownCell extends BaseCell {
  cellType: 'markdown';
  children: [Markdown | ParsedMarkdown];
}

/**
 * Raw cell node
 */
export interface RawCell extends BaseCell {
  cellType: 'raw';
  children: [Raw];
}

/**
 * Code content node
 */
export interface Code extends Literal {
  type: 'code';
  lang?: string;
  meta?: string;
  value: string;
}

/**
 * Markdown content node (unparsed)
 */
export interface Markdown extends Literal {
  type: 'markdown';
  value: string;
}

/**
 * Parsed markdown content node (contains mdast tree)
 */
export interface ParsedMarkdown extends Parent {
  type: 'parsedMarkdown';
  children: any[]; // mdast nodes - type is 'any' to avoid importing mdast at this level
  data?: {
    /**
     * Original markdown source
     */
    source?: string;
    [key: string]: unknown;
  };
}

/**
 * HTML content node (unparsed)
 */
export interface Html extends Literal {
  type: 'html';
  value: string;
}

/**
 * Parsed HTML content node (contains hast tree)
 */
export interface ParsedHtml extends Parent {
  type: 'parsedHtml';
  children: any[]; // hast nodes - type is 'any' to avoid importing hast at this level
  data?: {
    /**
     * Original HTML source
     */
    source?: string;
    [key: string]: unknown;
  };
}

/**
 * Raw content node
 */
export interface Raw extends Literal {
  type: 'raw';
  value: string;
}

/**
 * Output node types (discriminated union)
 */
export type Output = StreamOutput | DisplayDataOutput | ExecuteResultOutput | ErrorOutput;

/**
 * Stream output node (stdout/stderr)
 */
export interface StreamOutput extends Literal {
  type: 'stream';
  name: 'stdout' | 'stderr';
  text: string;
}

/**
 * Display data output node
 */
export interface DisplayDataOutput extends Node {
  type: 'displayData';
  data: MIMEBundle;
  metadata?: OutputMetadata;
}

/**
 * Execute result output node
 */
export interface ExecuteResultOutput extends Node {
  type: 'executeResult';
  executionCount: number | null;
  data: MIMEBundle;
  metadata?: OutputMetadata;
}

/**
 * Error output node
 */
export interface ErrorOutput extends Node {
  type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * MIME bundle containing data in various formats
 *
 * Text-based MIME types (text/*, image/svg+xml, application/javascript):
 *   - Can be string or string[] (arrays will be joined)
 *
 * Binary MIME types (image/png, image/jpeg, etc.):
 *   - Base64-encoded strings
 *
 * JSON MIME types (application/json, application/*+json):
 *   - Any valid JSON value (objects, arrays, primitives)
 *
 * See src/mime-types.ts for complete list of supported MIME types
 */
export interface MIMEBundle {
  // Text content
  'text/plain'?: string | string[];
  'text/html'?: string | string[];
  'text/markdown'?: string | string[];
  'text/latex'?: string | string[];
  'text/csv'?: string | string[];
  'text/xml'?: string | string[];

  // Images (base64 encoded, except SVG)
  'image/png'?: string;
  'image/jpeg'?: string;
  'image/gif'?: string;
  'image/bmp'?: string;
  'image/webp'?: string;
  'image/svg+xml'?: string | string[];

  // Application formats
  'application/json'?: any;
  'application/javascript'?: string | string[];
  'application/pdf'?: string;  // base64 encoded
  'application/geo+json'?: any;
  'application/xml'?: string | string[];

  // Jupyter-specific formats
  'application/vnd.jupyter.widget-view+json'?: any;
  'application/vnd.jupyter.widget-state+json'?: any;

  // Visualization formats
  'application/vnd.plotly.v1+json'?: any;
  'application/vnd.vega.v2+json'?: any;
  'application/vnd.vega.v3+json'?: any;
  'application/vnd.vega.v4+json'?: any;
  'application/vnd.vega.v5+json'?: any;
  'application/vnd.vegalite.v1+json'?: any;
  'application/vnd.vegalite.v2+json'?: any;
  'application/vnd.vegalite.v3+json'?: any;
  'application/vnd.vegalite.v4+json'?: any;
  'application/vnd.vegalite.v5+json'?: any;
  'application/vnd.bokehjs_exec.v0+json'?: any;
  'application/vnd.holoviews_exec.v0+json'?: any;
  'application/vnd.holoviews_load.v0+json'?: any;

  // Allow any other MIME type
  [mimeType: string]: any;
}

/**
 * Notebook-level metadata
 */
export interface NotebookMetadata {
  kernelspec?: {
    display_name: string;
    language: string;
    name: string;
  };
  language_info?: {
    name: string;
    version?: string;
    mimetype?: string;
    file_extension?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Cell-level metadata
 */
export interface CellMetadata {
  collapsed?: boolean;
  scrolled?: boolean;
  tags?: string[];
  [key: string]: any;
}

/**
 * Output-level metadata
 */
export interface OutputMetadata {
  isolated?: boolean;
  [key: string]: any;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a node is a Parent node
 */
export function isParent(node: Node): node is Parent {
  return 'children' in node && Array.isArray((node as Parent).children);
}

/**
 * Check if a node is a Literal node
 */
export function isLiteral(node: Node): node is Literal {
  return 'value' in node && typeof (node as Literal).value === 'string';
}

/**
 * Check if a node is a Root node
 */
export function isRoot(node: Node): node is Root {
  return node.type === 'root';
}

/**
 * Check if a node is a Cell node
 */
export function isCell(node: Node): node is Cell {
  return node.type === 'cell';
}

/**
 * Check if a cell is a CodeCell
 */
export function isCodeCell(node: Node): node is CodeCell {
  return isCell(node) && node.cellType === 'code';
}

/**
 * Check if a cell is a MarkdownCell
 */
export function isMarkdownCell(node: Node): node is MarkdownCell {
  return isCell(node) && node.cellType === 'markdown';
}

/**
 * Check if a cell is a RawCell
 */
export function isRawCell(node: Node): node is RawCell {
  return isCell(node) && node.cellType === 'raw';
}

/**
 * Check if a node is an Output node
 */
export function isOutput(node: Node): node is Output {
  return (
    node.type === 'stream' ||
    node.type === 'displayData' ||
    node.type === 'executeResult' ||
    node.type === 'error'
  );
}

/**
 * Check if an output is a StreamOutput
 */
export function isStreamOutput(node: Node): node is StreamOutput {
  return node.type === 'stream';
}

/**
 * Check if an output is a DisplayDataOutput
 */
export function isDisplayDataOutput(node: Node): node is DisplayDataOutput {
  return node.type === 'displayData';
}

/**
 * Check if an output is an ExecuteResultOutput
 */
export function isExecuteResultOutput(node: Node): node is ExecuteResultOutput {
  return node.type === 'executeResult';
}

/**
 * Check if an output is an ErrorOutput
 */
export function isErrorOutput(node: Node): node is ErrorOutput {
  return node.type === 'error';
}

/**
 * Check if a node is a Markdown node
 */
export function isMarkdown(node: Node): node is Markdown {
  return node.type === 'markdown';
}

/**
 * Check if a node is a ParsedMarkdown node
 */
export function isParsedMarkdown(node: Node): node is ParsedMarkdown {
  return node.type === 'parsedMarkdown';
}

/**
 * Check if a node is an Html node
 */
export function isHtml(node: Node): node is Html {
  return node.type === 'html';
}

/**
 * Check if a node is a ParsedHtml node
 */
export function isParsedHtml(node: Node): node is ParsedHtml {
  return node.type === 'parsedHtml';
}
