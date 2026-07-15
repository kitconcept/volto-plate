import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock(
  'react-redux',
  () => ({
    useDispatch: () => vi.fn(),
    useSelector: () => null,
  }),
  { virtual: true },
);

vi.mock('@plone/volto/helpers/Url/Url', () => ({
  flattenToAppURL: (url: string) => {
    if (!url) return '';

    try {
      const parsed = new URL(url, 'http://localhost');
      return parsed.pathname || '/';
    } catch {
      return url.startsWith('/') ? url : `/${url}`;
    }
  },
  getBaseUrl: (url: string) =>
    (url
      ?.replace(/\?.*$/, '')
      .replace(
        /\/(edit|contents|delete|diff|history|layout|sharing|add)$/,
        '',
      ) ??
      '') ||
    '/',
  getParentUrl: (url: string) => url.substring(0, url.lastIndexOf('/')),
}));

let buildImageCreateContentPayload: typeof import('./volto-clipboard-image-paste-helpers').buildImageCreateContentPayload;
let getImageUploadTarget: typeof import('./volto-clipboard-image-paste-helpers').getImageUploadTarget;
let isClipboardImagePaste: typeof import('./volto-clipboard-image-paste-helpers').isClipboardImagePaste;
let toPlateImageBlockData: typeof import('./volto-clipboard-image-paste-helpers').toPlateImageBlockData;

beforeAll(async () => {
  const pluginModule = await import('./volto-clipboard-image-paste-helpers');

  buildImageCreateContentPayload = pluginModule.buildImageCreateContentPayload;
  getImageUploadTarget = pluginModule.getImageUploadTarget;
  isClipboardImagePaste = pluginModule.isClipboardImagePaste;
  toPlateImageBlockData = pluginModule.toPlateImageBlockData;
});

describe('volto clipboard image paste helpers', () => {
  it('builds an Image create payload from a data URL', () => {
    const file = new File(['fake'], 'clipboard.png', { type: 'image/png' });

    expect(
      buildImageCreateContentPayload(
        file,
        'data:image/png;base64,ZmFrZS1jbGlwYm9hcmQ=',
      ),
    ).toEqual({
      '@type': 'Image',
      title: 'clipboard.png',
      image: {
        data: 'ZmFrZS1jbGlwYm9hcmQ=',
        encoding: 'base64',
        'content-type': 'image/png',
        filename: 'clipboard.png',
      },
    });
  });

  it('uploads inside the current folder for folderish content', () => {
    expect(getImageUploadTarget('/Plone/folder', true, '/Plone/folder')).toBe(
      '/Plone/folder',
    );
  });

  it('uploads next to the current content for non-folderish content', () => {
    expect(
      getImageUploadTarget('/Plone/folder/page', false, '/Plone/folder/page'),
    ).toBe('/Plone/folder');
  });

  it('strips the edit route before resolving the upload target', () => {
    expect(getImageUploadTarget('/Plone/folder/page/edit', false)).toBe(
      '/Plone/folder',
    );
  });

  it('uploads to the parent container on add views', () => {
    expect(getImageUploadTarget('/Plone/folder/add?type=Document', false)).toBe(
      '/Plone/folder',
    );
  });

  it('maps a created image item into plateimage block data', () => {
    const file = new File(['fake'], 'clipboard.png', { type: 'image/png' });

    expect(
      toPlateImageBlockData(
        {
          '@id': 'http://localhost:8080/Plone/folder/pasted-image',
          image_field: 'image',
          title: 'Pasted image',
        },
        file,
      ),
    ).toEqual({
      align: 'center',
      alt: 'Pasted image',
      image_field: 'image',
      image_scales: undefined,
      size: 'l',
      url: '/Plone/folder/pasted-image',
    });
  });

  it('detects pure clipboard image pastes and ignores html pastes', () => {
    expect(
      isClipboardImagePaste({
        files: [new File(['fake'], 'clipboard.png', { type: 'image/png' })],
        types: [],
      } as unknown as DataTransfer),
    ).toBe(true);

    expect(
      isClipboardImagePaste({
        files: [new File(['fake'], 'clipboard.png', { type: 'image/png' })],
        types: ['text/html'],
      } as unknown as DataTransfer),
    ).toBe(false);
  });
});
