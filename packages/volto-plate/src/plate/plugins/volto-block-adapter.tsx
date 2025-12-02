/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import isEqual from 'lodash/isEqual';

import type { TElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import {
  PlateElement,
  useEditorRef,
  useReadOnly,
  useSelected,
} from 'platejs/react';

type AdapterContext<TPlateElement extends TElement, TBlockData> = {
  element: TPlateElement;
  blockData: TBlockData;
  blockId: string;
};

type AdapterOptions<TPlateElement extends TElement, TBlockData> = {
  Edit: React.ComponentType<any>;
  View: React.ComponentType<any>;
  toBlockData: (element: TPlateElement) => TBlockData;
  fromBlockData: (
    data: TBlockData,
    previousElement: TPlateElement,
  ) => Partial<TPlateElement>;
  getEditProps?: (
    context: AdapterContext<TPlateElement, TBlockData>,
  ) => Record<string, unknown>;
  getViewProps?: (
    context: AdapterContext<TPlateElement, TBlockData>,
  ) => Record<string, unknown>;
};

/**
 * Generic adapter to wrap an existing Volto block (Edit/View) so it can render
 * as a Plate element without touching the original components. It maps the
 * Plate element data into Volto block data, and writes block updates back into
 * the Plate node via `setNodes`.
 */
export function createVoltoBlockAdapter<
  TPlateElement extends TElement,
  TBlockData,
>(options: AdapterOptions<TPlateElement, TBlockData>) {
  const { Edit, View, toBlockData, fromBlockData, getEditProps, getViewProps } =
    options;

  return function VoltoBlockAdapter(props: PlateElementProps<TPlateElement>) {
    // If Plate context is missing (e.g. rendering outside a Plate/PlateController),
    // fall back to rendering the View component directly.
    try {
      return renderWithPlate(props);
    } catch (_err) {
      const fallbackData = toBlockData(props.element);
      return <View data={fallbackData} />;
    }
  };

  function renderWithPlate(props: PlateElementProps<TPlateElement>) {
    const { element } = props;
    const editor = useEditorRef();
    const readOnly = useReadOnly();
    const selected = useSelected();

    const path = React.useMemo(
      () => editor.api.findPath(element),
      [editor, element],
    );
    const pathRef = React.useRef(path);
    pathRef.current = path;

    // We must have a path to update the Plate node; bail out if it cannot be
    // resolved for any reason.
    if (!path) return null;

    const blockId = React.useMemo(() => {
      const explicitId = (element as any)?.id;
      return explicitId ? String(explicitId) : pathRef.current.join('-');
    }, [element]);

    const blockData = React.useMemo(
      () => toBlockData(element),
      [element, toBlockData],
    );

    const handleChangeBlock = React.useCallback(
      (_block: string, data: TBlockData) => {
        const mapped = fromBlockData(data, element);
        const current = editor.api.node(pathRef.current)?.[0] as
          | TPlateElement
          | undefined;

        const next = current
          ? ({ ...current, ...mapped } as TPlateElement)
          : mapped;

        if (!isEqual(current, next)) {
          editor.tf.setNodes(mapped, { at: pathRef.current });
        }
      },
      [editor, element, fromBlockData],
    );

    const handleSelectBlock = React.useCallback(() => {
      editor.tf.select(pathRef.current);
    }, [editor]);

    const context = React.useMemo<AdapterContext<TPlateElement, TBlockData>>(
      () => ({ element, blockData, blockId }),
      [blockData, blockId, element],
    );

    const extraEditProps = React.useMemo(
      () => (getEditProps ? getEditProps(context) : {}),
      [context, getEditProps],
    );

    const extraViewProps = React.useMemo(
      () => (getViewProps ? getViewProps(context) : {}),
      [context, getViewProps],
    );
    console.log(props);
    return (
      <PlateElement {...props} contentEditable={false}>
        {readOnly ? (
          <View data={blockData} {...extraViewProps} />
        ) : (
          <Edit
            data={blockData}
            block={blockId}
            selected={selected}
            onChangeBlock={handleChangeBlock}
            onSelectBlock={handleSelectBlock}
            {...extraEditProps}
          />
        )}
        {props.children}
      </PlateElement>
    );
  }
}
