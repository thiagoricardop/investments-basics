export interface ExpectancyInput {
  winRatePct: number;
  avgWin: number;
  avgLoss: number;
  tradeCost: number;
}

export interface ExpectancyResult {
  grossE: number;
  netE: number;
  payoffRatio: number;
  breakEvenBefore: number;
  breakEvenAfter: number;
}

export function calculateExpectancy(input: ExpectancyInput): ExpectancyResult {
  const p = Math.min(1, Math.max(0, input.winRatePct / 100));
  const grossE = p * input.avgWin - (1 - p) * input.avgLoss;
  const netE = grossE - input.tradeCost;
  const payoffRatio = input.avgLoss > 0 ? input.avgWin / input.avgLoss : 0;
  const denom = input.avgWin + input.avgLoss;
  const breakEvenBefore = denom > 0 ? (input.avgLoss / denom) * 100 : 100;
  const breakEvenAfter = denom > 0 ? Math.min(100, ((input.avgLoss + input.tradeCost) / denom) * 100) : 100;

  return {
    grossE,
    netE,
    payoffRatio,
    breakEvenBefore,
    breakEvenAfter,
  };
}

export interface PositionSizingInput {
  equity: number;
  riskPct: number;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
}

export interface PositionSizingResult {
  riskBudget: number;
  stopDistance: number;
  validStop: boolean;
  shares: number;
  notional: number;
  notionalPct: number;
  rMultiple: number;
  gapLoss2x: number;
}

export function calculatePositionSizing(input: PositionSizingInput): PositionSizingResult {
  const riskBudget = Math.max(0, input.equity) * (Math.max(0, input.riskPct) / 100);
  const validStop = input.entryPrice > input.stopPrice && input.stopPrice > 0;
  const stopDistance = validStop ? input.entryPrice - input.stopPrice : Math.max(0.01, Math.abs(input.entryPrice - input.stopPrice));
  const shares = validStop ? Math.floor(riskBudget / stopDistance) : 0;
  const notional = shares * input.entryPrice;
  const notionalPct = input.equity > 0 ? (notional / input.equity) * 100 : 0;
  const plannedRewardPerShare = Math.max(0, input.targetPrice - input.entryPrice);
  const rMultiple = stopDistance > 0 ? plannedRewardPerShare / stopDistance : 0;
  const gapLoss2x = shares * stopDistance * 2;

  return {
    riskBudget,
    stopDistance,
    validStop,
    shares,
    notional,
    notionalPct,
    rMultiple,
    gapLoss2x,
  };
}

export function calculateDrawdownRecovery(drawdownPct: number): {
  recoveryPct: number;
  remainingCapital: number;
} {
  const clamped = Math.min(99, Math.max(0, drawdownPct));
  const recoveryPct = (1 / (1 - clamped / 100) - 1) * 100;
  const remainingCapital = 10000 * (1 - clamped / 100);
  return { recoveryPct, remainingCapital };
}

export interface CompoundingInput {
  initialCap: number;
  monthlyAdd: number;
  years: number;
  grossReturn: number;
  lowFee: number;
  highFee: number;
}

export interface CompoundingRow {
  year: number;
  lowFeeBal: number;
  highFeeBal: number;
  contributed: number;
}

export function calculateCompoundingComparison(input: CompoundingInput): {
  rows: CompoundingRow[];
  finalLow: number;
  finalHigh: number;
  finalContrib: number;
  feeDragDollar: number;
  maxVal: number;
} {
  const rows: CompoundingRow[] = [];
  const months = Math.max(1, Math.round(input.years)) * 12;
  const rLow = (input.grossReturn - input.lowFee) / 100 / 12;
  const rHigh = (input.grossReturn - input.highFee) / 100 / 12;

  let bLow = Math.max(0, input.initialCap);
  let bHigh = Math.max(0, input.initialCap);
  let contrib = Math.max(0, input.initialCap);

  rows.push({ year: 0, lowFeeBal: bLow, highFeeBal: bHigh, contributed: contrib });

  for (let m = 1; m <= months; m++) {
    bLow = bLow * (1 + rLow) + Math.max(0, input.monthlyAdd);
    bHigh = bHigh * (1 + rHigh) + Math.max(0, input.monthlyAdd);
    contrib += Math.max(0, input.monthlyAdd);
    if (m % 12 === 0) {
      rows.push({
        year: m / 12,
        lowFeeBal: bLow,
        highFeeBal: bHigh,
        contributed: contrib,
      });
    }
  }

  const finalLow = rows[rows.length - 1]?.lowFeeBal ?? input.initialCap;
  const finalHigh = rows[rows.length - 1]?.highFeeBal ?? input.initialCap;
  const finalContrib = rows[rows.length - 1]?.contributed ?? input.initialCap;
  const feeDragDollar = finalLow - finalHigh;
  const maxVal = Math.max(finalLow, finalHigh, finalContrib, 1);

  return { rows, finalLow, finalHigh, finalContrib, feeDragDollar, maxVal };
}
