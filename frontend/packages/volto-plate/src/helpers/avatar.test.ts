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
  it('gives the same tone to the same id', () => {
    expect(avatarTone('max.mustermann')).toBe(avatarTone('max.mustermann'));
  });

  it('can tell apart ids that share initials', () => {
    expect(getInitials('admin')).toBe(getInitials('alok'));
    expect(avatarTone('admin')).not.toBe(avatarTone('alok'));
  });

  it('stays within the palette', () => {
    for (const key of ['', 'a', 'admin', 'max.mustermann', 'jürgen', '?']) {
      const tone = avatarTone(key);
      expect(tone).toBeGreaterThanOrEqual(0);
      expect(tone).toBeLessThan(AVATAR_TONE_COUNT);
    }
  });

  it('builds the utility class name', () => {
    expect(avatarToneClass('admin')).toBe(`avatar-tone-${avatarTone('admin')}`);
  });
});
