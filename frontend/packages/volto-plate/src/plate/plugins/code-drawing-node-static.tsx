import * as React from 'react';

import type { TCodeDrawingElement } from '@platejs/code-drawing';
import type { SlateElementProps } from 'platejs/static';

import { VIEW_MODE } from '@platejs/code-drawing';
import { SlateElement } from 'platejs/static';
import { useIntl } from 'react-intl';

import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';

import { getCodeDrawingData, useCodeDrawingImage } from './code-drawing-utils';

/**
 * Public view of a code drawing: the rendered diagram, or its source when the
 * author chose the "Code" view mode or the diagram cannot be rendered. The
 * diagram is rendered client side, so the server output only carries the
 * source as a fallback.
 */
export function CodeDrawingElementStatic(
  props: SlateElementProps<TCodeDrawingElement>,
) {
  const { element } = props;
  const intl = useIntl();
  const { code, drawingType, drawingMode } = getCodeDrawingData(element);
  const codeOnly = drawingMode === VIEW_MODE.Code;
  const { image, error } = useCodeDrawingImage(code, drawingType, {
    enabled: !codeOnly,
  });

  const showSource = codeOnly || !!error || !image;

  return (
    <SlateElement {...props} className="my-4">
      <BlockInnerContainer>
        <div contentEditable={false} data-drawing-type={drawingType}>
          {!codeOnly && image && (
            <img
              src={image}
              alt={intl.formatMessage({
                id: 'Diagram',
                defaultMessage: 'Diagram',
              })}
              className="mx-auto h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          )}
          {showSource && code && (
            <pre
              className={
                codeOnly || error
                  ? 'overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm'
                  : 'sr-only'
              }
            >
              <code>{code}</code>
            </pre>
          )}
        </div>
        {props.children}
      </BlockInnerContainer>
    </SlateElement>
  );
}
