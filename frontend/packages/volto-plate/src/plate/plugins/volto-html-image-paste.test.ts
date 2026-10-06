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

  it('keeps the images of a table in their cells', () => {
    const table = (cells: Descendant[][]) => ({
      type: 'table',
      children: [
        {
          type: 'tr',
          children: cells.map((children) => ({ type: 'td', children })),
        },
      ],
    });
    const fragment: Descendant[] = [
      table([
        [{ type: 'p', children: [{ text: 'A1' }] }],
        [
          {
            type: 'p',
            children: [{ text: 'Caption ' }, image('a.png'), { text: ' ' }],
          },
        ],
      ]),
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual([
      table([
        [{ type: 'p', children: [{ text: 'A1' }] }],
        [{ type: 'p', children: [{ text: 'Caption ' }] }, image('a.png')],
      ]),
    ]);
  });

  it('leaves fragments without images untouched', () => {
    const fragment: Descendant[] = [
      { type: 'p', children: [{ text: 'Text' }] },
    ];

    expect(helpers.liftPastedImages(fragment, isVoid)).toEqual(fragment);
  });
});

describe('replacePastedImages', () => {
  it('replaces the images at any depth, and drops the ones without a replacement', () => {
    const fragment: Descendant[] = [
      image('top.png'),
      { type: 'td', children: [image('cell.png')] },
      { type: 'td', children: [image('drop.png')] },
    ];

    expect(
      helpers.replacePastedImages(fragment, (node) =>
        node.src === 'drop.png'
          ? null
          : { type: 'img', url: node.src, children: [{ text: '' }] },
      ),
    ).toEqual([
      { type: 'img', url: 'top.png', children: [{ text: '' }] },
      {
        type: 'td',
        children: [{ type: 'img', url: 'cell.png', children: [{ text: '' }] }],
      },
      { type: 'td', children: [{ text: '' }] },
    ]);
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

const PNG_HEX = '89504e470d0a1a0a';
const PNG_DATA_URL = `data:image/png;base64,${btoa(
  String.fromCharCode(...PNG_HEX.match(/../g)!.map((h) => parseInt(h, 16))),
)}`;

/** An RTF picture as LibreOffice writes it. */
const libreOfficePicture = (name: string, hex = PNG_HEX) =>
  `{\\pict{\\*\\picprop{\\sp{\\sn wzDescription}{\\sv About ${name}}}` +
  `{\\sp{\\sn wzName}{\\sv ${name}}}}\\picscalex88\\picw1\\pich1\\pngblip\n` +
  `${hex.slice(0, 8)}\n${hex.slice(8)}}`;

const fileImage = (alt: string) =>
  `<img src="file:///tmp/lu1.tmp/${alt}.png" name="Picture" alt="${alt}"/>`;

describe('getRtfPictures', () => {
  it('reads the PNG pictures of LibreOffice RTF', () => {
    expect(
      helpers.getRtfPictures(`{\\rtf1 ${libreOfficePicture('One')}\\par}`),
    ).toEqual([{ dataUrl: PNG_DATA_URL, names: ['About One', 'One'] }]);
  });

  it("reads Word's pictures and skips its WMF fallbacks", () => {
    const rtf =
      `{\\rtf1{\\*\\shppict{\\pict{\\*\\picprop\\shplid1025{\\sp{\\sn shapeType}{\\sv 75}}}` +
      `\\pngblip\\bliptag-1{\\*\\blipuid 0123}${PNG_HEX}}}` +
      `{\\nonshppict{\\pict\\wmetafile8\\picw1 0102}}}`;

    expect(helpers.getRtfPictures(rtf)).toEqual([
      { dataUrl: PNG_DATA_URL, names: [] },
    ]);
  });
});

describe('embedRtfPictures', () => {
  it('points file images at the RTF picture with their name', () => {
    const rtf = libreOfficePicture('Two') + libreOfficePicture('One');
    const html = `<p>${fileImage('One')}</p><p>${fileImage('Two')}</p>`;

    expect(helpers.embedRtfPictures(html, rtf)).toBe(
      html
        .replace('file:///tmp/lu1.tmp/One.png', PNG_DATA_URL)
        .replace('file:///tmp/lu1.tmp/Two.png', PNG_DATA_URL),
    );
  });

  it('points unnamed file images at the RTF picture at their position', () => {
    const html = '<img src="file:///a.png"><img src="https://x.org/b.png">';

    expect(helpers.embedRtfPictures(html, libreOfficePicture('Other'))).toBe(
      `<img src="${PNG_DATA_URL}"><img src="https://x.org/b.png">`,
    );
  });

  it('leaves images without a matching picture alone', () => {
    const rtf = libreOfficePicture('One');
    const html = `${fileImage('Two')}${fileImage('Three')}`;

    expect(helpers.embedRtfPictures(html, rtf)).toBe(html);
    expect(helpers.embedRtfPictures(html, '')).toBe(html);
  });
});
