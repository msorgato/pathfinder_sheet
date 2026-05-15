export type ThemeId = 'sigil' | 'astral' | 'blood';

export interface PaletteDef {
  id: string;
  name: string;
  hex: string;
}

export const CHARACTER_PALETTES: PaletteDef[] = [
  { id: 'oro-antico',       name: 'Oro Antico',        hex: '#d4a574' },
  { id: 'ametista',         name: 'Ametista',          hex: '#c4b5fd' },
  { id: 'sangue-antico',    name: 'Sangue Antico',     hex: '#e8534a' },
  { id: 'verde-foresta',    name: 'Verde Foresta',     hex: '#4ade80' },
  { id: 'bianco-mithral',   name: 'Bianco Mithral',   hex: '#e2e8f0' },
  { id: 'azzurro-celeste',  name: 'Azzurro Celeste',  hex: '#60a5fa' },
  { id: 'ambra-solare',     name: 'Ambra Solare',     hex: '#fbbf24' },
  { id: 'rosa-del-tramonto',name: 'Rosa del Tramonto', hex: '#f472b6' },
  { id: 'ruggine-del-ferro',name: 'Ruggine del Ferro', hex: '#f97316' },
  { id: 'ombra-viola',      name: 'Ombra Viola',       hex: '#7c3aed' },
];

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
