/**
 * Unified processor configuration for ipynb-ast
 * Provides configurable remark and rehype pipelines
 */

import { unified, type Processor, type Pluggable } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { toHast } from 'mdast-util-to-hast';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot } from 'hast';

/**
 * Options for processing markdown
 */
export interface MarkdownProcessorOptions {
  /**
   * Remark plugins to use when parsing/transforming markdown
   * Can be a plugin or [plugin, options] tuple
   */
  plugins?: Pluggable[];

  /**
   * Whether to parse markdown into mdast (default: true)
   * If false, markdown will be kept as plain strings
   */
  parse?: boolean;
}

/**
 * Options for processing HTML
 */
export interface HtmlProcessorOptions {
  /**
   * Rehype plugins to use when parsing/transforming HTML
   * Can be a plugin or [plugin, options] tuple
   */
  plugins?: Pluggable[];

  /**
   * Whether to parse HTML into hast (default: true)
   * If false, HTML will be kept as plain strings
   */
  parse?: boolean;

  /**
   * Fragment mode - parse as HTML fragment vs full document
   * Default: true (fragment mode)
   */
  fragment?: boolean;
}

/**
 * Options for markdown to HTML conversion
 */
export interface MarkdownToHtmlOptions {
  /**
   * Options for mdast-util-to-hast conversion
   */
  toHastOptions?: {
    allowDangerousHtml?: boolean;
    [key: string]: any;
  };

  /**
   * Rehype plugins to apply after conversion
   */
  rehypePlugins?: Pluggable[];
}

/**
 * Create a configured markdown processor
 */
export function createMarkdownProcessor(options: MarkdownProcessorOptions = {}): Processor<MdastRoot> {
  let processor = unified().use(remarkParse) as any;

  // Add user-provided plugins
  if (options.plugins) {
    for (const plugin of options.plugins) {
      if (Array.isArray(plugin)) {
        processor = processor.use(plugin[0], plugin[1]);
      } else {
        processor = processor.use(plugin);
      }
    }
  }

  return processor as Processor<MdastRoot>;
}

/**
 * Create a configured HTML processor
 */
export function createHtmlProcessor(options: HtmlProcessorOptions = {}): Processor<HastRoot> {
  const fragment = options.fragment !== false; // default to true

  let processor = unified().use(rehypeParse, { fragment }) as any;

  // Add user-provided plugins
  if (options.plugins) {
    for (const plugin of options.plugins) {
      if (Array.isArray(plugin)) {
        processor = processor.use(plugin[0], plugin[1]);
      } else {
        processor = processor.use(plugin);
      }
    }
  }

  return processor as Processor<HastRoot>;
}

/**
 * Convert markdown string to mdast
 */
export async function parseMarkdown(
  markdown: string,
  options: MarkdownProcessorOptions = {}
): Promise<MdastRoot> {
  const processor = createMarkdownProcessor(options);
  const tree = await processor.parse(markdown);
  return tree;
}

/**
 * Convert HTML string to hast
 */
export async function parseHtml(
  html: string,
  options: HtmlProcessorOptions = {}
): Promise<HastRoot> {
  const processor = createHtmlProcessor(options);
  const tree = await processor.parse(html);
  return tree;
}

/**
 * Convert mdast to HTML string
 */
export async function markdownToHtml(
  markdown: string | MdastRoot,
  options: MarkdownToHtmlOptions = {}
): Promise<string> {
  // Parse markdown if string is provided
  let mdastTree: MdastRoot;
  if (typeof markdown === 'string') {
    mdastTree = await parseMarkdown(markdown);
  } else {
    mdastTree = markdown;
  }

  // Convert mdast to hast
  const hastTree = toHast(mdastTree, options.toHastOptions);

  if (!hastTree) {
    return '';
  }

  // Create HTML processor with user plugins
  let processor = unified().use(rehypeStringify) as any;

  if (options.rehypePlugins) {
    for (const plugin of options.rehypePlugins) {
      if (Array.isArray(plugin)) {
        processor = processor.use(plugin[0], plugin[1]);
      } else {
        processor = processor.use(plugin);
      }
    }
  }

  const html = await processor.stringify(hastTree as any);
  return html as string;
}

/**
 * Convert mdast back to markdown string
 */
export async function stringifyMarkdown(
  tree: MdastRoot,
  options: MarkdownProcessorOptions = {}
): Promise<string> {
  let processor = createMarkdownProcessor(options) as any;
  processor = processor.use(remarkStringify);

  const markdown = await processor.stringify(tree);
  return markdown as string;
}

/**
 * Convert hast back to HTML string
 */
export async function stringifyHtml(
  tree: HastRoot,
  options: HtmlProcessorOptions = {}
): Promise<string> {
  let processor = createHtmlProcessor(options) as any;
  processor = processor.use(rehypeStringify);

  const html = await processor.stringify(tree);
  return html as string;
}
