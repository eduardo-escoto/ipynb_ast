# MIME Types in ipynb-ast

This document explains how Jupyter notebooks handle MIME types and how ipynb-ast provides tools for working with them.

## What are MIME Types?

MIME (Multipurpose Internet Mail Extensions) types are standardized identifiers for file formats and content types. Jupyter notebooks use MIME types extensively to represent cell outputs in multiple formats, allowing rich display in different contexts.

## Why Multiple MIME Types?

A single output can have multiple representations. For example, a plot might be available as:
- `image/png` - Bitmap image for display
- `image/svg+xml` - Vector graphics for scalable display
- `application/json` - Raw data for interactivity
- `text/plain` - Text fallback

This allows the frontend to choose the best representation based on context (web, PDF export, terminal, etc.).

## Standard MIME Types

ipynb-ast supports all standard Jupyter MIME types:

### Text Content
- `text/plain` - Plain text
- `text/html` - HTML markup
- `text/markdown` - Markdown
- `text/latex` - LaTeX equations
- `text/csv` - CSV data
- `text/xml` - XML

### Images
- `image/png` - PNG image (base64 encoded)
- `image/jpeg` - JPEG image (base64 encoded)
- `image/gif` - GIF image (base64 encoded)
- `image/svg+xml` - SVG vector graphics
- `image/bmp` - BMP image (base64 encoded)
- `image/webp` - WebP image (base64 encoded)

### Application Formats
- `application/json` - JSON data
- `application/javascript` - JavaScript code
- `application/pdf` - PDF document (base64 encoded)
- `application/geo+json` - GeoJSON geographic data
- `application/xml` - XML data

### Jupyter-Specific
- `application/vnd.jupyter.widget-view+json` - IPyWidgets
- `application/vnd.jupyter.widget-state+json` - Widget state

### Visualization Libraries

**Plotly:**
- `application/vnd.plotly.v1+json`

**Vega/Vega-Lite:**
- `application/vnd.vega.v2+json` through `v5+json`
- `application/vnd.vegalite.v1+json` through `v5+json`

**Bokeh:**
- `application/vnd.bokehjs_exec.v0+json`

**HoloViews:**
- `application/vnd.holoviews_exec.v0+json`
- `application/vnd.holoviews_load.v0+json`

## MIME Type Constants

Use the provided constants instead of string literals:

```typescript
import {
  TEXT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  APPLICATION_MIME_TYPES,
  JUPYTER_MIME_TYPES,
  VISUALIZATION_MIME_TYPES,
  STANDARD_MIME_TYPES,
} from 'ipynb-ast';

// Access specific types
console.log(TEXT_MIME_TYPES.HTML);  // 'text/html'
console.log(IMAGE_MIME_TYPES.PNG);  // 'image/png'
console.log(VISUALIZATION_MIME_TYPES.PLOTLY_V1);  // 'application/vnd.plotly.v1+json'
```

## Working with Output MIME Types

### Get All MIME Types from an Output

```typescript
import { parseFromFile, getOutputMimeTypes } from 'ipynb-ast';

const notebook = await parseFromFile('example.ipynb');
for (const cell of notebook.children) {
  if (cell.cellType === 'code') {
    for (const output of cell.children.slice(1)) {
      const mimeTypes = getOutputMimeTypes(output);
      console.log('Available formats:', mimeTypes);
    }
  }
}
```

### Get the Best MIME Type

The library includes a priority system for selecting the best MIME type:

```typescript
import { getBestOutputMimeType } from 'ipynb-ast';

const bestMimeType = getBestOutputMimeType(output);
console.log('Best format:', bestMimeType);
```

Priority order (highest to lowest):
1. HTML (100)
2. Jupyter widgets (95)
3. Plotly visualizations (90)
4. Vega/Vega-Lite (80-88)
5. SVG images (75)
6. PNG images (70)
7. Other formats (lower priority)
8. Plain text (10, fallback)

### Check for Specific Content Types

```typescript
import {
  hasHtml,
  hasMarkdown,
  hasText,
  hasImage,
  hasWidget,
  hasVisualization,
  hasMimeType,
  STANDARD_MIME_TYPES,
} from 'ipynb-ast';

// Check for specific content
if (hasHtml(output)) {
  console.log('Has HTML representation');
}

if (hasImage(output)) {
  console.log('Has image representation');
}

if (hasVisualization(output)) {
  console.log('Has Plotly/Vega/Bokeh visualization');
}

// Check for exact MIME type
if (hasMimeType(output, STANDARD_MIME_TYPES.PLOTLY_V1)) {
  console.log('Has Plotly visualization');
}
```

### Extract Data for a MIME Type

```typescript
import { extractMimeData, STANDARD_MIME_TYPES } from 'ipynb-ast';

if (output.type === 'displayData' || output.type === 'executeResult') {
  // Extract HTML
  const html = extractMimeData(output, STANDARD_MIME_TYPES.HTML);

  // Extract PNG (base64 encoded)
  const png = extractMimeData(output, STANDARD_MIME_TYPES.PNG);

  // Extract Plotly data
  const plotly = extractMimeData(output, STANDARD_MIME_TYPES.PLOTLY_V1);
}
```

The `extractMimeData` function automatically normalizes string arrays to strings for text-based MIME types.

## MIME Type Utilities

### Category Detection

```typescript
import { getMimeTypeCategory } from 'ipynb-ast';

const category = getMimeTypeCategory('image/png');
// Returns: 'image'

const category2 = getMimeTypeCategory('application/vnd.plotly.v1+json');
// Returns: 'visualization'
```

Categories:
- `'text'` - Text content
- `'binary'` - Binary content (base64 encoded)
- `'json'` - JSON content
- `'image'` - Image content
- `'widget'` - Jupyter widgets
- `'visualization'` - Plotly, Vega, etc.
- `'unknown'` - Unknown type

### Type Checking

```typescript
import {
  isTextMimeType,
  isBinaryMimeType,
  isJsonMimeType,
  isImageMimeType,
  isHtmlMimeType,
  isMarkdownMimeType,
  isWidgetMimeType,
  isVisualizationMimeType,
  isStandardMimeType,
} from 'ipynb-ast';

if (isImageMimeType('image/png')) {
  console.log('PNG is an image');
}

if (isVisualizationMimeType('application/vnd.plotly.v1+json')) {
  console.log('Plotly is a visualization');
}
```

### Selecting Best MIME Type

```typescript
import { selectBestMimeType } from 'ipynb-ast';

const available = [
  'text/plain',
  'text/html',
  'image/png',
  'image/svg+xml',
];

const best = selectBestMimeType(available);
console.log(best);  // 'text/html' (highest priority)
```

## Example: Rendering Different MIME Types

```typescript
import {
  parseFromFile,
  getBestOutputMimeType,
  extractMimeData,
  isImageMimeType,
  isHtmlMimeType,
  isVisualizationMimeType,
} from 'ipynb-ast';

async function renderOutput(output) {
  if (output.type !== 'displayData' && output.type !== 'executeResult') {
    return;
  }

  const bestMimeType = getBestOutputMimeType(output);
  if (!bestMimeType) return;

  const data = extractMimeData(output, bestMimeType);

  if (isHtmlMimeType(bestMimeType)) {
    return `<div class="output-html">${data}</div>`;
  } else if (isImageMimeType(bestMimeType)) {
    return `<img src="data:${bestMimeType};base64,${data}" />`;
  } else if (isVisualizationMimeType(bestMimeType)) {
    // Render with appropriate visualization library
    return renderVisualization(bestMimeType, data);
  } else {
    // Fallback to text
    return `<pre>${data}</pre>`;
  }
}
```

## Custom MIME Types

While ipynb-ast provides constants for standard MIME types, it also supports custom MIME types through the index signature in `MIMEBundle`:

```typescript
const customData = output.data['application/vnd.custom+json'];
```

## Best Practices

1. **Use constants** - Use provided constants instead of string literals
2. **Check availability** - Always check if a MIME type exists before extracting
3. **Provide fallbacks** - Have a fallback chain (HTML → Image → Text)
4. **Normalize data** - Use `extractMimeData()` to automatically normalize arrays
5. **Respect priority** - Use `getBestOutputMimeType()` for automatic selection

## See Also

- [SPEC.md](./SPEC.md) - Complete AST specification
- [examples/mime-types.ts](./examples/mime-types.ts) - MIME type examples
- [src/mime-types.ts](./src/mime-types.ts) - Full MIME type API
