import { BaseCaptionPlugin } from '@platejs/caption';
import {
  BaseAudioPlugin,
  BaseFilePlugin,
  // BaseImagePlugin,
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
  BaseVideoPlugin,
} from '@platejs/media';
import { KEYS } from 'platejs';

import { AudioElementStatic } from '@plone/plate/components/ui/media-audio-node-static';
import { FileElementStatic } from '@plone/plate/components/ui/media-file-node-static';
import { VideoElementStatic } from '@plone/plate/components/ui/media-video-node-static';

import { VoltoImageBlockPlugin } from '@plone/volto-plate/plate/plugins/volto-image-block';

// Override the base media kit to reuse the Volto image block (via the adapter)
// for both edit and view, instead of the static Plate image element.
export const BaseMediaKit = [
  VoltoImageBlockPlugin,
  BaseVideoPlugin.withComponent(VideoElementStatic),
  BaseAudioPlugin.withComponent(AudioElementStatic),
  BaseFilePlugin.withComponent(FileElementStatic),
  BaseCaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
];
