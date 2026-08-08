// src/store/financeStore.js
// Zustand store for financial calculations, unit economics, cap table, investor memo, and pitch slides.

import { create } from 'zustand';
import { storage } from '../services/storage.service.js';
import { FINANCIAL_DEFAULTS, MEMO_DEFAULTS, INITIAL_PITCH_SLIDES } from '../config/constants.js';

export const useFinanceStore = create((set, get) => ({
  // Raw state
  cashBalance: storage.getCash(FINANCIAL_DEFAULTS.cashBalance),
  monthlyExpenses: storage.getExpenses(FINANCIAL_DEFAULTS.monthlyExpenses),
  monthlyRevenue: storage.getRevenue(FINANCIAL_DEFAULTS.monthlyRevenue),
  arpu: storage.getArpu(FINANCIAL_DEFAULTS.arpu),
  cac: storage.getCac(FINANCIAL_DEFAULTS.cac),
  grossMargin: storage.getMargin(FINANCIAL_DEFAULTS.grossMargin),
  monthlyChurn: storage.getChurn(FINANCIAL_DEFAULTS.monthlyChurn),
  founderInitialPct: storage.getFounderPct(FINANCIAL_DEFAULTS.founderInitialPct),
  esopPoolPct: storage.getEsopPct(FINANCIAL_DEFAULTS.esopPoolPct),
  safeInvestment: storage.getSafeAmt(FINANCIAL_DEFAULTS.safeInvestment),
  postMoneyCap: storage.getPostCap(FINANCIAL_DEFAULTS.postMoneyCap),
  memoMonth: storage.getMemoMonth(MEMO_DEFAULTS.memoMonth),
  memoHighs: storage.getMemoHighs(MEMO_DEFAULTS.memoHighs),
  memoLows: storage.getMemoLows(MEMO_DEFAULTS.memoLows),
  memoAsks: storage.getMemoAsks(MEMO_DEFAULTS.memoAsks),
  pitchSlides: storage.getPitchSlides(INITIAL_PITCH_SLIDES),

  // Setters with storage sync
  setCashBalance: (v) => {
    const num = Number(v);
    storage.setCash(num);
    set({ cashBalance: num });
  },

  setMonthlyExpenses: (v) => {
    const num = Number(v);
    storage.setExpenses(num);
    set({ monthlyExpenses: num });
  },

  setMonthlyRevenue: (v) => {
    const num = Number(v);
    storage.setRevenue(num);
    set({ monthlyRevenue: num });
  },

  setArpu: (v) => {
    const num = Number(v);
    storage.setArpu(num);
    set({ arpu: num });
  },

  setCac: (v) => {
    const num = Number(v);
    storage.setCac(num);
    set({ cac: num });
  },

  setGrossMargin: (v) => {
    const num = Number(v);
    storage.setMargin(num);
    set({ grossMargin: num });
  },

  setMonthlyChurn: (v) => {
    const num = Number(v);
    storage.setChurn(num);
    set({ monthlyChurn: num });
  },

  setFounderInitialPct: (v) => {
    const num = Number(v);
    storage.setFounderPct(num);
    set({ founderInitialPct: num });
  },

  setEsopPoolPct: (v) => {
    const num = Number(v);
    storage.setEsopPct(num);
    set({ esopPoolPct: num });
  },

  setSafeInvestment: (v) => {
    const num = Number(v);
    storage.setSafeAmt(num);
    set({ safeInvestment: num });
  },

  setPostMoneyCap: (v) => {
    const num = Number(v);
    storage.setPostCap(num);
    set({ postMoneyCap: num });
  },

  setMemoMonth: (v) => {
    storage.setMemoMonth(v);
    set({ memoMonth: v });
  },

  setMemoHighs: (v) => {
    storage.setMemoHighs(v);
    set({ memoHighs: v });
  },

  setMemoLows: (v) => {
    storage.setMemoLows(v);
    set({ memoLows: v });
  },

  setMemoAsks: (v) => {
    storage.setMemoAsks(v);
    set({ memoAsks: v });
  },

  updateSlideDetail: (id, newDetail) => {
    set((state) => {
      const updated = state.pitchSlides.map((s) => s.id === id ? { ...s, detail: newDetail } : s);
      storage.setPitchSlides(updated);
      return { pitchSlides: updated };
    });
  },

  // Derived metrics selectors
  getDerivedMetrics: () => {
    const s = get();
    const netBurn = Math.max(0, s.monthlyExpenses - s.monthlyRevenue);
    const runwayMonthsRaw = netBurn > 0 ? s.cashBalance / netBurn : Infinity;
    const runwayMonths = netBurn > 0 ? runwayMonthsRaw.toFixed(1) : '∞';
    const runwayNum = Number(runwayMonths) || 0;
    const gaugePercent = netBurn === 0 ? 100 : Math.min(100, Math.max(5, (runwayNum / 24) * 100));

    const ltv = s.monthlyChurn > 0
      ? Math.round((s.arpu * (s.grossMargin / 100)) / (s.monthlyChurn / 100))
      : 0;
    const ltvCacRatio = s.cac > 0 ? (ltv / s.cac).toFixed(1) : '0.0';
    const cacPaybackMonths = (s.arpu * (s.grossMargin / 100)) > 0
      ? (s.cac / (s.arpu * (s.grossMargin / 100))).toFixed(1)
      : '0.0';

    const safeDilutionPct = s.postMoneyCap > 0
      ? Math.min(100, (s.safeInvestment / s.postMoneyCap) * 100).toFixed(1)
      : '0.0';
    const founderPostRoundPct = Math.max(0, 100 - Number(safeDilutionPct) - s.esopPoolPct).toFixed(1);

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
      netBurn,
      runwayMonths,
      runwayNum,
      gaugePercent,
      ltv,
      ltvCacRatio,
      cacPaybackMonths,
      safeDilutionPct,
      founderPostRoundPct,
      runwayColor: getRunwayColor(),
      ltvCacColor: getLtvCacColor(),
    };
  },
}));
