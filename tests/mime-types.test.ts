import { describe, it, expect } from 'vitest';
import {
  TEXT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  APPLICATION_MIME_TYPES,
  JUPYTER_MIME_TYPES,
  VISUALIZATION_MIME_TYPES,
  isImageMimeType,
  isVisualizationMimeType,
  getMimeTypeCategory,
  getMimeTypePriority,
  selectBestMimeType,
  normalizeMimeData,
} from '../src/mime-types';

describe('MIME Types', () => {
  describe('MIME Type Constants', () => {
    it('should have text MIME types defined', () => {
      expect(TEXT_MIME_TYPES.PLAIN).toBe('text/plain');
      expect(TEXT_MIME_TYPES.HTML).toBe('text/html');
      expect(TEXT_MIME_TYPES.MARKDOWN).toBe('text/markdown');
      expect(TEXT_MIME_TYPES.LATEX).toBe('text/latex');
    });

    it('should have image MIME types defined', () => {
      expect(IMAGE_MIME_TYPES.PNG).toBe('image/png');
      expect(IMAGE_MIME_TYPES.JPEG).toBe('image/jpeg');
      expect(IMAGE_MIME_TYPES.SVG).toBe('image/svg+xml');
      expect(IMAGE_MIME_TYPES.GIF).toBe('image/gif');
    });

    it('should have application MIME types defined', () => {
      expect(APPLICATION_MIME_TYPES.JSON).toBe('application/json');
      expect(APPLICATION_MIME_TYPES.JAVASCRIPT).toBe('application/javascript');
      expect(APPLICATION_MIME_TYPES.PDF).toBe('application/pdf');
    });

    it('should have Jupyter-specific MIME types defined', () => {
      expect(JUPYTER_MIME_TYPES.WIDGET_VIEW).toBe('application/vnd.jupyter.widget-view+json');
      expect(JUPYTER_MIME_TYPES.WIDGET_STATE).toBe('application/vnd.jupyter.widget-state+json');
    });

    it('should have visualization MIME types defined', () => {
      expect(VISUALIZATION_MIME_TYPES.PLOTLY_V1).toBe('application/vnd.plotly.v1+json');
      expect(VISUALIZATION_MIME_TYPES.VEGALITE_V4).toBe('application/vnd.vegalite.v4+json');
      expect(VISUALIZATION_MIME_TYPES.VEGA_V5).toBe('application/vnd.vega.v5+json');
      expect(VISUALIZATION_MIME_TYPES.BOKEH).toBe('application/vnd.bokehjs_exec.v0+json');
    });
  });

  describe('Type Checking', () => {
    it('should identify image MIME types', () => {
      expect(isImageMimeType(IMAGE_MIME_TYPES.PNG)).toBe(true);
      expect(isImageMimeType(IMAGE_MIME_TYPES.JPEG)).toBe(true);
      expect(isImageMimeType(IMAGE_MIME_TYPES.SVG)).toBe(true);
      expect(isImageMimeType(TEXT_MIME_TYPES.HTML)).toBe(false);
    });

    it('should identify visualization MIME types', () => {
      expect(isVisualizationMimeType(VISUALIZATION_MIME_TYPES.PLOTLY_V1)).toBe(true);
      expect(isVisualizationMimeType(VISUALIZATION_MIME_TYPES.VEGALITE_V4)).toBe(true);
      expect(isVisualizationMimeType(VISUALIZATION_MIME_TYPES.BOKEH)).toBe(true);
      expect(isVisualizationMimeType(TEXT_MIME_TYPES.PLAIN)).toBe(false);
    });
  });

  describe('Category Detection', () => {
    it('should categorize text MIME types', () => {
      expect(getMimeTypeCategory(TEXT_MIME_TYPES.PLAIN)).toBe('text');
      expect(getMimeTypeCategory(TEXT_MIME_TYPES.HTML)).toBe('text');
      expect(getMimeTypeCategory(TEXT_MIME_TYPES.MARKDOWN)).toBe('text');
    });

    it('should categorize image MIME types', () => {
      expect(getMimeTypeCategory(IMAGE_MIME_TYPES.PNG)).toBe('image');
      expect(getMimeTypeCategory(IMAGE_MIME_TYPES.JPEG)).toBe('image');
      expect(getMimeTypeCategory(IMAGE_MIME_TYPES.SVG)).toBe('image');
    });

    it('should categorize application MIME types', () => {
      expect(getMimeTypeCategory(APPLICATION_MIME_TYPES.JSON)).toBe('json');
      expect(getMimeTypeCategory(APPLICATION_MIME_TYPES.PDF)).toBe('binary');
    });

    it('should categorize Jupyter MIME types', () => {
      expect(getMimeTypeCategory(JUPYTER_MIME_TYPES.WIDGET_VIEW)).toBe('widget');
      expect(getMimeTypeCategory(JUPYTER_MIME_TYPES.WIDGET_STATE)).toBe('widget');
    });

    it('should categorize visualization MIME types', () => {
      expect(getMimeTypeCategory(VISUALIZATION_MIME_TYPES.PLOTLY_V1)).toBe('visualization');
      expect(getMimeTypeCategory(VISUALIZATION_MIME_TYPES.VEGALITE_V4)).toBe('visualization');
    });

    it('should return "unknown" for unrecognized MIME types', () => {
      expect(getMimeTypeCategory('unknown/type')).toBe('unknown');
    });
  });

  describe('Priority System', () => {
    it('should have priority for HTML', () => {
      const priority = getMimeTypePriority(TEXT_MIME_TYPES.HTML);
      expect(priority).toBeGreaterThan(0);
    });

    it('should have priority for visualizations', () => {
      const plotlyPriority = getMimeTypePriority(VISUALIZATION_MIME_TYPES.PLOTLY_V1);
      expect(plotlyPriority).toBeGreaterThan(0);
    });

    it('should have lower priority for plain text', () => {
      const htmlPriority = getMimeTypePriority(TEXT_MIME_TYPES.HTML);
      const plainPriority = getMimeTypePriority(TEXT_MIME_TYPES.PLAIN);
      expect(htmlPriority).toBeGreaterThan(plainPriority);
    });

    it('should return 0 for unknown MIME types', () => {
      expect(getMimeTypePriority('unknown/type')).toBe(0);
    });
  });

  describe('Best MIME Type Selection', () => {
    it('should select HTML over plain text', () => {
      const mimeTypes = [TEXT_MIME_TYPES.PLAIN, TEXT_MIME_TYPES.HTML];
      const best = selectBestMimeType(mimeTypes);
      expect(best).toBe(TEXT_MIME_TYPES.HTML);
    });

    it('should select visualization over text', () => {
      const mimeTypes = [TEXT_MIME_TYPES.PLAIN, VISUALIZATION_MIME_TYPES.PLOTLY_V1];
      const best = selectBestMimeType(mimeTypes);
      expect(best).toBe(VISUALIZATION_MIME_TYPES.PLOTLY_V1);
    });

    it('should return first MIME type if none have priority', () => {
      const mimeTypes = ['unknown/type1', 'unknown/type2'];
      const best = selectBestMimeType(mimeTypes);
      expect(best).toBe('unknown/type1');
    });

    it('should return undefined for empty array', () => {
      const best = selectBestMimeType([]);
      expect(best).toBeUndefined();
    });
  });

  describe('Data Normalization', () => {
    it('should normalize array to string for text MIME types', () => {
      const data = ['line1\n', 'line2\n', 'line3'];
      const normalized = normalizeMimeData(TEXT_MIME_TYPES.PLAIN, data);
      expect(normalized).toBe('line1\nline2\nline3');
    });

    it('should return string as-is for text MIME types', () => {
      const data = 'already a string';
      const normalized = normalizeMimeData(TEXT_MIME_TYPES.PLAIN, data);
      expect(normalized).toBe('already a string');
    });

    it('should handle objects for non-text MIME types', () => {
      const data = { key: 'value' };
      const normalized = normalizeMimeData(APPLICATION_MIME_TYPES.JSON, data);
      expect(normalized).toEqual({ key: 'value' });
    });

    it('should handle empty array for text MIME types', () => {
      const data: string[] = [];
      const normalized = normalizeMimeData(TEXT_MIME_TYPES.PLAIN, data);
      expect(normalized).toBe('');
    });

    it('should handle single-element array for text MIME types', () => {
      const data = ['single item'];
      const normalized = normalizeMimeData(TEXT_MIME_TYPES.HTML, data);
      expect(normalized).toBe('single item');
    });

    it('should not normalize arrays for non-text MIME types', () => {
      const data = ['item1', 'item2'];
      const normalized = normalizeMimeData(IMAGE_MIME_TYPES.PNG, data);
      expect(normalized).toEqual(data); // Should return as-is
    });
  });
});
