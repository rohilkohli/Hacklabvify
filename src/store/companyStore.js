// src/store/companyStore.js
// Zustand store for Company Brain — structured knowledge base about the startup.

import { create } from 'zustand';
import { storage } from '../services/storage.service.js';

const DEFAULT_BRAIN = {
  industry: '',
  founded: '',
  teamSize: '',
  icp: '',           // Ideal Customer Profile
  uniqueValue: '',   // Unique Value Proposition
  businessModel: '',
  topCompetitors: '',
  moat: '',          // Competitive moat
  currentMrr: '',
  customerCount: '',
  fundraisingStatus: '',
  biggestChallenge: '',
  goals: '',
  additionalContext: '',
};

export const useCompanyStore = create((set, get) => ({
  brain: storage.getCompanyBrain(DEFAULT_BRAIN),

  updateField: (field, value) => {
    set((state) => {
      const updatedBrain = { ...state.brain, [field]: value };
      storage.setCompanyBrain(updatedBrain);
      return { brain: updatedBrain };
    });
  },

  setBrain: (newBrain) => {
    storage.setCompanyBrain(newBrain);
    set({ brain: newBrain });
  },

  resetBrain: () => {
    storage.setCompanyBrain(DEFAULT_BRAIN);
    set({ brain: DEFAULT_BRAIN });
  },

  getCompletionScore: () => {
    const { brain } = get();
    const fields = Object.values(brain);
    if (fields.length === 0) return 0;
    const filled = fields.filter((v) => v && String(v).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  },

  hasData: () => {
    const { brain } = get();
    return Object.values(brain).some((v) => v && String(v).trim() !== '');
  },
}));
