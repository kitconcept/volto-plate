import { describe, expect, it } from 'vitest';

import { getPlainLines } from './volto-paste-plain-text';

describe('getPlainLines', () => {
  it('returns the lines of unformatted paragraphs', () => {
    expect(
      getPlainLines([{ type: 'p', children: [{ text: 'Hello' }] }]),
    ).toEqual(['Hello']);
    expect(getPlainLines([{ text: 'Hello' }])).toEqual(['Hello']);
    expect(
      getPlainLines([
        { type: 'p', children: [{ text: 'One\nTwo' }] },
        { type: 'p', children: [{ text: '' }] },
        { type: 'p', children: [{ text: 'Three' }] },
      ]),
    ).toEqual(['One', 'Two', 'Three']);
  });

  it('keeps the structure and formatting of the pasted content', () => {
    expect(
      getPlainLines([{ type: 'h2', children: [{ text: 'Heading' }] }]),
    ).toBeNull();
    expect(
      getPlainLines([{ type: 'p', children: [{ text: 'Bold', bold: true }] }]),
    ).toBeNull();
    expect(
      getPlainLines([
        { type: 'p', listStyleType: 'disc', children: [{ text: 'Item' }] },
      ]),
    ).toBeNull();
    expect(
      getPlainLines([
        { type: 'p', children: [{ text: 'Plain' }] },
        { type: 'h2', children: [{ text: 'Heading' }] },
      ]),
    ).toBeNull();
  });
});
