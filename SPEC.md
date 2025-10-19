# ipynb-ast Specification

This document defines the Abstract Syntax Tree (AST) specification for Jupyter Notebooks, similar to how [mdast](https://github.com/syntax-tree/mdast) defines an AST for Markdown.

## Design Principles

1. **Unist Compatibility** - Follows [unist](https://github.com/syntax-tree/unist) (Universal Syntax Tree) principles where applicable
2. **Lossless** - Preserves all information from the source notebook, including metadata
3. **Traversable** - Tree structure that can be easily walked and transformed
4. **Type-safe** - Strongly typed for TypeScript usage
5. **Source-mappable** - Includes position information for error reporting and transformations

## Core Concepts

### Node

All nodes in the AST extend the base `Node` interface:

```typescript
interface Node {
  type: string;
  data?: Data;
}
```

### Parent

Nodes that contain other nodes extend the `Parent` interface:

```typescript
interface Parent extends Node {
  children: Node[];
}
```

### Literal

Nodes that contain a value extend the `Literal` interface:

```typescript
interface Literal extends Node {
  value: string;
}
```

### Position

Optional position information for source mapping:

```typescript
interface Position {
  start: Point;
  end: Point;
}

interface Point {
  line: number;      // 1-indexed
  column: number;    // 1-indexed
  offset: number;    // 0-indexed
}
```

### Data

The `data` field can contain any information and is guaranteed to never be specified by ipynb-ast itself:

```typescript
interface Data {
  [key: string]: unknown;
}
```

## Node Types

### Root

The root node represents an entire Jupyter notebook.

```typescript
interface Root extends Parent {
  type: 'root';
  children: Cell[];
  metadata: NotebookMetadata;
  nbformat: number;
  nbformat_minor: number;
}
```

**Fields:**
- `children` - Array of cell nodes
- `metadata` - Notebook-level metadata (kernel info, language info, etc.)
- `nbformat` - Major version of the notebook format
- `nbformat_minor` - Minor version of the notebook format

### Cell

Base type for all cells. Not directly instantiated - use specific cell types below.

```typescript
interface Cell extends Parent {
  type: 'cell';
  cellType: 'code' | 'markdown' | 'raw';
  metadata?: CellMetadata;
  position?: Position;
}
```

### CodeCell

Represents a code cell with executable code and outputs.

```typescript
interface CodeCell extends Cell {
  cellType: 'code';
  children: [Code, ...Output[]];
  executionCount: number | null;
}
```

**Fields:**
- `children` - First child is the Code node, remaining children are Output nodes
- `executionCount` - Execution count, or null if never executed

**Example:**
```typescript
{
  type: 'cell',
  cellType: 'code',
  executionCount: 1,
  children: [
    { type: 'code', lang: 'python', value: 'print("hello")' },
    { type: 'stream', name: 'stdout', text: 'hello\n' }
  ],
  metadata: { collapsed: false }
}
```

### MarkdownCell

Represents a markdown cell containing documentation.

```typescript
interface MarkdownCell extends Cell {
  cellType: 'markdown';
  children: [Markdown];
}
```

**Fields:**
- `children` - Single Markdown node containing the content

**Example:**
```typescript
{
  type: 'cell',
  cellType: 'markdown',
  children: [
    { type: 'markdown', value: '# Hello\n\nThis is **markdown**.' }
  ],
  metadata: {}
}
```

### RawCell

Represents a raw cell (unformatted text, often used for LaTeX or other formats).

```typescript
interface RawCell extends Cell {
  cellType: 'raw';
  children: [Raw];
}
```

**Fields:**
- `children` - Single Raw node containing the content

### Code

Represents the source code in a code cell.

```typescript
interface Code extends Literal {
  type: 'code';
  lang?: string;
  meta?: string;
  value: string;
}
```

**Fields:**
- `lang` - Programming language (inferred from notebook metadata)
- `meta` - Additional metadata string (reserved for future use)
- `value` - The source code as a string

### Markdown

Represents markdown content in a markdown cell.

```typescript
interface Markdown extends Literal {
  type: 'markdown';
  value: string;
}
```

**Note:** Future versions may parse the markdown content into a nested mdast tree.

### Raw

Represents raw content in a raw cell.

```typescript
interface Raw extends Literal {
  type: 'raw';
  value: string;
}
```

## Output Nodes

Outputs are children of CodeCell nodes and represent execution results.

### StreamOutput

Represents stdout/stderr text output.

```typescript
interface StreamOutput extends Literal {
  type: 'stream';
  name: 'stdout' | 'stderr';
  text: string;
}
```

**Fields:**
- `name` - The stream name
- `text` - The complete text output (newlines preserved)

### DisplayDataOutput

Represents rich display output (images, HTML, etc.).

```typescript
interface DisplayDataOutput extends Node {
  type: 'displayData';
  data: MIMEBundle;
  metadata?: OutputMetadata;
}
```

**Fields:**
- `data` - MIME-typed data bundle
- `metadata` - Output-specific metadata

### ExecuteResultOutput

Represents the result of executing code (similar to display data but includes execution count).

```typescript
interface ExecuteResultOutput extends Node {
  type: 'executeResult';
  executionCount: number | null;
  data: MIMEBundle;
  metadata?: OutputMetadata;
}
```

### ErrorOutput

Represents error/exception output.

```typescript
interface ErrorOutput extends Node {
  type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}
```

**Fields:**
- `ename` - Exception name
- `evalue` - Exception value/message
- `traceback` - Array of traceback lines (with ANSI color codes)

## Supporting Types

### MIMEBundle

A bundle of data in various MIME types:

```typescript
interface MIMEBundle {
  'text/plain'?: string | string[];
  'text/html'?: string | string[];
  'text/markdown'?: string | string[];
  'text/latex'?: string | string[];
  'application/json'?: any;
  'application/javascript'?: string | string[];
  'image/png'?: string;      // base64 encoded
  'image/jpeg'?: string;     // base64 encoded
  'image/svg+xml'?: string | string[];
  [mimeType: string]: any;
}
```

### NotebookMetadata

Notebook-level metadata:

```typescript
interface NotebookMetadata {
  kernelspec?: {
    display_name: string;
    language: string;
    name: string;
  };
  language_info?: {
    name: string;
    version?: string;
    mimetype?: string;
    file_extension?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
```

### CellMetadata

Cell-level metadata (extensible):

```typescript
interface CellMetadata {
  collapsed?: boolean;
  scrolled?: boolean;
  tags?: string[];
  [key: string]: any;
}
```

### OutputMetadata

Output-level metadata (extensible):

```typescript
interface OutputMetadata {
  isolated?: boolean;
  [key: string]: any;
}
```

## Complete Example

Input `.ipynb` file:
```json
{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {},
      "source": ["# Example Notebook"]
    },
    {
      "cell_type": "code",
      "execution_count": 1,
      "metadata": {},
      "outputs": [
        {
          "name": "stdout",
          "output_type": "stream",
          "text": ["Hello, World!\n"]
        }
      ],
      "source": ["print('Hello, World!')"]
    }
  ],
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 5
}
```

Resulting AST:
```typescript
{
  type: 'root',
  nbformat: 4,
  nbformat_minor: 5,
  metadata: {
    kernelspec: {
      display_name: 'Python 3',
      language: 'python',
      name: 'python3'
    }
  },
  children: [
    {
      type: 'cell',
      cellType: 'markdown',
      metadata: {},
      children: [
        {
          type: 'markdown',
          value: '# Example Notebook'
        }
      ]
    },
    {
      type: 'cell',
      cellType: 'code',
      executionCount: 1,
      metadata: {},
      children: [
        {
          type: 'code',
          lang: 'python',
          value: 'print(\'Hello, World!\')'
        },
        {
          type: 'stream',
          name: 'stdout',
          text: 'Hello, World!\n'
        }
      ]
    }
  ]
}
```

## Design Decisions

### Why separate Code/Markdown/Raw nodes from Cell nodes?

This design allows for:
1. Consistent parent-child relationships (cells always have children)
2. Future extensibility (e.g., parsing markdown into mdast)
3. Easier transformation (you can replace the content node without modifying cell metadata)

### Why include source position information?

Position information enables:
- Better error messages with line/column numbers
- Source maps for transformations
- Syntax highlighting and IDE integration
- Diffing and merging notebooks

### Why use children array for outputs?

This follows the unist pattern and makes it easier to:
- Traverse all cell content uniformly
- Transform outputs using the same visitor pattern as other nodes
- Maintain order of outputs
- Filter or modify outputs during transformations

## Future Extensions

Potential future additions to this specification:

1. **Parsed Markdown** - Parse markdown cells into mdast trees
2. **Attachments** - Support for cell attachments (embedded images)
3. **Widgets** - Interactive widget output support
4. **Collaborative Metadata** - Support for collaborative editing metadata
5. **Custom Output Types** - Plugin system for custom output renderers
