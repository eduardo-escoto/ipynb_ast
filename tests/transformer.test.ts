import { describe, it, expect } from 'vitest';
import {
  visit,
  visitType,
  transform,
  transformType,
  filter,
  map,
  find,
  findAll,
  removeOutputs,
  removeEmptyCells,
  removeCellsByTag,
  extractCellsByTag,
} from '../src/transformer';
import { parseFromFile } from '../src/parser';
import { isCodeCell, isMarkdownCell, type Root, type Node } from '../src/types';
import * as path from 'path';

describe('Transformer', () => {
  describe('visit()', () => {
    it('should visit all nodes', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const visited: string[] = [];
      await visit(ast, (node) => {
        visited.push(node.type);
      });

      expect(visited).toContain('root');
      expect(visited).toContain('cell');
      expect(visited.length).toBeGreaterThan(0);
    });

    it('should stop traversal when visitor returns false', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      let count = 0;
      await visit(ast, (node) => {
        count++;
        if (count >= 3) {
          return false; // Stop after 3 nodes
        }
      });

      expect(count).toBe(3);
    });
  });

  describe('visitType()', () => {
    it('should visit only nodes of specific type', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const cells: Node[] = [];
      await visitType(ast, 'cell', (node) => {
        cells.push(node);
      });

      expect(cells.length).toBeGreaterThan(0);
      expect(cells.every((n) => n.type === 'cell')).toBe(true);
    });
  });

  describe('transform()', () => {
    it('should transform nodes', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const transformed = await transform(ast, (node) => {
        if (node.type === 'markdown') {
          return {
            ...node,
            value: node.value.toUpperCase(),
          };
        }
      });

      // Check that markdown values are uppercase
      await visit(transformed, (node) => {
        if (node.type === 'markdown') {
          expect(node.value).toBe(node.value.toUpperCase());
        }
      });
    });

    it('should work with async transformers', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const transformed = await transform(ast, async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return node;
      });

      expect(transformed).toBeDefined();
    });
  });

  describe('transformType()', () => {
    it('should transform only nodes of specific type', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      let codeTransforms = 0;
      const transformed = await transformType(ast, 'code', (node) => {
        codeTransforms++;
        return {
          ...node,
          value: '// transformed\n' + node.value,
        };
      });

      expect(codeTransforms).toBeGreaterThan(0);

      // Check that code nodes were transformed
      await visit(transformed, (node) => {
        if (node.type === 'code') {
          expect(node.value).toContain('// transformed');
        }
      });
    });
  });

  describe('filter()', () => {
    it('should filter out nodes based on predicate', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const originalCellCount = ast.children.length;

      // Filter out markdown cells
      const filtered = (await filter(ast, (node) => {
        if (node.type === 'cell') {
          return !isMarkdownCell(node);
        }
        return true;
      })) as Root;

      expect(filtered.children.length).toBeLessThan(originalCellCount);
      expect(filtered.children.every((cell) => !isMarkdownCell(cell))).toBe(true);
    });
  });

  describe('map()', () => {
    it('should map over nodes', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const mapped = await map(ast, (node) => {
        if (node.type === 'code') {
          return {
            ...node,
            lang: 'javascript',
          };
        }
        return node;
      });

      await visit(mapped, (node) => {
        if (node.type === 'code') {
          expect(node.lang).toBe('javascript');
        }
      });
    });
  });

  describe('find()', () => {
    it('should find first matching node', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const found = await find(ast, (node) => node.type === 'code');

      expect(found).toBeDefined();
      expect(found?.type).toBe('code');
    });

    it('should return null if no node matches', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const found = await find(ast, (node) => node.type === 'nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should find all matching nodes', async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
      const ast = await parseFromFile(fixturePath);

      const found = await findAll(ast, (node) => node.type === 'cell');

      expect(found.length).toBeGreaterThan(0);
      expect(found.every((n) => n.type === 'cell')).toBe(true);
    });
  });

  describe('Built-in Transformers', () => {
    describe('removeOutputs', () => {
      it('should remove all outputs from code cells', async () => {
        const fixturePath = path.join(__dirname, 'fixtures', 'with-outputs.ipynb');
        const ast = await parseFromFile(fixturePath);

        const transformed = removeOutputs(ast);

        if (transformed && transformed.type === 'root') {
          for (const cell of transformed.children) {
            if (isCodeCell(cell)) {
              // Should only have the code node, no outputs
              expect(cell.children.length).toBe(1);
              expect(cell.children[0].type).toBe('code');
            }
          }
        }
      });
    });

    describe('removeEmptyCells', () => {
      it('should remove empty cells', async () => {
        const fixturePath = path.join(__dirname, 'fixtures', 'empty-cells.ipynb');
        const ast = await parseFromFile(fixturePath);

        const originalCount = ast.children.length;
        const transformed = removeEmptyCells(ast);

        if (transformed && transformed.type === 'root') {
          expect(transformed.children.length).toBeLessThan(originalCount);

          // All remaining cells should have content
          for (const cell of transformed.children) {
            if (isCodeCell(cell)) {
              expect(cell.children[0].value.trim()).not.toBe('');
            } else if (isMarkdownCell(cell)) {
              const content = cell.children[0];
              if (content.type === 'markdown') {
                expect(content.value.trim()).not.toBe('');
              }
            }
          }
        }
      });
    });

    describe('removeCellsByTag', () => {
      it('should remove cells with specified tags', async () => {
        const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
        const ast = await parseFromFile(fixturePath);

        const transformer = removeCellsByTag('important');
        const transformed = transformer(ast);

        if (transformed && transformed.type === 'root') {
          for (const cell of transformed.children) {
            const tags = cell.metadata?.tags || [];
            expect(tags).not.toContain('important');
          }
        }
      });
    });

    describe('extractCellsByTag', () => {
      it('should keep only cells with specified tags', async () => {
        const fixturePath = path.join(__dirname, 'fixtures', 'simple.ipynb');
        const ast = await parseFromFile(fixturePath);

        const transformer = extractCellsByTag('important');
        const transformed = transformer(ast);

        if (transformed && transformed.type === 'root') {
          expect(transformed.children.length).toBeGreaterThan(0);
          for (const cell of transformed.children) {
            const tags = cell.metadata?.tags || [];
            expect(tags).toContain('important');
          }
        }
      });
    });
  });
});
