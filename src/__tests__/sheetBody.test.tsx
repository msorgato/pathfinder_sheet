import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

vi.mock('../lib/firebase', () => ({ auth: { currentUser: null }, db: {} }));
const { mockSpells } = vi.hoisted(() => ({ mockSpells: [] as unknown[] }));
vi.mock('../store/dataStore', async importActual => ({
  ...(await importActual<typeof import('../store/dataStore')>()),
  useMergedSpells: () => mockSpells,
}));
vi.mock('../lib/firestoreSync', () => ({ saveCharacter: vi.fn(), deleteCharacterDoc: vi.fn(), loadCharacters: vi.fn() }));

import type { Character } from '../types';
import { SKILLS } from '../data/skills';
import { SheetBody } from '../components/sheet/SheetBody';
import type { SheetLayout, SheetTab } from '../components/sheet/SheetBody';

const char = {
  id: 'c1', name: 'Valeros', race: 'human', racialAbilityBonus: { str: 2 }, alignment: 'NG',
  baseAbilityScores: { str: 14, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, abilityIncreases: [],
  classes: [{ classId: 'fighter', level: 5, favoredClassBonus: [] }], totalLevel: 5,
  hitPointsRolled: [10, 6, 7, 5, 8], currentHp: 40, tempHp: 0, nonLethalDamage: 0,
  skills: [{ skillId: 'climb', ranks: 3, misc: 0 }], feats: [], traits: [],
  knownSpells: [], preparedSpells: [], spellSlots: [],
  weaponAttacks: [{ id: 'w', name: 'Spada lunga', damageDiceCount: 1, damageDieType: 8, abilityKey: 'str', attackType: 'melee' }],
  equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: 'Appunti', background: 'Storia',
  conditions: [], effects: [],
} as unknown as Character;

const render = (layout: SheetLayout, tab: SheetTab = 'overview') =>
  renderToString(<SheetBody char={char} tab={tab} onTabChange={() => {}} layout={layout} onQuickRoll={() => {}} />);

const count = (html: string, text: string) => html.split(text).length - 1;

describe('SheetBody', () => {
  it('mobile: combat tab stacks the panels in the original order', () => {
    const html = render('mobile');
    expect(html).not.toContain('sheet-desktop');
    const order = ['Caratteristiche', 'Punti Ferita', 'Condizioni ed effetti', 'Colto di sorpresa', 'Spada lunga']
      .map(t => html.indexOf(t));
    expect(order.every(i => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('desktop: core stats are in the sidebar and not repeated in the combat tab', () => {
    const html = render('desktop');
    expect(html).toContain('sheet-desktop');
    expect(count(html, 'Caratteristiche')).toBe(1);
    const sidebarEnd = html.indexOf('</aside>');
    expect(html.indexOf('Caratteristiche')).toBeLessThan(sidebarEnd);
    expect(html.indexOf('Colto di sorpresa')).toBeLessThan(sidebarEnd);
  });

  it('desktop: combat tab shows attacks and status in main columns', () => {
    const html = render('desktop');
    const main = html.slice(html.indexOf('<main'));
    expect(main).toContain('sheet-cols');
    expect(main).toContain('Spada lunga');
    expect(main).toContain('Condizioni ed effetti');
    expect(main.indexOf('Spada lunga')).toBeLessThan(main.indexOf('Condizioni ed effetti'));
  });

  it('desktop: the tab bar sits in the main area', () => {
    const html = render('desktop');
    expect(html.indexOf('sheet-tabs')).toBeGreaterThan(html.indexOf('<main'));
  });

  it.each(['mobile', 'desktop'] as const)('%s: notes tab shows notes, details and background', layout => {
    const html = render(layout, 'notes');
    expect(html).toContain('Appunti');
    expect(html).toContain('Storia');
    expect(html).toContain('Allineamento');
  });

  it.each(['mobile', 'desktop'] as const)('%s: skills tab lists every skill exactly once', layout => {
    const html = render(layout, 'skills');
    for (const sk of SKILLS) expect(count(html, `>${sk.name}</span>`)).toBe(1);
    expect(count(html, 'sheet-second-header')).toBe(1);
  });

  it.each(['mobile', 'desktop'] as const)('%s: features tab shows the sub-tabs when the width is unknown', layout => {
    const html = render(layout, 'features');
    expect(html).toContain('Capacità di Classe');
    expect(html).toMatch(/Talenti \((<!-- -->)?0(<!-- -->)?\)/);
  });

  it.each(['mobile', 'desktop'] as const)('%s: equipment tab groups its content in two columns', layout => {
    const html = render(layout, 'equipment');
    expect(count(html, 'sheet-col sheet-col-tight')).toBe(2);
    expect(html.indexOf('Equipaggiamento indossato')).toBeLessThan(html.indexOf('Trasportati'));
    expect(html.indexOf('Trasportati')).toBeLessThan(html.indexOf('Monete'));
  });
});
