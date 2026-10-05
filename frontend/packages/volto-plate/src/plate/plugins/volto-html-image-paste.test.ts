import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Descendant, TElement } from 'platejs';

vi.mock('@plone/volto/helpers/Url/Url', () => ({
  flattenToAppURL: (url: string) => url.replace('http://localhost:3000', ''),
  isInternalURL: (url: string) =>
    url.startsWith('/') || url.startsWith('http://localhost:3000'),
}));

let helpers: typeof import('./volto-html-image-paste-helpers');

beforeAll(async () => {
  helpers = await import('./volto-html-image-paste-helpers');
});

const image = (src: string): TElement => ({
  type: 'voltoPastedImage',
  alt: '',
  src,
  children: [{ text: '' }],
});

const isVoid = (element: TElement) =>
  element.type === 'voltoPastedImage' || element.type === 'mention';

describe('liftPastedImages', () => {
  it('splits a paragraph around its image', () => {
    const fragment: Descendant[] = [
      {
        type: 'p',
        indent: 1,
        children: [{ text: 'Before ' }, image('a.png'), { text: ' after' }],
      },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual([
      { type: 'p', indent: 1, children: [{ text: 'Before ' }] },
      image('a.png'),
      { type: 'p', indent: 1, children: [{ text: ' after' }] },
    ]);
  });

  it('drops the parts left without content', () => {
    const fragment: Descendant[] = [
      { type: 'p', children: [{ text: ' ' }, image('a.png'), { text: '' }] },
      {
        type: 'p',
        children: [
          { type: 'a', url: 'https://plone.org', children: [image('b.png')] },
        ],
      },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual([
      image('a.png'),
      image('b.png'),
    ]);
  });

  it('keeps parts holding only an inline void element', () => {
    const mention = { type: 'mention', value: 'x', children: [{ text: '' }] };
    const fragment: Descendant[] = [
      { type: 'p', children: [mention, image('a.png')] },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual([
      { type: 'p', children: [mention] },
      image('a.png'),
    ]);
  });

  it('lifts images out of containers', () => {
    const fragment: Descendant[] = [
      {
        type: 'blockquote',
        children: [
          { type: 'p', children: [{ text: 'Quote' }] },
          { type: 'p', children: [image('a.png')] },
        ],
      },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual([
      {
        type: 'blockquote',
        children: [{ type: 'p', children: [{ text: 'Quote' }] }],
      },
      image('a.png'),
    ]);
  });

  it('places the images of a table after it', () => {
    const cell = (children: Descendant[]) => ({
      type: 'td',
      children: [{ type: 'p', children }],
    });
    const fragment: Descendant[] = [
      {
        type: 'table',
        children: [
          {
            type: 'tr',
            children: [cell([image('a.png')]), cell([{ text: 'B1' }])],
          },
        ],
      },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual([
      {
        type: 'table',
        children: [
          {
            type: 'tr',
            children: [cell([{ text: '' }]), cell([{ text: 'B1' }])],
          },
        ],
      },
      image('a.png'),
    ]);
  });

  it('leaves fragments without images untouched', () => {
    const fragment: Descendant[] = [
      { type: 'p', children: [{ text: 'Text' }] },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual(fragment);
  });
});

describe('getPastedImageSourceKind', () => {
  it.each([
    ['data:image/png;base64,iVBORw0KGgo=', 'embedded'],
    ['blob:http://localhost:3000/1234', 'embedded'],
    ['http://localhost:3000/page/photo.png/@@images/image', 'internal'],
    ['/page/photo.png/@@images/image/large', 'internal'],
    ['https://example.com/photo.png', 'external'],
    ['file:///C:/Users/me/clip_image001.png', 'unsupported'],
    ['data:text/html,<p>no</p>', 'unsupported'],
    ['photo.png', 'unsupported'],
  ])('%s is %s', (src, kind) => {
    expect(helpers.getPastedImageSourceKind(src)).toBe(kind);
  });
});

describe('getPastedImageContentPath', () => {
  it.each([
    [
      'http://localhost:3000/page/photo.png/@@images/image-800-abc.png',
      '/page/photo.png',
    ],
    ['/page/photo.png/@@images/image/large?x=1', '/page/photo.png'],
    ['/page/photo.png/@@download/image', '/page/photo.png'],
    ['/page/photo.png/view', '/page/photo.png'],
    ['/page/photo.png', '/page/photo.png'],
  ])('%s -> %s', (src, path) => {
    expect(helpers.getPastedImageContentPath(src)).toBe(path);
  });
});

describe('getPastedImageFileName', () => {
  it('uses the file name of a web image', () => {
    expect(
      helpers.getPastedImageFileName(
        'https://example.com/media/my%20photo.jpg?w=200',
        'image/jpeg',
      ),
    ).toBe('my photo.jpg');
  });

  it('names images without a file name after their type', () => {
    expect(
      helpers.getPastedImageFileName('data:image/png;base64,AA==', 'image/png'),
    ).toBe('pasted-image.png');
    expect(
      helpers.getPastedImageFileName('https://example.com/image', 'image/jpeg'),
    ).toBe('pasted-image.jpg');
  });
});
