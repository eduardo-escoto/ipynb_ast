/**
 * Example custom renderers for different MIME types
 * Shows how to build plugins for rendering Plotly, Vega, LaTeX, etc.
 */

import {
  parseFromFile,
  type Output,
  type DisplayDataOutput,
  type ExecuteResultOutput,
  hasMimeType,
  extractMimeData,
  STANDARD_MIME_TYPES,
  VISUALIZATION_MIME_TYPES,
} from '../src/index';

// =============================================================================
// Custom Renderer Interface
// =============================================================================

interface RenderContext {
  cellIndex: number;
  outputIndex: number;
  preferredFormats?: string[];
}

type OutputRenderer = (
  output: Output,
  context: RenderContext
) => Promise<string | null>;

// =============================================================================
// Example: Plotly Renderer Plugin
// =============================================================================

async function renderPlotly(
  output: DisplayDataOutput | ExecuteResultOutput,
  context: RenderContext
): Promise<string> {
  const plotlyData = extractMimeData(output, VISUALIZATION_MIME_TYPES.PLOTLY_V1);

  // In real implementation, you would:
  // 1. Load Plotly.js library
  // 2. Generate unique ID for the div
  // 3. Embed the Plotly config

  const divId = `plotly-${context.cellIndex}-${context.outputIndex}`;

  return `
    <div id="${divId}" class="plotly-graph"></div>
    <script>
      Plotly.newPlot('${divId}', ${JSON.stringify(plotlyData)});
    </script>
  `;
}

// =============================================================================
// Example: Vega/Vega-Lite Renderer Plugin
// =============================================================================

async function renderVega(
  output: DisplayDataOutput | ExecuteResultOutput,
  mimeType: string,
  context: RenderContext
): Promise<string> {
  const vegaSpec = extractMimeData(output, mimeType);
  const divId = `vega-${context.cellIndex}-${context.outputIndex}`;

  // Determine if it's Vega or Vega-Lite based on MIME type
  const isVegaLite = mimeType.includes('vegalite');

  return `
    <div id="${divId}" class="vega-graph"></div>
    <script>
      ${isVegaLite ? 'vegaEmbed' : 'vega.embed'}('${divId}', ${JSON.stringify(vegaSpec)});
    </script>
  `;
}

// =============================================================================
// Example: LaTeX Renderer Plugin (using KaTeX)
// =============================================================================

async function renderLatex(
  output: DisplayDataOutput | ExecuteResultOutput,
  context: RenderContext
): Promise<string> {
  const latex = extractMimeData(output, STANDARD_MIME_TYPES.LATEX);

  // In real implementation, you would use KaTeX or MathJax
  // This is just a placeholder showing the pattern

  return `
    <div class="latex-output">
      <!-- KaTeX would render this -->
      <script>
        katex.render(${JSON.stringify(latex)}, document.currentScript.previousElementSibling);
      </script>
    </div>
  `;
}

// =============================================================================
// Example: Image Renderer Plugin (with lazy loading, zoom, etc.)
// =============================================================================

async function renderImage(
  output: DisplayDataOutput | ExecuteResultOutput,
  mimeType: string,
  context: RenderContext
): Promise<string> {
  const imageData = extractMimeData(output, mimeType);

  // Add features like lazy loading, click to zoom, etc.
  return `
    <figure class="notebook-image">
      <img
        src="data:${mimeType};base64,${imageData}"
        loading="lazy"
        alt="Output ${context.outputIndex}"
        onclick="zoomImage(this)"
      />
    </figure>
  `;
}

// =============================================================================
// Example: IPyWidget Renderer Plugin
// =============================================================================

async function renderWidget(
  output: DisplayDataOutput | ExecuteResultOutput,
  context: RenderContext
): Promise<string> {
  const widgetView = extractMimeData(
    output,
    STANDARD_MIME_TYPES.WIDGET_VIEW
  );

  // In real implementation, load ipywidgets and render
  const widgetId = `widget-${context.cellIndex}-${context.outputIndex}`;

  return `
    <div
      id="${widgetId}"
      class="jupyter-widget"
      data-widget-model="${widgetView.model_id}"
    >
      <!-- Widget would be rendered here by ipywidgets manager -->
    </div>
  `;
}

// =============================================================================
// Renderer Registry Pattern
// =============================================================================

class RendererRegistry {
  private renderers: Map<string, OutputRenderer> = new Map();

  /**
   * Register a renderer for a specific MIME type
   */
  register(mimeType: string, renderer: OutputRenderer): void {
    this.renderers.set(mimeType, renderer);
  }

  /**
   * Register multiple renderers at once
   */
  registerMany(renderers: Record<string, OutputRenderer>): void {
    for (const [mimeType, renderer] of Object.entries(renderers)) {
      this.register(mimeType, renderer);
    }
  }

  /**
   * Render an output using registered renderers
   */
  async render(
    output: Output,
    context: RenderContext
  ): Promise<string | null> {
    if (output.type !== 'displayData' && output.type !== 'executeResult') {
      return null;
    }

    // Check which renderers we can use
    const preferredFormats = context.preferredFormats || Object.keys(output.data);

    for (const mimeType of preferredFormats) {
      if (hasMimeType(output, mimeType)) {
        const renderer = this.renderers.get(mimeType);
        if (renderer) {
          return renderer(output, context);
        }
      }
    }

    return null;
  }
}

// =============================================================================
// Example Usage: Building a Custom Notebook Renderer
// =============================================================================

async function renderNotebookWithPlugins() {
  // Create renderer registry
  const registry = new RendererRegistry();

  // Register custom renderers
  registry.register(VISUALIZATION_MIME_TYPES.PLOTLY_V1, async (output, context) => {
    return renderPlotly(output as any, context);
  });

  registry.register(VISUALIZATION_MIME_TYPES.VEGALITE_V5, async (output, context) => {
    return renderVega(output as any, VISUALIZATION_MIME_TYPES.VEGALITE_V5, context);
  });

  registry.register(STANDARD_MIME_TYPES.LATEX, async (output, context) => {
    return renderLatex(output as any, context);
  });

  registry.register(STANDARD_MIME_TYPES.PNG, async (output, context) => {
    return renderImage(output as any, STANDARD_MIME_TYPES.PNG, context);
  });

  registry.register(STANDARD_MIME_TYPES.WIDGET_VIEW, async (output, context) => {
    return renderWidget(output as any, context);
  });

  // Parse notebook
  const notebook = await parseFromFile('example.ipynb');

  // Render with custom renderers
  const htmlParts: string[] = [];

  for (let cellIndex = 0; cellIndex < notebook.children.length; cellIndex++) {
    const cell = notebook.children[cellIndex];

    if (cell.cellType === 'code') {
      htmlParts.push(`<div class="code-cell">`);

      // Render code
      htmlParts.push(`<pre><code>${cell.children[0].value}</code></pre>`);

      // Render outputs with custom renderers
      const outputs = cell.children.slice(1);
      for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
        const output = outputs[outputIndex];

        const rendered = await registry.render(output, {
          cellIndex,
          outputIndex,
          // Prefer rich formats over plain text
          preferredFormats: [
            VISUALIZATION_MIME_TYPES.PLOTLY_V1,
            VISUALIZATION_MIME_TYPES.VEGALITE_V5,
            STANDARD_MIME_TYPES.WIDGET_VIEW,
            STANDARD_MIME_TYPES.HTML,
            STANDARD_MIME_TYPES.PNG,
            STANDARD_MIME_TYPES.LATEX,
            STANDARD_MIME_TYPES.PLAIN,
          ],
        });

        if (rendered) {
          htmlParts.push(rendered);
        }
      }

      htmlParts.push(`</div>`);
    }
  }

  return htmlParts.join('\n');
}

// =============================================================================
// Example: Composable Renderer Pattern
// =============================================================================

/**
 * Create a renderer that tries multiple strategies
 */
function createFallbackRenderer(...renderers: OutputRenderer[]): OutputRenderer {
  return async (output, context) => {
    for (const renderer of renderers) {
      const result = await renderer(output, context);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

/**
 * Create a renderer with preprocessing
 */
function withPreprocessor(
  preprocessor: (output: Output) => Output | Promise<Output>,
  renderer: OutputRenderer
): OutputRenderer {
  return async (output, context) => {
    const processed = await preprocessor(output);
    return renderer(processed, context);
  };
}

/**
 * Create a renderer with post-processing
 */
function withPostprocessor(
  renderer: OutputRenderer,
  postprocessor: (html: string) => string | Promise<string>
): OutputRenderer {
  return async (output, context) => {
    const html = await renderer(output, context);
    if (!html) return null;
    return postprocessor(html);
  };
}

// Example: Use composable renderers
const enhancedPlotlyRenderer = withPostprocessor(
  async (output, context) => renderPlotly(output as any, context),
  (html) => `<div class="enhanced-visualization">${html}</div>`
);

// =============================================================================
// Export for use in other modules
// =============================================================================

export {
  RendererRegistry,
  renderPlotly,
  renderVega,
  renderLatex,
  renderImage,
  renderWidget,
  createFallbackRenderer,
  withPreprocessor,
  withPostprocessor,
};
