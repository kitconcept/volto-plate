import { createPlatePlugin } from 'platejs/react';

import {
  VoltoImageUploadBridge,
  insertVoltoImageBlocks,
  type VoltoImageUploadOptions,
} from './volto-image-upload';

const VOLTO_IMAGE_DROP_PLUGIN_KEY = 'volto-image-drop';

function hasDroppedImageFiles(dataTransfer?: DataTransfer | null) {
  if (!dataTransfer) return false;

  return Array.from(dataTransfer.files ?? []).some((file) =>
    file.type.startsWith('image/'),
  );
}

function VoltoImageDropBridge() {
  return (
    <VoltoImageUploadBridge
      plugin={VoltoImageDropPlugin as any}
      requestPrefix={VOLTO_IMAGE_DROP_PLUGIN_KEY}
    />
  );
}

export const VoltoImageDropPlugin = createPlatePlugin({
  key: VOLTO_IMAGE_DROP_PLUGIN_KEY,
  handlers: {
    onDrop: ({ editor, event }) => {
      if (!hasDroppedImageFiles(event.dataTransfer)) return false;

      const uploadVoltoImage = editor.getOption(
        VoltoImageDropPlugin,
        'uploadVoltoImage',
      );

      if (!uploadVoltoImage) return false;

      event.preventDefault();
      event.stopPropagation();

      const at = editor.api.findEventRange(event);

      if (at) {
        editor.tf.select(at);
      }

      void insertVoltoImageBlocks(
        editor,
        Array.from(event.dataTransfer?.files ?? []),
        uploadVoltoImage,
      );

      return true;
    },
  },
  options: {
    uploadVoltoImage: null,
  },
  render: {
    afterEditable: VoltoImageDropBridge,
  },
}) as any as ReturnType<typeof createPlatePlugin<VoltoImageUploadOptions>>;
