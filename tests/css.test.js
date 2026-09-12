import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Contrastul WCAG al perechilor text / fundal din tokeni: textul obișnuit cere cel puțin 4,5:1.
const css = readFileSync(new URL('../site/css/00-tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/(--c-[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const PAIRS = [
  ['--c-ink', '--c-paper'],
  ['--c-ink-soft', '--c-paper'],
  ['--c-ink-soft', '--c-surface-2'],
  ['--c-on-brand', '--c-brand'],
  ['--c-brand-dark', '--c-brand-soft'],
  ['--c-usor-ink', '--c-usor-bg'],
  ['--c-usor-ink', '--c-paper'],
  ['--c-on-brand', '--c-usor-ink'],
  ['--c-intermediar-ink', '--c-intermediar-bg'],
  ['--c-on-brand', '--c-intermediar-ink'],
  ['--c-avansat-ink', '--c-avansat-bg'],
  ['--c-on-brand', '--c-avansat-ink'],
  ['--c-ok-ink', '--c-ok-bg'],
  ['--c-bad-ink', '--c-bad-bg'],
  ['--c-bad', '--c-paper'],
  ['--c-warn-ink', '--c-paper'],
  ['--c-warn-ink', '--c-warn-bg'],
  ['--c-info-ink', '--c-info-bg'],
];

test('css: textul are contrast de cel puțin 4,5:1 pe fundalul lui', () => {
  assert.ok(contrast('#000000', '#ffffff') > 20.9);
  const low = PAIRS.map(([fg, bg]) => {
    assert.ok(tokens[fg] && tokens[bg], `lipsește ${fg} sau ${bg} din 00-tokens.css`);
    return [fg, bg, contrast(tokens[fg], tokens[bg])];
  }).filter(([, , c]) => c < 4.5);
  assert.deepEqual(low.map(([fg, bg, c]) => `${fg} pe ${bg}: ${c.toFixed(2)}`), []);
});
