export type ThemeId = 'fantasy' | 'eva01' | 'cyberpunk';

export interface ThemeDef {
  id: ThemeId;
  label: string;
  swatch1: string;
  swatch2: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'fantasy',   label: 'Fantasy',   swatch1: '#6b4226', swatch2: '#c8a443' },
  { id: 'eva01',     label: 'EVA-01',    swatch1: '#3d0080', swatch2: '#39ff14' },
  { id: 'cyberpunk', label: 'Cyberpunk', swatch1: '#0a2040', swatch2: '#00ffff' },
];
