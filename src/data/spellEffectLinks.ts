/**
 * Links a spell of the database to an effect preset (data/effectPresets).
 * Curated by hand: spell ids do not match preset ids. "Ira" is intentionally not linked: the
 * spell differs from the barbarian rage modelled by the preset.
 */
export const SPELL_EFFECT_LINKS: Record<string, string> = {
  benedizione: 'benedizione',
  anatema: 'anatema',
  lentezza: 'lentezza',
  scudo: 'scudo',
  velocita: 'velocita',
  ingrandire_persone: 'ingrandire-persona',
  ridurre_persone: 'ridurre-persona',
  forza_del_toro: 'forza-del-toro',
  grazia_del_gatto: 'grazia-del-gatto',
  resistenza_dell_orso: 'resistenza-dell-orso',
  astuzia_della_volpe: 'astuzia-della-volpe',
  saggezza_del_gufo: 'saggezza-del-gufo',
  splendore_dell_aquila: 'splendore-dell-aquila',
  armatura_magica: 'armatura-magica',
  scudo_della_fede: 'scudo-della-fede',
  pelle_coriacea: 'pelle-coriacea',
  resistenza: 'resistenza',
  eroismo: 'eroismo',
  preghiera: 'preghiera-alleati',
};
