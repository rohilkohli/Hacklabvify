// src/store/sessionStore.js
// Zustand store for user session and active startup metadata.

import { create } from 'zustand';
import { storage } from '../services/storage.service.js';

export const useSessionStore = create((set) => ({
  username: storage.getUser(),
  startupName: storage.getStartupName(),
  stage: storage.getStage(),
  sessionActive: storage.getSession(),
  persona: storage.getPersona(),

  setUsername: (username) => {
    storage.setUser(username);
    set({ username });
  },

  setStartupName: (startupName) => {
    storage.setStartupName(startupName);
    set({ startupName });
  },

  setStage: (stage) => {
    storage.setStage(stage);
    set({ stage });
  },

  setPersona: (persona) => {
    storage.setPersona(persona);
    set({ persona });
  },

  startSession: (name, startup, stageVal) => {
    storage.setUser(name);
    storage.setStartupName(startup);
    storage.setStage(stageVal || 'MVP');
    storage.setSession(true);
    set({
      username: name,
      startupName: startup,
      stage: stageVal || 'MVP',
      sessionActive: true,
    });
  },

  endSession: () => {
    storage.setSession(false);
    set({ sessionActive: false });
  },
}));
