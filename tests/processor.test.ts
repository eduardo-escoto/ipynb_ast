import { describe, it, expect } from 'vitest';
import {
  createMarkdownProcessor,
  createHtmlProcessor,
  parseMarkdown,
  parseHtml,
  markdownToHtml,
} from '../src/processor';

describe('Processor', () => {
  describe('createMarkdownProcessor()', () => {
    it('should create a markdown processor', () => {
      const processor = createMarkdownProcessor();
      expect(processor).toBeDefined();
      expect(processor.parse).toBeDefined();
      expect(processor.stringify).toBeDefined();
    });

    it('should parse markdown', async () => {
      const processor = createMarkdownProcessor();
      const result = await processor.parse('# Heading\n\nParagraph text.');

      expect(result).toBeDefined();
      expect(result.type).toBe('root');
      expect(result.children).toBeDefined();
      expect(result.children.length).toBeGreaterThan(0);
    });
  });

  describe('createHtmlProcessor()', () => {
    it('should create an HTML processor', () => {
      const processor = createHtmlProcessor();
      expect(processor).toBeDefined();
      expect(processor.parse).toBeDefined();
      expect(processor.stringify).toBeDefined();
    });

    it('should parse HTML', async () => {
      const processor = createHtmlProcessor();
      const result = await processor.parse('<div><p>Hello</p></div>');

      expect(result).toBeDefined();
      expect(result.type).toBe('root');
      expect(result.children).toBeDefined();
    });
  });

  describe('parseMarkdown()', () => {
    it('should parse markdown string to AST', async () => {
      const ast = await parseMarkdown('# Heading\n\nParagraph text.');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
      expect(ast.children).toBeDefined();
      expect(ast.children.length).toBeGreaterThan(0);
    });

    it('should handle inline markdown', async () => {
      const ast = await parseMarkdown('**bold** and *italic*');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
    });

    it('should handle code blocks', async () => {
      const markdown = '```python\nprint("hello")\n```';
      const ast = await parseMarkdown(markdown);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
    });

    it('should handle lists', async () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const ast = await parseMarkdown(markdown);

      expect(ast).toBeDefined();
      expect(ast.children.length).toBeGreaterThan(0);
    });

    it('should handle links', async () => {
      const markdown = '[Link text](https://example.com)';
      const ast = await parseMarkdown(markdown);

      expect(ast).toBeDefined();
    });

    it('should handle images', async () => {
      const markdown = '![Alt text](image.png)';
      const ast = await parseMarkdown(markdown);

      expect(ast).toBeDefined();
    });
  });

  describe('parseHtml()', () => {
    it('should parse HTML string to AST', async () => {
      const ast = await parseHtml('<div><p>Hello</p></div>');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
      expect(ast.children).toBeDefined();
    });

    it('should handle nested HTML', async () => {
      const html = '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>';
      const ast = await parseHtml(html);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
    });

    it('should handle HTML with attributes', async () => {
      const html = '<div class="container" id="main"><p style="color: red;">Text</p></div>';
      const ast = await parseHtml(html);

      expect(ast).toBeDefined();
    });

    it('should handle self-closing tags', async () => {
      const html = '<img src="image.png" alt="Image" /><br />';
      const ast = await parseHtml(html);

      expect(ast).toBeDefined();
    });
  });

  describe('markdownToHtml()', () => {
    it('should convert markdown to HTML', async () => {
      const html = await markdownToHtml('# Heading\n\nParagraph text.');

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('<h1>');
      expect(html).toContain('Heading');
      expect(html).toContain('<p>');
      expect(html).toContain('Paragraph');
    });

    it('should convert inline markdown', async () => {
      const html = await markdownToHtml('**bold** and *italic*');

      expect(html).toContain('<strong>');
      expect(html).toContain('bold');
      expect(html).toContain('<em>');
      expect(html).toContain('italic');
    });

    it('should convert code blocks', async () => {
      const markdown = '```python\nprint("hello")\n```';
      const html = await markdownToHtml(markdown);

      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
      expect(html).toContain('print');
    });

    it('should convert lists', async () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = await markdownToHtml(markdown);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
      expect(html).toContain('Item 1');
    });

    it('should convert links', async () => {
      const markdown = '[Link text](https://example.com)';
      const html = await markdownToHtml(markdown);

      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Link text');
    });
  });

  describe('Custom Processors with Plugins', () => {
    it('should accept custom remark plugins', () => {
      // Just test that it accepts plugins without error
      const processor = createMarkdownProcessor({
        plugins: [],
      });

      expect(processor).toBeDefined();
    });

    it('should accept custom rehype plugins', () => {
      // Just test that it accepts plugins without error
      const processor = createHtmlProcessor({
        plugins: [],
      });

      expect(processor).toBeDefined();
    });
  });
});
