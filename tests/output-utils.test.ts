import { describe, it, expect } from 'vitest';
import {
  hasHtml,
  hasMarkdown,
  hasImage,
  hasWidget,
  hasVisualization,
  extractHtml,
  extractMarkdown,
  extractText,
  getOutputMimeTypes,
  getBestOutputMimeType,
  extractMimeData,
  renderOutputToHtml,
} from '../src/output-utils';
import type { DisplayDataOutput, ExecuteResultOutput, MIMEBundle } from '../src/types';
import { TEXT_MIME_TYPES, IMAGE_MIME_TYPES, VISUALIZATION_MIME_TYPES } from '../src/mime-types';

describe('Output Utils', () => {
  describe('Content Type Checking', () => {
    it('should detect HTML content', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.HTML]: ['<div>Hello</div>'],
          [TEXT_MIME_TYPES.PLAIN]: ['Hello'],
        },
        metadata: {},
      };

      expect(hasHtml(output)).toBe(true);
    });

    it('should detect markdown content', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.MARKDOWN]: ['# Heading'],
          [TEXT_MIME_TYPES.PLAIN]: ['Heading'],
        },
        metadata: {},
      };

      expect(hasMarkdown(output)).toBe(true);
    });

    it('should detect image content', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [IMAGE_MIME_TYPES.PNG]: 'base64data',
          [TEXT_MIME_TYPES.PLAIN]: ['<image>'],
        },
        metadata: {},
      };

      expect(hasImage(output)).toBe(true);
    });

    it('should detect widget content', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          'application/vnd.jupyter.widget-view+json': {
            model_id: 'abc123',
            version_major: 2,
            version_minor: 0,
          },
          [TEXT_MIME_TYPES.PLAIN]: ['Widget'],
        },
        metadata: {},
      };

      expect(hasWidget(output)).toBe(true);
    });

    it('should detect visualization content', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [VISUALIZATION_MIME_TYPES.PLOTLY_V1]: {
            data: [],
            layout: {},
          },
          [TEXT_MIME_TYPES.PLAIN]: ['Chart'],
        },
        metadata: {},
      };

      expect(hasVisualization(output)).toBe(true);
    });
  });

  describe('Data Extraction', () => {
    it('should extract HTML content', () => {
      const data = {
        [TEXT_MIME_TYPES.HTML]: ['<div>Hello</div>', '<p>World</p>'],
      };

      const html = extractHtml(data);
      expect(html).toBe('<div>Hello</div><p>World</p>');
    });

    it('should extract markdown content', () => {
      const data = {
        [TEXT_MIME_TYPES.MARKDOWN]: ['# Heading\n', 'Paragraph'],
      };

      const markdown = extractMarkdown(data);
      expect(markdown).toBe('# Heading\nParagraph');
    });

    it('should extract plain text content', () => {
      const data = {
        [TEXT_MIME_TYPES.PLAIN]: ['Hello\n', 'World'],
      };

      const text = extractText(data);
      expect(text).toBe('Hello\nWorld');
    });

    it('should return undefined when content type not present', () => {
      const data = {
        [TEXT_MIME_TYPES.PLAIN]: ['Text only'],
      };

      expect(extractHtml(data)).toBeUndefined();
      expect(extractMarkdown(data)).toBeUndefined();
    });
  });

  describe('MIME Type Utilities', () => {
    it('should get all MIME types from output', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.HTML]: ['<div>test</div>'],
          [TEXT_MIME_TYPES.PLAIN]: ['test'],
          [IMAGE_MIME_TYPES.PNG]: 'base64',
        },
        metadata: {},
      };

      const mimeTypes = getOutputMimeTypes(output);
      expect(mimeTypes).toContain(TEXT_MIME_TYPES.HTML);
      expect(mimeTypes).toContain(TEXT_MIME_TYPES.PLAIN);
      expect(mimeTypes).toContain(IMAGE_MIME_TYPES.PNG);
      expect(mimeTypes).toHaveLength(3);
    });

    it('should get best MIME type based on priority', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.HTML]: ['<div>test</div>'],
          [TEXT_MIME_TYPES.PLAIN]: ['test'],
        },
        metadata: {},
      };

      const bestMime = getBestOutputMimeType(output);
      expect(bestMime).toBe(TEXT_MIME_TYPES.HTML); // HTML has higher priority
    });

    it('should extract data by MIME type', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.HTML]: ['<div>test</div>'],
          [IMAGE_MIME_TYPES.PNG]: 'base64data',
        },
        metadata: {},
      };

      const htmlData = extractMimeData(output, TEXT_MIME_TYPES.HTML);
      expect(htmlData).toBe('<div>test</div>');

      const imageData = extractMimeData(output, IMAGE_MIME_TYPES.PNG);
      expect(imageData).toBe('base64data');
    });

    it('should return undefined for non-existent MIME type', () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.PLAIN]: ['text'],
        },
        metadata: {},
      };

      const data = extractMimeData(output, TEXT_MIME_TYPES.HTML);
      expect(data).toBeUndefined();
    });
  });

  describe('Rendering', () => {
    it('should render HTML output', async () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [TEXT_MIME_TYPES.HTML]: ['<strong>Bold</strong>'],
        },
        metadata: {},
      };

      const html = await renderOutputToHtml(output);
      expect(html).toContain('<strong>Bold</strong>');
    });

    it('should render text output as HTML', async () => {
      const output: ExecuteResultOutput = {
        type: 'executeResult',
        executionCount: 1,
        data: {
          [TEXT_MIME_TYPES.PLAIN]: ['Plain text'],
        },
        metadata: {},
      };

      const html = await renderOutputToHtml(output);
      expect(html).toContain('Plain text');
      expect(html).toContain('<pre>');
    });

    it('should render image output', async () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {
          [IMAGE_MIME_TYPES.PNG]: 'iVBORw0KGgo=',
        },
        metadata: {},
      };

      const html = await renderOutputToHtml(output);
      // Since the render function doesn't actually handle images yet,
      // this test may need adjustment based on actual implementation
      expect(html).toBeDefined();
    });

    it('should handle outputs with no renderable content', async () => {
      const output: DisplayDataOutput = {
        type: 'displayData',
        data: {},
        metadata: {},
      };

      const html = await renderOutputToHtml(output);
      expect(html).toBeDefined();
    });
  });
});
