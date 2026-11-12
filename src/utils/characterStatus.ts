import type { AbilityKey, AbilityScores, ActiveEffect, Character, NegativeLevels } from '../types';

/** Pure state transitions for conditions, effects, ability damage/drain and negative levels. */

const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const cleanNote = (note?: string) => (note?.trim() ? note.trim() : undefined);

export type StatusPatch = Pick<Partial<Character>, 'conditions' | 'effects' | 'abilityDamage' | 'abilityDrain' | 'negativeLevels'>;

/** Applies a condition; reapplying the same condition updates its note. */
export function applyCondition(char: Character, conditionId: string, note?: string): StatusPatch {
  const list = char.conditions ?? [];
  const existing = list.find(c => c.conditionId === conditionId);
  const entry = { id: existing?.id ?? newId(), conditionId, note: cleanNote(note) };
  return {
    conditions: existing ? list.map(c => (c.conditionId === conditionId ? entry : c)) : [...list, entry],
  };
}

export function removeCondition(char: Character, id: string): StatusPatch {
  return { conditions: (char.conditions ?? []).filter(c => c.id !== id) };
}

export type EffectInput = Omit<ActiveEffect, 'id'>;

function cleanEffect(input: EffectInput): EffectInput {
  return {
    ...input,
    name: input.name.trim() || 'Effetto',
    note: cleanNote(input.note),
    modifiers: input.modifiers.filter(m => Number.isFinite(m.value) && m.value !== 0).map(m => ({ ...m, value: Math.trunc(m.value) })),
  };
}

export function addEffect(char: Character, input: EffectInput): StatusPatch {
  return { effects: [...(char.effects ?? []), { ...cleanEffect(input), id: newId() }] };
}

export function updateEffect(char: Character, id: string, input: EffectInput): StatusPatch {
  return { effects: (char.effects ?? []).map(e => (e.id === id ? { ...cleanEffect(input), id } : e)) };
}

export function toggleEffect(char: Character, id: string): StatusPatch {
  return { effects: (char.effects ?? []).map(e => (e.id === id ? { ...e, disabled: !e.disabled } : e)) };
}

export function removeEffect(char: Character, id: string): StatusPatch {
  return { effects: (char.effects ?? []).filter(e => e.id !== id) };
}

const cleanScores = (scores: Partial<AbilityScores>): Partial<AbilityScores> => {
  const out: Partial<AbilityScores> = {};
  (Object.keys(scores) as AbilityKey[]).forEach(k => {
    const v = Math.max(0, Math.floor(scores[k] ?? 0));
    if (v > 0) out[k] = v;
  });
  return out;
};

export function setAbilityDamage(char: Character, ability: AbilityKey, value: number): StatusPatch {
  return { abilityDamage: cleanScores({ ...char.abilityDamage, [ability]: value }) };
}

export function setAbilityDrain(char: Character, ability: AbilityKey, value: number): StatusPatch {
  return { abilityDrain: cleanScores({ ...char.abilityDrain, [ability]: value }) };
}

export function setNegativeLevels(value: NegativeLevels): StatusPatch {
  return {
    negativeLevels: {
      temporary: Math.max(0, Math.floor(value.temporary)),
      permanent: Math.max(0, Math.floor(value.permanent)),
    },
  };
}

/** Full rest heals 1 point of ability damage per ability; drain is not healed. */
export function restAbilityDamage(char: Character): StatusPatch {
  const healed: Partial<AbilityScores> = {};
  (Object.keys(char.abilityDamage ?? {}) as AbilityKey[]).forEach(k => {
    healed[k] = (char.abilityDamage?.[k] ?? 0) - 1;
  });
  return { abilityDamage: cleanScores(healed) };
}
