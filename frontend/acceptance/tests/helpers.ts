import type { Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

export type SlateNode = Record<string, unknown>;

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

export async function selectParagraphText(
  page: Page,
  { start, end }: { start: number; end: number },
) {
  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: start },
    focus: { path: [1, 0], offset: end },
  });
}
