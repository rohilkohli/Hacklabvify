// src/store/settingsStore.js
// Zustand store for application settings (theme, language, custom API key, guide banner).

import { create } from 'zustand';
import { storage } from '../services/storage.service.js';
import { setCustomApiKey } from '../services/ai/AIProviderFactory.js';

export const useSettingsStore = create((set) => {
  // Initialize AI Provider Factory custom API key if present
  const initialCustomKey = storage.getCustomApiKey();
  if (initialCustomKey) {
    setCustomApiKey(initialCustomKey);
  }

  return {
    theme: storage.getTheme(),
    language: storage.getLang(),
    customApiKey: initialCustomKey,
    showGuideBanner: storage.getShowGuideBanner(),

    setTheme: (theme) => {
      storage.setTheme(theme);
      document.documentElement.setAttribute('data-theme', theme);
      set({ theme });
    },

    toggleTheme: () => {
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        storage.setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
      });
    },

    setLanguage: (language) => {
      storage.setLang(language);
      set({ language });
    },

    setCustomApiKey: (key) => {
      const trimmed = (key || '').trim();
      storage.setCustomApiKey(trimmed);
      setCustomApiKey(trimmed);
      set({ customApiKey: trimmed });
    },

    setShowGuideBanner: (show) => {
      storage.setShowGuideBanner(show);
      set({ showGuideBanner: show });
    },
  };
});
