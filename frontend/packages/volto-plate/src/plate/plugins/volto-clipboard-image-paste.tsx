import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { createContent } from '@plone/volto/actions/content/content';
import { NodeApi, PathApi } from 'platejs';
import {
  createPlatePlugin,
  type PlateEditor,
  useEditorRef,
} from 'platejs/react';
import { toast } from 'react-toastify';

import {
  buildImageCreateContentPayload,
  getImageUploadTarget,
  isClipboardImagePaste,
  toPlateImageBlockData,
  type CreateContentResponse,
  type PlateImageBlockData,
} from './volto-clipboard-image-paste-helpers';

const CLIPBOARD_IMAGE_PASTE_PLUGIN_KEY = 'volto-clipboard-image-paste';

type ClipboardImagePasteOptions = {
  uploadClipboardImage:
    | ((file: File) => Promise<PlateImageBlockData | null>)
    | null;
};

async function readFileAsDataURL(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read clipboard image'));

    reader.readAsDataURL(file);
  });
}

async function uploadClipboardImageWithVolto(
  dispatch: any,
  contextUrl: string,
  isFolderish: boolean,
  file: File,
) {
  try {
    const dataUrl = await readFileAsDataURL(file);
    const payload = buildImageCreateContentPayload(file, dataUrl);
    const response = await dispatch(
      createContent(
        getImageUploadTarget(contextUrl, isFolderish, window.location.pathname),
        payload,
        `${CLIPBOARD_IMAGE_PASTE_PLUGIN_KEY}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
      ),
    );
    const createdItem = (response?.data ?? response) as CreateContentResponse;

    return toPlateImageBlockData(createdItem, file);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not upload clipboard image';

    toast.error(message);
    return null;
  }
}

async function insertClipboardImages(
  editor: PlateEditor,
  files: File[],
  uploadClipboardImage: NonNullable<
    ClipboardImagePasteOptions['uploadClipboardImage']
  >,
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
    const blockData = await uploadClipboardImage(file);

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

function ClipboardImagePasteBridge() {
  const dispatch = useDispatch();
  const editor = useEditorRef();
  const location = useLocation();
  const isFolderish = useSelector((state: any) =>
    Boolean(state.content?.data?.is_folderish),
  );

  React.useEffect(() => {
    editor.setOption(
      VoltoClipboardImagePastePlugin,
      'uploadClipboardImage',
      (file: File) =>
        uploadClipboardImageWithVolto(
          dispatch,
          location.pathname,
          isFolderish,
          file,
        ),
    );

    return () => {
      editor.setOption(
        VoltoClipboardImagePastePlugin,
        'uploadClipboardImage',
        null,
      );
    };
  }, [dispatch, editor, isFolderish, location.pathname]);

  return null;
}

export const VoltoClipboardImagePastePlugin = createPlatePlugin({
  key: CLIPBOARD_IMAGE_PASTE_PLUGIN_KEY,
  handlers: {
    onPaste: ({ editor, event }) => {
      if (!isClipboardImagePaste(event.clipboardData)) return false;

      const uploadClipboardImage = editor.getOption(
        VoltoClipboardImagePastePlugin,
        'uploadClipboardImage',
      );

      if (!uploadClipboardImage) return false;

      event.preventDefault();
      event.stopPropagation();

      void insertClipboardImages(
        editor,
        Array.from(event.clipboardData.files ?? []),
        uploadClipboardImage,
      );

      return true;
    },
  },
  options: {
    uploadClipboardImage: null,
  },
  render: {
    afterEditable: ClipboardImagePasteBridge,
  },
});
