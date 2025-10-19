# ipynb-ast

A unified AST parser for Jupyter Notebooks with full [unified.js](https://unifiedjs.com/) ecosystem integration.

This library converts Jupyter notebooks (`.ipynb` files) to an Abstract Syntax Tree for manipulation and rendering pipelines, similar to how [mdast](https://github.com/syntax-tree/mdast) works for markdown.

## Features

- **Lossless parsing** - Preserves all notebook information including metadata
- **Unified.js compatible** - Works with remark, rehype, and the entire unified ecosystem
- **TypeScript-first** - Fully typed with comprehensive type guards
- **Flexible processing** - Optional markdown parsing with configurable plugins
- **Output rendering** - Built-in utilities for rendering outputs to HTML
- **Unist compatible** - Follows the [unist](https://github.com/syntax-tree/unist) specification

## Installation

```bash
npm install ipynb-ast
```

## Quick Start

```typescript
import { parseFromFile } from 'ipynb-ast';

// Basic parsing
const notebook = await parseFromFile('example.ipynb');

// With markdown parsing
const notebookWithMdast = await parseFromFile('example.ipynb', {
  parseMarkdown: true,
});

// With remark plugins
import remarkGfm from 'remark-gfm';

const notebook = await parseFromFile('example.ipynb', {
  parseMarkdown: true,
  markdownOptions: {
    plugins: [remarkGfm],
  },
});
```

## Documentation

- [Architecture & Philosophy](./ARCHITECTURE.md) - Design decisions and plugin system
- [Specification](./SPEC.md) - Complete AST specification
- [Unified Integration](./UNIFIED.md) - Guide to using with unified.js
- [MIME Types](./MIME_TYPES.md) - Working with Jupyter MIME types
- [Examples](./examples/) - Code examples
- [CLAUDE.md](./CLAUDE.md) - Development guide for contributors

## API

### Parsing

- `parse(notebook, options?)` - Parse a notebook object to AST
- `parseFromString(json, options?)` - Parse from JSON string
- `parseFromFile(filePath, options?)` - Parse from file path

### Processing

- `createMarkdownProcessor(options)` - Create remark processor
- `createHtmlProcessor(options)` - Create rehype processor
- `markdownToHtml(markdown, options)` - Convert markdown to HTML
- `parseMarkdown(markdown, options)` - Parse markdown to mdast
- `parseHtml(html, options)` - Parse HTML to hast

### Output Utilities

- `renderOutputToHtml(output, options)` - Render output to HTML
- `hasHtml(output)`, `hasMarkdown(output)`, `hasText(output)` - Check output types
- `extractHtml(data)`, `extractMarkdown(data)`, `extractText(data)` - Extract from MIME bundles

### Type Guards

- `isCodeCell(node)`, `isMarkdownCell(node)`, `isRawCell(node)`
- `isMarkdown(node)`, `isParsedMarkdown(node)`
- `isOutput(node)`

### Transformers

- `visit(tree, visitor)` - Traverse AST
- `visitType(tree, type, visitor)` - Visit nodes of specific type
- `transform(tree, transformer)` - Transform all nodes
- `filter(tree, predicate)` - Filter nodes
- `find(tree, predicate)`, `findAll(tree, predicate)` - Search nodes
- Built-in: `removeOutputs`, `removeEmptyCells`, `removeCellsByTag`, `extractCellsByTag`

## Examples

### Rendering a Notebook to HTML

```typescript
import { parseFromFile, renderOutputToHtml, markdownToHtml } from 'ipynb-ast';

const notebook = await parseFromFile('example.ipynb', {
  parseMarkdown: true,
});

for (const cell of notebook.children) {
  if (cell.cellType === 'markdown') {
    const html = await markdownToHtml(cell.children[0].value);
    console.log(html);
  } else if (cell.cellType === 'code') {
    for (const output of cell.children.slice(1)) {
      const html = await renderOutputToHtml(output);
      console.log(html);
    }
  }
}
```

### Using Remark Plugins

```typescript
import { parseFromFile } from 'ipynb-ast';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const notebook = await parseFromFile('example.ipynb', {
  parseMarkdown: true,
  markdownOptions: {
    plugins: [remarkGfm, remarkMath],
  },
});
```

## License

ISC

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

