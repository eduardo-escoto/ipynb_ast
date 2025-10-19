# Unified.js Integration

This document explains how ipynb-ast integrates with the [unified.js](https://unifiedjs.com/) ecosystem for processing markdown and HTML content in Jupyter notebooks.

## Overview

ipynb-ast is designed for maximum compatibility with the unified.js ecosystem:

- **[remark](https://github.com/remarkjs/remark)** - For processing markdown cells
- **[rehype](https://github.com/rehypejs/rehype)** - For processing HTML outputs
- **[mdast](https://github.com/syntax-tree/mdast)** - Markdown Abstract Syntax Tree
- **[hast](https://github.com/syntax-tree/hast)** - HTML Abstract Syntax Tree

## Architecture

The integration follows unified.js patterns:

1. **Parser** - Converts Jupyter notebooks (`.ipynb`) to an AST
2. **Processor** - Configurable pipelines for markdown and HTML
3. **Transformer** - Modify the AST using unified plugins
4. **Compiler** - Convert AST back to various formats (HTML, markdown, etc.)

## Parsing Markdown Cells

By default, markdown cells are kept as plain strings. You can opt-in to parsing them into mdast trees:

```typescript
import { parseFromFile } from 'ipynb-ast';

const notebook = await parseFromFile('example.ipynb', {
  parseMarkdown: true,
});

// Markdown cells now contain mdast trees
for (const cell of notebook.children) {
  if (cell.cellType === 'markdown') {
    const content = cell.children[0];
    if (content.type === 'parsedMarkdown') {
      console.log('mdast nodes:', content.children);
    }
  }
}
```

## Using Remark Plugins

You can pass remark plugins to customize markdown processing:

```typescript
import { parseFromFile } from 'ipynb-ast';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const notebook = await parseFromFile('example.ipynb', {
  parseMarkdown: true,
  markdownOptions: {
    plugins: [
      remarkGfm,           // GitHub Flavored Markdown
      remarkMath,          // Math syntax
      [remarkToc, {        // Table of contents with options
        heading: 'contents',
        maxDepth: 3,
      }],
    ],
  },
});
```

## Converting Markdown to HTML

Use the built-in markdown-to-HTML converter:

```typescript
import { markdownToHtml } from 'ipynb-ast';

// From string
const html1 = await markdownToHtml('# Hello\n\nThis is **markdown**.');

// From mdast tree
const mdastTree = {
  type: 'root',
  children: [
    { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Hello' }] },
  ],
};
const html2 = await markdownToHtml(mdastTree);
```

With rehype plugins:

```typescript
import { markdownToHtml } from 'ipynb-ast';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const html = await markdownToHtml('# Hello', {
  rehypePlugins: [
    rehypeSanitize,  // Sanitize HTML output
  ],
});
```

## Processing HTML Outputs

Parse HTML from outputs into hast trees:

```typescript
import { parseOutputHtml } from 'ipynb-ast';

// For a display_data or execute_result output
const output = cell.children[1]; // First output
if (output.type === 'displayData' || output.type === 'executeResult') {
  const hastTree = await parseOutputHtml(output, {
    fragment: true,  // Parse as HTML fragment (default)
    plugins: [
      // Add rehype plugins here
    ],
  });

  if (hastTree) {
    console.log('HTML nodes:', hastTree.children);
  }
}
```

## Rendering Outputs

Render outputs to HTML with the utility functions:

```typescript
import { parseFromFile, renderOutputToHtml } from 'ipynb-ast';

const notebook = await parseFromFile('example.ipynb');

for (const cell of notebook.children) {
  if (cell.cellType === 'code') {
    for (const output of cell.children.slice(1)) {
      const html = await renderOutputToHtml(output, {
        wrap: true,                    // Wrap in HTML tags
        wrapperClass: 'jupyter-output', // CSS class
        preserveAnsi: false,           // Strip ANSI codes from errors
      });

      console.log(html);
    }
  }
}
```

## Custom Processors

Create your own processor instances for advanced use cases:

```typescript
import { createMarkdownProcessor, createHtmlProcessor } from 'ipynb-ast';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSanitize from 'rehype-sanitize';

// Create a custom markdown processor
const markdownProcessor = createMarkdownProcessor({
  plugins: [remarkGfm, remarkMath],
});

// Parse markdown
const mdastTree = await markdownProcessor.parse('# Hello');

// Create a custom HTML processor
const htmlProcessor = createHtmlProcessor({
  plugins: [rehypeSanitize],
  fragment: true,
});

// Parse HTML
const hastTree = await htmlProcessor.parse('<p>Hello</p>');
```

## Type Guards

Use type guards to safely work with different node types:

```typescript
import {
  isCodeCell,
  isMarkdownCell,
  isRawCell,
  isMarkdown,
  isParsedMarkdown,
  isOutput,
} from 'ipynb-ast';

for (const cell of notebook.children) {
  if (isCodeCell(cell)) {
    console.log('Code:', cell.children[0].value);
    console.log('Outputs:', cell.children.slice(1).filter(isOutput));
  }

  if (isMarkdownCell(cell)) {
    const content = cell.children[0];
    if (isParsedMarkdown(content)) {
      console.log('Parsed mdast:', content.children);
    } else if (isMarkdown(content)) {
      console.log('Plain markdown:', content.value);
    }
  }
}
```

## Visitor Pattern

Walk the AST using a visitor pattern (similar to unist-util-visit):

```typescript
function visit(node, callback) {
  callback(node);

  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child, callback);
    }
  }
}

// Count all node types
const counts = {};
visit(notebook, (node) => {
  counts[node.type] = (counts[node.type] || 0) + 1;
});
```

For more advanced tree walking, consider using [unist-util-visit](https://github.com/syntax-tree/unist-util-visit):

```typescript
import { visit } from 'unist-util-visit';

// Find all code blocks in markdown cells
visit(notebook, 'parsedMarkdown', (markdownNode) => {
  visit(markdownNode, 'code', (codeNode) => {
    console.log('Found code block:', codeNode.value);
  });
});
```

## Available Utilities

### Processor Functions

- `createMarkdownProcessor(options)` - Create remark processor
- `createHtmlProcessor(options)` - Create rehype processor
- `parseMarkdown(markdown, options)` - Parse markdown to mdast
- `parseHtml(html, options)` - Parse HTML to hast
- `markdownToHtml(markdown, options)` - Convert markdown to HTML
- `stringifyMarkdown(tree, options)` - Convert mdast to markdown
- `stringifyHtml(tree, options)` - Convert hast to HTML

### Output Utilities

- `hasHtml(output)` - Check if output has HTML
- `hasMarkdown(output)` - Check if output has markdown
- `hasText(output)` - Check if output has text
- `extractHtml(data)` - Extract HTML from MIME bundle
- `extractMarkdown(data)` - Extract markdown from MIME bundle
- `extractText(data)` - Extract text from MIME bundle
- `getBestTextRepresentation(output)` - Get best text from output
- `parseOutputHtml(output, options)` - Parse output HTML to hast
- `outputMarkdownToHtml(output)` - Convert output markdown to HTML
- `renderOutputToHtml(output, options)` - Render output to HTML
- `getOutputMimeTypes(output)` - Get available MIME types

## Plugin Compatibility

ipynb-ast is compatible with the entire unified.js plugin ecosystem:

### Remark Plugins (Markdown)

- [remark-gfm](https://github.com/remarkjs/remark-gfm) - GitHub Flavored Markdown
- [remark-math](https://github.com/remarkjs/remark-math) - Math syntax
- [remark-toc](https://github.com/remarkjs/remark-toc) - Table of contents
- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter) - Frontmatter support
- [remark-emoji](https://github.com/rhysd/remark-emoji) - Emoji support
- And 100+ more on [npm](https://www.npmjs.com/search?q=keywords:remark-plugin)

### Rehype Plugins (HTML)

- [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) - Sanitize HTML
- [rehype-highlight](https://github.com/rehypejs/rehype-highlight) - Syntax highlighting
- [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) - Render math with KaTeX
- [rehype-raw](https://github.com/rehypejs/rehype-raw) - Parse raw HTML in markdown
- And 50+ more on [npm](https://www.npmjs.com/search?q=keywords:rehype-plugin)

## Examples

See the `examples/` directory for complete examples:

- `basic-usage.ts` - Basic parsing with and without markdown parsing
- `remark-plugins.ts` - Using remark plugins
- `rendering-outputs.ts` - Rendering outputs to HTML
- `markdown-to-html.ts` - Converting markdown cells to HTML
- `visiting-nodes.ts` - Walking the AST with visitors

## Best Practices

1. **Parse markdown only when needed** - Parsing has overhead, enable only if transforming
2. **Use streaming for large notebooks** - Process cells one at a time
3. **Cache processor instances** - Reuse processors across multiple notebooks
4. **Use type guards** - TypeScript type guards ensure type safety
5. **Leverage existing plugins** - Don't reinvent the wheel, use unified plugins

## Related Projects

- [unified](https://unifiedjs.com/) - The unified ecosystem
- [remark](https://github.com/remarkjs/remark) - Markdown processor
- [rehype](https://github.com/rehypejs/rehype) - HTML processor
- [mdast](https://github.com/syntax-tree/mdast) - Markdown AST spec
- [hast](https://github.com/syntax-tree/hast) - HTML AST spec
- [unist](https://github.com/syntax-tree/unist) - Universal syntax tree
