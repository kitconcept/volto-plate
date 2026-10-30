import { describe, expect, it } from 'vitest';
import {
  elementSummary,
  getDocumentDocs,
  getElements,
  isPlateContentType,
  nodeKindLine,
  plateBlocksToMarkdown,
  plateContentTypesNote,
  type BlockDocsFile,
} from './blocksSchema';

const docsFiles: BlockDocsFile[] = [
  {
    block: '__somersault__',
    markdown: '---\nblock: __somersault__\n---\n\nA page stores a document.',
  },
  {
    block: 'teaser',
    markdown: '---\nblock: teaser\n---\n\nShows a card.',
  },
  {
    element: 'callout',
    title: 'Callout',
    markdown:
      '---\nelement: callout\ntitle: Callout\n---\n\nA highlighted box.\n\nWidths: {{widths}}.',
  },
  {
    element: 'toggle',
    title: 'Toggle',
    markdown: '---\nelement: toggle\ntitle: Toggle\n---\n\nA collapsible.',
  },
  {
    element: 'h2',
    markdown: '---\nelement: h2, h3\n---\n\nA heading.',
  },
];

describe('isPlateContentType', () => {
  it('is true for the configured content types', () => {
    expect(isPlateContentType('WikiPage', ['WikiPage'])).toBe(true);
  });

  it('is false for other content types, or none', () => {
    expect(isPlateContentType('Document', ['WikiPage'])).toBe(false);
    expect(isPlateContentType(undefined, ['WikiPage'])).toBe(false);
    expect(isPlateContentType('WikiPage', undefined)).toBe(false);
  });
});

describe('getDocumentDocs', () => {
  it('returns the docs of the page document, without the frontmatter', () => {
    expect(getDocumentDocs(docsFiles)).toBe('A page stores a document.');
  });

  it('is empty without them', () => {
    expect(getDocumentDocs([])).toBe('');
  });
});

describe('getElements', () => {
  it('only returns the elements in plateBlocksConfig', () => {
    const elements = getElements(docsFiles, { callout: {}, h2: {} });
    expect(elements.map((element) => element.id)).toEqual(['callout', 'h2']);
  });

  it('fills the placeholders from plateBlocksConfig', () => {
    const [callout] = getElements(docsFiles, {
      callout: { widths: ['default', 'wide'] },
    });
    expect(callout).toEqual({
      id: 'callout',
      title: 'Callout',
      kind: 'element',
      docs: 'A highlighted box.\n\nWidths: `default`, `wide`.',
    });
  });

  it('uses the ID as title when the docs have none', () => {
    const [heading] = getElements(docsFiles, { h2: {} });
    expect(heading.title).toBe('h2');
  });
});

describe('elementSummary', () => {
  it('has the first paragraph of the docs as description', () => {
    const [callout] = getElements(docsFiles, { callout: {} });
    expect(
      elementSummary(callout, 'http://localhost/@blocks-schema/callout'),
    ).toEqual({
      '@id': 'http://localhost/@blocks-schema/callout',
      id: 'callout',
      title: 'Callout',
      kind: 'element',
      description: 'A highlighted box.',
    });
  });
});

describe('nodeKindLine', () => {
  it('describes an element node', () => {
    expect(nodeKindLine({ id: 'p', title: 'Paragraph', kind: 'element' })).toBe(
      '_An element of the document: a node with `"type": "p"`._',
    );
  });

  it('describes a Plone block node', () => {
    expect(
      nodeKindLine({ id: 'plateimage', title: 'Image', kind: 'block' }),
    ).toBe(
      '_A Plone block: a `ploneBlock` node with `"@type": "plateimage"`._',
    );
  });
});

describe('plateBlocksToMarkdown', () => {
  it('lists the document format, the elements and the blocks', () => {
    const markdown = plateBlocksToMarkdown(
      [
        {
          '@id': 'http://localhost/@blocks-schema/p',
          id: 'p',
          title: 'Paragraph',
          kind: 'element',
          description: 'A paragraph.',
        },
        {
          '@id': 'http://localhost/@blocks-schema/plateimage',
          id: 'plateimage',
          title: 'Image',
          kind: 'block',
        },
      ],
      'A page stores a document.',
    );
    expect(markdown).toContain(
      '## Document format\n\nA page stores a document.',
    );
    expect(markdown).toContain(
      '## Elements\n\n- [Paragraph](http://localhost/@blocks-schema/p) (`p`): A paragraph.',
    );
    expect(markdown).toContain(
      '## Blocks\n\n- [Image](http://localhost/@blocks-schema/plateimage) (`plateimage`)',
    );
    expect(markdown).not.toContain('blocks_layout');
  });
});

describe('plateContentTypesNote', () => {
  it('names the Plate content types', () => {
    const note = plateContentTypesNote(['WikiPage']);
    expect(note).toContain('`WikiPage`');
    expect(note).toContain('/@blocks-schema?type=<type>');
  });

  it('is empty without them', () => {
    expect(plateContentTypesNote([])).toBe('');
  });
});
