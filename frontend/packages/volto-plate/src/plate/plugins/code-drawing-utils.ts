import * as React from 'react';

import type {
  CodeDrawingType,
  TCodeDrawingElement,
  ViewMode,
} from '@platejs/code-drawing';
import {
  CODE_DRAWING_TYPE,
  CODE_DRAWING_TYPE_ARRAY,
  RENDER_DEBOUNCE_DELAY,
  VIEW_MODE,
  renderCodeDrawing,
} from '@platejs/code-drawing';
import debounce from 'lodash/debounce';

// PlantUML is rendered by posting the diagram source to the public
// plantuml.com server, which must not happen with wiki content. It is left
// out of the type list and never rendered; such elements show their source.
const DISABLED_DRAWING_TYPES: CodeDrawingType[] = [CODE_DRAWING_TYPE.PlantUml];

export const isDrawingTypeEnabled = (type: CodeDrawingType) =>
  !DISABLED_DRAWING_TYPES.includes(type);

export const ENABLED_DRAWING_TYPE_ARRAY = CODE_DRAWING_TYPE_ARRAY.filter(
  (item) => isDrawingTypeEnabled(item.value),
);

export const DEFAULT_DRAWING_TYPE: CodeDrawingType = 'Mermaid';
export const DEFAULT_VIEW_MODE: ViewMode = VIEW_MODE.Both;

export const getCodeDrawingData = (element: TCodeDrawingElement) => ({
  code: element.data?.code ?? '',
  drawingType: element.data?.drawingType ?? DEFAULT_DRAWING_TYPE,
  drawingMode: element.data?.drawingMode ?? DEFAULT_VIEW_MODE,
});

const SVG_DATA_URL_PREFIX = 'data:image/svg+xml;base64,';

/**
 * Mermaid (and Graphviz) emit `width="100%"` on the root `<svg>`, so as an
 * `<img>` source the image has no intrinsic size and stretches to the full
 * container width. Pin the size from the viewBox so it renders at its
 * natural size, capped by CSS.
 */
export const withIntrinsicSize = (dataUrl: string) => {
  if (!dataUrl.startsWith(SVG_DATA_URL_PREFIX)) return dataUrl;

  try {
    const svgText = decodeURIComponent(
      escape(window.atob(dataUrl.slice(SVG_DATA_URL_PREFIX.length))),
    );
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    const viewBox = svg
      .getAttribute('viewBox')
      ?.split(/[\s,]+/)
      .map(Number);
    if (!viewBox || viewBox.length !== 4 || viewBox.some(Number.isNaN)) {
      return dataUrl;
    }

    svg.setAttribute('width', String(Math.ceil(viewBox[2])));
    svg.setAttribute('height', String(Math.ceil(viewBox[3])));
    svg.style.removeProperty('max-width');

    const serialized = new XMLSerializer().serializeToString(svg);
    return `${SVG_DATA_URL_PREFIX}${window.btoa(unescape(encodeURIComponent(serialized)))}`;
  } catch {
    return dataUrl;
  }
};

/**
 * Renders the diagram source of a code drawing element into an image data URL.
 * Rendering only happens in the browser (inside an effect), the renderers
 * (Mermaid, Graphviz, Flowchart, PlantUML) are lazy loaded on first use.
 */
export function useCodeDrawingImage(
  code: string,
  drawingType: CodeDrawingType,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [image, setImage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const debouncedRender = React.useMemo(() => {
    let lastRequestId = 0;

    return debounce(async (nextCode: string, nextType: CodeDrawingType) => {
      lastRequestId += 1;
      const requestId = lastRequestId;

      if (!nextCode.trim()) {
        setImage('');
        setLoading(false);
        setError(null);
        return;
      }

      if (!isDrawingTypeEnabled(nextType)) {
        setImage('');
        setLoading(false);
        setError(`Unsupported drawing type: ${nextType}`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const imageData = await renderCodeDrawing(nextType, nextCode);
        if (lastRequestId === requestId) {
          setImage(withIntrinsicSize(imageData));
        }
      } catch (err) {
        if (lastRequestId === requestId) {
          setError(err instanceof Error ? err.message : 'Rendering failed');
          setImage('');
        }
      } finally {
        if (lastRequestId === requestId) {
          setLoading(false);
        }
      }
    }, RENDER_DEBOUNCE_DELAY);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    debouncedRender(code, drawingType);

    return () => {
      debouncedRender.cancel();
    };
  }, [code, drawingType, enabled, debouncedRender]);

  return { image, loading, error };
}
