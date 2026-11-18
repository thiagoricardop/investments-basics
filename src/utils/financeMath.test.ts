import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCompoundingComparison,
  calculateDrawdownRecovery,
  calculateExpectancy,
  calculatePositionSizing,
} from './financeMath';

test('calculateExpectancy reproduces Ch. 01 high-win-rate negative-expectancy example', () => {
  const res = calculateExpectancy({
    winRatePct: 60,
    avgWin: 40,
    avgLoss: 70,
    tradeCost: 2,
  });

  assert.ok(Math.abs(res.grossE - -4) < 1e-6);
  assert.ok(Math.abs(res.netE - -6) < 1e-6);
  assert.ok(Math.abs(res.payoffRatio - 40 / 70) < 1e-6);
  assert.ok(Math.abs(res.breakEvenBefore - 63.6363636) < 1e-4);
  assert.ok(Math.abs(res.breakEvenAfter - 65.4545454) < 1e-4);
});

test('calculatePositionSizing reproduces Ch. 01 worked sizing example', () => {
  const res = calculatePositionSizing({
    equity: 10000,
    riskPct: 0.5,
    entryPrice: 25,
    stopPrice: 23.75,
    targetPrice: 27.5,
  });

  assert.equal(res.validStop, true);
  assert.equal(res.riskBudget, 50);
  assert.equal(res.stopDistance, 1.25);
  assert.equal(res.shares, 40);
  assert.equal(res.notional, 1000);
  assert.equal(res.notionalPct, 10);
  assert.equal(res.rMultiple, 2);
  assert.equal(res.gapLoss2x, 100);
});

test('calculatePositionSizing handles invalid stop at or above entry', () => {
  const res = calculatePositionSizing({
    equity: 10000,
    riskPct: 1,
    entryPrice: 25,
    stopPrice: 26,
    targetPrice: 30,
  });

  assert.equal(res.validStop, false);
  assert.equal(res.shares, 0);
  assert.equal(res.notional, 0);
});

test('calculateDrawdownRecovery handles asymmetric recovery math', () => {
  const dd15 = calculateDrawdownRecovery(15);
  assert.ok(Math.abs(dd15.recoveryPct - 17.647058) < 1e-3);
  assert.equal(dd15.remainingCapital, 8500);

  const dd50 = calculateDrawdownRecovery(50);
  assert.ok(Math.abs(dd50.recoveryPct - 100) < 1e-6);
  assert.equal(dd50.remainingCapital, 5000);
});

test('calculateCompoundingComparison accurately quantifies annual fee drag', () => {
  const res = calculateCompoundingComparison({
    initialCap: 10000,
    monthlyAdd: 300,
    years: 25,
    grossReturn: 7.5,
    lowFee: 0.05,
    highFee: 1.1,
  });

  assert.equal(res.rows.length, 26); // Year 0..25
  assert.ok(res.finalLow > res.finalHigh);
  assert.ok(res.feeDragDollar > 30000);
  assert.equal(res.finalContrib, 10000 + 300 * 12 * 25);
});
