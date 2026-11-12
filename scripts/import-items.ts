/// <reference types="node" />
/**
 * Generates public/data/items.json (mundane item catalogue) from the
 * golarion.altervista.org wiki tables.
 *
 *   node scripts/import-items.ts            # uses scripts/.cache when present
 *   node scripts/import-items.ts --refresh  # re-downloads the pages
 *
 * Only game data (names, numbers) and a link to the source page are stored:
 * item descriptions are never copied. Manual fixes live in item-overrides.json.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ArmorCategory, ArmorStats, BodySlot, DamageType, Dice, ItemDefinition, ItemKind, WeaponGroup, WeaponHandedness, WeaponStats,
} from '../src/types/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
// Outside the source tree: Vite plugins scan project files and choke on raw wikitext.
const CACHE = join(ROOT, 'node_modules', '.cache', 'item-import');
const OUT = join(ROOT, 'public', 'data', 'items.json');
const OVERRIDES = join(HERE, 'item-overrides.json');
const WIKI = 'https://golarion.altervista.org';
const API = `${WIKI}/api.php`;
const REFRESH = process.argv.includes('--refresh');
const REQUEST_DELAY_MS = 1000;

// ── Fetching (rate limited, cached) ─────────────────────────────────────────

let lastRequest = 0;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function wikitext(page: string): Promise<string> {
  const file = join(CACHE, `${page.replace(/[^\p{L}\p{N}_-]/gu, '_')}.wikitext`);
  if (!REFRESH && existsSync(file)) return readFileSync(file, 'utf-8');
  const wait = lastRequest + REQUEST_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  const url = `${API}?action=parse&prop=wikitext&format=json&formatversion=2&page=${encodeURIComponent(page)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'pathfinder-sheet-item-import/1.0' } });
  if (!res.ok) throw new Error(`${page}: HTTP ${res.status}`);
  const json = await res.json() as { parse?: { wikitext: string }; error?: { info: string } };
  if (!json.parse) throw new Error(`${page}: ${json.error?.info ?? 'no content'}`);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, json.parse.wikitext, 'utf-8');
  return json.parse.wikitext;
}

/**
 * The magic item database is a page that transcludes about ninety tables
 * (`{{:Tabella ...}}`): one `expandtemplates` request returns them all.
 */
async function expandedMagicDatabase(): Promise<string> {
  const file = join(CACHE, 'Database_Oggetti_Magici_espanso.wikitext');
  if (!REFRESH && existsSync(file)) return readFileSync(file, 'utf-8');
  const source = await wikitext('Database_Oggetti_Magici_e_Meravigliosi');
  const wait = lastRequest + REQUEST_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'User-Agent': 'pathfinder-sheet-item-import/1.0' },
    body: new URLSearchParams({ action: 'expandtemplates', prop: 'wikitext', format: 'json', formatversion: '2', text: source }),
  });
  if (!res.ok) throw new Error(`expandtemplates: HTTP ${res.status}`);
  const json = await res.json() as { expandtemplates?: { wikitext: string } };
  if (!json.expandtemplates) throw new Error('expandtemplates: no content');
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, json.expandtemplates.wikitext, 'utf-8');
  return json.expandtemplates.wikitext;
}

// ── Wikitext table parsing ──────────────────────────────────────────────────

export interface Cell { text: string; raw: string; header: boolean; colspan: number; attrs: string }
export type Row = Cell[];

/** Splits on `sep` outside [[...]] and {{...}}. */
function splitOutside(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === '[[' || two === '{{') { depth++; cur += two; i++; continue; }
    if ((two === ']]' || two === '}}') && depth > 0) { depth--; cur += two; i++; continue; }
    if (depth === 0 && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += s[i];
  }
  out.push(cur);
  return out;
}

/** Removes wiki markup, keeping the visible text. */
export function plain(s: string): string {
  return s
    .replace(/<sup>.*?<\/sup>/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCell(content: string, header: boolean): Cell {
  let attrs = '';
  let body = content;
  // `attr="x" | content` (single pipe, not inside a link)
  const parts = splitOutside(content, '|');
  if (parts.length > 1 && /^\s*([\w-]+\s*=\s*("[^"]*"|'[^']*'|\S+)\s*)+$/.test(parts[0])) {
    attrs = parts[0];
    body = parts.slice(1).join('|');
  }
  const colspan = Number(/colspan\s*=\s*"?(\d+)/i.exec(attrs)?.[1] ?? 1);
  const rowspan = Number(/rowspan\s*=\s*"?(\d+)/i.exec(attrs)?.[1] ?? 1);
  return Object.assign({ text: plain(body), raw: body.trim(), header, colspan, attrs }, rowspan > 1 ? { rowspan } : {});
}

/** Parses every `{| … |}` table into rows of cells, expanding rowspans. */
export function parseTables(wt: string): Row[][] {
  const tables: Row[][] = [];
  const re = /\{\|[\s\S]*?\n\|\}/g;
  for (const match of wt.matchAll(re)) {
    const rows: Row[] = [];
    let current: (Cell & { rowspan?: number })[] | null = null;
    const pending = new Map<number, { cell: Cell; left: number }>();
    const flush = () => {
      if (!current) return;
      // re-insert cells carried down by rowspan
      const row: Cell[] = [];
      let col = 0;
      let i = 0;
      while (i < current.length || [...pending.keys()].some(k => k >= col)) {
        const carried = pending.get(col);
        if (carried) {
          row.push(carried.cell);
          if (--carried.left === 0) pending.delete(col);
          col++;
          continue;
        }
        if (i >= current.length) break;
        const c = current[i++];
        if (c.rowspan && c.rowspan > 1) pending.set(col, { cell: { ...c }, left: c.rowspan - 1 });
        row.push(c);
        col += c.colspan;
      }
      if (row.length) rows.push(row);
      current = null;
    };
    for (const line of match[0].split('\n').slice(1)) {
      const t = line.trim();
      if (t.startsWith('|}')) break;
      if (t.startsWith('|-')) { flush(); current = []; continue; }
      if (t.startsWith('|+')) continue;
      if (t.startsWith('|') || t.startsWith('!')) {
        current ??= [];
        const header = t.startsWith('!');
        const sep = header ? '!!' : '||';
        for (const part of splitOutside(t.slice(1), sep)) current.push(parseCell(part, header));
      } else if (current && current.length) {
        // continuation of the previous cell (multi-line content)
        const last = current[current.length - 1];
        last.raw += `\n${t}`;
        last.text = plain(`${last.text} ${t}`);
      }
    }
    flush();
    tables.push(rows);
  }
  return tables;
}

// ── Value parsing ───────────────────────────────────────────────────────────

const dash = (s: string) => s.replace(/[–−—]/g, '-').trim();
const isEmpty = (s: string) => /^[-–—]?$|^n\/a$/i.test(s.trim());

/** "1.100 mo", "5 ma", "+50 mo" → gold pieces (0 when unknown). */
export function parsePrice(s: string): number {
  const m = /([\d.,]+)\s*(mp|mo|ma|mr)/i.exec(s);
  if (!m) return 0;
  const n = Number(m[1].replace(/\./g, '').replace(',', '.'));
  const rate = { mp: 10, mo: 1, ma: 0.1, mr: 0.01 }[m[2].toLowerCase() as 'mp' | 'mo' | 'ma' | 'mr'];
  return Math.round(n * rate * 100) / 100;
}

/** "0,5 kg" → 0.5 (0 when unknown). */
export function parseWeight(s: string): number {
  const m = /([\d.,]+)\s*kg/i.exec(s);
  return m ? Number(m[1].replace(',', '.')) : 0;
}

/** "1d6/1d6" → first part; "1" → 1d1; "-" → null. */
export function parseDice(s: string): Dice | null {
  const first = dash(s).split('/')[0].trim();
  const m = /^(\d+)d(\d+)$/.exec(first);
  if (m) return { count: Number(m[1]), die: Number(m[2]) };
  if (/^\d+$/.test(first)) return { count: Number(first), die: 1 };
  return null;
}

/** "19-20/x2", "x3", "x2/x3" → { range, mult } (first head of a double weapon). */
export function parseCrit(s: string): { critRange: number; critMult: number } {
  const t = dash(s).replace(/×/g, 'x');
  const range = /(\d+)\s*-\s*20/.exec(t);
  const mult = /x\s*(\d)/i.exec(t);
  return { critRange: range ? Number(range[1]) : 20, critMult: mult ? Number(mult[1]) : 2 };
}

const signed = (s: string): number | null => {
  const m = /([+-]?\d+)/.exec(dash(s));
  return m ? Number(m[1]) : null;
};

export function slug(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "[[Armi/Pugnale|Pugnale]] (O)" → { name, page, qty }. */
function nameCell(cell: Cell): { name: string; page?: string; qty?: number } {
  const link = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(cell.raw);
  const qty = /\((\d+)\)/.exec(cell.text)?.[1];
  // Parentheses inside the link text are part of the name ("Armatura Lamellare (Cuoio)");
  // outside it they are markers like (O), (G), (P) or quantities.
  const name = link ? plain(link[2] ?? link[1]) : cell.text.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  return { name, page: link?.[1], qty: qty ? Number(qty) : undefined };
}

const pageUrl = (page: string) => `${WIKI}/wiki/${encodeURI(page.replace(/ /g, '_')).replace(/'/g, '%27')}`;

// ── Weapons ─────────────────────────────────────────────────────────────────

const GROUP_LABEL: Record<WeaponGroup, string> = { simple: 'semplici', martial: 'da guerra', exotic: 'esotiche' };
const HAND_LABEL: Record<WeaponHandedness, string> = {
  light: 'leggere', 'one-handed': 'a una mano', 'two-handed': 'a due mani', ranged: 'a distanza',
};

function weaponsFrom(wt: string, log: string[]): ItemDefinition[] {
  const table = parseTables(wt).find(t => t.some(r => r.some(c => /Danni \(M\)/.test(c.text))));
  if (!table) throw new Error('Armi: weapon table not found');
  const items: ItemDefinition[] = [];
  let group: WeaponGroup = 'simple';
  let hand: WeaponHandedness = 'light';
  let ammo = false;
  for (const row of table) {
    const first = row[0]?.text ?? '';
    if (!/\[\[/.test(row[0]?.raw ?? '') || row[0].colspan > 1) {
      if (/Semplici/i.test(first)) group = 'simple';
      else if (/Guerra/i.test(first)) group = 'martial';
      else if (/Esotiche/i.test(first)) group = 'exotic';
      if (/Senz'?Armi|Leggere/i.test(first)) { hand = 'light'; ammo = false; }
      else if (/una Mano/i.test(first)) { hand = 'one-handed'; ammo = false; }
      else if (/Due Mani/i.test(first)) { hand = 'two-handed'; ammo = false; }
      else if (/Distanza/i.test(first)) { hand = 'ranged'; ammo = false; }
      else if (/Munizioni/i.test(first)) ammo = true;
      continue;
    }
    if (row.length < 9) { log.push(`Armi: riga scartata (${row.length} celle): ${first}`); continue; }
    const [nameC, cost, dmgS, dmgM, crit, range, weight, type, special] = row;
    const { name, page, qty } = nameCell(nameC);
    if (!name) continue;
    const damageTypes = (['C', 'P', 'T'] as DamageType[]).filter(t => new RegExp(`\\b${t}\\b`).test(type.text));
    const rangeM = parseWeight(range.text.replace(/m\b/, 'kg')) || undefined; // reuse decimal parsing
    const weapon: WeaponStats = {
      group,
      handedness: hand,
      damage: { small: parseDice(dmgS.text), medium: parseDice(dmgM.text) },
      ...parseCrit(crit.text),
      ...(rangeM ? { rangeM } : {}),
      damageTypes,
      special: isEmpty(special.text) ? [] : special.text.split(/,\s*/).filter(s => s && !isEmpty(s)),
    };
    // Ammunition has its own table (ammoFrom); here only an explicit section marks it.
    const isAmmo = ammo;
    items.push({
      id: slug(name),
      name: qty && isAmmo ? `${name} (${qty})` : name,
      kind: isAmmo ? 'ammo' : 'weapon',
      category: `Armi ${GROUP_LABEL[group]} ${HAND_LABEL[hand]}`,
      priceGp: parsePrice(cost.text),
      weightKg: parseWeight(weight.text),
      url: page ? pageUrl(page) : `${WIKI}/wiki/Armi`,
      ...(isAmmo ? {} : { weapon }),
    });
  }
  return items;
}

/** Ammunition table (Oggetto | Costo | Peso) on the weapons page. */
function ammoFrom(wt: string): ItemDefinition[] {
  const table = parseTables(wt).find(t => t.some(r => r.some(c => /Frecce/.test(c.raw))) && t[0]?.length === 3);
  if (!table) return [];
  return table.slice(1).filter(r => r.length === 3 && /\[\[/.test(r[0].raw)).map(([n, cost, weight]) => {
    const { name, page, qty } = nameCell(n);
    return {
      id: slug(name), name: qty ? `${name} (${qty})` : name, kind: 'ammo' as ItemKind, category: 'Munizioni',
      priceGp: parsePrice(cost.text), weightKg: parseWeight(weight.text), url: page ? pageUrl(page) : `${WIKI}/wiki/Armi`,
    };
  });
}

// ── Armor ───────────────────────────────────────────────────────────────────

const ARMOR_LABEL: Record<ArmorCategory, string> = {
  light: 'Armature leggere', medium: 'Armature medie', heavy: 'Armature pesanti', shield: 'Scudi', tower: 'Scudi',
};
const METAL = /maglia|scaglie|piastre|bande|strisce|metallo|completa|mezza|acciaio|ferro|brigantina|kikko|do-maru|o-yoroi|parata|cavaliere|agile/i;

function armorFrom(wt: string, log: string[]): ItemDefinition[] {
  const table = parseTables(wt).find(t => t.some(r => r.some(c => /Bonus Des max/i.test(c.text))));
  if (!table) throw new Error('Armature: armor table not found');
  const items: ItemDefinition[] = [];
  let section: ArmorCategory | 'extra' = 'light';
  for (const row of table) {
    const first = row[0]?.text ?? '';
    if (row.length < 9) {
      if (/Leggere/i.test(first)) section = 'light';
      else if (/Medie/i.test(first)) section = 'medium';
      else if (/Pesanti/i.test(first)) section = 'heavy';
      else if (/Scudi/i.test(first)) section = 'shield';
      else if (/Extra/i.test(first)) section = 'extra';
      else if (row.length > 1 && /\[\[/.test(row[0].raw)) log.push(`Armature: riga scartata: ${first}`);
      continue;
    }
    if (section === 'extra' || !/\[\[/.test(row[0].raw)) continue;
    const [nameC, cost, bonus, maxDex, acp, asf, , , weight] = row;
    const { name, page } = nameCell(nameC);
    const category: ArmorCategory = section === 'shield' && /torre/i.test(name) ? 'tower' : section;
    const armor: ArmorStats = {
      category,
      bonus: signed(bonus.text) ?? 0,
      maxDex: isEmpty(maxDex.text) ? null : signed(maxDex.text),
      checkPenalty: Math.min(0, signed(acp.text) ?? 0),
      arcaneFailure: Number(/(\d+)\s*%/.exec(asf.text)?.[1] ?? 0),
      metal: METAL.test(name) && !/legno/i.test(name),
    };
    items.push({
      id: slug(name), name, kind: section === 'shield' ? 'shield' : 'armor',
      category: ARMOR_LABEL[category], priceGp: parsePrice(cost.text), weightKg: parseWeight(weight.text),
      url: page ? pageUrl(page) : `${WIKI}/wiki/Armature`, armor,
    });
  }
  return items;
}

// ── Gear (Oggetto | … | Costo | Peso | …) ───────────────────────────────────

function gearFrom(page: string, label: string, wt: string, log: string[]): ItemDefinition[] {
  const items: ItemDefinition[] = [];
  for (const table of parseTables(wt)) {
    const head = table.find(r => r.some(c => /^Costo/i.test(c.text)));
    if (!head) continue;
    const idx = (re: RegExp) => head.findIndex(c => re.test(c.text));
    const iName = idx(/^Oggetto/i);
    const iCost = idx(/^Costo/i);
    const iWeight = idx(/^Peso/i);
    if (iName < 0 || iCost < 0) continue;
    let parent = '';
    for (const row of table) {
      if (row === head || row.every(c => c.header) || row.length <= Math.max(iName, iCost)) continue;
      const base = row[iName].text.replace(/\s*\([^)]*\)\s*$/, '').trim();
      if (!base) continue;
      // Centered name cells are variants of the previous item (e.g. Serratura → Media, Tenda → Grande).
      const variant = /text-?align:\s*center/i.test(row[iName].attrs) && parent;
      if (!variant) parent = base;
      const name = variant ? `${parent} (${base})` : base;
      const cost = row[iCost].text;
      if (!variant && !parsePrice(cost) && /varia/i.test(cost)) continue; // header of a variant group
      if (/varia/i.test(cost) && !parsePrice(cost)) log.push(`${label}: prezzo variabile per "${name}"`);
      items.push({
        id: slug(name), name, kind: 'gear', category: label,
        priceGp: parsePrice(cost), weightKg: iWeight >= 0 && row[iWeight] ? parseWeight(row[iWeight].text) : 0,
        url: `${WIKI}/wiki/${encodeURI(page.replace(/ /g, '_')).replace(/'/g, '%27')}#${encodeURI(name.replace(/ /g, '_'))}`,
      });
    }
  }
  return items;
}

// ── Magic items (Nascosto | Nome | Tipo | Slot | Prezzo | Peso | Fonte) ─────

const SLOT_BY_NAME: Record<string, BodySlot> = {
  armatura: 'armor', scudo: 'shield', anello: 'ring', cintura: 'belt', collo: 'neck', corpo: 'body', fronte: 'headband',
  mani: 'hands', occhi: 'eyes', piedi: 'feet', polsi: 'wrists', polso: 'wrists', spalle: 'shoulders', testa: 'head',
  torace: 'chest', nessuno: 'none',
};

const SLOT_IT: Partial<Record<BodySlot, string>> = {
  none: 'senza slot', neck: 'collo', shoulders: 'spalle', head: 'testa', belt: 'cintura', feet: 'piedi',
  headband: 'fronte', hands: 'mani', wrists: 'polsi', eyes: 'occhi', body: 'corpo', chest: 'torace',
};
const PLURAL: Record<string, string> = {
  arma: 'Armi magiche', armatura: 'Armature magiche', scudo: 'Scudi magici', anello: 'Anelli', bastone: 'Bastoni', verga: 'Verghe',
};

/** "Anello minore inferiore" → "Anelli"; "Oggetto Slot Collo" → "Oggetti meravigliosi (collo)". Tiers are dropped. */
export function magicCategory(type: string, slot: BodySlot): string {
  if (/^Oggetto\s+Scalare/i.test(type)) return 'Oggetti scalari';
  if (/^Oggetto/i.test(type)) return `Oggetti meravigliosi (${SLOT_IT[slot] ?? 'senza slot'})`;
  const base = type.replace(/\b(infimi?|minor[ei]|medi[aeo]|maggior[ei]|inferior[ei]|superior[ei])\b/gi, '').replace(/\s+/g, ' ').trim();
  return PLURAL[base.toLowerCase()] ?? (base || type);
}

export function magicFrom(expanded: string, log: string[]): ItemDefinition[] {
  const items: ItemDefinition[] = [];
  for (const table of parseTables(expanded)) {
    for (const row of table) {
      if (row.length < 7 || row.some(c => c.header) || !row[1].raw) continue;
      const [, nameC, typeC, slotC, priceC, weightC, sourceC] = row;
      // Variants are written outside the link ("Lama della Fortuna (1 Desiderio)"): keep the whole cell text.
      const name = nameC.text.trim();
      const page = nameCell(nameC).page;
      if (!name) continue;
      // "Nessuno o Collo": works without a slot, so it counts as slotless.
      const slotText = slotC.text.toLowerCase();
      const slot = SLOT_BY_NAME[slotText] ?? (slotText.startsWith('nessuno') ? 'none' : undefined);
      if (!slot) { log.push(`Magici: slot sconosciuto "${slotC.text}" per "${name}"`); continue; }
      if (!parsePrice(priceC.text) && !isEmpty(priceC.text)) log.push(`Magici: prezzo non letto per "${name}": ${priceC.text}`);
      items.push({
        id: slug(name),
        name,
        kind: 'magic',
        category: magicCategory(typeC.text, slot),
        priceGp: parsePrice(priceC.text),
        weightKg: parseWeight(weightC.text),
        url: page ? pageUrl(page) : `${WIKI}/wiki/${encodeURI(name.replace(/ /g, '_'))}`,
        slot,
        tier: typeC.text,
        ...(sourceC.text && !isEmpty(sourceC.text) ? { source: sourceC.text } : {}),
      });
    }
  }
  return items;
}

// ── Overrides, ids, output ──────────────────────────────────────────────────

interface Overrides {
  /** id → partial fields merged into the entry (weapon/armor merged shallowly). */
  patch?: Record<string, Partial<ItemDefinition> & { weapon?: Partial<WeaponStats>; armor?: Partial<ArmorStats> }>;
  /** id → replacement id (keeps ids stable if the wiki renames an entry). */
  alias?: Record<string, string>;
  /** ids to drop. */
  exclude?: string[];
}

function applyOverrides(items: ItemDefinition[], ov: Overrides): ItemDefinition[] {
  return items
    .map(it => ({ ...it, id: ov.alias?.[it.id] ?? it.id }))
    .filter(it => !ov.exclude?.includes(it.id))
    .map(it => {
      const p = ov.patch?.[it.id];
      if (!p) return it;
      return {
        ...it, ...p,
        ...(p.weapon && it.weapon ? { weapon: { ...it.weapon, ...p.weapon } } : {}),
        ...(p.armor && it.armor ? { armor: { ...it.armor, ...p.armor } } : {}),
      } as ItemDefinition;
    });
}

/** Weapons/armor win over gear; other duplicates get a category suffix; leftovers are an error. */
function uniqueIds(items: ItemDefinition[], log: string[]): ItemDefinition[] {
  const rank = (k: ItemKind) => (k === 'magic' ? 2 : k === 'gear' ? 1 : 0);
  const seen = new Map<string, ItemDefinition>();
  const out: ItemDefinition[] = [];
  for (const it of [...items].sort((a, b) => rank(a.kind) - rank(b.kind))) {
    const prev = seen.get(it.id);
    if (!prev) { seen.set(it.id, it); out.push(it); continue; }
    if (prev.name === it.name && prev.priceGp === it.priceGp) { log.push(`duplicato ignorato: ${it.id}`); continue; }
    if (it.kind === 'magic' && prev.kind === 'magic' && prev.name !== it.name) throw new Error(`stesso id, nomi diversi: ${it.id}`);
    // Magic items get an "m-" prefix against common ones; between magic items the tier tells them apart.
    const id = it.kind === 'magic'
      ? (seen.has(`m-${it.id}`) ? `m-${it.id}-${slug(it.tier ?? it.category)}` : `m-${it.id}`)
      : `${it.id}-${slug(it.category)}`;
    if (seen.has(id)) throw new Error(`id duplicato non risolvibile: ${id}`);
    log.push(`id rinominato: ${it.id} → ${id}`);
    const renamed = { ...it, id };
    seen.set(id, renamed);
    out.push(renamed);
  }
  return out;
}

async function main() {
  const log: string[] = [];
  const armiWt = await wikitext('Armi');
  const items = [
    ...weaponsFrom(armiWt, log),
    ...ammoFrom(armiWt),
    ...armorFrom(await wikitext('Armature'), log),
    ...gearFrom("Oggetti_d'Avventura", "Oggetti d'avventura", await wikitext("Oggetti_d'Avventura"), log),
    ...gearFrom('Attrezzi_di_Classe_e_Abilità', 'Attrezzi di classe e abilità', await wikitext('Attrezzi_di_Classe_e_Abilità'), log),
    ...gearFrom('Vestiario', 'Vestiario', await wikitext('Vestiario'), log),
    ...magicFrom(await expandedMagicDatabase(), log),
  ];
  const overrides: Overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf-8')) : {};
  const final = uniqueIds(applyOverrides(items, overrides), log)
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'it'));

  writeFileSync(OUT, JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), items: final }, null, 0) + '\n', 'utf-8');

  const byKind = final.reduce<Record<string, number>>((acc, it) => ({ ...acc, [it.kind]: (acc[it.kind] ?? 0) + 1 }), {});
  console.log(`items.json: ${final.length} voci`, byKind);
  if (log.length) console.log(log.map(l => `  · ${l}`).join('\n'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => { console.error(err); process.exit(1); });
}
