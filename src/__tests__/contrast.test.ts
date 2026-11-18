/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../index.css'), 'utf-8');

/** Custom properties of a block, from the selector to the closing brace. */
function block(selector: RegExp): Record<string, string> {
  const m = selector.exec(css);
  if (!m) throw new Error(`block not found: ${selector}`);
  const end = css.indexOf('\n}', m.index);
  return Object.fromEntries([...css.slice(m.index, end).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map(x => [x[1], x[2]]));
}
const THEMES: Record<string, Record<string, string>> = {
  sigil: block(/:root,\s*\[data-theme="sigil"\]\s*\{/),
  astral: block(/\[data-theme="astral"\]\s*\{/),
  blood: block(/\[data-theme="blood"\]\s*\{/),
};
const ROOT = block(/:root\s*\{\s*--blood-text/);
const SURFACES = ['bg-deep', 'bg-base', 'bg-elev', 'surface-1', 'surface-2'];

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const worst = (fg: string, theme: Record<string, string>) => Math.min(...SURFACES.map(s => ratio(fg, theme[s])));

describe('text contrast (WCAG AA, 4.5:1)', () => {
  Object.entries(THEMES).forEach(([name, t]) => {
    it(`${name}: every ink colour is readable on every surface`, () => {
      ['ink', 'ink-soft', 'ink-mute', 'ink-faint'].forEach(k => {
        expect(t[k], `${name} --${k}`).toBeDefined();
        expect(worst(t[k], t), `${name} --${k}`).toBeGreaterThanOrEqual(4.5);
      });
    });

    it(`${name}: the hierarchy of the four inks is kept`, () => {
      const c = (k: string) => worst(t[k], t);
      expect(c('ink')).toBeGreaterThan(c('ink-soft'));
      expect(c('ink-soft')).toBeGreaterThan(c('ink-mute'));
      expect(c('ink-mute')).toBeGreaterThan(c('ink-faint') + 1);
    });

    it(`${name}: the red used for text is readable`, () => {
      expect(worst(ROOT['blood-text'], t), `${name} --blood-text`).toBeGreaterThanOrEqual(4.5);
    });
  });
});
