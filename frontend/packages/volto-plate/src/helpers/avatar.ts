// Initials avatar helpers: the same initials always get the same color
// from a fixed palette (see .avatar-tone-N in theme/_person-pill.scss).

export const AVATAR_TONE_COUNT = 6;

// "Max Mustermann" -> "MM", "Marketing" -> "M", "max.mustermann" -> "MM"
export function getInitials(name?: string | null): string {
  const words = (name ?? '').split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return '?';

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Add up the letter codes, weighting each by its position so that
// "AB" and "BA" can get different colors, then pick one of the tones.
export function avatarTone(initials: string): number {
  let sum = 0;
  for (let i = 0; i < initials.length; i += 1) {
    sum += initials.charCodeAt(i) * (i + 1);
  }
  return sum % AVATAR_TONE_COUNT;
}

export function avatarToneClass(initials: string): string {
  return `avatar-tone-${avatarTone(initials)}`;
}
