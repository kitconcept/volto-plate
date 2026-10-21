import { describe, expect, it, vi } from 'vitest';
import type { Descendant } from 'platejs';

vi.mock('./volto-title', () => ({ setTitleBlockText: vi.fn() }));

const { getRtfDocumentTitle, takePastedTitle } = await import(
  './volto-paste-title'
);

const block = (type: string, text: string): Descendant => ({
  type,
  children: [{ text }],
});

describe('takePastedTitle', () => {
  it('takes the first H1 as the title and turns the others into H2s', () => {
    expect(
      takePastedTitle([
        block('p', 'Intro'),
        block('h1', '  The   title '),
        block('p', 'Body'),
        block('h1', 'Second H1'),
        { type: 'td', children: [block('h1', 'Nested H1')] },
      ]),
    ).toEqual({
      title: 'The title',
      fragment: [
        block('p', 'Intro'),
        block('p', 'Body'),
        block('h2', 'Second H1'),
        { type: 'td', children: [block('h2', 'Nested H1')] },
      ],
    });
  });

  it('skips empty H1s and nested ones', () => {
    expect(
      takePastedTitle([
        { type: 'td', children: [block('h1', 'Nested H1')] },
        block('h1', ' '),
        block('h1', 'The title'),
      ]),
    ).toEqual({
      title: 'The title',
      fragment: [
        { type: 'td', children: [block('h2', 'Nested H1')] },
        block('h2', ' '),
      ],
    });
  });

  it('leaves fragments without H1 alone', () => {
    const fragment = [block('h2', 'Heading'), block('p', 'Body')];

    expect(takePastedTitle(fragment)).toEqual({ title: null, fragment });
  });
});

describe('takePastedTitle with the document title', () => {
  it('takes the block with the document title and turns every H1 into an H2', () => {
    expect(
      takePastedTitle(
        [
          block('p', 'Document  title'),
          block('p', 'Intro'),
          block('h1', 'First section'),
        ],
        'Document title',
      ),
    ).toEqual({
      title: 'Document title',
      fragment: [block('p', 'Intro'), block('h2', 'First section')],
    });
  });

  it('falls back to the first H1 when no block has the document title', () => {
    expect(
      takePastedTitle(
        [block('p', 'Intro'), block('h1', 'First section')],
        'Not pasted',
      ),
    ).toEqual({ title: 'First section', fragment: [block('p', 'Intro')] });
  });
});

describe('getRtfDocumentTitle', () => {
  it('reads the Title paragraph of LibreOffice RTF', () => {
    const rtf = String.raw`{\rtf1\ansi{\fonttbl{\f0 Calibri;}}
{\stylesheet{\s0\snext0 Normal;}{\s77\sbasedon87\snext0\i Subtitle;}{\s78\sbasedon87\snext0\b\fs54 Title;}}
\pard\plain \s78\sl240\qc{
Document title with a{\*\bkmkstart x} caf\'e9 and \u8364\'80 sign}
\par \pard\plain \s77 A subtitle\par \pard\plain \s0 Body\par}`;

    expect(getRtfDocumentTitle(rtf)).toBe(
      'Document title with a café and € sign',
    );
  });

  it('reads the Title paragraph of Word RTF', () => {
    const rtf = String.raw`{\rtf1{\stylesheet{\ql \snext0 Normal;}{\s15\ql \sbasedon0 \snext0 \slink16 \sqformat \spriority10 \fs56 Title;}}
\pard\plain \ltrpar\s15\ql {\rtlch\fcs1 \af0 \ltrch\fcs0 \insrsid1 Word }{\b Title}\par
\pard\plain \s0 Body\par}`;

    expect(getRtfDocumentTitle(rtf)).toBe('Word Title');
  });

  it('is null without a Title paragraph', () => {
    expect(
      getRtfDocumentTitle(
        String.raw`{\rtf1{\stylesheet{\s0 Normal;}{\s78 Title;}}\pard\s0 Body\par}`,
      ),
    ).toBeNull();
    expect(getRtfDocumentTitle(String.raw`{\rtf1\pard Body\par}`)).toBeNull();
  });
});
