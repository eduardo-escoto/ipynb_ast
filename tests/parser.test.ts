import { describe, it, expect } from 'vitest';
import { parse, parseFromFile } from '../src/parser';
import {
  isCodeCell,
  isMarkdownCell,
  isStreamOutput,
  isExecuteResultOutput,
  isDisplayDataOutput,
  isErrorOutput,
  isMarkdown,
  isParsedMarkdown,
} from '../src/types';
import type { JupyterNotebook } from '../src/types';
import * as path from 'path';

describe('Parser', () => {
  describe('parse()', () => {
    it('should parse a simple notebook', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'markdown',
            metadata: {},
            source: ['# Heading'],
          },
          {
            cell_type: 'code',
            execution_count: 1,
            metadata: {},
            outputs: [],
            source: ['print("hello")'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);

      expect(ast.type).toBe('root');
      expect(ast.nbformat).toBe(4);
      expect(ast.nbformat_minor).toBe(4);
      expect(ast.children).toHaveLength(2);

      // Check markdown cell
      const markdownCell = ast.children[0];
      expect(isMarkdownCell(markdownCell)).toBe(true);
      if (isMarkdownCell(markdownCell)) {
        expect(markdownCell.children).toHaveLength(1);
        const content = markdownCell.children[0];
        expect(isMarkdown(content)).toBe(true);
        if (isMarkdown(content)) {
          expect(content.value).toBe('# Heading');
        }
      }

      // Check code cell
      const codeCell = ast.children[1];
      expect(isCodeCell(codeCell)).toBe(true);
      if (isCodeCell(codeCell)) {
        expect(codeCell.executionCount).toBe(1);
        expect(codeCell.children).toHaveLength(1);
        expect(codeCell.children[0].type).toBe('code');
        expect(codeCell.children[0].value).toBe('print("hello")');
      }
    });

    it('should parse notebooks with outputs', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'code',
            execution_count: 1,
            metadata: {},
            outputs: [
              {
                output_type: 'stream',
                name: 'stdout',
                text: ['Hello, World!\n'],
              },
            ],
            source: ['print("Hello, World!")'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);
      const codeCell = ast.children[0];

      expect(isCodeCell(codeCell)).toBe(true);
      if (isCodeCell(codeCell)) {
        expect(codeCell.children).toHaveLength(2); // code + output
        const output = codeCell.children[1];
        expect(isStreamOutput(output)).toBe(true);
        if (isStreamOutput(output)) {
          expect(output.name).toBe('stdout');
          expect(output.text).toBe('Hello, World!\n');
        }
      }
    });

    it('should parse execute_result outputs', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'code',
            execution_count: 1,
            metadata: {},
            outputs: [
              {
                output_type: 'execute_result',
                execution_count: 1,
                data: {
                  'text/plain': ['42'],
                  'text/html': ['<strong>42</strong>'],
                },
                metadata: {},
              },
            ],
            source: ['42'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);
      const codeCell = ast.children[0];

      expect(isCodeCell(codeCell)).toBe(true);
      if (isCodeCell(codeCell)) {
        const output = codeCell.children[1];
        expect(isExecuteResultOutput(output)).toBe(true);
        if (isExecuteResultOutput(output)) {
          expect(output.executionCount).toBe(1);
          expect(output.data['text/plain']).toEqual(['42']);
          expect(output.data['text/html']).toEqual(['<strong>42</strong>']);
        }
      }
    });

    it('should parse display_data outputs', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'code',
            execution_count: 1,
            metadata: {},
            outputs: [
              {
                output_type: 'display_data',
                data: {
                  'image/png': 'base64data',
                },
                metadata: {},
              },
            ],
            source: ['plt.plot([1, 2, 3])'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);
      const codeCell = ast.children[0];

      expect(isCodeCell(codeCell)).toBe(true);
      if (isCodeCell(codeCell)) {
        const output = codeCell.children[1];
        expect(isDisplayDataOutput(output)).toBe(true);
        if (isDisplayDataOutput(output)) {
          expect(output.data['image/png']).toBe('base64data');
        }
      }
    });

    it('should parse error outputs', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'code',
            execution_count: 1,
            metadata: {},
            outputs: [
              {
                output_type: 'error',
                ename: 'ZeroDivisionError',
                evalue: 'division by zero',
                traceback: ['Traceback...', 'ZeroDivisionError: division by zero'],
              },
            ],
            source: ['1 / 0'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);
      const codeCell = ast.children[0];

      expect(isCodeCell(codeCell)).toBe(true);
      if (isCodeCell(codeCell)) {
        const output = codeCell.children[1];
        expect(isErrorOutput(output)).toBe(true);
        if (isErrorOutput(output)) {
          expect(output.ename).toBe('ZeroDivisionError');
          expect(output.evalue).toBe('division by zero');
          expect(output.traceback).toHaveLength(2);
        }
      }
    });

    it('should parse markdown with parseMarkdown option', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'markdown',
            metadata: {},
            source: ['# Heading\n\nParagraph text.'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook, { parseMarkdown: true });
      const markdownCell = ast.children[0];

      expect(isMarkdownCell(markdownCell)).toBe(true);
      if (isMarkdownCell(markdownCell)) {
        const content = markdownCell.children[0];
        expect(isParsedMarkdown(content)).toBe(true);
        if (isParsedMarkdown(content)) {
          expect(content.children).toBeDefined();
          expect(content.children.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle cell metadata', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'markdown',
            metadata: {
              tags: ['important', 'test'],
              custom_field: 'custom_value',
            },
            source: ['# Test'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);
      const cell = ast.children[0];

      expect(cell.metadata).toBeDefined();
      expect(cell.metadata?.tags).toEqual(['important', 'test']);
      expect((cell.metadata as any).custom_field).toBe('custom_value');
    });

    it('should normalize source arrays to strings', async () => {
      const notebook: JupyterNotebook = {
        cells: [
          {
            cell_type: 'code',
            execution_count: null,
            metadata: {},
            outputs: [],
            source: ['line1\n', 'line2\n', 'line3'],
          },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const ast = await parse(notebook);
      const codeCell = ast.children[0];

      expect(isCodeCell(codeCell)).toBe(true);
      if (isCodeCell(codeCell)) {
        expect(codeCell.children[0].value).toBe('line1\nline2\nline3');
      }
    });
  });

  describe('parseFromFile()', () => {
    it('should parse a notebook from file', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      expect(ast.type).toBe('root');
      expect(ast.children.length).toBeGreaterThan(0);
    });

    it('should parse notebook with outputs from file', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'with-outputs.ipynb');
      const ast = await parseFromFile(fixturePath);

      expect(ast.type).toBe('root');

      // Should have cells with outputs
      const cellsWithOutputs = ast.children.filter((cell) => {
        if (isCodeCell(cell)) {
          return cell.children.length > 1;
        }
        return false;
      });

      expect(cellsWithOutputs.length).toBeGreaterThan(0);
    });
  });
});
