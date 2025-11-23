import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '@plone/plate/components/ui/media-audio-node';
import { MediaEmbedElement } from '@plone/plate/components/ui/media-embed-node';
import { FileElement } from '@plone/plate/components/ui/media-file-node';
import { ImageElement } from '@plone/plate/components/ui/media-image-node';
import { PlaceholderElement } from '@plone/plate/components/ui/media-placeholder-node';
import { MediaPreviewDialog } from '@plone/plate/components/ui/media-preview-dialog';
import { MediaUploadToast } from '@plone/plate/components/ui/media-upload-toast';
import { VideoElement } from '@plone/plate/components/ui/media-video-node';

import { VoltoImagePlugin } from '@plone/volto-plate/plate/plugins/volto-media-kit';

export const MediaKit = [
  VoltoImagePlugin,
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
