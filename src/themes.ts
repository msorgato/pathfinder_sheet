export type ThemeId = 'sigil' | 'astral' | 'blood';

export interface ThemeDef {
  id: ThemeId;
  label: string;
  swatch1: string;
  swatch2: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'sigil',  label: 'Sigillo', swatch1: '#1a1535', swatch2: '#d4a574' },
  { id: 'astral', label: 'Astrale', swatch1: '#181336', swatch2: '#c4b5fd' },
  { id: 'blood',  label: 'Sangue',  swatch1: '#2a1212', swatch2: '#e8c87a' },
];

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  fantasy:  'sigil',
  eva01:    'sigil',
  cyberpunk:'sigil',
  persona5: 'sigil',
};

export function migrateThemeId(raw: string): ThemeId {
  if (raw === 'sigil' || raw === 'astral' || raw === 'blood') return raw;
  return LEGACY_THEME_MAP[raw] ?? 'sigil';
}
