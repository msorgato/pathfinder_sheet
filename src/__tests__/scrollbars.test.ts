import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../index.css'), 'utf-8');

/** The body of the global rule that starts a line with `selector` (so `.x::-webkit-scrollbar` rules are skipped). */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector}`) + 1;
  expect(start, `rule ${selector}`).toBeGreaterThan(0);
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
}

describe('themed scrollbars', () => {
  it('has a slim bar (≤ 10px) with a transparent track', () => {
    const bar = rule('::-webkit-scrollbar ');
    expect(Number(/width:\s*(\d+)px/.exec(bar)?.[1])).toBeLessThanOrEqual(10);
    expect(rule('::-webkit-scrollbar-track')).toMatch(/background:\s*transparent/);
  });

  it('draws a fully rounded thumb in theme variables, stronger on hover', () => {
    const thumb = rule('::-webkit-scrollbar-thumb {');
    expect(thumb).toMatch(/background:\s*var\(--line-mid\)/);
    expect(thumb).toMatch(/border-radius:\s*999px/);
    expect(rule('::-webkit-scrollbar-thumb:hover')).toMatch(/var\(--line-strong\)/);
  });

  it('uses the standard properties only inside the @supports fallback', () => {
    const fallback = css.indexOf('@supports not selector(::-webkit-scrollbar)');
    expect(fallback).toBeGreaterThanOrEqual(0);
    const fallbackEnd = css.indexOf('\n}', fallback);
    const uses = [...css.matchAll(/scrollbar-(width|color):\s*([^;]+);/g)];
    for (const m of uses) {
      const inFallback = m.index > fallback && m.index < fallbackEnd;
      // hiding a bar on purpose (none) is allowed anywhere; anything else must sit in the fallback
      if (m[2].trim() !== 'none') expect(inFallback, m[0]).toBe(true);
    }
  });

  it('takes the fallback colour from the theme', () => {
    expect(css).toMatch(/scrollbar-color:\s*var\(--line-mid\)\s+transparent/);
  });
});
