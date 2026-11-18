import {
  extractChapterExercises,
  extractGlossaryTerms,
  extractHeadings,
  slugifyHeading,
  type ChapterExercise,
  type GlossaryEntry,
  type HeadingItem,
  type SuggestedLabTab,
} from '../utils/studyParser';

export {
  slugifyHeading,
  type ChapterExercise,
  type GlossaryEntry,
  type HeadingItem,
  type SuggestedLabTab,
};

export interface ChapterMeta {
  id: string;
  number: string;
  filename: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  level: string;
  studyTime: string;
  rawMarkdown: string;
  readingMinutes: number;
  headings: HeadingItem[];
  checklistCount: number;
}

export interface ChartPlate {
  id: string;
  filename: string;
  path: string;
  url: string;
  chapter: string;
  title: string;
  caption: string;
  embeddedInChapter: boolean;
}

const markdownModules = import.meta.glob('/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const assetModules = import.meta.glob('/assets/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export const ASSET_URL_MAP: Record<string, string> = {};
for (const [fullPath, url] of Object.entries(assetModules)) {
  const cleanRel = fullPath.replace(/^\//, ''); // e.g., assets/ch01-order-book-depth.png
  ASSET_URL_MAP[cleanRel] = url;
  ASSET_URL_MAP[`/${cleanRel}`] = url;
}

function countChecklistItems(markdown: string): number {
  const matches = markdown.match(/^- \[ \]/gm);
  return matches ? matches.length : 0;
}

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(10, Math.round(words / 185));
}

interface ChapterSeed {
  id: string;
  number: string;
  filename: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  level: string;
  studyTime: string;
}

const CHAPTER_SEEDS: ChapterSeed[] = [
  {
    id: 'ch01',
    number: '01',
    filename: '01-foundations-and-market-mechanics.md',
    title: 'Foundations and Market Mechanics',
    shortTitle: 'Foundations & Mechanics',
    subtitle: 'Exchanges, order books, bid/ask spreads, instrument types, expectancy, sizing, and drawdown asymmetry.',
    level: 'Beginner → Practical Foundations',
    studyTime: '8–12 hours',
  },
  {
    id: 'ch02',
    number: '02',
    filename: '02-markets-and-current-regime.md',
    title: 'Markets and the Current Market Regime',
    shortTitle: 'Markets & Regime',
    subtitle: 'Comparing U.S. equities, Bitcoin, gold, and oil exposures, custody structures, and futures curves.',
    level: 'Beginner → Informed Comparison',
    studyTime: '6–9 hours',
  },
  {
    id: 'ch03',
    number: '03',
    filename: '03-long-term-investing-and-portfolio.md',
    title: 'Long-Term Investing and Portfolio Building',
    shortTitle: 'Long-Term Portfolio',
    subtitle: 'Investment policy statements, diversification, ETF selection, financial statements, DCF scenarios, and rebalancing.',
    level: 'Core Portfolio Process',
    studyTime: '10–14 hours',
  },
  {
    id: 'ch04',
    number: '04',
    filename: '04-short-term-trading-playbook.md',
    title: 'Short-Term Trading Playbook',
    shortTitle: 'Trading Playbook',
    subtitle: 'OHLCV price structure, market regimes, technical indicators, stop-gap risk, and falsifiable breakout rules.',
    level: 'Systematic Hypotheses',
    studyTime: '8–12 hours',
  },
  {
    id: 'ch05',
    number: '05',
    filename: '05-data-backtesting-and-paper-trading.md',
    title: 'Data, Backtesting, and Paper Trading',
    shortTitle: 'Data & Backtesting',
    subtitle: 'Data contracts, survivorship and look-ahead bias controls, chronological splits, bootstrap, and paper execution.',
    level: 'Beginner → Intermediate',
    studyTime: '10–14 hours',
  },
];

export const CHAPTERS: ChapterMeta[] = CHAPTER_SEEDS.map((seed) => {
  const raw = markdownModules[`/${seed.filename}`] ?? '';
  return {
    ...seed,
    rawMarkdown: raw,
    readingMinutes: estimateReadingMinutes(raw),
    headings: extractHeadings(raw),
    checklistCount: countChecklistItems(raw),
  };
});

export const CHAPTER_BY_FILENAME: Record<string, ChapterMeta> = Object.fromEntries(
  CHAPTERS.map((ch) => [ch.filename, ch])
);

const PLATE_DESCRIPTIONS: Record<string, { chapter: string; title: string; caption: string; embedded: boolean }> = {
  'ch01-order-book-depth.png': {
    chapter: '01',
    title: 'Synthetic Order-Book Depth',
    caption: 'Three-level displayed bid and ask depth around a $50 midpoint illustrating multi-level market fills.',
    embedded: true,
  },
  'ch01-expectancy-heatmap.png': {
    chapter: '01',
    title: 'Expectancy Sensitivity Heatmap',
    caption: 'Modeled expectancy across win rates and payoff ratios with zero-expectancy break-even contour.',
    embedded: true,
  },
  'ch01-drawdown-recovery.png': {
    chapter: '01',
    title: 'Drawdown Recovery Asymmetry',
    caption: 'Required percentage gain on remaining equity to recover from increasingly deep drawdowns.',
    embedded: true,
  },
  'ch02-intraday-snapshot.png': {
    chapter: '02',
    title: 'Cross-Asset Intraday Snapshot',
    caption: 'Intraday percentage change versus prior close for representative instruments on 10 Nov 2026.',
    embedded: true,
  },
  'ch02-contango-backwardation-curves.png': {
    chapter: '02',
    title: 'Contango vs. Backwardation Futures Curves',
    caption: 'Term-structure shape across delivery months showing negative and positive roll-yield dynamics.',
    embedded: false,
  },
  'ch02-market-learning-scorecard.png': {
    chapter: '02',
    title: 'Market Learning Suitability Scorecard',
    caption: 'Weighted comparison of liquidity, structure simplicity, data access, and beginner suitability.',
    embedded: false,
  },
  'ch03-compounding-fees.png': {
    chapter: '03',
    title: 'Compounding & Annual Fee Drag',
    caption: 'Synthetic multi-decade trajectory contrasting contributions, contribution timing, and expense drag.',
    embedded: true,
  },
  'ch03-dcf-scenario-range.png': {
    chapter: '03',
    title: 'Bear / Base / Bull DCF Valuation Range',
    caption: 'Scenario distribution showing how intrinsic value depends on growth and discount assumptions.',
    embedded: false,
  },
  'ch03-dcf-sensitivity-heatmap.png': {
    chapter: '03',
    title: 'DCF Discount Rate & Terminal Growth Grid',
    caption: 'Two-way sensitivity matrix across WACC and terminal growth rates.',
    embedded: false,
  },
  'ch03-microsoft-quarterly-growth.png': {
    chapter: '03',
    title: 'Microsoft Quarterly Financial Progression',
    caption: 'Illustrative quarterly revenue, operating income, and cash conversion snapshot.',
    embedded: false,
  },
  'ch03-rebalancing-drift.png': {
    chapter: '03',
    title: 'Portfolio Allocation Drift & Rebalancing',
    caption: 'Weight drift over time comparing unadjusted buy-and-hold against threshold rebalancing.',
    embedded: false,
  },
  'ch03-synthetic-correlation-heatmap.png': {
    chapter: '03',
    title: 'Cross-Asset Synthetic Correlation Matrix',
    caption: 'Pairwise return correlations highlighting diversification behavior across asset sleeves.',
    embedded: false,
  },
  'ch04-expectancy-sensitivity.png': {
    chapter: '04',
    title: 'Net Expectancy After Execution Costs',
    caption: 'Sensitivity grid incorporating 0.10R round-trip friction across win rates and payoff ratios.',
    embedded: true,
  },
  'ch04-rsi-regime-behavior.png': {
    chapter: '04',
    title: 'RSI Behavior Across Regimes',
    caption: 'Synthetic comparison of 14-period RSI in a sideways oscillation versus a persistent uptrend.',
    embedded: true,
  },
  'ch04-stop-gap-risk.png': {
    chapter: '04',
    title: 'Overnight Gap Through Stop Level',
    caption: 'Illustration of stop-market execution below the planned stop price following an opening gap.',
    embedded: true,
  },
  'ch04-execution-cost-drag.png': {
    chapter: '04',
    title: 'Execution Cost Drag on Small Targets',
    caption: 'Net return erosion as round-trip spread and slippage consume small gross profit targets.',
    embedded: true,
  },
  'ch04-breakout-setup.png': {
    chapter: '04',
    title: '20-Session Breakout & Next-Open Entry',
    caption: 'Synthetic daily bar series marking 50-session trend filter, 20-day high signal, and next-open fill.',
    embedded: true,
  },
  'ch05-synthetic-price-volatility.png': {
    chapter: '05',
    title: 'Synthetic Price & 21-Day Realized Volatility',
    caption: 'Fixed-seed synthetic price series alongside 50-session moving average and annualized volatility.',
    embedded: true,
  },
  'ch05-synthetic-equity-drawdown.png': {
    chapter: '05',
    title: 'Strategy vs. Buy-and-Hold Equity & Drawdown',
    caption: 'Normalized equity curves and underwater drawdown paths on synthetic research bars.',
    embedded: true,
  },
  'ch05-cost-sensitivity.png': {
    chapter: '05',
    title: 'Backtest Cost Sensitivity Curve',
    caption: 'Net sample return deterioration across 0 to 30 bps adverse cost per side.',
    embedded: true,
  },
  'ch05-chronological-splits.png': {
    chapter: '05',
    title: 'Chronological 60 / 20 / 20 Research Split',
    caption: 'Time-ordered train, validation, and untouched holdout partitions preventing leakage.',
    embedded: true,
  },
  'ch05-block-bootstrap.png': {
    chapter: '05',
    title: 'Moving-Block Bootstrap Distribution',
    caption: 'Resampled distribution of synthetic strategy outcomes preserving short-horizon serial structure.',
    embedded: true,
  },
  'ch06-feed-freshness-gate.png': {
    chapter: '06',
    title: 'Feed Freshness & Staleness Risk Gate',
    caption: 'Supplemental automation plate: halting simulated order placement when market quotes exceed age thresholds.',
    embedded: false,
  },
  'ch06-partial-fill-ledger.png': {
    chapter: '06',
    title: 'Partial Fill & Order-State Ledger',
    caption: 'Supplemental automation plate: reconciling submitted, partially filled, and cancelled order quantities.',
    embedded: false,
  },
  'ch06-retry-backoff.png': {
    chapter: '06',
    title: 'Exponential Retry & Backoff Schedule',
    caption: 'Supplemental automation plate: bounded retry intervals with jitter for transient API failures.',
    embedded: false,
  },
};

export const CHART_PLATES: ChartPlate[] = Object.entries(ASSET_URL_MAP)
  .filter(([key]) => !key.startsWith('/'))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([relPath, url]) => {
    const filename = relPath.replace('assets/', '');
    const meta = PLATE_DESCRIPTIONS[filename] ?? {
      chapter: filename.slice(2, 4),
      title: filename.replace('.png', '').replace(/-/g, ' '),
      caption: 'Curriculum chart plate.',
      embedded: false,
    };
    return {
      id: filename.replace('.png', ''),
      filename,
      path: relPath,
      url,
      chapter: meta.chapter,
      title: meta.title,
      caption: meta.caption,
      embeddedInChapter: meta.embedded,
    };
  });

export const ALL_GLOSSARY_TERMS: GlossaryEntry[] = CHAPTERS.flatMap((ch) =>
  extractGlossaryTerms(ch.rawMarkdown, ch.id, ch.number)
);

export const ALL_CHAPTER_EXERCISES: ChapterExercise[] = CHAPTERS.flatMap((ch) =>
  extractChapterExercises(ch.rawMarkdown, ch.id, ch.number)
);

export function getSupplementalPlatesForChapter(chapterNumber: string): ChartPlate[] {
  return CHART_PLATES.filter(
    (p) => p.chapter === chapterNumber && !p.embeddedInChapter
  );
}

