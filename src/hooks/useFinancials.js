// src/hooks/useFinancials.js
// All financial state and derived calculations. No UI rendering.

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage.service.js';
import { FINANCIAL_DEFAULTS, MEMO_DEFAULTS, INITIAL_PITCH_SLIDES } from '../config/constants.js';

export function useFinancials() {
  // ── Runway State ──────────────────────────────────────────────
  const [cashBalance, setCashBalanceState] = useState(() => storage.getCash(FINANCIAL_DEFAULTS.cashBalance));
  const [monthlyExpenses, setMonthlyExpensesState] = useState(() => storage.getExpenses(FINANCIAL_DEFAULTS.monthlyExpenses));
  const [monthlyRevenue, setMonthlyRevenueState] = useState(() => storage.getRevenue(FINANCIAL_DEFAULTS.monthlyRevenue));

  // ── Unit Economics State ──────────────────────────────────────
  const [arpu, setArpuState] = useState(() => storage.getArpu(FINANCIAL_DEFAULTS.arpu));
  const [cac, setCacState] = useState(() => storage.getCac(FINANCIAL_DEFAULTS.cac));
  const [grossMargin, setGrossMarginState] = useState(() => storage.getMargin(FINANCIAL_DEFAULTS.grossMargin));
  const [monthlyChurn, setMonthlyChurnState] = useState(() => storage.getChurn(FINANCIAL_DEFAULTS.monthlyChurn));

  // ── Cap Table State ───────────────────────────────────────────
  const [founderInitialPct, setFounderInitialPctState] = useState(() => storage.getFounderPct(FINANCIAL_DEFAULTS.founderInitialPct));
  const [esopPoolPct, setEsopPoolPctState] = useState(() => storage.getEsopPct(FINANCIAL_DEFAULTS.esopPoolPct));
  const [safeInvestment, setSafeInvestmentState] = useState(() => storage.getSafeAmt(FINANCIAL_DEFAULTS.safeInvestment));
  const [postMoneyCap, setPostMoneyCapState] = useState(() => storage.getPostCap(FINANCIAL_DEFAULTS.postMoneyCap));

  // ── Investor Memo State ───────────────────────────────────────
  const [memoMonth, setMemoMonthState] = useState(() => storage.getMemoMonth(MEMO_DEFAULTS.memoMonth));
  const [memoHighs, setMemoHighsState] = useState(() => storage.getMemoHighs(MEMO_DEFAULTS.memoHighs));
  const [memoLows, setMemoLowsState] = useState(() => storage.getMemoLows(MEMO_DEFAULTS.memoLows));
  const [memoAsks, setMemoAsksState] = useState(() => storage.getMemoAsks(MEMO_DEFAULTS.memoAsks));

  // ── Pitch Slides State ────────────────────────────────────────
  const [pitchSlides, setPitchSlidesState] = useState(() => storage.getPitchSlides(INITIAL_PITCH_SLIDES));

  // ── Persist to storage (debounced via useEffect) ──────────────
  useEffect(() => { storage.setCash(cashBalance); }, [cashBalance]);
  useEffect(() => { storage.setExpenses(monthlyExpenses); }, [monthlyExpenses]);
  useEffect(() => { storage.setRevenue(monthlyRevenue); }, [monthlyRevenue]);
  useEffect(() => { storage.setArpu(arpu); }, [arpu]);
  useEffect(() => { storage.setCac(cac); }, [cac]);
  useEffect(() => { storage.setMargin(grossMargin); }, [grossMargin]);
  useEffect(() => { storage.setChurn(monthlyChurn); }, [monthlyChurn]);
  useEffect(() => { storage.setFounderPct(founderInitialPct); }, [founderInitialPct]);
  useEffect(() => { storage.setEsopPct(esopPoolPct); }, [esopPoolPct]);
  useEffect(() => { storage.setSafeAmt(safeInvestment); }, [safeInvestment]);
  useEffect(() => { storage.setPostCap(postMoneyCap); }, [postMoneyCap]);
  useEffect(() => { storage.setMemoMonth(memoMonth); }, [memoMonth]);
  useEffect(() => { storage.setMemoHighs(memoHighs); }, [memoHighs]);
  useEffect(() => { storage.setMemoLows(memoLows); }, [memoLows]);
  useEffect(() => { storage.setMemoAsks(memoAsks); }, [memoAsks]);
  useEffect(() => { storage.setPitchSlides(pitchSlides); }, [pitchSlides]);

  // ── Setters (wrapped to maintain single responsibility) ───────
  const setCashBalance = useCallback((v) => setCashBalanceState(Number(v)), []);
  const setMonthlyExpenses = useCallback((v) => setMonthlyExpensesState(Number(v)), []);
  const setMonthlyRevenue = useCallback((v) => setMonthlyRevenueState(Number(v)), []);
  const setArpu = useCallback((v) => setArpuState(Number(v)), []);
  const setCac = useCallback((v) => setCacState(Number(v)), []);
  const setGrossMargin = useCallback((v) => setGrossMarginState(Number(v)), []);
  const setMonthlyChurn = useCallback((v) => setMonthlyChurnState(Number(v)), []);
  const setFounderInitialPct = useCallback((v) => setFounderInitialPctState(Number(v)), []);
  const setEsopPoolPct = useCallback((v) => setEsopPoolPctState(Number(v)), []);
  const setSafeInvestment = useCallback((v) => setSafeInvestmentState(Number(v)), []);
  const setPostMoneyCap = useCallback((v) => setPostMoneyCapState(Number(v)), []);
  const setMemoMonth = useCallback((v) => setMemoMonthState(v), []);
  const setMemoHighs = useCallback((v) => setMemoHighsState(v), []);
  const setMemoLows = useCallback((v) => setMemoLowsState(v), []);
  const setMemoAsks = useCallback((v) => setMemoAsksState(v), []);

  const updateSlideDetail = useCallback((id, newDetail) => {
    setPitchSlidesState((prev) => prev.map((s) => s.id === id ? { ...s, detail: newDetail } : s));
  }, []);

  // ── Derived Calculations ──────────────────────────────────────
  const netBurn = Math.max(0, monthlyExpenses - monthlyRevenue);
  const runwayMonthsRaw = netBurn > 0 ? cashBalance / netBurn : Infinity;
  const runwayMonths = netBurn > 0 ? runwayMonthsRaw.toFixed(1) : '∞';
  const runwayNum = Number(runwayMonths) || 0;
  const gaugePercent = netBurn === 0 ? 100 : Math.min(100, Math.max(5, (runwayNum / 24) * 100));

  const ltv = monthlyChurn > 0
    ? Math.round((arpu * (grossMargin / 100)) / (monthlyChurn / 100))
    : 0;
  const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(1) : '0.0';
  const cacPaybackMonths = (arpu * (grossMargin / 100)) > 0
    ? (cac / (arpu * (grossMargin / 100))).toFixed(1)
    : '0.0';

  const safeDilutionPct = postMoneyCap > 0
    ? Math.min(100, (safeInvestment / postMoneyCap) * 100).toFixed(1)
    : '0.0';
  const founderPostRoundPct = Math.max(0, 100 - Number(safeDilutionPct) - esopPoolPct).toFixed(1);

  // ── Color helpers ─────────────────────────────────────────────
  const getRunwayColor = () => {
    if (netBurn === 0 || runwayNum >= 12) return 'var(--success)';
    if (runwayNum >= 6) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const getLtvCacColor = () => {
    const ratio = Number(ltvCacRatio);
    if (ratio >= 3) return 'var(--success)';
    if (ratio >= 1.5) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return {
    // Raw state
    cashBalance, monthlyExpenses, monthlyRevenue,
    arpu, cac, grossMargin, monthlyChurn,
    founderInitialPct, esopPoolPct, safeInvestment, postMoneyCap,
    memoMonth, memoHighs, memoLows, memoAsks,
    pitchSlides,

    // Setters
    setCashBalance, setMonthlyExpenses, setMonthlyRevenue,
    setArpu, setCac, setGrossMargin, setMonthlyChurn,
    setFounderInitialPct, setEsopPoolPct, setSafeInvestment, setPostMoneyCap,
    setMemoMonth, setMemoHighs, setMemoLows, setMemoAsks,
    updateSlideDetail,

    // Derived values
    netBurn, runwayMonths, runwayNum, gaugePercent,
    ltv, ltvCacRatio, cacPaybackMonths,
    safeDilutionPct, founderPostRoundPct,

    // Color helpers
    getRunwayColor, getLtvCacColor,
  };
}
