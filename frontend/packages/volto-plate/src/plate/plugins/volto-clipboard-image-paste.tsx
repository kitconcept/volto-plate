import {
  createPlatePlugin,
} from 'platejs/react';

import {
  isClipboardImagePaste,
} from './volto-clipboard-image-paste-helpers';
import {
  insertVoltoImageBlocks,
  VoltoImageUploadBridge,
  type VoltoImageUploadOptions,
} from './volto-image-upload';

const CLIPBOARD_IMAGE_PASTE_PLUGIN_KEY = 'volto-clipboard-image-paste';

function ClipboardImagePasteBridge() {
  return (
    <VoltoImageUploadBridge
      plugin={VoltoClipboardImagePastePlugin as any}
      requestPrefix={CLIPBOARD_IMAGE_PASTE_PLUGIN_KEY}
    />
  );
}

export const VoltoClipboardImagePastePlugin = createPlatePlugin({
  key: CLIPBOARD_IMAGE_PASTE_PLUGIN_KEY,
  handlers: {
    onPaste: ({ editor, event }) => {
      if (!isClipboardImagePaste(event.clipboardData)) return false;

      const uploadClipboardImage = editor.getOption(
        VoltoClipboardImagePastePlugin,
        'uploadVoltoImage',
      );

      if (!uploadClipboardImage) return false;

      event.preventDefault();
      event.stopPropagation();

      void insertVoltoImageBlocks(
        editor,
        Array.from(event.clipboardData.files ?? []),
        uploadClipboardImage,
      );

      return true;
    },
  },
  options: {
    uploadVoltoImage: null,
  },
  render: {
    afterEditable: ClipboardImagePasteBridge,
  },
}) as any as ReturnType<typeof createPlatePlugin<VoltoImageUploadOptions>>;
