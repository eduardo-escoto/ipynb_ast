import { describe, it, expect } from 'vitest';
import {
  isCodeCell,
  isMarkdownCell,
  isRawCell,
  isMarkdown,
  isParsedMarkdown,
  isStreamOutput,
  isDisplayDataOutput,
  isExecuteResultOutput,
  isErrorOutput,
  type CodeCell,
  type MarkdownCell,
  type RawCell,
  type Markdown,
  type ParsedMarkdown,
  type StreamOutput,
  type DisplayDataOutput,
  type ExecuteResultOutput,
  type ErrorOutput,
  type Code,
} from '../src/types';

describe('Type Guards', () => {
  describe('Cell Type Guards', () => {
    it('should identify code cells', () => {
      const codeCell: CodeCell = {
        type: 'cell',
        cellType: 'code',
        children: [
          {
            type: 'code',
            lang: 'python',
            value: 'print("hello")',
          } as Code,
        ],
        metadata: {},
        executionCount: 1,
      };

      expect(isCodeCell(codeCell)).toBe(true);
      expect(isMarkdownCell(codeCell)).toBe(false);
      expect(isRawCell(codeCell)).toBe(false);
    });

    it('should identify markdown cells', () => {
      const markdownCell: MarkdownCell = {
        type: 'cell',
        cellType: 'markdown',
        children: [
          {
            type: 'markdown',
            value: '# Heading',
          } as Markdown,
        ],
        metadata: {},
      };

      expect(isMarkdownCell(markdownCell)).toBe(true);
      expect(isCodeCell(markdownCell)).toBe(false);
      expect(isRawCell(markdownCell)).toBe(false);
    });

    it('should identify raw cells', () => {
      const rawCell: RawCell = {
        type: 'cell',
        cellType: 'raw',
        children: [
          {
            type: 'raw',
            value: 'raw content',
          },
        ],
        metadata: {},
      };

      expect(isRawCell(rawCell)).toBe(true);
      expect(isCodeCell(rawCell)).toBe(false);
      expect(isMarkdownCell(rawCell)).toBe(false);
    });
  });

  describe('Content Type Guards', () => {
    it('should identify markdown content', () => {
      const markdown: Markdown = {
        type: 'markdown',
        value: '# Heading',
      };

      expect(isMarkdown(markdown)).toBe(true);
      expect(isParsedMarkdown(markdown)).toBe(false);
    });

    it('should identify parsed markdown content', () => {
      const parsedMarkdown: ParsedMarkdown = {
        type: 'parsedMarkdown',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [
              {
                type: 'text',
                value: 'Heading',
              },
            ],
          },
        ],
      };

      expect(isParsedMarkdown(parsedMarkdown)).toBe(true);
      expect(isMarkdown(parsedMarkdown)).toBe(false);
    });
  });

  describe('Output Type Guards', () => {
    it('should identify stream outputs', () => {
      const streamOutput: StreamOutput = {
        type: 'stream',
        name: 'stdout',
        text: 'Hello, World!\n',
        value: 'Hello, World!\n',
      };

      expect(isStreamOutput(streamOutput)).toBe(true);
      expect(isDisplayDataOutput(streamOutput)).toBe(false);
      expect(isExecuteResultOutput(streamOutput)).toBe(false);
      expect(isErrorOutput(streamOutput)).toBe(false);
    });

    it('should identify display_data outputs', () => {
      const displayDataOutput: DisplayDataOutput = {
        type: 'displayData',
        data: {
          'text/plain': ['data'],
        },
        metadata: {},
      };

      expect(isDisplayDataOutput(displayDataOutput)).toBe(true);
      expect(isStreamOutput(displayDataOutput)).toBe(false);
      expect(isExecuteResultOutput(displayDataOutput)).toBe(false);
      expect(isErrorOutput(displayDataOutput)).toBe(false);
    });

    it('should identify execute_result outputs', () => {
      const executeResultOutput: ExecuteResultOutput = {
        type: 'executeResult',
        executionCount: 1,
        data: {
          'text/plain': ['42'],
        },
        metadata: {},
      };

      expect(isExecuteResultOutput(executeResultOutput)).toBe(true);
      expect(isStreamOutput(executeResultOutput)).toBe(false);
      expect(isDisplayDataOutput(executeResultOutput)).toBe(false);
      expect(isErrorOutput(executeResultOutput)).toBe(false);
    });

    it('should identify error outputs', () => {
      const errorOutput: ErrorOutput = {
        type: 'error',
        ename: 'ZeroDivisionError',
        evalue: 'division by zero',
        traceback: ['Traceback...'],
      };

      expect(isErrorOutput(errorOutput)).toBe(true);
      expect(isStreamOutput(errorOutput)).toBe(false);
      expect(isDisplayDataOutput(errorOutput)).toBe(false);
      expect(isExecuteResultOutput(errorOutput)).toBe(false);
    });
  });
});
