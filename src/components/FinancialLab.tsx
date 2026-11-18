import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  calculateCompoundingComparison,
  calculateDrawdownRecovery,
  calculateExpectancy,
  calculatePositionSizing,
} from '../utils/financeMath';
import { type SuggestedLabTab } from '../data/curriculum';
import { GlossaryFlashcards } from './GlossaryFlashcards';
import { ChapterExercises } from './ChapterExercises';

export type PracticeMode = 'equations' | 'exercises' | 'glossary';
type LabTab = 'expectancy' | 'sizing' | 'drawdown' | 'compounding';

interface FinancialLabProps {
  initialMode?: PracticeMode;
  initialExerciseChapter?: string;
  completedExercises?: Record<string, boolean>;
  exerciseNotes?: Record<string, string>;
  onToggleExerciseComplete?: (exerciseId: string) => void;
  onChangeExerciseNote?: (exerciseId: string, text: string) => void;
  onJumpToChapter: (chapterId: string, headingId?: string) => void;
}

export const FinancialLab: React.FC<FinancialLabProps> = ({
  initialMode = 'equations',
  initialExerciseChapter = 'all',
  completedExercises = {},
  exerciseNotes = {},
  onToggleExerciseComplete = () => {},
  onChangeExerciseNote = () => {},
  onJumpToChapter,
}) => {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(initialMode);
  const [activeTab, setActiveTab] = useState<LabTab>('expectancy');

  // 1. Expectancy State (Ch 01 §6.4)
  const [winRate, setWinRate] = useState(60);
  const [avgWin, setAvgWin] = useState(40);
  const [avgLoss, setAvgLoss] = useState(70);
  const [tradeCost, setTradeCost] = useState(2);

  // 2. Position Sizing State (Ch 01 §6.6)
  const [equity, setEquity] = useState(10000);
  const [riskPct, setRiskPct] = useState(0.5);
  const [entryPrice, setEntryPrice] = useState(25);
  const [stopPrice, setStopPrice] = useState(23.75);
  const [targetPrice, setTargetPrice] = useState(27.5);

  // 3. Drawdown State (Ch 01 §6.7)
  const [drawdownPct, setDrawdownPct] = useState(15);

  // 4. Compounding & Fee Drag State (Ch 01 §6.2 & Ch 03)
  const [initialCap, setInitialCap] = useState(10000);
  const [monthlyAdd, setMonthlyAdd] = useState(300);
  const [years, setYears] = useState(25);
  const [grossReturn, setGrossReturn] = useState(7.5);
  const [lowFee, setLowFee] = useState(0.05);
  const [highFee, setHighFee] = useState(1.1);

  const expectancyMetrics = useMemo(
    () => calculateExpectancy({ winRatePct: winRate, avgWin, avgLoss, tradeCost }),
    [winRate, avgWin, avgLoss, tradeCost]
  );

  const sizingMetrics = useMemo(
    () => calculatePositionSizing({ equity, riskPct, entryPrice, stopPrice, targetPrice }),
    [equity, riskPct, entryPrice, stopPrice, targetPrice]
  );

  const drawdownCurve = useMemo(() => {
    const pts: { dd: number; rec: number }[] = [];
    for (let dd = 0; dd <= 80; dd += 2) {
      pts.push({ dd, rec: calculateDrawdownRecovery(dd).recoveryPct });
    }
    const { recoveryPct: currentRecovery, remainingCapital } =
      calculateDrawdownRecovery(drawdownPct);
    return { pts, currentRecovery, remainingCapital };
  }, [drawdownPct]);

  const compoundingSeries = useMemo(
    () =>
      calculateCompoundingComparison({
        initialCap,
        monthlyAdd,
        years,
        grossReturn,
        lowFee,
        highFee,
      }),
    [initialCap, monthlyAdd, years, grossReturn, lowFee, highFee]
  );

  const handleOpenEquationsTab = (tab: SuggestedLabTab) => {
    setActiveTab(tab);
    setPracticeMode('equations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TABS: { id: LabTab; label: string; refChapter: string }[] = [
    { id: 'expectancy', label: 'Expectancy & Break-Even', refChapter: 'ch01' },
    { id: 'sizing', label: 'Position Sizing', refChapter: 'ch01' },
    { id: 'drawdown', label: 'Drawdown Recovery', refChapter: 'ch01' },
    { id: 'compounding', label: 'Compounding & Fee Drag', refChapter: 'ch03' },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-8 py-8 sm:py-10">
      <div className="mb-8 border-b border-stone-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium tracking-wider uppercase text-stone-500 dark:text-slate-400">
          Interactive Practice Suite · Exercises, Models &amp; Vocabulary
        </p>
        <div className="mt-2 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              {practiceMode === 'equations'
                ? 'Curriculum Equations Laboratory'
                : practiceMode === 'exercises'
                  ? 'Chapter Exercises & Research Labs'
                  : 'Glossary & Flashcard Drill'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-stone-600 dark:text-slate-300">
              {practiceMode === 'equations'
                ? 'Test the mathematical relationships from Chapters 01, 03, and 04 interactively. All models are educational simplifications without tax or live fills.'
                : practiceMode === 'exercises'
                  ? 'Work through all 41 chapter exercises and backtesting labs using built-in scratchpads, spoiler-protected worked solutions, and live formula checks.'
                  : 'Drill key financial mechanics and backtesting terminology extracted directly from all five chapters.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/80 dark:bg-slate-900 p-1 w-fit shrink-0">
            <button
              type="button"
              onClick={() => setPracticeMode('exercises')}
              className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
                practiceMode === 'exercises'
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Chapter Exercises (41)
            </button>
            <button
              type="button"
              onClick={() => setPracticeMode('equations')}
              className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
                practiceMode === 'equations'
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Equations Lab
            </button>
            <button
              type="button"
              onClick={() => setPracticeMode('glossary')}
              className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
                practiceMode === 'glossary'
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Glossary Flashcards
            </button>
          </div>
        </div>

        {practiceMode === 'equations' && (
          <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/80 dark:bg-slate-900 p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {practiceMode === 'exercises' ? (
        <ChapterExercises
          key={initialExerciseChapter}
          initialChapterFilter={initialExerciseChapter}
          completedExercises={completedExercises}
          exerciseNotes={exerciseNotes}
          onToggleExerciseComplete={onToggleExerciseComplete}
          onChangeExerciseNote={onChangeExerciseNote}
          onJumpToChapter={onJumpToChapter}
          onOpenEquationsTab={handleOpenEquationsTab}
        />
      ) : practiceMode === 'glossary' ? (
        <GlossaryFlashcards onJumpToChapter={onJumpToChapter} />
      ) : (
        <>

      {/* TAB 1: EXPECTANCY */}
      {activeTab === 'expectancy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-white">
                    Net Expectancy Across Win Rates
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    E = p(W) − (1 − p)(L) − C
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded border ${
                    expectancyMetrics.netE > 0
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : Math.abs(expectancyMetrics.netE) < 0.01
                        ? 'border-stone-200 bg-stone-100 text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  {expectancyMetrics.netE > 0
                    ? 'Positive Net Expectancy'
                    : Math.abs(expectancyMetrics.netE) < 0.01
                      ? 'Break-Even Expectancy'
                      : 'Negative Net Expectancy'}
                </span>
              </div>

              {/* SVG Chart */}
              <div className="mt-4">
                {(() => {
                  const w = 560;
                  const h = 250;
                  const padL = 54;
                  const padR = 20;
                  const padT = 20;
                  const padB = 34;
                  const plotW = w - padL - padR;
                  const plotH = h - padT - padB;

                  const minY = -avgLoss - tradeCost;
                  const maxY = Math.max(avgWin - tradeCost, 10);
                  const rangeY = Math.max(1, maxY - minY);

                  const toX = (pct: number) => padL + (pct / 100) * plotW;
                  const toY = (val: number) => padT + ((maxY - val) / rangeY) * plotH;

                  const yZero = toY(0);
                  const yStart = toY(-avgLoss - tradeCost);
                  const yEnd = toY(avgWin - tradeCost);
                  const xCurr = toX(winRate);
                  const yCurr = toY(expectancyMetrics.netE);
                  const xBE = Math.min(100, Math.max(0, expectancyMetrics.breakEvenAfter));

                  return (
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible" role="img" aria-label="Expectancy vs win rate line chart">
                      {/* Grid */}
                      <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="currentColor" className="text-stone-300 dark:text-slate-700" strokeWidth="1" />
                      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="currentColor" className="text-stone-300 dark:text-slate-700" strokeWidth="1" />

                      {/* Zero line */}
                      {yZero >= padT && yZero <= h - padB && (
                        <>
                          <line
                            x1={padL}
                            y1={yZero}
                            x2={w - padR}
                            y2={yZero}
                            stroke="currentColor"
                            className="text-stone-400 dark:text-slate-500"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                          <text x={padL - 8} y={yZero + 4} textAnchor="end" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                            $0
                          </text>
                        </>
                      )}

                      {/* Axis labels */}
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <text key={tick} x={toX(tick)} y={h - 12} textAnchor="middle" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                          {tick}%
                        </text>
                      ))}
                      <text x={padL - 8} y={padT + 4} textAnchor="end" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                        +${Math.round(maxY)}
                      </text>
                      <text x={padL - 8} y={h - padB} textAnchor="end" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                        -${Math.round(Math.abs(minY))}
                      </text>

                      {/* Line */}
                      <line
                        x1={toX(0)}
                        y1={yStart}
                        x2={toX(100)}
                        y2={yEnd}
                        stroke="#1E3A8A"
                        className="dark:stroke-blue-400"
                        strokeWidth="2.5"
                      />

                      {/* Break-even vertical guide */}
                      {expectancyMetrics.breakEvenAfter <= 100 && (
                        <>
                          <line
                            x1={toX(xBE)}
                            y1={padT}
                            x2={toX(xBE)}
                            y2={h - padB}
                            stroke="#B45309"
                            className="dark:stroke-amber-400"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                          />
                          <circle cx={toX(xBE)} cy={yZero} r="4.5" fill="#B45309" className="dark:fill-amber-400" />
                          <text
                            x={Math.min(w - padR - 45, toX(xBE) + 6)}
                            y={padT + 12}
                            className="fill-amber-800 dark:fill-amber-300 text-[10px] font-mono"
                          >
                            BE: {expectancyMetrics.breakEvenAfter.toFixed(1)}%
                          </text>
                        </>
                      )}

                      {/* Active point */}
                      <circle
                        cx={xCurr}
                        cy={yCurr}
                        r="6"
                        fill={expectancyMetrics.netE >= 0 ? '#047857' : '#BE123C'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    </svg>
                  );
                })()}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-stone-200 dark:border-slate-800 pt-4">
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Net Expectancy</div>
                <div className={`mt-1 text-lg font-mono font-semibold tabular-nums ${expectancyMetrics.netE >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {expectancyMetrics.netE >= 0 ? '+' : '−'}${Math.abs(expectancyMetrics.netE).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Payoff Ratio (W/L)</div>
                <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                  {expectancyMetrics.payoffRatio.toFixed(2)}×
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Break-Even (Gross)</div>
                <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                  {expectancyMetrics.breakEvenBefore.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Break-Even (Net)</div>
                <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {expectancyMetrics.breakEvenAfter.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-[#141A22] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-stone-900 dark:text-white">
                Parameters
              </h3>
              <button
                type="button"
                onClick={() => {
                  setWinRate(60);
                  setAvgWin(40);
                  setAvgLoss(70);
                  setTradeCost(2);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Ch. 01 Example</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <label htmlFor="win-rate-slider" className="text-stone-700 dark:text-slate-300">Win Rate (p)</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">{winRate}%</span>
                </div>
                <input
                  id="win-rate-slider"
                  type="range"
                  min={5}
                  max={95}
                  step={1}
                  value={winRate}
                  onChange={(e) => setWinRate(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <label htmlFor="avg-win-slider" className="text-stone-700 dark:text-slate-300">Average Winning Trade ($)</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">${avgWin}</span>
                </div>
                <input
                  id="avg-win-slider"
                  type="range"
                  min={10}
                  max={250}
                  step={5}
                  value={avgWin}
                  onChange={(e) => setAvgWin(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <label htmlFor="avg-loss-slider" className="text-stone-700 dark:text-slate-300">Average Losing Trade ($)</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">${avgLoss}</span>
                </div>
                <input
                  id="avg-loss-slider"
                  type="range"
                  min={10}
                  max={250}
                  step={5}
                  value={avgLoss}
                  onChange={(e) => setAvgLoss(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <label htmlFor="cost-slider" className="text-stone-700 dark:text-slate-300">Average Round-Trip Costs ($)</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">${tradeCost}</span>
                </div>
                <input
                  id="cost-slider"
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={tradeCost}
                  onChange={(e) => setTradeCost(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>
            </div>

            <div className="border-t border-stone-200 dark:border-slate-800 pt-4 space-y-2">
              <p className="text-xs font-medium text-stone-700 dark:text-slate-300">Textbook Presets</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWinRate(60);
                    setAvgWin(40);
                    setAvgLoss(70);
                    setTradeCost(2);
                  }}
                  className="rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A]"
                >
                  Ch. 01 Trap (60% Win, +$40/−$70)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWinRate(65);
                    setAvgWin(60);
                    setAvgLoss(100);
                    setTradeCost(10);
                  }}
                  className="rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A]"
                >
                  Ch. 04 Scalping Drag (65% Win, +0.6R)
                </button>
              </div>
              <button
                type="button"
                onClick={() => onJumpToChapter('ch01')}
                className="inline-block pt-1 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 underline underline-offset-2"
              >
                Read Chapter 01 §6.4 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POSITION SIZING */}
      {activeTab === 'sizing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-white">
                Fixed-Risk Position Sizing &amp; Gap Stress
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Quantity = floor(Risk Budget ÷ (Entry Price − Planned Stop Price))
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 p-4">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Planned Share Quantity</div>
                  <div className="mt-1 text-3xl font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    {sizingMetrics.validStop ? `${sizingMetrics.shares} shares` : 'Invalid stop'}
                  </div>
                  <div className="mt-1 text-xs text-stone-500 dark:text-slate-400 font-mono tabular-nums">
                    Risk distance: ${sizingMetrics.stopDistance.toFixed(2)} / share
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 p-4">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Notional Capital Committed</div>
                  <div className="mt-1 text-3xl font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    ${sizingMetrics.notional.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="mt-1 text-xs text-stone-500 dark:text-slate-400 font-mono tabular-nums">
                    {sizingMetrics.notionalPct.toFixed(1)}% of account equity
                  </div>
                </div>
              </div>

              {/* Visual Exposure Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-stone-600 dark:text-slate-300 mb-1.5">
                  <span>Account Notional Allocation</span>
                  <span className="font-mono tabular-nums">
                    {sizingMetrics.notionalPct > 100
                      ? 'Exceeds Cash Equity (Margin Required)'
                      : `${sizingMetrics.notionalPct.toFixed(1)}% Allocated`}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all duration-200 ${
                      sizingMetrics.notionalPct > 100
                        ? 'bg-rose-600'
                        : sizingMetrics.notionalPct > 40
                          ? 'bg-amber-600'
                          : 'bg-[#1E3A8A] dark:bg-blue-400'
                    }`}
                    style={{ width: `${Math.min(100, sizingMetrics.notionalPct)}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-slate-900/50 p-4">
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Stop-Gap Reality Check (Ch. 01 §6.6 &amp; Ch. 04 §6)
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-slate-300">
                  Your planned risk budget is <span className="font-mono tabular-nums font-medium">${sizingMetrics.riskBudget.toFixed(2)}</span>. If an overnight gap opens 2× past your planned stop distance, realized loss before slippage would be{' '}
                  <span className="font-mono tabular-nums font-semibold text-rose-700 dark:text-rose-400">
                    ${sizingMetrics.gapLoss2x.toFixed(2)}
                  </span>{' '}
                  ({((sizingMetrics.gapLoss2x / Math.max(1, equity)) * 100).toFixed(2)}% of equity).
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-stone-200 dark:border-slate-800 pt-4">
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Planned Risk Budget</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                  ${sizingMetrics.riskBudget.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Planned R-Multiple</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                  {sizingMetrics.rMultiple.toFixed(2)} : 1
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Target Gross Gain</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  +${(sizingMetrics.shares * Math.max(0, targetPrice - entryPrice)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-[#141A22] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-stone-900 dark:text-white">Trade Plan Inputs</h3>
              <button
                type="button"
                onClick={() => {
                  setEquity(10000);
                  setRiskPct(0.5);
                  setEntryPrice(25);
                  setStopPrice(23.75);
                  setTargetPrice(27.5);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Ch. 01 Example</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              <label className="block">
                <span className="text-xs font-medium text-stone-700 dark:text-slate-300">Account Equity ($)</span>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={equity}
                  onChange={(e) => setEquity(Math.max(100, Number(e.target.value)))}
                  className="mt-1 w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-stone-900 dark:text-white"
                />
              </label>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <label htmlFor="risk-pct-slider" className="text-stone-700 dark:text-slate-300">Risk Budget (% of Equity)</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">{riskPct.toFixed(2)}%</span>
                </div>
                <input
                  id="risk-pct-slider"
                  type="range"
                  min={0.25}
                  max={3}
                  step={0.25}
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <label className="block">
                  <span className="text-xs font-medium text-stone-700 dark:text-slate-300">Entry ($)</span>
                  <input
                    type="number"
                    min={1}
                    step={0.25}
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Math.max(0.01, Number(e.target.value)))}
                    className="mt-1 w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm font-mono tabular-nums text-stone-900 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-stone-700 dark:text-slate-300">Stop ($)</span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.25}
                    value={stopPrice}
                    onChange={(e) => setStopPrice(Math.max(0.01, Number(e.target.value)))}
                    className="mt-1 w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm font-mono tabular-nums text-stone-900 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-stone-700 dark:text-slate-300">Target ($)</span>
                  <input
                    type="number"
                    min={1}
                    step={0.25}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Math.max(0.01, Number(e.target.value)))}
                    className="mt-1 w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm font-mono tabular-nums text-stone-900 dark:text-white"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onJumpToChapter('ch01')}
              className="inline-block pt-2 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 underline underline-offset-2"
            >
              Read Chapter 01 §6.6 →
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DRAWDOWN RECOVERY */}
      {activeTab === 'drawdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-white">
              Drawdown vs. Required Recovery Gain
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Recovery Gain = (1 ÷ (1 − Drawdown)) − 1
            </p>

            <div className="mt-5">
              {(() => {
                const w = 560;
                const h = 250;
                const padL = 54;
                const padR = 20;
                const padT = 20;
                const padB = 34;
                const plotW = w - padL - padR;
                const plotH = h - padT - padB;
                const maxRec = 400;

                const toX = (dd: number) => padL + (dd / 80) * plotW;
                const toY = (rec: number) => padT + ((maxRec - Math.min(maxRec, rec)) / maxRec) * plotH;

                const pathD = drawdownCurve.pts
                  .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(pt.dd).toFixed(1)} ${toY(pt.rec).toFixed(1)}`)
                  .join(' ');

                const linearD = `M ${toX(0)} ${toY(0)} L ${toX(80)} ${toY(80)}`;

                return (
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Drawdown recovery curve">
                    <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="currentColor" className="text-stone-300 dark:text-slate-700" strokeWidth="1" />
                    <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="currentColor" className="text-stone-300 dark:text-slate-700" strokeWidth="1" />

                    {[0, 100, 200, 300, 400].map((val) => (
                      <g key={val}>
                        <line x1={padL} y1={toY(val)} x2={w - padR} y2={toY(val)} stroke="currentColor" className="text-stone-100 dark:text-slate-800" strokeWidth="1" />
                        <text x={padL - 8} y={toY(val) + 4} textAnchor="end" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                          +{val}%
                        </text>
                      </g>
                    ))}

                    {[0, 20, 40, 60, 80].map((dd) => (
                      <text key={dd} x={toX(dd)} y={h - 12} textAnchor="middle" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                        −{dd}%
                      </text>
                    ))}

                    <path d={linearD} fill="none" stroke="currentColor" className="text-stone-400 dark:text-slate-500" strokeWidth="1.2" strokeDasharray="4 4" />
                    <path d={pathD} fill="none" stroke="#BE123C" className="dark:stroke-rose-400" strokeWidth="2.5" />

                    <circle
                      cx={toX(drawdownPct)}
                      cy={toY(drawdownCurve.currentRecovery)}
                      r="6"
                      fill="#1E3A8A"
                      className="dark:fill-blue-400"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </svg>
                );
              })()}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-[#141A22] p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold text-stone-900 dark:text-white">
                Explore Drawdown Depth
              </h3>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <label htmlFor="dd-slider" className="text-stone-700 dark:text-slate-300">Peak-to-Trough Drawdown</label>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400">−{drawdownPct}%</span>
                </div>
                <input
                  id="dd-slider"
                  type="range"
                  min={1}
                  max={80}
                  step={1}
                  value={drawdownPct}
                  onChange={(e) => setDrawdownPct(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Remaining of $10,000</div>
                  <div className="mt-1 text-xl font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    ${drawdownCurve.remainingCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Gain Needed to Recover</div>
                  <div className="mt-1 text-xl font-mono font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                    +{drawdownCurve.currentRecovery.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-medium text-stone-700 dark:text-slate-300 mb-2">Benchmark Drawdowns</p>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 25, 50, 75].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDrawdownPct(d)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono tabular-nums transition-colors ${
                        drawdownPct === d
                          ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-blue-400 dark:bg-blue-500'
                          : 'border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      −{d}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onJumpToChapter('ch01')}
              className="text-left text-xs font-medium text-[#1E3A8A] dark:text-blue-300 underline underline-offset-2"
            >
              Read Chapter 01 §6.7 →
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: COMPOUNDING & FEE DRAG */}
      {activeTab === 'compounding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-white">
                Long-Term Compounding &amp; Annual Fee Drag
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Constant hypothetical return comparison (no market volatility or taxes modeled)
              </p>

              <div className="mt-4">
                {(() => {
                  const w = 560;
                  const h = 250;
                  const padL = 64;
                  const padR = 20;
                  const padT = 20;
                  const padB = 34;
                  const plotW = w - padL - padR;
                  const plotH = h - padT - padB;
                  const maxV = compoundingSeries.maxVal;

                  const toX = (yr: number) => padL + (yr / Math.max(1, years)) * plotW;
                  const toY = (val: number) => padT + ((maxV - val) / maxV) * plotH;

                  const pathLow = compoundingSeries.rows
                    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${toX(r.year).toFixed(1)} ${toY(r.lowFeeBal).toFixed(1)}`)
                    .join(' ');
                  const pathHigh = compoundingSeries.rows
                    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${toX(r.year).toFixed(1)} ${toY(r.highFeeBal).toFixed(1)}`)
                    .join(' ');
                  const pathContrib = compoundingSeries.rows
                    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${toX(r.year).toFixed(1)} ${toY(r.contributed).toFixed(1)}`)
                    .join(' ');

                  return (
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Compounding and fee drag comparison chart">
                      <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="currentColor" className="text-stone-300 dark:text-slate-700" strokeWidth="1" />
                      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="currentColor" className="text-stone-300 dark:text-slate-700" strokeWidth="1" />

                      {[0, 0.5, 1].map((frac) => {
                        const val = maxV * frac;
                        return (
                          <g key={frac}>
                            <line x1={padL} y1={toY(val)} x2={w - padR} y2={toY(val)} stroke="currentColor" className="text-stone-100 dark:text-slate-800" strokeWidth="1" />
                            <text x={padL - 8} y={toY(val) + 4} textAnchor="end" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                              ${Math.round(val / 1000)}k
                            </text>
                          </g>
                        );
                      })}

                      <text x={toX(0)} y={h - 12} textAnchor="middle" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                        Yr 0
                      </text>
                      <text x={toX(Math.round(years / 2))} y={h - 12} textAnchor="middle" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                        Yr {Math.round(years / 2)}
                      </text>
                      <text x={toX(years)} y={h - 12} textAnchor="middle" className="fill-stone-500 dark:fill-slate-400 text-[10px] font-mono">
                        Yr {years}
                      </text>

                      <path d={pathContrib} fill="none" stroke="currentColor" className="text-stone-400 dark:text-slate-500" strokeWidth="1.5" strokeDasharray="4 4" />
                      <path d={pathHigh} fill="none" stroke="#B45309" className="dark:stroke-amber-400" strokeWidth="2.2" />
                      <path d={pathLow} fill="none" stroke="#1E3A8A" className="dark:stroke-blue-400" strokeWidth="2.5" />
                    </svg>
                  );
                })()}
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[#1E3A8A] dark:bg-blue-400 inline-block" /> Low-Fee ({lowFee.toFixed(2)}%)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-amber-700 dark:bg-amber-400 inline-block" /> High-Fee ({highFee.toFixed(2)}%)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t border-dashed border-stone-400 inline-block" /> Principal Contributed
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-stone-200 dark:border-slate-800 pt-4">
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">Low-Fee Ending Balance</div>
                <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-[#1E3A8A] dark:text-blue-300">
                  ${Math.round(compoundingSeries.finalLow).toLocaleString('en-US')}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-slate-400">High-Fee Ending Balance</div>
                <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  ${Math.round(compoundingSeries.finalHigh).toLocaleString('en-US')}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-xs text-stone-500 dark:text-slate-400">Cumulative Fee Drag</div>
                <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                  −${Math.round(Math.max(0, compoundingSeries.feeDragDollar)).toLocaleString('en-US')}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-[#141A22] p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-stone-900 dark:text-white">
              Compounding Schedule
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-stone-700 dark:text-slate-300">Initial Capital ($)</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={initialCap}
                  onChange={(e) => setInitialCap(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-stone-900 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-stone-700 dark:text-slate-300">Monthly Deposit ($)</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={monthlyAdd}
                  onChange={(e) => setMonthlyAdd(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-stone-900 dark:text-white"
                />
              </label>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <label htmlFor="years-slider" className="text-stone-700 dark:text-slate-300">Horizon (Years)</label>
                <span className="font-mono tabular-nums text-stone-900 dark:text-white">{years} yrs</span>
              </div>
              <input
                id="years-slider"
                type="range"
                min={5}
                max={40}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-[#1E3A8A] dark:accent-blue-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <label htmlFor="gross-slider" className="text-stone-700 dark:text-slate-300">Assumed Gross Return (%/yr)</label>
                <span className="font-mono tabular-nums text-stone-900 dark:text-white">{grossReturn.toFixed(1)}%</span>
              </div>
              <input
                id="gross-slider"
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={grossReturn}
                onChange={(e) => setGrossReturn(Number(e.target.value))}
                className="w-full accent-[#1E3A8A] dark:accent-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <label htmlFor="low-fee-slider" className="text-stone-700 dark:text-slate-300">Low Fee</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">{lowFee.toFixed(2)}%</span>
                </div>
                <input
                  id="low-fee-slider"
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={lowFee}
                  onChange={(e) => setLowFee(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <label htmlFor="high-fee-slider" className="text-stone-700 dark:text-slate-300">High Fee</label>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-white">{highFee.toFixed(2)}%</span>
                </div>
                <input
                  id="high-fee-slider"
                  type="range"
                  min={0.2}
                  max={2.5}
                  step={0.05}
                  value={highFee}
                  onChange={(e) => setHighFee(Number(e.target.value))}
                  className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onJumpToChapter('ch03')}
              className="inline-block pt-2 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 underline underline-offset-2"
            >
              Read Chapter 03 Compounding &amp; Fees →
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </section>
  );
};
