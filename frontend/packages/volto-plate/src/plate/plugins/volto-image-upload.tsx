import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { createContent } from '@plone/volto/actions/content/content';
import { NodeApi, PathApi } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';
import { toast } from 'react-toastify';

import {
  buildImageCreateContentPayload,
  getImageUploadTarget,
  toPlateImageBlockData,
  type CreateContentResponse,
  type PlateImageBlockData,
} from './volto-clipboard-image-paste-helpers';

export type VoltoImageUploadOptions = {
  uploadVoltoImage:
    | ((file: File) => Promise<PlateImageBlockData | null>)
    | null;
};

type UploadBridgePlugin = {
  key?: string;
};

async function readFileAsDataURL(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read dropped image'));

    reader.readAsDataURL(file);
  });
}

export async function uploadVoltoImageFile(
  dispatch: any,
  contextUrl: string,
  isFolderish: boolean,
  file: File,
  requestPrefix: string,
) {
  try {
    const dataUrl = await readFileAsDataURL(file);
    const payload = buildImageCreateContentPayload(file, dataUrl);
    const response = await dispatch(
      createContent(
        getImageUploadTarget(contextUrl, isFolderish, window.location.pathname),
        payload,
        `${requestPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ),
    );
    const createdItem = (response?.data ?? response) as CreateContentResponse;

    return toPlateImageBlockData(createdItem, file);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not upload image';

    toast.error(message);
    return null;
  }
}

export async function insertVoltoImageBlocks(
  editor: PlateEditor,
  files: File[],
  uploadVoltoImage: NonNullable<VoltoImageUploadOptions['uploadVoltoImage']>,
) {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));

  if (imageFiles.length === 0) return false;

  let insertAt: number[] | undefined;
  const ancestor = editor.api.block({ highest: true });

  if (ancestor) {
    const [node, path] = ancestor;

    if (NodeApi.string(node).length === 0) {
      editor.tf.removeNodes({ at: path });
      insertAt = path;
    }
  }

  let inserted = false;

  for (const file of imageFiles) {
    const blockData = await uploadVoltoImage(file);

    if (!blockData) continue;

    editor.tf.insertNodes(
      editor.api.create.block({
        type: PLONE_BLOCK_TYPE,
        '@type': 'plateimage',
        ...blockData,
      }),
      insertAt
        ? {
            at: insertAt,
            nextBlock: false,
            select: true,
          }
        : {
            nextBlock: false,
            select: true,
          },
    );

    if (insertAt) {
      insertAt = PathApi.next(insertAt);
    }

    inserted = true;
  }

  return inserted;
}

export function VoltoImageUploadBridge({
  plugin,
  requestPrefix,
}: {
  plugin: UploadBridgePlugin;
  requestPrefix: string;
}) {
  const dispatch = useDispatch();
  const editor = useEditorRef();
  const location = useLocation();
  const isFolderish = useSelector((state: any) =>
    Boolean(state.content?.data?.is_folderish),
  );

  React.useEffect(() => {
    editor.setOption(plugin, 'uploadVoltoImage', (file: File) =>
      uploadVoltoImageFile(
        dispatch,
        location.pathname,
        isFolderish,
        file,
        requestPrefix,
      ),
    );

    return () => {
      editor.setOption(plugin, 'uploadVoltoImage', null);
    };
  }, [dispatch, editor, isFolderish, location.pathname, plugin, requestPrefix]);

  return null;
}
