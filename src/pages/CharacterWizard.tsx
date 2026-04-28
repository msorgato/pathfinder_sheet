import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AbilityScores, AbilityKey, Alignment, KnownSpell } from '../types';
import { useCharacterStore, emptyCharacter } from '../store/characterStore';
import { getClass } from '../data/classes';
import { Step1_Race } from '../components/wizard/Step1_Race';
import { Step2_Class } from '../components/wizard/Step2_Class';
import { Step3_Abilities } from '../components/wizard/Step3_Abilities';
import { Step4_Skills } from '../components/wizard/Step4_Skills';
import { Step5_Feats } from '../components/wizard/Step5_Feats';
import { Step6_Spells } from '../components/wizard/Step6_Spells';
import { Step7_Details } from '../components/wizard/Step7_Details';

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface WizardState {
  step: StepId;
  raceId: string;
  racialBonus: Partial<Record<AbilityKey, number>>;
  classId: string;
  abilityScores: AbilityScores;
  skillRanks: Record<string, number>;
  feats: string[];
  knownSpells: KnownSpell[];
  details: {
    name?: string;
    playerName?: string;
    alignment?: Alignment;
    deity?: string;
    gender?: string;
    age?: string;
    height?: string;
    weight?: string;
    hair?: string;
    eyes?: string;
    background?: string;
  };
}

const defaultState: WizardState = {
  step: 1,
  raceId: '',
  racialBonus: {},
  classId: '',
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  skillRanks: {},
  feats: [],
  knownSpells: [],
  details: {},
};

export function CharacterWizard() {
  const navigate = useNavigate();
  const { characters, setActive } = useCharacterStore();
  const commitWizardDraft = useCharacterStore(s => s.commitWizardDraft);
  const updateWizardDraft = useCharacterStore(s => s.updateWizardDraft);
  const setWizardDraft = useCharacterStore(s => s.setWizardDraft);

  const [state, setState] = useState<WizardState>(defaultState);

  const go = (step: StepId) => setState(s => ({ ...s, step }));

  const finish = () => {
    const cls = getClass(state.classId);
    const draft = {
      id: undefined,
      name: state.details.name ?? 'Senza nome',
      playerName: state.details.playerName,
      race: state.raceId,
      racialAbilityBonus: state.racialBonus,
      alignment: (state.details.alignment ?? 'TN') as Alignment,
      deity: state.details.deity,
      gender: state.details.gender,
      age: state.details.age ? Number(state.details.age) : undefined,
      height: state.details.height,
      weight: state.details.weight,
      hair: state.details.hair,
      eyes: state.details.eyes,
      background: state.details.background,
      baseAbilityScores: state.abilityScores,
      abilityIncreases: [],
      classes: [{ classId: state.classId, level: 1, favoredClassBonus: [] }],
      totalLevel: 1,
      hitPointsRolled: [cls?.hitDie ?? 6],
      skills: Object.entries(state.skillRanks)
        .filter(([, r]) => r > 0)
        .map(([skillId, ranks]) => ({ skillId, ranks, misc: 0 })),
      feats: state.feats,
      knownSpells: state.knownSpells,
      preparedSpells: [],
      spellSlots: [],
      equipment: [],
      copper: 0, silver: 0, gold: 0, platinum: 0,
      experience: 0,
      notes: '',
    };

    setWizardDraft(draft);
    const id = commitWizardDraft();
    if (id) {
      setActive(id);
      navigate(`/character/${id}`);
    }
  };

  const { step } = state;

  if (step === 1) {
    return (
      <Step1_Race
        selectedRaceId={state.raceId}
        selectableBonus={state.racialBonus}
        onSelect={(raceId, bonus) => setState(s => ({ ...s, raceId, racialBonus: bonus }))}
        onNext={() => go(2)}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2_Class
        selectedClassId={state.classId}
        onSelect={classId => setState(s => ({ ...s, classId }))}
        onNext={() => go(3)}
        onBack={() => go(1)}
      />
    );
  }

  if (step === 3) {
    return (
      <Step3_Abilities
        scores={state.abilityScores}
        onChange={scores => setState(s => ({ ...s, abilityScores: scores }))}
        onNext={() => go(4)}
        onBack={() => go(2)}
      />
    );
  }

  if (step === 4) {
    return (
      <Step4_Skills
        classId={state.classId}
        raceId={state.raceId}
        abilityScores={state.abilityScores}
        skillRanks={state.skillRanks}
        onChange={skillRanks => setState(s => ({ ...s, skillRanks }))}
        onNext={() => go(5)}
        onBack={() => go(3)}
      />
    );
  }

  if (step === 5) {
    return (
      <Step5_Feats
        raceId={state.raceId}
        selectedFeats={state.feats}
        onChange={feats => setState(s => ({ ...s, feats }))}
        onNext={() => go(6)}
        onBack={() => go(4)}
      />
    );
  }

  if (step === 6) {
    return (
      <Step6_Spells
        classId={state.classId}
        abilityScores={state.abilityScores}
        knownSpells={state.knownSpells}
        onChange={knownSpells => setState(s => ({ ...s, knownSpells }))}
        onNext={() => go(7)}
        onBack={() => go(5)}
      />
    );
  }

  return (
    <Step7_Details
      details={state.details}
      onChange={details => setState(s => ({ ...s, details }))}
      onFinish={finish}
      onBack={() => go(6)}
    />
  );
}
