/**
 * MIME type constants and utilities for Jupyter notebook outputs
 *
 * Based on Jupyter's standard MIME types:
 * https://jupyter-client.readthedocs.io/en/stable/messaging.html#display-data
 */

// ============================================================================
// MIME Type Constants
// ============================================================================

/**
 * Standard text-based MIME types
 */
export const TEXT_MIME_TYPES = {
  PLAIN: 'text/plain',
  HTML: 'text/html',
  MARKDOWN: 'text/markdown',
  LATEX: 'text/latex',
  CSV: 'text/csv',
  XML: 'text/xml',
} as const;

/**
 * Image MIME types (typically base64 encoded)
 */
export const IMAGE_MIME_TYPES = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  GIF: 'image/gif',
  SVG: 'image/svg+xml',
  BMP: 'image/bmp',
  WEBP: 'image/webp',
} as const;

/**
 * Application MIME types
 */
export const APPLICATION_MIME_TYPES = {
  JSON: 'application/json',
  JAVASCRIPT: 'application/javascript',
  PDF: 'application/pdf',
  GEOJSON: 'application/geo+json',
  XML: 'application/xml',
} as const;

/**
 * Jupyter-specific vendor MIME types
 */
export const JUPYTER_MIME_TYPES = {
  // IPyWidgets
  WIDGET_VIEW: 'application/vnd.jupyter.widget-view+json',
  WIDGET_STATE: 'application/vnd.jupyter.widget-state+json',

  // Errors (internal representation)
  ERROR: 'application/vnd.jupyter.error',

  // Stdin (for interactive input)
  STDIN: 'application/vnd.jupyter.stdin',
} as const;

/**
 * Visualization library MIME types
 */
export const VISUALIZATION_MIME_TYPES = {
  // Plotly
  PLOTLY_V1: 'application/vnd.plotly.v1+json',

  // Vega and Vega-Lite
  VEGA_V2: 'application/vnd.vega.v2+json',
  VEGA_V3: 'application/vnd.vega.v3+json',
  VEGA_V4: 'application/vnd.vega.v4+json',
  VEGA_V5: 'application/vnd.vega.v5+json',
  VEGALITE_V1: 'application/vnd.vegalite.v1+json',
  VEGALITE_V2: 'application/vnd.vegalite.v2+json',
  VEGALITE_V3: 'application/vnd.vegalite.v3+json',
  VEGALITE_V4: 'application/vnd.vegalite.v4+json',
  VEGALITE_V5: 'application/vnd.vegalite.v5+json',

  // Bokeh
  BOKEH: 'application/vnd.bokehjs_exec.v0+json',

  // Holoviews
  HOLOVIEWS_EXEC: 'application/vnd.holoviews_exec.v0+json',
  HOLOVIEWS_LOAD: 'application/vnd.holoviews_load.v0+json',
} as const;

/**
 * All standard MIME types supported by Jupyter
 */
export const STANDARD_MIME_TYPES = {
  ...TEXT_MIME_TYPES,
  ...IMAGE_MIME_TYPES,
  ...APPLICATION_MIME_TYPES,
  ...JUPYTER_MIME_TYPES,
  ...VISUALIZATION_MIME_TYPES,
} as const;

/**
 * Union type of all standard MIME type strings
 */
export type StandardMimeType = typeof STANDARD_MIME_TYPES[keyof typeof STANDARD_MIME_TYPES];

// ============================================================================
// MIME Type Categories
// ============================================================================

/**
 * MIME types that represent text content (can be strings or string arrays)
 */
export const TEXT_CONTENT_TYPES: readonly string[] = [
  TEXT_MIME_TYPES.PLAIN,
  TEXT_MIME_TYPES.HTML,
  TEXT_MIME_TYPES.MARKDOWN,
  TEXT_MIME_TYPES.LATEX,
  TEXT_MIME_TYPES.CSV,
  TEXT_MIME_TYPES.XML,
  APPLICATION_MIME_TYPES.JAVASCRIPT,
  IMAGE_MIME_TYPES.SVG,
];

/**
 * MIME types that represent binary content (base64 encoded strings)
 */
export const BINARY_CONTENT_TYPES: readonly string[] = [
  IMAGE_MIME_TYPES.PNG,
  IMAGE_MIME_TYPES.JPEG,
  IMAGE_MIME_TYPES.GIF,
  IMAGE_MIME_TYPES.BMP,
  IMAGE_MIME_TYPES.WEBP,
  APPLICATION_MIME_TYPES.PDF,
];

/**
 * MIME types that represent JSON content
 */
export const JSON_CONTENT_TYPES: readonly string[] = [
  APPLICATION_MIME_TYPES.JSON,
  APPLICATION_MIME_TYPES.GEOJSON,
  JUPYTER_MIME_TYPES.WIDGET_VIEW,
  JUPYTER_MIME_TYPES.WIDGET_STATE,
  VISUALIZATION_MIME_TYPES.PLOTLY_V1,
  VISUALIZATION_MIME_TYPES.VEGA_V2,
  VISUALIZATION_MIME_TYPES.VEGA_V3,
  VISUALIZATION_MIME_TYPES.VEGA_V4,
  VISUALIZATION_MIME_TYPES.VEGA_V5,
  VISUALIZATION_MIME_TYPES.VEGALITE_V1,
  VISUALIZATION_MIME_TYPES.VEGALITE_V2,
  VISUALIZATION_MIME_TYPES.VEGALITE_V3,
  VISUALIZATION_MIME_TYPES.VEGALITE_V4,
  VISUALIZATION_MIME_TYPES.VEGALITE_V5,
  VISUALIZATION_MIME_TYPES.BOKEH,
  VISUALIZATION_MIME_TYPES.HOLOVIEWS_EXEC,
  VISUALIZATION_MIME_TYPES.HOLOVIEWS_LOAD,
];

/**
 * MIME types that can be rendered as images
 */
export const IMAGE_CONTENT_TYPES: readonly string[] = [
  IMAGE_MIME_TYPES.PNG,
  IMAGE_MIME_TYPES.JPEG,
  IMAGE_MIME_TYPES.GIF,
  IMAGE_MIME_TYPES.SVG,
  IMAGE_MIME_TYPES.BMP,
  IMAGE_MIME_TYPES.WEBP,
];

// ============================================================================
// MIME Type Utilities
// ============================================================================

/**
 * Check if a MIME type represents text content
 */
export function isTextMimeType(mimeType: string): boolean {
  return TEXT_CONTENT_TYPES.includes(mimeType);
}

/**
 * Check if a MIME type represents binary content (base64 encoded)
 */
export function isBinaryMimeType(mimeType: string): boolean {
  return BINARY_CONTENT_TYPES.includes(mimeType);
}

/**
 * Check if a MIME type represents JSON content
 */
export function isJsonMimeType(mimeType: string): boolean {
  return JSON_CONTENT_TYPES.includes(mimeType) || mimeType.endsWith('+json');
}

/**
 * Check if a MIME type represents image content
 */
export function isImageMimeType(mimeType: string): boolean {
  return IMAGE_CONTENT_TYPES.includes(mimeType) || mimeType.startsWith('image/');
}

/**
 * Check if a MIME type represents HTML content
 */
export function isHtmlMimeType(mimeType: string): boolean {
  return mimeType === TEXT_MIME_TYPES.HTML;
}

/**
 * Check if a MIME type represents markdown content
 */
export function isMarkdownMimeType(mimeType: string): boolean {
  return mimeType === TEXT_MIME_TYPES.MARKDOWN;
}

/**
 * Check if a MIME type is a Jupyter widget
 */
export function isWidgetMimeType(mimeType: string): boolean {
  return (
    mimeType === JUPYTER_MIME_TYPES.WIDGET_VIEW ||
    mimeType === JUPYTER_MIME_TYPES.WIDGET_STATE
  );
}

/**
 * Check if a MIME type is a visualization (Plotly, Vega, etc.)
 */
export function isVisualizationMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('application/vnd.plotly.') ||
    mimeType.startsWith('application/vnd.vega.') ||
    mimeType.startsWith('application/vnd.vegalite.') ||
    mimeType.startsWith('application/vnd.bokehjs') ||
    mimeType.startsWith('application/vnd.holoviews')
  );
}

/**
 * Check if a MIME type is a standard Jupyter MIME type
 */
export function isStandardMimeType(mimeType: string): mimeType is StandardMimeType {
  return Object.values(STANDARD_MIME_TYPES).includes(mimeType as any);
}

/**
 * Get the category of a MIME type
 */
export function getMimeTypeCategory(mimeType: string):
  | 'text'
  | 'binary'
  | 'json'
  | 'image'
  | 'widget'
  | 'visualization'
  | 'unknown' {

  if (isWidgetMimeType(mimeType)) return 'widget';
  if (isVisualizationMimeType(mimeType)) return 'visualization';
  if (isImageMimeType(mimeType)) return 'image';
  if (isJsonMimeType(mimeType)) return 'json';
  if (isBinaryMimeType(mimeType)) return 'binary';
  if (isTextMimeType(mimeType)) return 'text';

  return 'unknown';
}

/**
 * MIME type priority for rendering (higher = preferred)
 * Used to select the best representation when multiple MIME types are available
 */
export const MIME_TYPE_PRIORITY: Record<string, number> = {
  // HTML is usually the richest format
  [TEXT_MIME_TYPES.HTML]: 100,

  // Widgets and visualizations
  [JUPYTER_MIME_TYPES.WIDGET_VIEW]: 95,
  [VISUALIZATION_MIME_TYPES.PLOTLY_V1]: 90,
  [VISUALIZATION_MIME_TYPES.VEGALITE_V5]: 88,
  [VISUALIZATION_MIME_TYPES.VEGALITE_V4]: 87,
  [VISUALIZATION_MIME_TYPES.VEGALITE_V3]: 86,
  [VISUALIZATION_MIME_TYPES.VEGALITE_V2]: 85,
  [VISUALIZATION_MIME_TYPES.VEGALITE_V1]: 84,
  [VISUALIZATION_MIME_TYPES.VEGA_V5]: 83,
  [VISUALIZATION_MIME_TYPES.VEGA_V4]: 82,
  [VISUALIZATION_MIME_TYPES.VEGA_V3]: 81,
  [VISUALIZATION_MIME_TYPES.VEGA_V2]: 80,

  // Images (vector > raster)
  [IMAGE_MIME_TYPES.SVG]: 75,
  [IMAGE_MIME_TYPES.PNG]: 70,
  [IMAGE_MIME_TYPES.JPEG]: 65,
  [IMAGE_MIME_TYPES.WEBP]: 64,
  [IMAGE_MIME_TYPES.GIF]: 63,
  [IMAGE_MIME_TYPES.BMP]: 60,

  // Structured text
  [TEXT_MIME_TYPES.MARKDOWN]: 55,
  [TEXT_MIME_TYPES.LATEX]: 50,
  [APPLICATION_MIME_TYPES.JSON]: 45,
  [APPLICATION_MIME_TYPES.GEOJSON]: 44,

  // JavaScript
  [APPLICATION_MIME_TYPES.JAVASCRIPT]: 40,

  // Plain text (fallback)
  [TEXT_MIME_TYPES.PLAIN]: 10,
};

/**
 * Get the priority of a MIME type for rendering
 */
export function getMimeTypePriority(mimeType: string): number {
  return MIME_TYPE_PRIORITY[mimeType] ?? 0;
}

/**
 * Select the best MIME type from a list based on priority
 */
export function selectBestMimeType(mimeTypes: string[]): string | undefined {
  if (mimeTypes.length === 0) return undefined;
  if (mimeTypes.length === 1) return mimeTypes[0];

  return mimeTypes.reduce((best, current) => {
    const bestPriority = getMimeTypePriority(best);
    const currentPriority = getMimeTypePriority(current);
    return currentPriority > bestPriority ? current : best;
  });
}

/**
 * Normalize MIME type data (convert arrays to strings where appropriate)
 */
export function normalizeMimeData(
  mimeType: string,
  data: string | string[] | any
): string | any {
  // For text-based MIME types, join arrays
  if (isTextMimeType(mimeType) && Array.isArray(data)) {
    return data.join('');
  }

  return data;
}
