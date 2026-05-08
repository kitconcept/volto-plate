import type { Locator, Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

export function getEditor(page: Page): Locator {
  return page.locator('.slate-editor[data-slate-editor]');
}

export async function selectTextInEditor(
  page: Page,
  anchorPath: number[],
  anchorOffset: number,
  focusPath: number[],
  focusOffset: number,
) {
  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  await setSelection(page, editorHandle, {
    anchor: { path: anchorPath, offset: anchorOffset },
    focus: { path: focusPath, offset: focusOffset },
  });
}

export type SlateNode = Record<string, unknown>;

/**
 * Builds a somersault block bodyModifier with the given slate value nodes.
 * Title node is always prepended from body.title.
 */
export function makeSomersaultBody(extraNodes: SlateNode[]) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';
    return {
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            ...extraNodes,
          ],
        },
      },
    };
  };
}
