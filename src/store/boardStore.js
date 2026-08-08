// src/store/boardStore.js
// Zustand store for Executive Board multi-agent C-Suite sessions.

import { create } from 'zustand';
import { C_SUITE_AGENTS, AGENT_MODES } from '../config/agents.config.js';
import { sendChatMessage } from '../services/ai/AIService.js';

export const useBoardStore = create((set, get) => ({
  agents: C_SUITE_AGENTS,
  mode: AGENT_MODES.BOARD_MEETING, // 'board' | 'panel' | 'debate' | 'advisor' | 'silent'
  primaryAgentId: 'ceo',
  activeTopic: '',
  isConsulting: false,
  boardResponses: {}, // agentId -> text
  consensusVerdict: '',
  actionableTasks: [],

  setMode: (mode) => set({ mode }),
  setPrimaryAgentId: (primaryAgentId) => set({ primaryAgentId }),
  setActiveTopic: (activeTopic) => set({ activeTopic }),

  runBoardConsultation: async (topic, startupContext) => {
    if (!topic?.trim() || get().isConsulting) return;

    const { mode, agents, primaryAgentId } = get();

    set({
      activeTopic: topic,
      isConsulting: true,
      boardResponses: {},
      consensusVerdict: '',
      actionableTasks: [],
    });

    const responses = {};

    // Select agents based on mode
    let targetAgents = agents.slice(0, 6);
    if (mode === AGENT_MODES.ADVISOR) {
      targetAgents = [agents.find((a) => a.id === primaryAgentId) || agents[0]];
    } else if (mode === AGENT_MODES.DEBATE) {
      targetAgents = [agents[1], agents[2]]; // CTO vs CFO
    } else if (mode === AGENT_MODES.PANEL) {
      targetAgents = agents.slice(0, 3);
    }

    for (const agent of targetAgents) {
      const prompt = `You are acting as the ${agent.name} (${agent.title}) of ${startupContext.startupName || 'the startup'}.
Focus: ${agent.mission}.
Question: "${topic}".

Provide 3 bullet points:
1. Verdict from ${agent.title} Perspective
2. Key Risk or Opportunity
3. Specific Next Action`;

      const res = await sendChatMessage({
        systemPrompt: prompt,
        messages: [{ role: 'user', content: topic }],
      });

      responses[agent.id] = res.success ? res.text : `⚠️ ${agent.title} perspective unavailable.`;
      set({ boardResponses: { ...responses } });
    }

    // Formulate consensus
    const consensusPrompt = `You are the Lead Board Chair synthesizing an Executive Board meeting for ${startupContext.startupName || 'the startup'}.
Topic: "${topic}".
Perspectives provided by C-Suite executives.

Synthesize a 2-paragraph Board Consensus Verdict and 3 high-priority tasks.
Format tasks as: TASK: [Action Item]`;

    const finalRes = await sendChatMessage({
      systemPrompt: consensusPrompt,
      messages: [{ role: 'user', content: `Summarize board consensus on: ${topic}` }],
    });

    const verdictText = finalRes.success ? finalRes.text : 'Consensus reached.';
    const taskMatches = verdictText.match(/TASK:\s*(.+)/gi) || [];
    const tasks = taskMatches.map((t) => t.replace(/TASK:\s*/i, '').trim());

    set({
      consensusVerdict: verdictText,
      actionableTasks: tasks,
      isConsulting: false,
    });
  },
}));
