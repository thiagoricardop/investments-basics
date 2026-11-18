export type MediaKind = 'video' | 'podcast';

export interface MediaItem {
  id: string;
  chapterId: string;
  chapterNumber: string;
  kind: MediaKind;
  title: string;
  description: string;
  filename: string;
  repoPath: string;
  streamUrl: string;
  githubRawUrl: string;
  sizeLabel: string;
}

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/thiagoricardop/investments-basics/main';
const USE_DIRECT_MEDIA = import.meta.env.VITE_MEDIA_MODE === 'direct';

function resolveStreamUrl(repoPath: string): string {
  return USE_DIRECT_MEDIA ? `${GITHUB_RAW_BASE}/${repoPath}` : `/api/media/${repoPath}`;
}

export const MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'ch01-video',
    chapterId: 'ch01',
    chapterNumber: '01',
    kind: 'video',
    title: 'Trading Foundations',
    description: 'Visual walkthrough of exchanges, brokers, order books, bid/ask spreads, expectancy, and drawdown recovery math.',
    filename: 'Trading_Foundations.mp4',
    repoPath: '01/Trading_Foundations.mp4',
    streamUrl: resolveStreamUrl('01/Trading_Foundations.mp4'),
    githubRawUrl: `${GITHUB_RAW_BASE}/01/Trading_Foundations.mp4`,
    sizeLabel: '43.0 MB · MP4',
  },
  {
    id: 'ch01-podcast',
    chapterId: 'ch01',
    chapterNumber: '01',
    kind: 'podcast',
    title: 'How Stock Order Books Actually Work',
    description: 'Deep-dive audio discussion on displayed liquidity, partial fills, slippage, and why stops do not guarantee fill prices.',
    filename: 'How_Stock_Order_Books_Actually_Work.m4a',
    repoPath: '01/How_Stock_Order_Books_Actually_Work.m4a',
    streamUrl: resolveStreamUrl('01/How_Stock_Order_Books_Actually_Work.m4a'),
    githubRawUrl: `${GITHUB_RAW_BASE}/01/How_Stock_Order_Books_Actually_Work.m4a`,
    sizeLabel: '36.9 MB · M4A',
  },
  {
    id: 'ch02-video',
    chapterId: 'ch02',
    chapterNumber: '02',
    kind: 'video',
    title: 'Market Realities Blueprint',
    description: 'Comparing U.S. equity ETFs, individual stocks, spot Bitcoin, gold trusts, and oil futures curves side by side.',
    filename: 'Market_Realities_Blueprint.mp4',
    repoPath: '02/Market_Realities_Blueprint.mp4',
    streamUrl: resolveStreamUrl('02/Market_Realities_Blueprint.mp4'),
    githubRawUrl: `${GITHUB_RAW_BASE}/02/Market_Realities_Blueprint.mp4`,
    sizeLabel: '42.3 MB · MP4',
  },
  {
    id: 'ch02-podcast',
    chapterId: 'ch02',
    chapterNumber: '02',
    kind: 'podcast',
    title: 'You Are Buying Products, Not Assets',
    description: 'Why ticker labels conceal fund expenses, custody structures, futures roll yield, and tracking differences.',
    filename: 'You_Are_Buying_Products_Not_Assets.m4a',
    repoPath: '02/You_Are_Buying_Products_Not_Assets.m4a',
    streamUrl: resolveStreamUrl('02/You_Are_Buying_Products_Not_Assets.m4a'),
    githubRawUrl: `${GITHUB_RAW_BASE}/02/You_Are_Buying_Products_Not_Assets.m4a`,
    sizeLabel: '47.1 MB · M4A',
  },
  {
    id: 'ch03-video',
    chapterId: 'ch03',
    chapterNumber: '03',
    kind: 'video',
    title: 'The Financial Architect',
    description: 'Structuring an investment policy statement, reading financial statements together, DCF ranges, and rebalancing discipline.',
    filename: 'The_Financial_Architect.mp4',
    repoPath: '03/The_Financial_Architect.mp4',
    streamUrl: resolveStreamUrl('03/The_Financial_Architect.mp4'),
    githubRawUrl: `${GITHUB_RAW_BASE}/03/The_Financial_Architect.mp4`,
    sizeLabel: '37.8 MB · MP4',
  },
  {
    id: 'ch03-podcast',
    chapterId: 'ch03',
    chapterNumber: '03',
    kind: 'podcast',
    title: 'Why SPY Costs Thousands More Than VOO',
    description: 'Breaking down expense ratios, spreads, tracking differences, and how small annual fee gaps compound over decades.',
    filename: 'Why_SPY_Costs_Thousands_More_Than_VOO.m4a',
    repoPath: '03/Why_SPY_Costs_Thousands_More_Than_VOO.m4a',
    streamUrl: resolveStreamUrl('03/Why_SPY_Costs_Thousands_More_Than_VOO.m4a'),
    githubRawUrl: `${GITHUB_RAW_BASE}/03/Why_SPY_Costs_Thousands_More_Than_VOO.m4a`,
    sizeLabel: '45.3 MB · M4A',
  },
  {
    id: 'ch04-video',
    chapterId: 'ch04',
    chapterNumber: '04',
    kind: 'video',
    title: 'Short-Term Trading: Lab Test',
    description: 'Specifying falsifiable breakout hypotheses, OHLCV structure, regime filters, and explicit next-bar execution rules.',
    filename: 'Short-Term_Trading__Lab_Test.mp4',
    repoPath: '04/Short-Term_Trading__Lab_Test.mp4',
    streamUrl: resolveStreamUrl('04/Short-Term_Trading__Lab_Test.mp4'),
    githubRawUrl: `${GITHUB_RAW_BASE}/04/Short-Term_Trading__Lab_Test.mp4`,
    sizeLabel: '40.3 MB · MP4',
  },
  {
    id: 'ch04-podcast',
    chapterId: 'ch04',
    chapterNumber: '04',
    kind: 'podcast',
    title: 'Why High Win Rates Bankrupt Traders',
    description: 'Understanding negative expectancy, asymmetric payoffs, cost drag on small targets, and stop-gap slippage risk.',
    filename: 'Why_High_Win_Rates_Bankrupt_Traders.m4a',
    repoPath: '04/Why_High_Win_Rates_Bankrupt_Traders.m4a',
    streamUrl: resolveStreamUrl('04/Why_High_Win_Rates_Bankrupt_Traders.m4a'),
    githubRawUrl: `${GITHUB_RAW_BASE}/04/Why_High_Win_Rates_Bankrupt_Traders.m4a`,
    sizeLabel: '46.9 MB · M4A',
  },
  {
    id: 'ch05-video',
    chapterId: 'ch05',
    chapterNumber: '05',
    kind: 'video',
    title: 'Algorithmic Trading Lab',
    description: 'Building clean market data contracts, chronological validation splits, bootstrap checks, and paper-trading telemetry.',
    filename: 'Algorithmic_Trading_Lab.mp4',
    repoPath: '05/Algorithmic_Trading_Lab.mp4',
    streamUrl: resolveStreamUrl('05/Algorithmic_Trading_Lab.mp4'),
    githubRawUrl: `${GITHUB_RAW_BASE}/05/Algorithmic_Trading_Lab.mp4`,
    sizeLabel: '44.3 MB · MP4',
  },
  {
    id: 'ch05-podcast',
    chapterId: 'ch05',
    chapterNumber: '05',
    kind: 'podcast',
    title: 'Why Your Backtest Lies to You',
    description: 'Uncovering look-ahead bias, survivorship distortion, overfitting, and execution assumptions that erase apparent edges.',
    filename: 'Why_Your_Backtest_Lies_to_You.m4a',
    repoPath: '05/Why_Your_Backtest_Lies_to_You.m4a',
    streamUrl: resolveStreamUrl('05/Why_Your_Backtest_Lies_to_You.m4a'),
    githubRawUrl: `${GITHUB_RAW_BASE}/05/Why_Your_Backtest_Lies_to_You.m4a`,
    sizeLabel: '52.4 MB · M4A',
  },
];

export function getMediaForChapter(chapterId: string): {
  video?: MediaItem;
  podcast?: MediaItem;
} {
  return {
    video: MEDIA_ITEMS.find((m) => m.chapterId === chapterId && m.kind === 'video'),
    podcast: MEDIA_ITEMS.find((m) => m.chapterId === chapterId && m.kind === 'podcast'),
  };
}
