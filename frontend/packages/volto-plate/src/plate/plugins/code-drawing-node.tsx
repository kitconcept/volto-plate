import * as React from 'react';

import type {
  CodeDrawingData,
  CodeDrawingType,
  TCodeDrawingElement,
  ViewMode,
} from '@platejs/code-drawing';
import type { PlateElementProps } from 'platejs/react';

import {
  DEFAULT_MIN_HEIGHT,
  DOWNLOAD_FILENAME,
  VIEW_MODE,
  VIEW_MODE_ARRAY,
  downloadImage,
} from '@platejs/code-drawing';
import { DownloadIcon, Trash2 } from 'lucide-react';
import {
  PlateElement,
  useEditorSelector,
  useFocusedLast,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { cn } from '@plone/plate/lib/utils';
import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import { Button } from '@plone/plate/components/ui/button';
import { useTranslation } from '@plone/plate/components/editor/plugins/i18n';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@plone/plate/components/ui/popover';

import {
  ENABLED_DRAWING_TYPE_ARRAY,
  getCodeDrawingData,
  isDrawingTypeEnabled,
  useCodeDrawingImage,
} from './code-drawing-utils';

export function CodeDrawingElement(
  props: PlateElementProps<TCodeDrawingElement>,
) {
  const { children, editor, element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const selectionCollapsed = useEditorSelector(
    (editor) => !editor.api.isExpanded(),
    [],
  );

  const { t: translate } = useTranslation();
  const t = React.useCallback(
    (id: string) => translate(id, { defaultValue: id }),
    [translate],
  );

  const { code, drawingType, drawingMode } = getCodeDrawingData(element);
  const { image, loading, error } = useCodeDrawingImage(code, drawingType);

  const setData = React.useCallback(
    (data: Partial<CodeDrawingData>) => {
      const path = editor.api.findPath(element);
      if (!path) return;
      editor.tf.setNodes<TCodeDrawingElement>(
        { data: { ...element.data, ...data } },
        { at: path },
      );
    },
    [editor, element],
  );

  const removeNode = () => {
    const path = editor.api.findPath(element);
    if (path) editor.tf.removeNodes({ at: path });
  };

  const showCode = drawingMode !== VIEW_MODE.Image;
  const showImage = drawingMode !== VIEW_MODE.Code;
  const open = isFocusedLast && !readOnly && selected && selectionCollapsed;

  const toolbar = readOnly ? null : (
    <div
      role="toolbar"
      className={cn(
        'absolute top-2 right-2 z-10 flex items-center gap-2 transition-opacity',
        'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        selected && 'opacity-100',
      )}
    >
      <select
        aria-label={t('Diagram type')}
        className="h-8 rounded-md border-0 bg-muted px-2 text-xs"
        value={drawingType}
        onChange={(e) =>
          setData({ drawingType: e.target.value as CodeDrawingType })
        }
      >
        {/* Keep a disabled type that is already set (e.g. pasted PlantUML)
            visible, so the select does not misreport it. */}
        {!isDrawingTypeEnabled(drawingType) && (
          <option value={drawingType} disabled>
            {drawingType}
          </option>
        )}
        {ENABLED_DRAWING_TYPE_ARRAY.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <select
        aria-label={t('View mode')}
        className="h-8 rounded-md border-0 bg-muted px-2 text-xs"
        value={drawingMode}
        onChange={(e) => setData({ drawingMode: e.target.value as ViewMode })}
      >
        {VIEW_MODE_ARRAY.map((item) => (
          <option key={item.value} value={item.value}>
            {t(item.label)}
          </option>
        ))}
      </select>
    </div>
  );

  const content = (
    <PlateElement {...props}>
      <BlockInnerContainer>
        <div contentEditable={false}>
          <div
            className={cn(
              'group relative my-4 flex w-full flex-col items-stretch rounded-md border border-border bg-muted/50 md:flex-row',
              selected && !readOnly && 'ring-2 ring-ring',
            )}
            style={{ minHeight: `${DEFAULT_MIN_HEIGHT}px` }}
          >
            {toolbar}
            {showCode && (
              <CodeDrawingTextarea
                code={code}
                readOnly={readOnly}
                placeholder={t('Enter your diagram code here…')}
                className={cn(
                  'min-w-0 flex-1',
                  showImage &&
                    'border-b border-border md:border-r md:border-b-0',
                )}
                onChange={(nextCode) => setData({ code: nextCode })}
              />
            )}
            {showImage && (
              <div className="flex min-w-0 flex-1 items-center justify-center p-4 pt-12">
                {loading && (
                  <div className="text-muted-foreground">{t('Loading…')}</div>
                )}
                {!loading && image && (
                  <img
                    src={image}
                    alt={t('Diagram')}
                    className="h-auto max-h-[480px] w-auto max-w-full object-contain"
                  />
                )}
                {!loading && !image && (
                  <div
                    className={cn(
                      'text-sm',
                      error ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {error
                      ? t('The diagram could not be rendered.')
                      : t('The diagram preview will appear here.')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {children}
      </BlockInnerContainer>
    </PlateElement>
  );

  if (readOnly) return content;

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor asChild>{content}</PopoverAnchor>
      <PopoverContent
        className="w-auto p-1"
        contentEditable={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1">
          {image && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => downloadImage(image, DOWNLOAD_FILENAME)}
              title={t('Download as PNG')}
            >
              <DownloadIcon className="size-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={removeNode}
            title={t('Delete')}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CodeDrawingTextarea({
  code,
  readOnly,
  placeholder,
  className,
  onChange,
}: {
  code: string;
  readOnly: boolean;
  placeholder: string;
  className?: string;
  onChange: (code: string) => void;
}) {
  // Keep a local copy so typing stays responsive and the caret does not jump
  // while the editor value round-trips; resync when the value changes from
  // the outside (undo/redo, collaboration).
  const [internalCode, setInternalCode] = React.useState(code);
  const lastExternalCodeRef = React.useRef(code);

  React.useEffect(() => {
    if (code !== lastExternalCodeRef.current) {
      lastExternalCodeRef.current = code;
      setInternalCode(code);
    }
  }, [code]);

  return (
    <div className={cn('flex flex-col', className)}>
      <textarea
        value={internalCode}
        onChange={(e) => {
          setInternalCode(e.target.value);
          lastExternalCodeRef.current = e.target.value;
          onChange(e.target.value);
        }}
        readOnly={readOnly}
        className="m-0 h-full w-full flex-1 resize-none border-0 bg-transparent p-4 pt-12 font-mono! text-sm shadow-none! outline-none! [tab-size:2]"
        style={{ minHeight: `${DEFAULT_MIN_HEIGHT}px` }}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
