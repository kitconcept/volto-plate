import { describe, expect, it } from 'vitest';

import {
  AVATAR_TONE_COUNT,
  avatarTone,
  avatarToneClass,
  getInitials,
} from './avatar';

describe('getInitials', () => {
  it('uses the first letters of the first and last name', () => {
    expect(getInitials('Max Mustermann')).toBe('MM');
    expect(getInitials('  maria von der Leyen ')).toBe('ML');
  });

  it('uses a single letter for a single word', () => {
    expect(getInitials('Marketing')).toBe('M');
  });

  it('splits login ids on dots, dashes and underscores', () => {
    expect(getInitials('max.mustermann')).toBe('MM');
    expect(getInitials('max_mustermann')).toBe('MM');
    expect(getInitials('max-mustermann')).toBe('MM');
  });

  it('falls back to a question mark', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials(null)).toBe('?');
  });
});

describe('avatarTone', () => {
  it('gives the same tone to the same initials', () => {
    expect(avatarTone(getInitials('Max Mustermann'))).toBe(
      avatarTone(getInitials('Maria Müller')),
    );
  });

  it('depends on the order of the initials', () => {
    expect(avatarTone('AB')).not.toBe(avatarTone('BA'));
  });

  it('stays within the palette', () => {
    for (const initials of ['A', 'MM', 'ZZ', '?', 'ÄÖ']) {
      const tone = avatarTone(initials);
      expect(tone).toBeGreaterThanOrEqual(0);
      expect(tone).toBeLessThan(AVATAR_TONE_COUNT);
    }
  });

  it('builds the utility class name', () => {
    expect(avatarToneClass('MM')).toBe(`avatar-tone-${avatarTone('MM')}`);
  });
});
