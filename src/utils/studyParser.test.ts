import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildChapterLineMaps,
  extractChapterExercises,
  extractGlossaryTerms,
  extractHeadings,
  slugifyHeading,
  splitAnswerKeySection,
} from './studyParser';

test('slugifyHeading normalizes punctuation and spaces cleanly', () => {
  assert.equal(slugifyHeading('6.4 Expectancy, win rate, and payoff ratio'), '64-expectancy-win-rate-and-payoff-ratio');
});

test('extractHeadings ignores headings inside fenced code blocks', () => {
  const sample = `
## 1. Real Heading
\`\`\`python
# Comment
## Not a heading
\`\`\`
### 1.1 Sub Heading
`;
  const headings = extractHeadings(sample);
  assert.equal(headings.length, 2);
  assert.equal(headings[0].text, '1. Real Heading');
  assert.equal(headings[1].text, '1.1 Sub Heading');
});

const CHAPTER_FILES = [
  { id: 'ch01', num: '01', file: '01-foundations-and-market-mechanics.md', expectedExercises: 8 },
  { id: 'ch02', num: '02', file: '02-markets-and-current-regime.md', expectedExercises: 8 },
  { id: 'ch03', num: '03', file: '03-long-term-investing-and-portfolio.md', expectedExercises: 8 },
  { id: 'ch04', num: '04', file: '04-short-term-trading-playbook.md', expectedExercises: 8 },
  { id: 'ch05', num: '05', file: '05-data-backtesting-and-paper-trading.md', expectedExercises: 9 },
];

test('splitAnswerKeySection separates Answer Key cleanly across all 5 chapters', () => {
  for (const ch of CHAPTER_FILES) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), ch.file), 'utf-8');
    const split = splitAnswerKeySection(raw);
    assert.ok(split.answerKeyHeading !== null, `Missing answer key heading in ${ch.file}`);
    assert.match(split.answerKeyHeading!, /Answer key/i);
    assert.ok(split.answerKeyBody && split.answerKeyBody.length > 50, `Empty answer key body in ${ch.file}`);
    assert.ok(/Exercise|Lab/.test(split.beforeAnswerKey), `Exercises/Labs missing from beforeAnswerKey in ${ch.file}`);
  }
});

test('extractGlossaryTerms parses glossary entries across all 5 chapters', () => {
  let total = 0;
  for (const ch of CHAPTER_FILES) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), ch.file), 'utf-8');
    const terms = extractGlossaryTerms(raw, ch.id, ch.num);
    assert.ok(terms.length >= 5, `Expected >= 5 glossary terms in ${ch.file}, got ${terms.length}`);
    total += terms.length;
  }
  assert.ok(total >= 50, `Expected >= 50 total glossary terms, got ${total}`);
});

test('extractChapterExercises extracts all 41 exercises and labs with matched answer key solutions', () => {
  let total = 0;
  const matchedTabs = new Set<string>();

  for (const ch of CHAPTER_FILES) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), ch.file), 'utf-8');
    const headings = new Set(extractHeadings(raw).map((h) => h.id));
    const items = extractChapterExercises(raw, ch.id, ch.num);
    assert.equal(
      items.length,
      ch.expectedExercises,
      `Expected ${ch.expectedExercises} exercises/labs in ${ch.file}, got ${items.length}`
    );

    for (const item of items) {
      assert.ok(item.promptMarkdown.length > 20, `Prompt too short for ${item.id}`);
      assert.ok(item.solutionMarkdown.length > 20, `Missing Answer Key solution for ${item.id}`);
      assert.ok(headings.has(item.headingId), `headingId ${item.headingId} not found in ${ch.file} headings`);
      if (item.suggestedLabTab) {
        matchedTabs.add(item.suggestedLabTab);
      }
    }
    total += items.length;
  }

  assert.equal(total, 41);
  assert.deepEqual(
    Array.from(matchedTabs).sort(),
    ['compounding', 'drawdown', 'expectancy', 'sizing']
  );
});

test('buildChapterLineMaps produces exact heading IDs and sequential checkbox indices across all 5 chapters', () => {
  for (const ch of CHAPTER_FILES) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), ch.file), 'utf-8');
    const split = splitAnswerKeySection(raw);
    const maps = buildChapterLineMaps(
      split.beforeAnswerKey,
      split.answerKeyHeading,
      split.answerKeyBody ?? '',
      split.afterAnswerKey
    );

    const expectedHeadings = extractHeadings(raw).map((h) => h.id);
    const mappedHeadings = [
      ...maps.before.headingIdByLine.values(),
      ...(maps.answerHeadingId ? [maps.answerHeadingId] : []),
      ...maps.answerBody.headingIdByLine.values(),
      ...maps.after.headingIdByLine.values(),
    ];
    assert.deepEqual(mappedHeadings, expectedHeadings, `Heading ID mismatch in ${ch.file}`);

    const expectedChecks = (raw.match(/^- \[ \]/gm) ?? []).length;
    const mappedChecks =
      maps.before.checkboxIndexByLine.size +
      maps.answerBody.checkboxIndexByLine.size +
      maps.after.checkboxIndexByLine.size;
    assert.equal(mappedChecks, expectedChecks, `Checkbox count mismatch in ${ch.file}`);
  }
});


