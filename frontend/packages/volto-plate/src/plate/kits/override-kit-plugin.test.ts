import { describe, expect, it, vi } from 'vitest';

import { overrideKitPlugin } from './override-kit-plugin';

describe('overrideKitPlugin', () => {
  it('patches only the matching plugin and preserves existing options', () => {
    const configureParagraph = vi.fn((config) => ({
      key: 'p',
      options: config.options,
      configure: configureParagraph,
    }));
    const configureHeading = vi.fn((config) => ({
      key: 'h1',
      options: config.options,
      configure: configureHeading,
    }));
    const paragraphPlugin = {
      key: 'p',
      options: {
        blockWidth: { defaultWidth: 'narrow' },
        existing: true,
      },
      configure: configureParagraph,
    };
    const headingPlugin = {
      key: 'h1',
      options: {
        existing: true,
      },
      configure: configureHeading,
    };

    const nextKit = overrideKitPlugin([paragraphPlugin, headingPlugin], 'p', {
      options: {
        blockWidth: { defaultWidth: 'default', widths: ['default'] },
      },
    });

    expect(configureParagraph).toHaveBeenCalledWith({
      options: {
        blockWidth: { defaultWidth: 'default', widths: ['default'] },
        existing: true,
      },
    });
    expect(configureHeading).not.toHaveBeenCalled();
    expect(nextKit[1]).toBe(headingPlugin);
    expect(nextKit[0].options).toEqual({
      blockWidth: { defaultWidth: 'default', widths: ['default'] },
      existing: true,
    });
  });

  it('returns the original kit unchanged when no plugin matches the key', () => {
    const configureParagraph = vi.fn();
    const paragraphPlugin = {
      key: 'p',
      options: { existing: true },
      configure: configureParagraph,
    };
    const kit = [paragraphPlugin];

    const nextKit = overrideKitPlugin(kit, 'h1', {
      options: {
        blockWidth: { defaultWidth: 'default' },
      },
    });

    expect(nextKit).toEqual(kit);
    expect(configureParagraph).not.toHaveBeenCalled();
  });
});
