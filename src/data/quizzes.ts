export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sectionRef: string;
}

export const CHAPTER_QUIZZES: Record<string, QuizQuestion[]> = {
  ch01: [
    {
      id: 'ch01-q1',
      prompt: 'A strategy wins 60% of trades, gains $40 on an average win, loses $70 on an average loss, and pays $2 in average round-trip costs. What is its net expectancy per trade?',
      options: ['+$4.00 per trade', '−$4.00 per trade', '−$6.00 per trade', '+$6.00 per trade'],
      correctIndex: 2,
      explanation: 'E = 0.60($40) − 0.40($70) − $2 = $24 − $28 − $2 = −$6.00 per trade. A high win rate can still produce negative expectancy when average losses exceed average wins.',
      sectionRef: 'Section 6.4 · Expectancy, win rate, and payoff ratio',
    },
    {
      id: 'ch01-q2',
      prompt: 'If a portfolio falls from $10,000 to $5,000 (a 50% drawdown), what percentage gain on the remaining balance is required simply to recover to $10,000?',
      options: ['50%', '75%', '100%', '150%'],
      correctIndex: 2,
      explanation: 'Recovery gain = ($10,000 ÷ $5,000) − 1 = +100%. Drawdowns and recoveries are asymmetric because the recovery compounds on a smaller capital base.',
      sectionRef: 'Section 6.7 · Drawdown and recovery math',
    },
    {
      id: 'ch01-q3',
      prompt: 'Which statement accurately describes a standard stop-loss (stop-market) order?',
      options: [
        'It guarantees execution at the exact stop trigger price.',
        'It becomes a market order once the stop trigger is reached and can gap through at a worse fill.',
        'It cancels automatically if the bid/ask spread widens beyond $0.05.',
        'It converts into a limit order that refuses fills below the trigger price.',
      ],
      correctIndex: 1,
      explanation: 'A stop order triggers a market order after the stop price is reached; overnight gaps or thin liquidity can produce fills significantly worse than the stop price.',
      sectionRef: 'Section 4.3 · Main order types and their trade-offs',
    },
  ],
  ch02: [
    {
      id: 'ch02-q1',
      prompt: 'In an oil futures curve in contango, later-dated contracts trade above nearer-dated contracts. All else equal, what is the mechanical roll effect when a fund rolls from the expiring contract into the next month?',
      options: [
        'Positive roll yield from buying cheaper contracts',
        'Negative roll effect from selling lower and buying a higher-priced later contract',
        'Zero impact because futures contracts do not expire',
        'Guaranteed dividend income equal to spot WTI yield',
      ],
      correctIndex: 1,
      explanation: 'In contango, selling the lower-priced near contract and buying the higher-priced next contract creates a negative roll headwind if the curve level does not otherwise shift upward.',
      sectionRef: 'Section 3.4 · Contango, backwardation and roll yield',
    },
    {
      id: 'ch02-q2',
      prompt: 'What is the key legal difference between holding spot BTC in a self-custody wallet versus holding shares of a spot Bitcoin ETP in a brokerage account?',
      options: [
        'Spot Bitcoin ETPs have zero management fees or tracking differences.',
        'ETP shareholders own fund/security shares governed by market sessions and issuer custody, not direct private keys on the Bitcoin network.',
        'Self-custody wallets are insured by SIPC up to $500,000.',
        'Spot Bitcoin ETPs trade 24/7 including weekends.',
      ],
      correctIndex: 1,
      explanation: 'An ETP shareholder holds a brokerage security subject to exchange hours, expense ratios, and NAV/market-price differences rather than direct control of private keys.',
      sectionRef: 'Section 3.2 · Bitcoin spot versus Bitcoin securities',
    },
    {
      id: 'ch02-q3',
      prompt: 'Why does the Chapter 02 study sequence start with a broad, liquid U.S. equity index ETF and a Treasury/cash benchmark before studying oil futures?',
      options: [
        'Because equity ETFs are guaranteed to outperform commodities every year.',
        'Because a broad equity ETF has transparent holdings, regular exchange hours, and simpler structure without futures expiry or roll mechanics.',
        'Because Treasury bills never fluctuate in secondary-market price.',
        'Because oil futures have lower volatility than broad equity indexes.',
      ],
      correctIndex: 1,
      explanation: 'The learning scorecard prioritizes structural simplicity, data quality, and clear execution mechanics—not a prediction of future return.',
      sectionRef: 'Section 2 · 80/20 — what matters most',
    },
  ],
  ch03: [
    {
      id: 'ch03-q1',
      prompt: 'What is the practical distinction between risk tolerance and risk capacity?',
      options: [
        'Risk tolerance is set by your broker; risk capacity is set by the SEC.',
        'Risk tolerance is psychological willingness to absorb swings; risk capacity is financial ability to absorb losses without harming near-term goals.',
        'They are identical terms measured by a single questionnaire.',
        'Risk capacity only applies to leveraged derivatives.',
      ],
      correctIndex: 1,
      explanation: 'An investor saving for a down payment due in two years may feel calm about volatility (high tolerance) yet have low financial capacity to risk a sharp equity decline before the spending date.',
      sectionRef: 'Section 3.3 · Risk tolerance versus risk capacity',
    },
    {
      id: 'ch03-q2',
      prompt: 'Why does Chapter 03 emphasize reading the income statement, balance sheet, and cash-flow statement together?',
      options: [
        'Accounting profit alone can rise while cash conversion weakens, debt grows, share count dilutes, or capital expenditures consume cash.',
        'Only the balance sheet reports revenue.',
        'Cash-flow statements ignore capital expenditures.',
        'Because SEC 10-Q filings omit net income.',
      ],
      correctIndex: 0,
      explanation: 'Evaluating all three statements reveals earnings quality, free cash flow conversion, leverage, and dilution rather than relying on headline EPS alone.',
      sectionRef: 'Section 2 · 80/20 — what matters most',
    },
    {
      id: 'ch03-q3',
      prompt: 'What is the primary purpose of writing an Investment Policy Statement (IPS) and following scheduled rebalancing rules?',
      options: [
        'To predict next quarter’s interest rate path',
        'To act as a behavioral control system that prevents chasing recent winners or panic selling after headlines',
        'To eliminate market drawdowns completely',
        'To maximize annual portfolio turnover',
      ],
      correctIndex: 1,
      explanation: 'An IPS pre-commits allocation ranges, position limits, and review triggers before emotional market moves occur.',
      sectionRef: 'Section 3.4 · Write an investment policy before selecting products',
    },
  ],
  ch04: [
    {
      id: 'ch04-q1',
      prompt: 'With a $10,000 account, a 0.5% risk budget ($50), entry at $25.00, and planned stop at $23.75, what is the planned share quantity?',
      options: ['20 shares', '40 shares', '80 shares', '400 shares'],
      correctIndex: 1,
      explanation: 'Stop distance is $25.00 − $23.75 = $1.25/share. Quantity = floor($50 ÷ $1.25) = 40 shares ($1,000 notional commitment).',
      sectionRef: 'Section 6 · Position sizing and stop-gap risk',
    },
    {
      id: 'ch04-q2',
      prompt: 'In a daily-bar swing strategy where a breakout signal is observed at Day t’s close, what is the earliest realistic historical simulation fill?',
      options: [
        'Day t’s intraday low',
        'Day t’s close (using information before the bell finished)',
        'Day t+1’s open (or next session)',
        'Five sessions prior to Day t',
      ],
      correctIndex: 2,
      explanation: 'A signal computed from Day t’s closing price is only known after the close; entering on Day t’s open or close introduces look-ahead bias.',
      sectionRef: 'Section 2 · 80/20 — what matters most',
    },
    {
      id: 'ch04-q3',
      prompt: 'If a trader plots RSI, Stochastic, and MACD simultaneously and all three turn upward together, what does that prove?',
      options: [
        'Three independent statistical confirmations of an edge',
        'Very little independently—all three transform the same underlying past price/volume series',
        'A guaranteed breakout above resistance',
        'Zero possibility of a false signal',
      ],
      correctIndex: 1,
      explanation: 'Momentum oscillators derived from the same OHLCV price history are collinear; agreement among redundant indicators does not add independent confirmation.',
      sectionRef: 'Section 5 · Essential indicators: purpose, calculation, and limitations',
    },
  ],
  ch05: [
    {
      id: 'ch05-q1',
      prompt: 'How should historical market data be partitioned into train, validation, and final holdout sets?',
      options: [
        'Randomly shuffle all daily bars across decades before splitting 60/20/20',
        'Split strictly chronologically (earlier development data, middle validation, final untouched holdout)',
        'Optimize parameters repeatedly on the final holdout until Sharpe exceeds 2.0',
        'Forward-fill missing exchange holiday bars with synthetic prices',
      ],
      correctIndex: 1,
      explanation: 'Time-series observations have temporal dependence; random shuffling leaks future regime information into training, and tuning on the holdout invalidates out-of-sample testing.',
      sectionRef: 'Section 5 · Chronological validation and resampling',
    },
    {
      id: 'ch05-q2',
      prompt: 'When evaluating a 20-session prior high feature on bar t, why must the rolling window use High.shift(1).rolling(20).max()?',
      options: [
        'To double the sample size',
        'To exclude bar t’s own high (which is unknown until bar t ends) and prevent look-ahead bias',
        'To adjust historical prices for cash dividends',
        'To convert daily bars into weekly bars',
      ],
      correctIndex: 1,
      explanation: 'Without shift(1), row t compares against a 20-bar high that includes row t itself—leaking future intraday extrema into the entry trigger.',
      sectionRef: 'Section 4 · Common backtest biases',
    },
    {
      id: 'ch05-q3',
      prompt: 'Why should raw OHLC prices not be mixed carelessly with dividend-adjusted close prices in an execution simulator?',
      options: [
        'Adjusted closes can diverge from historical raw Open/High/Low quotes, distorting stop triggers and fill prices',
        'Raw prices omit volume',
        'Dividend adjustments only affect cryptocurrency feeds',
        'Adjusted close is always higher than raw close',
      ],
      correctIndex: 0,
      explanation: 'Execution simulation should track raw historical executable levels alongside a separate corporate-action/dividend ledger rather than mixing adjusted and unadjusted price columns.',
      sectionRef: 'Section 2.3 · Raw versus adjusted prices',
    },
  ],
};
