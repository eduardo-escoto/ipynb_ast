/**
 * Utilities for processing Jupyter notebook outputs
 */

import type {
  Output,
  DisplayDataOutput,
  ExecuteResultOutput,
  MIMEBundle,
} from './types';
import { parseHtml, markdownToHtml, type HtmlProcessorOptions } from './processor';
import type { Root as HastRoot } from 'hast';
import {
  isImageMimeType,
  isWidgetMimeType,
  isVisualizationMimeType,
  selectBestMimeType,
  normalizeMimeData,
  TEXT_MIME_TYPES,
} from './mime-types';

/**
 * Check if an output has HTML content
 */
export function hasHtml(output: Output): boolean {
  if (output.type === 'displayData' || output.type === 'executeResult') {
    return 'text/html' in output.data;
  }
  return false;
}

/**
 * Check if an output has markdown content
 */
export function hasMarkdown(output: Output): boolean {
  if (output.type === 'displayData' || output.type === 'executeResult') {
    return 'text/markdown' in output.data;
  }
  return false;
}

/**
 * Check if an output has plain text content
 */
export function hasText(output: Output): boolean {
  if (output.type === 'stream') {
    return true;
  }
  if (output.type === 'displayData' || output.type === 'executeResult') {
    return 'text/plain' in output.data;
  }
  return false;
}

/**
 * Extract HTML from a MIME bundle, normalizing arrays to strings
 */
export function extractHtml(data: MIMEBundle): string | undefined {
  const html = data['text/html'];
  if (!html) return undefined;
  return Array.isArray(html) ? html.join('') : html;
}

/**
 * Extract markdown from a MIME bundle, normalizing arrays to strings
 */
export function extractMarkdown(data: MIMEBundle): string | undefined {
  const markdown = data['text/markdown'];
  if (!markdown) return undefined;
  return Array.isArray(markdown) ? markdown.join('') : markdown;
}

/**
 * Extract plain text from a MIME bundle, normalizing arrays to strings
 */
export function extractText(data: MIMEBundle): string | undefined {
  const text = data['text/plain'];
  if (!text) return undefined;
  return Array.isArray(text) ? text.join('') : text;
}

/**
 * Get the best available text representation from an output
 * Prefers: HTML > Markdown > Plain text
 */
export function getBestTextRepresentation(output: Output): string | undefined {
  if (output.type === 'stream') {
    return output.text;
  }

  if (output.type === 'displayData' || output.type === 'executeResult') {
    return extractHtml(output.data) ||
           extractMarkdown(output.data) ||
           extractText(output.data);
  }

  if (output.type === 'error') {
    return output.traceback.join('\n');
  }

  return undefined;
}

/**
 * Parse HTML from an output into a hast tree
 */
export async function parseOutputHtml(
  output: DisplayDataOutput | ExecuteResultOutput,
  options?: HtmlProcessorOptions
): Promise<HastRoot | null> {
  const html = extractHtml(output.data);
  if (!html) return null;

  return parseHtml(html, options);
}

/**
 * Convert markdown from an output to HTML
 */
export async function outputMarkdownToHtml(
  output: DisplayDataOutput | ExecuteResultOutput
): Promise<string | null> {
  const markdown = extractMarkdown(output.data);
  if (!markdown) return null;

  return markdownToHtml(markdown);
}

/**
 * Get all output MIME types from an output
 */
export function getOutputMimeTypes(output: Output): string[] {
  if (output.type === 'stream') {
    return [TEXT_MIME_TYPES.PLAIN];
  }

  if (output.type === 'displayData' || output.type === 'executeResult') {
    return Object.keys(output.data);
  }

  if (output.type === 'error') {
    return ['application/vnd.jupyter.error'];
  }

  return [];
}

/**
 * Get the best MIME type from an output based on priority
 */
export function getBestOutputMimeType(output: Output): string | undefined {
  const mimeTypes = getOutputMimeTypes(output);
  return selectBestMimeType(mimeTypes);
}

/**
 * Extract data for a specific MIME type from an output
 */
export function extractMimeData(
  output: DisplayDataOutput | ExecuteResultOutput,
  mimeType: string
): any {
  const data = output.data[mimeType];
  return normalizeMimeData(mimeType, data);
}

/**
 * Check if output contains a specific MIME type
 */
export function hasMimeType(output: Output, mimeType: string): boolean {
  return getOutputMimeTypes(output).includes(mimeType);
}

/**
 * Check if output contains any image MIME type
 */
export function hasImage(output: Output): boolean {
  if (output.type !== 'displayData' && output.type !== 'executeResult') {
    return false;
  }
  return Object.keys(output.data).some(isImageMimeType);
}

/**
 * Check if output contains a widget
 */
export function hasWidget(output: Output): boolean {
  if (output.type !== 'displayData' && output.type !== 'executeResult') {
    return false;
  }
  return Object.keys(output.data).some(isWidgetMimeType);
}

/**
 * Check if output contains a visualization (Plotly, Vega, etc.)
 */
export function hasVisualization(output: Output): boolean {
  if (output.type !== 'displayData' && output.type !== 'executeResult') {
    return false;
  }
  return Object.keys(output.data).some(isVisualizationMimeType);
}

/**
 * Options for rendering outputs to HTML
 */
export interface RenderOutputOptions {
  /**
   * Whether to wrap outputs in HTML tags
   * Default: true
   */
  wrap?: boolean;

  /**
   * Class name for wrapper element
   * Default: 'jupyter-output'
   */
  wrapperClass?: string;

  /**
   * Whether to include ANSI color codes in error output
   * Default: false (strips ANSI codes)
   */
  preserveAnsi?: boolean;

  /**
   * Options for HTML processing
   */
  htmlOptions?: HtmlProcessorOptions;
}

/**
 * Render an output to HTML string
 */
export async function renderOutputToHtml(
  output: Output,
  options: RenderOutputOptions = {}
): Promise<string> {
  const wrap = options.wrap !== false;
  const wrapperClass = options.wrapperClass || 'jupyter-output';

  let content = '';

  if (output.type === 'stream') {
    content = escapeHtml(output.text);
    if (wrap) {
      content = `<pre class="${wrapperClass} ${wrapperClass}-stream ${wrapperClass}-${output.name}">${content}</pre>`;
    }
  } else if (output.type === 'displayData' || output.type === 'executeResult') {
    // Prefer HTML, then markdown, then plain text
    const html = extractHtml(output.data);
    if (html) {
      content = html;
    } else {
      const markdown = extractMarkdown(output.data);
      if (markdown) {
        content = await markdownToHtml(markdown);
      } else {
        const text = extractText(output.data);
        if (text) {
          content = `<pre>${escapeHtml(text)}</pre>`;
        }
      }
    }

    if (wrap && content) {
      const outputType = output.type === 'executeResult' ? 'execute-result' : 'display-data';
      content = `<div class="${wrapperClass} ${wrapperClass}-${outputType}">${content}</div>`;
    }
  } else if (output.type === 'error') {
    const traceback = options.preserveAnsi
      ? output.traceback.join('\n')
      : stripAnsi(output.traceback.join('\n'));

    content = escapeHtml(traceback);

    if (wrap) {
      content = `<pre class="${wrapperClass} ${wrapperClass}-error"><span class="error-name">${escapeHtml(output.ename)}</span>: ${escapeHtml(output.evalue)}\n${content}</pre>`;
    }
  }

  return content;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Strip ANSI color codes from text
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
