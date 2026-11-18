/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const walk = (dir: string, out: string[] = []): string[] => {
  readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') walk(p, out); } else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  });
  return out;
};
const files = walk(join(root, 'src'));
const read = (f: string) => readFileSync(f, 'utf-8');
const rel = (f: string) => f.replace(root, '').split(String.fromCharCode(92)).join('/');

describe('typography rules', () => {
  it('no font size below 12px in styles or components', () => {
    const offenders: string[] = [];
    files.forEach(f => read(f).split('\n').forEach((line, i) => {
      const css = [...line.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));
      const inline = [...line.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)\b/g)].map(m => Number(m[1]));
      const tw = [...line.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)].map(m => Number(m[1]));
      if ([...css, ...inline, ...tw].some(n => n < 12)) offenders.push(`${rel(f)}:${i + 1}`);
    }));
    expect(offenders).toEqual([]);
  });

  it('Georgia only appears as a fallback inside the font variables', () => {
    const offenders: string[] = [];
    files.forEach(f => read(f).split('\n').forEach((line, i) => {
      if (/Georgia/.test(line) && !/--font-(body|display|rune|mono):/.test(line)) offenders.push(`${rel(f)}:${i + 1}`);
    }));
    expect(offenders).toEqual([]);
  });

  it('fonts are not loaded from third-party servers', () => {
    ['index.html', 'vite.config.ts'].forEach(f => {
      expect(read(join(root, f))).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
    });
    files.forEach(f => expect(read(f), rel(f)).not.toMatch(/fonts\.googleapis|fonts\.gstatic/));
  });

  it('the font variables use the bundled Literata and Cinzel', () => {
    const css = read(join(root, 'src/index.css'));
    expect(css).toMatch(/--font-body:\s*"Literata Variable"/);
    expect(css).toMatch(/--font-display:\s*"Literata Variable"/);
    expect(css).toMatch(/--font-rune:\s*"Cinzel Variable"/);
    expect(css).not.toMatch(/Cormorant|EB Garamond/);
  });

  it('the small framework text sizes follow the scale', () => {
    const css = read(join(root, 'src/index.css'));
    expect(css).toMatch(/--text-xs:\s*0\.8125rem/); // 13px
    expect(css).toMatch(/--text-sm:\s*0\.9375rem/); // 15px
  });
});
