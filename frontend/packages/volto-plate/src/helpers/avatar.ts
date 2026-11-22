// Initials avatar helpers: the same user id always gets the same color
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

// Hash the whole key (a user id) into one of the tones, so the same id
// always gets the same color and different ids are spread over the palette.
export function avatarTone(key: string): number {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return hash % AVATAR_TONE_COUNT;
}

export function avatarToneClass(key: string): string {
  return `avatar-tone-${avatarTone(key)}`;
}
