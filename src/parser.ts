/**
 * Parser for converting Jupyter notebooks to AST
 */

import {
  JupyterNotebook,
  JupyterCodeCell,
  JupyterMarkdownCell,
  JupyterRawCell,
  JupyterOutput,
  Root,
  Cell,
  CodeCell,
  MarkdownCell,
  RawCell,
  Code,
  Markdown,
  ParsedMarkdown,
  Raw,
  Output,
  StreamOutput,
  DisplayDataOutput,
  ExecuteResultOutput,
  ErrorOutput,
} from './types';
import type { MarkdownProcessorOptions, HtmlProcessorOptions } from './processor';
import { parseMarkdown } from './processor';

/**
 * Options for parsing notebooks
 */
export interface ParseOptions {
  /**
   * Whether to parse markdown cells into mdast trees
   * Default: false (keeps markdown as plain strings)
   */
  parseMarkdown?: boolean;

  /**
   * Options for markdown processing (remark plugins, etc.)
   */
  markdownOptions?: MarkdownProcessorOptions;

  /**
   * Whether to parse HTML outputs into hast trees
   * Default: false (keeps HTML as plain strings)
   */
  parseHtml?: boolean;

  /**
   * Options for HTML processing (rehype plugins, etc.)
   */
  htmlOptions?: HtmlProcessorOptions;
}

/**
 * Normalize source to a single string
 * Jupyter notebooks can have source as either a string or array of strings
 */
function normalizeSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join('') : source;
}

/**
 * Normalize text output to a single string
 * Jupyter outputs can have text as either a string or array of strings
 */
function normalizeText(text: string | string[]): string {
  return Array.isArray(text) ? text.join('') : text;
}

/**
 * Parse a Jupyter output to an AST output node
 */
function parseOutput(output: JupyterOutput): Output {
  switch (output.output_type) {
    case 'stream':
      return {
        type: 'stream',
        name: output.name,
        text: normalizeText(output.text),
      } as StreamOutput;

    case 'display_data':
      return {
        type: 'displayData',
        data: output.data,
        metadata: output.metadata,
      } as DisplayDataOutput;

    case 'execute_result':
      return {
        type: 'executeResult',
        executionCount: output.execution_count,
        data: output.data,
        metadata: output.metadata,
      } as ExecuteResultOutput;

    case 'error':
      return {
        type: 'error',
        ename: output.ename,
        evalue: output.evalue,
        traceback: output.traceback,
      } as ErrorOutput;
  }
}

/**
 * Parse a Jupyter code cell to an AST code cell node
 */
function parseCodeCell(cell: JupyterCodeCell, lang?: string): CodeCell {
  const source = normalizeSource(cell.source);

  const codeNode: Code = {
    type: 'code',
    value: source,
    lang,
  };

  const outputNodes: Output[] = cell.outputs.map(parseOutput);

  return {
    type: 'cell',
    cellType: 'code',
    executionCount: cell.execution_count,
    metadata: cell.metadata,
    children: [codeNode, ...outputNodes],
  };
}

/**
 * Parse a Jupyter markdown cell to an AST markdown cell node
 */
async function parseMarkdownCell(
  cell: JupyterMarkdownCell,
  options?: ParseOptions
): Promise<MarkdownCell> {
  const source = normalizeSource(cell.source);

  let contentNode: Markdown | ParsedMarkdown;

  if (options?.parseMarkdown) {
    // Parse markdown into mdast tree
    const mdastTree = await parseMarkdown(source, options.markdownOptions);

    contentNode = {
      type: 'parsedMarkdown',
      children: mdastTree.children,
      data: {
        source,
      },
    };
  } else {
    // Keep as plain string
    contentNode = {
      type: 'markdown',
      value: source,
    };
  }

  return {
    type: 'cell',
    cellType: 'markdown',
    metadata: cell.metadata,
    children: [contentNode],
  };
}

/**
 * Parse a Jupyter raw cell to an AST raw cell node
 */
function parseRawCell(cell: JupyterRawCell): RawCell {
  const source = normalizeSource(cell.source);

  const rawNode: Raw = {
    type: 'raw',
    value: source,
  };

  return {
    type: 'cell',
    cellType: 'raw',
    metadata: cell.metadata,
    children: [rawNode],
  };
}

/**
 * Parse a Jupyter cell to an AST cell node
 */
async function parseCell(
  cell: JupyterCodeCell | JupyterMarkdownCell | JupyterRawCell,
  lang?: string,
  options?: ParseOptions
): Promise<Cell> {
  switch (cell.cell_type) {
    case 'code':
      return parseCodeCell(cell, lang);
    case 'markdown':
      return parseMarkdownCell(cell, options);
    case 'raw':
      return parseRawCell(cell);
  }
}

/**
 * Parse a Jupyter notebook into an AST
 * @param notebook - The Jupyter notebook object to parse
 * @param options - Parse options (e.g., whether to parse markdown)
 * @returns The root AST node
 */
export async function parse(notebook: JupyterNotebook, options?: ParseOptions): Promise<Root> {
  // Extract language from notebook metadata
  const lang = notebook.metadata.language_info?.name;

  // Parse all cells
  const cells: Cell[] = await Promise.all(
    notebook.cells.map((cell) => parseCell(cell, lang, options))
  );

  return {
    type: 'root',
    nbformat: notebook.nbformat,
    nbformat_minor: notebook.nbformat_minor,
    metadata: notebook.metadata,
    children: cells,
  };
}

/**
 * Parse a Jupyter notebook from a JSON string
 * @param json - The JSON string representing the notebook
 * @param options - Parse options (e.g., whether to parse markdown)
 * @returns The root AST node
 */
export async function parseFromString(json: string, options?: ParseOptions): Promise<Root> {
  const notebook: JupyterNotebook = JSON.parse(json);
  return parse(notebook, options);
}

/**
 * Parse a Jupyter notebook from a file path
 * @param filePath - Path to the .ipynb file
 * @param options - Parse options (e.g., whether to parse markdown)
 * @returns The root AST node
 */
export async function parseFromFile(filePath: string, options?: ParseOptions): Promise<Root> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  return parseFromString(content, options);
}
