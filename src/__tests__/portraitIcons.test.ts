import { describe, it, expect } from 'vitest';
import { resolvePortraitIcon, PORTRAIT_ICONS, CLASS_ICON_BY_CLASS_ID } from '../data/portraitIcons';

const cls = (classId: string) => [{ classId, level: 1 }] as never;

describe('resolvePortraitIcon', () => {
  it('uses the chosen icon', () => {
    expect(resolvePortraitIcon({ classes: cls('fighter'), portraitIcon: 'mago' })).toBe('mago');
  });

  it('ignores an unknown chosen icon and falls back to the class icon', () => {
    expect(resolvePortraitIcon({ classes: cls('fighter'), portraitIcon: 'drago' })).toBe('guerriero');
  });

  it('uses the primary class icon when none is chosen', () => {
    expect(resolvePortraitIcon({ classes: [...cls('rogue'), ...cls('wizard')] })).toBe('ladro');
  });

  it('returns undefined for a custom class without icon', () => {
    expect(resolvePortraitIcon({ classes: cls('custom_abc123') })).toBeUndefined();
  });

  it('returns undefined when the character has no class', () => {
    expect(resolvePortraitIcon({ classes: [] })).toBeUndefined();
  });

  it('maps every built-in class to an existing icon', () => {
    const ids = new Set(PORTRAIT_ICONS.map(i => i.id));
    for (const icon of Object.values(CLASS_ICON_BY_CLASS_ID)) expect(ids.has(icon)).toBe(true);
  });
});
