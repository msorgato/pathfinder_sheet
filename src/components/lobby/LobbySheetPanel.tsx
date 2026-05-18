import { useState } from 'react';
import type { Character, RollResultData } from '../../types';
import { AbilityPanel } from '../sheet/AbilityPanel';
import { CombatStats } from '../sheet/CombatStats';
import { SkillsPanel } from '../sheet/SkillsPanel';
import { AttacksPanel } from '../sheet/AttacksPanel';
import { DiceRoller } from '../sheet/DiceRoller';
import type { RollRequest } from '../sheet/DiceRoller';

interface Props {
  character: Character | null;
  loading?: boolean;
  onRollResult: (result: RollResultData) => void;
}

type SheetTab = 'abilities' | 'combat' | 'skills' | 'attacks';

export function LobbySheetPanel({ character, loading, onRollResult }: Props) {
  const [pendingRoll, setPendingRoll] = useState<RollRequest | undefined>();
  const [diceOpen, setDiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetTab>('abilities');

  const handleQuickRoll = (req: RollRequest) => {
    setPendingRoll(req);
    setDiceOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center gap-3">
        <div className="anim-spin text-3xl" style={{ color: 'var(--theme-accent)' }}>✦</div>
        <p className="text-sm" style={{ color: 'var(--theme-text-faint)' }}>Caricamento scheda…</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center gap-2 px-4">
        <p className="text-sm text-center" style={{ color: 'var(--theme-text-faint)' }}>
          Seleziona un personaggio per vedere la scheda.
        </p>
      </div>
    );
  }

  const tabs: { id: SheetTab; label: string }[] = [
    { id: 'abilities', label: 'Caratteristiche' },
    { id: 'combat',    label: 'Combattimento' },
    { id: 'skills',    label: 'Abilità' },
    { id: 'attacks',   label: 'Attacchi' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      {/* Character name header */}
      <div
        className="px-3 py-2 shrink-0 border-b"
        style={{ borderColor: 'var(--theme-ghost-border)' }}
      >
        <p className="text-sm font-bold truncate" style={{ color: 'var(--theme-accent)' }}>
          {character.name || '(senza nome)'}
        </p>
        <p className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
          {character.race}{character.classes.length > 0 ? ` · ${character.classes.map(c => c.classId).join('/')}` : ''}
        </p>
      </div>

      {/* Tab nav */}
      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: 'var(--theme-ghost-border)' }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            className="flex-1 py-1.5 text-xs font-semibold transition-colors"
            style={{
              color: activeTab === t.id ? 'var(--theme-accent)' : 'var(--theme-text-faint)',
              borderBottom: activeTab === t.id ? '2px solid var(--theme-accent)' : '2px solid transparent',
              background: 'transparent',
            }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3">
        {activeTab === 'abilities' && <AbilityPanel  char={character} onQuickRoll={handleQuickRoll} />}
        {activeTab === 'combat'    && <CombatStats   char={character} onQuickRoll={handleQuickRoll} />}
        {activeTab === 'skills'    && <SkillsPanel   char={character} onQuickRoll={handleQuickRoll} />}
        {activeTab === 'attacks'   && <AttacksPanel  char={character} onQuickRoll={handleQuickRoll} />}
      </div>

      {/* DiceRoller floating over the panel */}
      <DiceRoller
        open={diceOpen}
        onClose={() => setDiceOpen(false)}
        pendingRoll={pendingRoll}
        onPendingHandled={() => setPendingRoll(undefined)}
        characterName={character.name}
        onRollResult={onRollResult}
      />
    </div>
  );
}
