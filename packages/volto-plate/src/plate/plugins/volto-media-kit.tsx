import React from 'react';

import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable } from '@platejs/dnd';
import {
  ImagePlugin,
  useMediaState,
  Image as PlateImage,
} from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import {
  PlateElement,
  useEditorRef,
  withHOC,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import ImageSidebar from '@plone/volto/components/manage/Blocks/Image/ImageSidebar';
import { ImageInput } from '@plone/volto/components/manage/Widgets/ImageWidget';
import SidebarPopup from '@plone/volto/components/manage/Sidebar/SidebarPopup';
import config from '@plone/volto/registry';
import { Button } from 'semantic-ui-react';

import cx from 'classnames';
import { MediaToolbar } from '@plone/plate/components/ui/media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from '@plone/plate/components/ui/resize-handle';

type VoltoImageNode = TImageElement & {
  alt?: string;
  image_field?: string;
  image_scales?: Record<string, any>;
  [key: string]: unknown;
};

function getDisplayUrl(element: VoltoImageNode) {
  const field = element.image_field;
  const scales = element.image_scales;
  if (field && scales?.[field]?.[0]?.scales?.larger?.download) {
    return `${element.url}/${scales[field][0].scales.larger.download}`;
  }

  return element.url;
}

function isSameImageData(
  a: Partial<VoltoImageNode>,
  b: Partial<VoltoImageNode>,
) {
  return (
    a.url === b.url &&
    a.image_field === b.image_field &&
    a.alt === b.alt &&
    JSON.stringify(a.image_scales ?? null) ===
      JSON.stringify(b.image_scales ?? null)
  );
}

export const VoltoImageElement = withHOC(
  ResizableProvider,
  function VoltoImageElement(props: PlateElementProps<VoltoImageNode>) {
    const { element } = props;
    const editor = useEditorRef();
    const readOnly = useReadOnly();
    const selected = useSelected();
    const { align = 'center', focused } = useMediaState();
    const width = useResizableValue('width');

    const path = React.useMemo(
      () => editor.api.findPath(element),
      [editor, element],
    );
    const pathRef = React.useRef(path);
    pathRef.current = path;

    // Use existing element id if present; otherwise derive from path for stability.
    const nodeId = React.useMemo(() => {
      const explicitId = (element as any)?.id;
      return explicitId ? String(explicitId) : pathRef.current.join('-');
    }, [element]);

    const [isPickerOpen, setPickerOpen] = React.useState(!element.url);
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    const handleImageChange = React.useCallback(
      (id: string, image: any, extra: any = {}) => {
        const url = image ? image['@id'] || image : '';

        const nextData = {
          url: flattenToAppURL(url),
          image_field: extra.image_field,
          image_scales: extra.image_scales,
          alt: element.alt || extra.title || '',
        };

        const current = editor.api.node(path)?.[0] as VoltoImageNode | null;
        if (
          !current ||
          !isSameImageData(current, { ...current, ...nextData })
        ) {
          editor.tf.setNodes(nextData, { at: path });
        }

        setPickerOpen(false);
      },
      [editor, element.alt, path],
    );

    const handleClear = React.useCallback(() => {
      editor.tf.setNodes(
        {
          url: undefined,
          image_scales: undefined,
          image_field: undefined,
        },
        { at: path },
      );
      setPickerOpen(true);
    }, [editor, path]);

    const handleSidebarChange = React.useCallback(
      (_block: string, data: VoltoImageNode) => {
        editor.tf.setNodes(data, { at: path });
      },
      [editor, path],
    );

    const imageValue = React.useMemo(() => {
      if (!element.url) return undefined;
      return {
        '@id': element.url,
        image_field: element.image_field,
        image_scales: element.image_scales,
      };
    }, [element.image_field, element.image_scales, element.url]);

    const displayUrl = getDisplayUrl(element);

    return (
      <>
        {!readOnly && isPickerOpen && (
          <div className="mb-3">
            <ImageInput
              id={nodeId}
              block={nodeId}
              selected
              value={imageValue}
              onChange={handleImageChange}
              onSelectItem={(
                url: string,
                { title, image_field, image_scales },
              ) =>
                handleImageChange(nodeId, flattenToAppURL(url), {
                  title,
                  image_field,
                  image_scales,
                })
              }
            />
          </div>
        )}

        <MediaToolbar plugin={ImagePlugin}>
          <PlateElement {...props} key={nodeId} className="py-2.5">
            <figure className="group relative m-0" contentEditable={false}>
              <Resizable
                align={align}
                options={{
                  align,
                  readOnly,
                }}
              >
                <ResizeHandle
                  className={mediaResizeHandleVariants({ direction: 'left' })}
                  options={{ direction: 'left' }}
                />
                <PlateImage
                  ref={handleRef}
                  className={cx(
                    'block w-full max-w-full cursor-pointer object-cover px-0',
                    'rounded-sm',
                    focused && selected && 'ring-2 ring-ring ring-offset-2',
                    isDragging && 'opacity-50',
                  )}
                  alt={element.alt}
                  src={displayUrl}
                />
                <ResizeHandle
                  className={mediaResizeHandleVariants({
                    direction: 'right',
                  })}
                  options={{ direction: 'right' }}
                />
              </Resizable>

              {!readOnly && (
                <div
                  className="absolute right-2 top-2 flex gap-2"
                  contentEditable={false}
                >
                  <Button
                    size="small"
                    onClick={() => setPickerOpen(true)}
                    primary
                    basic
                  >
                    Replace
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSidebarOpen(true)}
                    basic
                  >
                    Settings
                  </Button>
                  {element.url ? (
                    <Button
                      size="small"
                      basic
                      color="red"
                      onClick={handleClear}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              )}
            </figure>

            {props.children}
          </PlateElement>
        </MediaToolbar>

        <SidebarPopup
          open={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          overlay
        >
          <ImageSidebar
            data={element}
            block={(element.id as string) || 'plate-image'}
            onChangeBlock={handleSidebarChange}
            blocksConfig={config.blocks.blocksConfig}
            blocksErrors={{}}
            navRoot={config.settings?.navRootPath}
            contentType={(element as any)?.['@type']}
          />
        </SidebarPopup>
      </>
    );
  },
);

export const VoltoImagePlugin = ImagePlugin.configure({
  options: { disableUploadInsert: true },
  render: { node: VoltoImageElement },
});
