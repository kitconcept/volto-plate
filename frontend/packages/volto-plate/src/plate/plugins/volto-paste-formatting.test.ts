import { describe, expect, it } from 'vitest';
import type { Descendant } from 'platejs';

import { stripPastedFormatting } from './volto-paste-formatting';

describe('stripPastedFormatting', () => {
  it('drops the text styles and keeps the marks', () => {
    expect(
      stripPastedFormatting([
        {
          type: 'p',
          children: [
            {
              text: 'Styled',
              bold: true,
              italic: true,
              underline: true,
              color: 'rgb(0, 0, 0)',
              backgroundColor: 'rgb(255, 241, 230)',
              fontFamily: 'Arial, serif',
              fontSize: '11pt',
            },
          ],
        },
      ]),
    ).toEqual([
      {
        type: 'p',
        children: [
          { text: 'Styled', bold: true, italic: true, underline: true },
        ],
      },
    ]);
  });

  it('drops the block styles and keeps the structure', () => {
    const fragment: Descendant[] = [
      {
        type: 'h2',
        align: 'left',
        lineHeight: '108%',
        children: [{ text: 'Heading' }],
      },
      { type: 'p', indent: 2, textIndent: 1, children: [{ text: 'Margin' }] },
      {
        type: 'p',
        indent: 2,
        listStyleType: 'decimal',
        listStart: 3,
        align: 'center',
        children: [
          { type: 'a', url: 'https://plone.org', children: [{ text: 'Link' }] },
        ],
      },
    ];

    expect(stripPastedFormatting(fragment)).toEqual([
      { type: 'h2', children: [{ text: 'Heading' }] },
      { type: 'p', children: [{ text: 'Margin' }] },
      {
        type: 'p',
        indent: 2,
        listStyleType: 'decimal',
        listStart: 3,
        children: [
          { type: 'a', url: 'https://plone.org', children: [{ text: 'Link' }] },
        ],
      },
    ]);
  });

  it('drops the table looks and keeps its cells', () => {
    expect(
      stripPastedFormatting([
        {
          type: 'table',
          colSizes: [120, 80],
          marginLeft: 10,
          children: [
            {
              type: 'tr',
              size: 40,
              children: [
                {
                  type: 'td',
                  colSpan: 2,
                  background: 'rgb(30, 58, 95)',
                  borders: { top: { size: 1 } },
                  children: [{ type: 'p', children: [{ text: 'Cell' }] }],
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual([
      {
        type: 'table',
        children: [
          {
            type: 'tr',
            children: [
              {
                type: 'td',
                colSpan: 2,
                children: [{ type: 'p', children: [{ text: 'Cell' }] }],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('keeps the properties of image blocks', () => {
    const image = {
      type: 'ploneBlock',
      '@type': 'plateimage',
      align: 'center',
      size: 'l',
      url: '/image.png',
      children: [{ text: '' }],
    };

    expect(stripPastedFormatting([image])).toEqual([image]);
  });
});
