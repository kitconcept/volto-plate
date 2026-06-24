import { describe, expect, it } from 'vitest';

function hasDroppedImageFiles(dataTransfer?: DataTransfer | null) {
  if (!dataTransfer) return false;

  return Array.from(dataTransfer.files ?? []).some((file) =>
    file.type.startsWith('image/'),
  );
}

describe('volto image drop helpers', () => {
  it('detects dropped image files', () => {
    expect(
      hasDroppedImageFiles({
        files: [new File(['fake'], 'drop.png', { type: 'image/png' })],
      } as unknown as DataTransfer),
    ).toBe(true);
  });

  it('ignores non-image drops', () => {
    expect(
      hasDroppedImageFiles({
        files: [new File(['fake'], 'drop.txt', { type: 'text/plain' })],
      } as unknown as DataTransfer),
    ).toBe(false);
  });
});
