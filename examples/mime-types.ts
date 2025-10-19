/**
 * Example working with MIME types in notebook outputs
 */

import {
  parseFromFile,
  getOutputMimeTypes,
  getBestOutputMimeType,
  extractMimeData,
  hasMimeType,
  hasImage,
  hasWidget,
  hasVisualization,
  STANDARD_MIME_TYPES,
  IMAGE_MIME_TYPES,
  isImageMimeType,
  isVisualizationMimeType,
  getMimeTypeCategory,
  selectBestMimeType,
} from '../src/index';

async function mimeTypeExample() {
  const notebook = await parseFromFile('example.ipynb');

  for (const cell of notebook.children) {
    if (cell.cellType === 'code') {
      console.log(`\n=== Code Cell ${cell.executionCount} ===`);

      // Process each output
      const outputs = cell.children.slice(1);
      for (let i = 0; i < outputs.length; i++) {
        const output = outputs[i];

        console.log(`\nOutput ${i}:`);
        console.log('Type:', output.type);

        if (output.type === 'displayData' || output.type === 'executeResult') {
          // Get all available MIME types
          const mimeTypes = getOutputMimeTypes(output);
          console.log('Available MIME types:', mimeTypes);

          // Get the best MIME type for rendering
          const bestMimeType = getBestOutputMimeType(output);
          console.log('Best MIME type:', bestMimeType);

          // Check for specific content types
          console.log('Has HTML:', hasMimeType(output, STANDARD_MIME_TYPES.HTML));
          console.log('Has image:', hasImage(output));
          console.log('Has widget:', hasWidget(output));
          console.log('Has visualization:', hasVisualization(output));

          // Extract data for a specific MIME type
          if (hasMimeType(output, STANDARD_MIME_TYPES.HTML)) {
            const htmlData = extractMimeData(output, STANDARD_MIME_TYPES.HTML);
            console.log('HTML content:', htmlData);
          }

          if (hasImage(output)) {
            // Find which image type
            const imageMimeType = mimeTypes.find(isImageMimeType);
            if (imageMimeType) {
              console.log('Image type:', imageMimeType);
              const imageData = extractMimeData(output, imageMimeType);
              console.log('Image data (base64):', imageData.substring(0, 50) + '...');
            }
          }

          // Categorize each MIME type
          for (const mimeType of mimeTypes) {
            const category = getMimeTypeCategory(mimeType);
            console.log(`  ${mimeType} -> ${category}`);
          }
        }
      }
    }
  }
}

// Example: Working with Plotly/Vega visualizations
async function visualizationExample() {
  const notebook = await parseFromFile('visualization-notebook.ipynb');

  for (const cell of notebook.children) {
    if (cell.cellType === 'code') {
      const outputs = cell.children.slice(1);

      for (const output of outputs) {
        if (hasVisualization(output)) {
          const mimeTypes = getOutputMimeTypes(output);
          const vizType = mimeTypes.find(isVisualizationMimeType);

          if (vizType) {
            console.log('Found visualization:', vizType);

            if (output.type === 'displayData' || output.type === 'executeResult') {
              const vizData = extractMimeData(output, vizType);
              console.log('Visualization spec:', JSON.stringify(vizData, null, 2));
            }
          }
        }
      }
    }
  }
}

// Example: Selecting best MIME type for different contexts
function mimeTypeSelectionExample() {
  // For web rendering, prefer HTML and images
  const webMimeTypes = [
    'text/plain',
    'text/html',
    'image/png',
    'application/json',
  ];

  const bestForWeb = selectBestMimeType(webMimeTypes);
  console.log('Best for web:', bestForWeb); // Should be 'text/html'

  // For print, prefer vector graphics
  const printMimeTypes = [
    'image/png',
    'image/svg+xml',
    'application/pdf',
  ];

  const bestForPrint = selectBestMimeType(printMimeTypes);
  console.log('Best for print:', bestForPrint); // Should be 'image/svg+xml'
}

// Example: Checking standard MIME types
function standardMimeTypesExample() {
  console.log('Standard text MIME types:', Object.values(STANDARD_MIME_TYPES));
  console.log('\nImage MIME types:', Object.values(IMAGE_MIME_TYPES));

  // Check if a MIME type is supported
  const customType = 'application/vnd.custom+json';
  console.log(`Is ${customType} a standard type?`,
    Object.values(STANDARD_MIME_TYPES).includes(customType));
}

mimeTypeExample().catch(console.error);
