// src/hooks/useCompanyBrain.js
// Company Brain — persistent, structured knowledge base about the startup.
// Auto-injected into every AI prompt to give context-aware responses.

import { useState, useCallback, useEffect } from 'react';
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

export function useCompanyBrain(startupName) {
  const [brain, setBrainState] = useState(() => storage.getCompanyBrain(DEFAULT_BRAIN));
  const [isExpanded, setIsExpanded] = useState(false);

  // Persist on every change
  useEffect(() => {
    storage.setCompanyBrain(brain);
  }, [brain]);

  /**
   * Updates a single field in the company brain.
   */
  const updateField = useCallback((field, value) => {
    setBrainState((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Resets the brain to defaults (but preserves startup name linkage).
   */
  const resetBrain = useCallback(() => {
    setBrainState(DEFAULT_BRAIN);
  }, []);

  /**
   * Returns true if the brain has any populated fields.
   */
  const hasBrainData = Object.values(brain).some((v) => v && v.trim() !== '');

  /**
   * Returns a completion score (0–100) indicating how filled-in the brain is.
   */
  const completionScore = Math.round(
    (Object.values(brain).filter((v) => v && v.trim() !== '').length / Object.keys(DEFAULT_BRAIN).length) * 100
  );

  return {
    brain,
    updateField,
    resetBrain,
    hasBrainData,
    completionScore,
    isExpanded,
    setIsExpanded,
    DEFAULT_BRAIN,
  };
}
