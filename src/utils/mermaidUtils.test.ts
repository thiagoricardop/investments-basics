import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMermaidCacheKey,
  normalizeMermaidChart,
  parseSvgViewBox,
  prepareMermaidSvg,
} from './mermaidUtils';

test('normalizeMermaidChart normalizes CRLF and trims whitespace', () => {
  const raw = '  \r\nflowchart TD\r\n  A --> B\r\n  ';
  assert.equal(normalizeMermaidChart(raw), 'flowchart TD\n  A --> B');
});

test('getMermaidCacheKey distinguishes light and dark themes for identical charts', () => {
  const chart = 'flowchart TD\n  A --> B';
  const lightKey = getMermaidCacheKey(chart, false);
  const darkKey = getMermaidCacheKey(`${chart}\r\n`, true);
  assert.notEqual(lightKey, darkKey);
  assert.equal(lightKey, getMermaidCacheKey(`  ${chart} `, false));
});

test('parseSvgViewBox reads numeric width and height from Mermaid viewBox', () => {
  const svg = '<svg id="m1" viewBox="4 4 501.16 1652" width="100%"></svg>';
  const dims = parseSvgViewBox(svg);
  assert.equal(dims.width, 501.16);
  assert.equal(dims.height, 1652);
});

test('prepareMermaidSvg keeps tall TD flowcharts responsive within column', () => {
  const raw = '<svg id="m1" width="100%" style="max-width: 360px;" viewBox="0 0 360 656"><g/></svg>';
  const prepared = prepareMermaidSvg(raw);
  assert.equal(prepared.isWide, false);
  assert.match(prepared.svg, /max-width: 360px/);
  assert.match(prepared.svg, /height: auto/);
  assert.doesNotMatch(prepared.svg, /\bwidth="100%"/);
});

test('prepareMermaidSvg preserves legible width for wide horizontal LR flowcharts', () => {
  const raw = '<svg id="m2" width="100%" style="max-width: 1850px;" viewBox="0 0 1850 140"><g/></svg>';
  const prepared = prepareMermaidSvg(raw);
  assert.equal(prepared.isWide, true);
  assert.match(prepared.svg, /width: 1480px; min-width: 1480px; max-width: none; height: auto; display: block; flex-shrink: 0;/);
});
