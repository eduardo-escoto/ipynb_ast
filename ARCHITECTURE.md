# Architecture & Philosophy

This document explains the architectural decisions and philosophy behind ipynb-ast.

## Design Philosophy

ipynb-ast follows the **unified.js** philosophy:

> **Parse → Transform → Render**

The core library focuses on **parsing** and **transforming**, while **rendering** is left to users and plugins.

## What the Core Library Does

### ✅ Parsing
Convert Jupyter notebooks (`.ipynb` files) to a well-typed AST:

```typescript
import { parseFromFile } from 'ipynb-ast';

const ast = await parseFromFile('notebook.ipynb', {
  parseMarkdown: true,  // Optional: parse markdown cells to mdast
});
```

### ✅ Type Definitions
Provide comprehensive TypeScript types for:
- Jupyter notebook format (input)
- AST node types (output)
- MIME types and bundles
- All with full type safety and guards

### ✅ MIME Type Utilities
Helper functions for working with outputs:

```typescript
import {
  getOutputMimeTypes,
  getBestOutputMimeType,
  extractMimeData,
  hasVisualization,
} from 'ipynb-ast';
```

### ✅ Basic Transformations
Simple utilities that don't require external dependencies:
- Text normalization (array → string)
- Metadata access
- Cell filtering
- AST traversal

### ✅ Integration with unified.js
First-class support for remark (markdown) and rehype (HTML):

```typescript
import remarkGfm from 'remark-gfm';

const ast = await parseFromFile('notebook.ipynb', {
  parseMarkdown: true,
  markdownOptions: {
    plugins: [remarkGfm],
  },
});
```

## What the Core Library Does NOT Do

### ❌ Complex Rendering
The core does NOT include renderers for:
- **Plotly** charts
- **Vega/Vega-Lite** visualizations
- **Bokeh** plots
- **IPyWidgets**
- **LaTeX** (KaTeX, MathJax)
- **Code syntax highlighting**

**Why?** These require large external dependencies and are highly customizable. Users should have full control over how they render.

### ❌ Opinionated HTML Generation
The core provides `renderOutputToHtml()` for **basic** output rendering (text, simple HTML), but doesn't enforce any specific:
- CSS frameworks
- JavaScript libraries
- Visual themes
- Layout systems

### ❌ Format Conversion
The core does NOT convert notebooks to:
- PDF
- LaTeX
- Word documents
- Static sites

**Why?** These are application-specific use cases better served by separate tools or plugins.

## Comparison with Other Ecosystems

### Similar to unified.js

| Library | What It Does | What Users/Plugins Do |
|---------|-------------|----------------------|
| **remark** | Parse markdown to mdast | Render to HTML, add GFM, math, etc. |
| **rehype** | Parse HTML to hast | Syntax highlighting, sanitization |
| **ipynb-ast** | Parse notebooks to AST | Render Plotly, Vega, widgets, LaTeX |

### Example: LaTeX Rendering

**remark** doesn't render LaTeX:
```typescript
import { remark } from 'remark';
import remarkMath from 'remark-math';      // Plugin: detect math
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';    // Plugin: render with KaTeX

const result = await remark()
  .use(remarkMath)      // Parse math syntax
  .use(remarkRehype)
  .use(rehypeKatex)     // Render with KaTeX
  .process('$E = mc^2$');
```

**ipynb-ast** follows the same pattern:
```typescript
import { parseFromFile, extractMimeData } from 'ipynb-ast';
// User brings their own renderer
import katex from 'katex';

const notebook = await parseFromFile('notebook.ipynb');

// User decides how to render LaTeX
for (const output of getOutputs(notebook)) {
  if (hasMimeType(output, 'text/latex')) {
    const latex = extractMimeData(output, 'text/latex');
    const html = katex.renderToString(latex);  // User's choice: KaTeX, MathJax, etc.
  }
}
```

## Plugin/Renderer Architecture

Users can build custom renderers using the provided utilities:

```typescript
// User creates their own renderer
class NotebookRenderer {
  constructor(private options: RenderOptions) {}

  async render(notebook: Root): Promise<string> {
    // Use ipynb-ast utilities
    const parts: string[] = [];

    for (const cell of notebook.children) {
      if (cell.cellType === 'code') {
        for (const output of cell.children.slice(1)) {
          // User decides rendering strategy
          const html = await this.renderOutput(output);
          parts.push(html);
        }
      }
    }

    return parts.join('\n');
  }

  private async renderOutput(output: Output): Promise<string> {
    // Get best MIME type (utility from ipynb-ast)
    const mimeType = getBestOutputMimeType(output);

    // User handles rendering based on their needs
    if (mimeType === 'application/vnd.plotly.v1+json') {
      return this.renderPlotly(output);  // User implements
    } else if (mimeType.startsWith('application/vnd.vega')) {
      return this.renderVega(output);    // User implements
    }
    // ... etc
  }
}
```

See [examples/custom-renderers.ts](./examples/custom-renderers.ts) for complete examples.

## Transformer System

ipynb-ast provides a transformer system for AST manipulation:

```typescript
import { visit, transform, filter } from 'ipynb-ast';

// Visit all nodes
await visit(notebook, (node) => {
  console.log(node.type);
});

// Transform specific nodes
const cleaned = await transform(notebook, (node) => {
  if (node.type === 'cell' && node.cellType === 'code') {
    // Remove outputs
    node.children = [node.children[0]];
  }
});

// Filter nodes
const onlyMarkdown = await filter(notebook, (node) => {
  return node.type !== 'cell' || node.cellType === 'markdown';
});
```

Built-in transformers:
- `removeOutputs` - Remove all outputs
- `removeEmptyCells` - Remove empty cells
- `removeCellsByTag` - Remove cells by tag
- `extractCellsByTag` - Keep only tagged cells

Users can create custom transformers following the same pattern.

## When to Create a Plugin

Create a separate package when:

1. **Requires external dependencies** - Plotly.js, Vega, KaTeX, etc.
2. **Highly configurable** - Theme systems, rendering options
3. **Application-specific** - Export to specific format
4. **Reusable** - Others might want to use it

Example plugin packages (hypothetical):
- `ipynb-ast-renderer-plotly` - Render Plotly charts
- `ipynb-ast-renderer-katex` - Render LaTeX with KaTeX
- `ipynb-ast-to-html` - Complete HTML conversion
- `ipynb-ast-to-pdf` - PDF export

## Core vs Plugin Decision Tree

```
Does it require external dependencies?
├─ Yes → Plugin
└─ No
    ├─ Is it highly opinionated?
    │   ├─ Yes → Plugin
    │   └─ No
    │       ├─ Is it a utility everyone needs?
    │       │   ├─ Yes → Core
    │       │   └─ No → Plugin
    │       └─ Is it simple and universally useful?
    │           ├─ Yes → Core
    │           └─ No → Plugin
```

## Examples

### ✅ Core Library Scope

```typescript
// These are in core because they're simple utilities
import {
  parseFromFile,           // Parse .ipynb to AST
  getOutputMimeTypes,      // Get available MIME types
  extractMimeData,         // Extract and normalize data
  visit,                   // Traverse AST
  filter,                  // Filter nodes
} from 'ipynb-ast';
```

### 🔌 Plugin Scope

```typescript
// These would be separate plugins
import { renderWithPlotly } from 'ipynb-ast-renderer-plotly';
import { renderWithKatex } from 'ipynb-ast-renderer-katex';
import { toStatic HTML } from 'ipynb-ast-to-html';
import { highlightCode } from 'ipynb-ast-highlight';
```

## Benefits of This Approach

1. **Minimal dependencies** - Core stays lightweight
2. **Flexibility** - Users choose their rendering stack
3. **Composability** - Mix and match renderers
4. **Type safety** - Everything is strongly typed
5. **Familiar** - Follows unified.js patterns
6. **Extensible** - Easy to add custom renderers

## Summary

**ipynb-ast core** provides:
- Parsing (`.ipynb` → AST)
- Type definitions
- MIME type utilities
- Basic transformations
- unified.js integration

**Users/Plugins** provide:
- Rendering (Plotly, Vega, widgets)
- LaTeX rendering (KaTeX, MathJax)
- Code highlighting
- Theme systems
- Format conversion

This separation keeps the core focused, lightweight, and flexible while enabling rich ecosystems of plugins.
