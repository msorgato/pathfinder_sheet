import { useState } from 'react';
import type { Character } from '../../types';
import { useCharacterStore } from '../../store/characterStore';
import { getRace } from '../../data/races';
import { AbilityPanel } from './AbilityPanel';
import { CombatStats, HitPointsPanel } from './CombatStats';
import { SkillsPanel } from './SkillsPanel';
import { SpellsPanel } from './SpellsPanel';
import { FeaturesPanel } from './FeaturesPanel';
import { AttacksPanel } from './AttacksPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { ConsumablesSection } from './ConsumablesSection';
import { StatusPanel } from './StatusPanel';
import type { RollRequest } from './DiceRoller';

export type SheetTab = 'overview' | 'equipment' | 'skills' | 'spells' | 'features' | 'notes';
export type SheetLayout = 'mobile' | 'desktop';

const TABS: { id: SheetTab; label: string; short?: string }[] = [
  { id: 'overview',  label: 'Combattimento' },
  { id: 'equipment', label: 'Equipaggiamento', short: 'Equip' },
  { id: 'skills',    label: 'Abilità' },
  { id: 'spells',    label: 'Incantesimi' },
  { id: 'features',  label: 'Capacità' },
  { id: 'notes',     label: 'Note' },
];

interface Props {
  char: Character;
  tab: SheetTab;
  onTabChange: (tab: SheetTab) => void;
  layout: SheetLayout;
  onQuickRoll: (req: RollRequest) => void;
}

function TabBar({ tab, onTabChange, className }: { tab: SheetTab; onTabChange: (t: SheetTab) => void; className?: string }) {
  return (
    <div
      className={className}
      style={className ? undefined : {
        display: 'flex',
        borderBottom: '1px solid var(--line-soft)',
        background: 'var(--bg-elev)',
        overflowX: 'auto',
      }}
    >
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          style={{
            fontFamily: 'var(--font-rune)',
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '12px 20px',
            border: 'none',
            borderBottom: `2px solid ${tab === t.id ? 'var(--gold)' : 'transparent'}`,
            background: 'transparent',
            color: tab === t.id ? 'var(--gold)' : 'var(--ink-mute)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          {t.short
            ? <><span className="tab-label-long">{t.label}</span><span className="tab-label-short">{t.short}</span></>
            : t.label}
        </button>
      ))}
    </div>
  );
}

function NotesTab({ char }: { char: Character }) {
  const { updateCharacter } = useCharacterStore();
  const [editingNotes, setEditingNotes] = useState(false);
  const race = getRace(char.race);

  return (
    <div className="sheet-cols">
      <div className="sheet-col">
        <div className="pf-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="label-rune">Note</div>
            <button
              className="pf-btn pf-btn-outline text-xs px-3 py-1"
              onClick={() => setEditingNotes(e => !e)}
            >
              {editingNotes ? 'Salva' : 'Modifica'}
            </button>
          </div>
          {editingNotes ? (
            <textarea
              className="pf-input resize-none w-full"
              rows={8}
              value={char.notes}
              onChange={e => updateCharacter(char.id, { notes: e.target.value })}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink-soft)' }}>
              {char.notes || 'Nessuna nota.'}
            </p>
          )}
        </div>
      </div>

      <div className="sheet-col">
        {/* Character details */}
        <div className="pf-panel p-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ['Razza', race?.name ?? char.race],
            ['Allineamento', char.alignment],
            ['Divinità', char.deity ?? '—'],
            ['Giocatore', char.playerName ?? '—'],
            ['Genere', char.gender ?? '—'],
            ['Età', char.age ? String(char.age) : '—'],
            ['Altezza', char.height ?? '—'],
            ['Peso', char.weight ?? '—'],
            ['Capelli', char.hair ?? '—'],
            ['Occhi', char.eyes ?? '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="label-rune-soft" style={{ display: 'inline', marginRight: 6 }}>{label}</span>
              <span style={{ color: 'var(--ink-soft)' }}>{value}</span>
            </div>
          ))}
        </div>

        {char.background && (
          <div className="pf-panel p-4">
            <div className="label-rune" style={{ marginBottom: 8 }}>Background</div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink-soft)' }}>{char.background}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabContent({ char, tab, layout, onQuickRoll }: Omit<Props, 'onTabChange'>) {
  if (tab === 'overview') {
    if (layout === 'desktop') {
      // Characteristics, hit points and combat stats live in the sidebar
      return (
        <div className="sheet-cols">
          <div className="sheet-col">
            <AttacksPanel char={char} onQuickRoll={onQuickRoll} />
          </div>
          <div className="sheet-col">
            <StatusPanel char={char} />
            <ConsumablesSection char={char} />
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <AbilityPanel char={char} onQuickRoll={onQuickRoll} />
        <HitPointsPanel char={char} />
        <StatusPanel char={char} />
        <CombatStats char={char} onQuickRoll={onQuickRoll} />
        <AttacksPanel char={char} onQuickRoll={onQuickRoll} />
        <ConsumablesSection char={char} />
      </div>
    );
  }
  if (tab === 'equipment') return <EquipmentPanel char={char} />;
  if (tab === 'skills') return <SkillsPanel char={char} onQuickRoll={onQuickRoll} />;
  if (tab === 'spells') return <SpellsPanel char={char} />;
  if (tab === 'features') return <FeaturesPanel char={char} />;
  return <NotesTab char={char} />;
}

/** Tab bar + active tab, arranged for mobile (single column) or desktop (sidebar + main). */
export function SheetBody({ char, tab, onTabChange, layout, onQuickRoll }: Props) {
  if (layout === 'desktop') {
    return (
      <div className="sheet-desktop flex-1">
        <aside className="sheet-sidebar" aria-label="Statistiche principali">
          <AbilityPanel char={char} onQuickRoll={onQuickRoll} />
          <HitPointsPanel char={char} />
          <CombatStats char={char} onQuickRoll={onQuickRoll} />
        </aside>
        <main className="sheet-main">
          <TabBar className="sheet-tabs" tab={tab} onTabChange={onTabChange} />
          <TabContent char={char} tab={tab} layout={layout} onQuickRoll={onQuickRoll} />
        </main>
      </div>
    );
  }
  return (
    <>
      <TabBar tab={tab} onTabChange={onTabChange} />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        <TabContent char={char} tab={tab} layout={layout} onQuickRoll={onQuickRoll} />
      </div>
    </>
  );
}
