# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ipynb_ast** is a unified AST parser for Jupyter Notebooks, designed to enable content manipulation and rendering pipelines similar to how markdown AST (md_ast) works for markdown files. The goal is to provide a structured representation of Jupyter notebooks that can be programmatically traversed and modified.

## Development Commands

```bash
# Build the project (compile TypeScript to JavaScript)
npm run build

# Run the project directly without compilation (for development)
npm run dev

# Watch mode - automatically recompile on file changes
npm run watch

# Clean compiled output
npm run clean
```

## Architecture

### Type System Philosophy

The project uses a dual-type system to represent both the native Jupyter notebook format and the AST representation:

1. **Jupyter Native Types** (`JupyterNotebook`, `CodeCell`, `MarkdownCell`, `RawCell`, `CellOutput`)
   - Matches the official Jupyter notebook format specification
   - Handles the quirks of the `.ipynb` JSON structure (e.g., `source` can be string or string[])

2. **AST Types** (`RootNode`, `CellNode`, `ASTNode`)
   - Normalized, tree-based representation for easier traversal and manipulation
   - Flattens arrays (e.g., source is always a string)
   - Designed to be similar to markdown AST ecosystems

### Parser Design

The parser in `src/parser.ts` is the bridge between these two type systems:

- `parse(notebook: JupyterNotebook): RootNode` - Main parser that converts Jupyter format to AST
- `parseFromString(json: string): RootNode` - Convenience method for parsing JSON strings

Key transformation logic:
- Cell sources (which can be `string | string[]` in Jupyter format) are normalized to single strings
- Code cells preserve execution metadata (execution_count, outputs)
- All cell metadata is preserved in the AST nodes

### TypeScript Configuration

- **Strict mode enabled** - All code must pass strict TypeScript checks
- **Module system**: CommonJS (for maximum Node.js compatibility)
- **Output**: `dist/` directory with full type declarations (`.d.ts` files) and source maps
- **Unused variables/parameters** are not allowed - the compiler will error on these

## Unified.js Integration

The library is fully integrated with the unified.js ecosystem:

- **processor.ts** - Configurable remark/rehype pipelines for markdown and HTML processing
- **ParseOptions** - Parser accepts options to enable markdown parsing with custom plugins
- **output-utils.ts** - Utilities for extracting and rendering outputs to HTML

Key integration points:
- Markdown cells can be parsed into mdast (Markdown AST) using remark
- HTML outputs can be parsed into hast (HTML AST) using rehype
- Users can pass remark/rehype plugins via options
- The AST design follows unist (Universal Syntax Tree) patterns

## Module Structure

- **types.ts** - Type definitions (Jupyter input types + AST output types)
- **parser.ts** - Converts Jupyter notebooks to AST (with optional markdown parsing)
- **processor.ts** - Unified.js processors for markdown/HTML
- **output-utils.ts** - Utilities for working with cell outputs
- **index.ts** - Public API exports

## Future Development Considerations

When extending this library, consider following the patterns established by markdown AST ecosystems:

- Add visitor/transformer utilities for AST traversal (similar to unist-util-visit)
- Create serializer functions to convert AST back to Jupyter notebook format
- Implement plugins for custom transformations
- Add utilities for common notebook operations (merging cells, extracting outputs, etc.)
- Consider creating a unified plugin for notebook-specific transformations
