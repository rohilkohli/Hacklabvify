// src/store/chatStore.js
// Zustand store for chat history, messages, input composer, and saved insights.

import { create } from 'zustand';
import { storage } from '../services/storage.service.js';
import { sendChatMessage } from '../services/ai/AIService.js';
import { Logger } from '../services/LoggerService.js';

export const useChatStore = create((set, get) => ({
  messages: storage.getMessages(),
  savedInsights: storage.getSavedInsights(),
  input: '',
  loading: false,
  isListening: false,
  attachedFile: null,

  setInput: (input) => set({ input }),

  setAttachedFile: (attachedFile) => set({ attachedFile }),

  setIsListening: (isListening) => set({ isListening }),

  /**
   * Initializes session welcome message if history is empty.
   */
  initSessionMessages: (username, startupName, stage) => {
    const { messages } = get();
    if (messages.length === 0) {
      const welcomeMsg = {
        role: 'assistant',
        content: `Welcome **${username}**! I'm your AI Co-Founder for **${startupName}** (${stage} stage). Ask me anything strategic, or start with a quick action below.`,
        ts: Date.now(),
      };
      const newMessages = [welcomeMsg];
      storage.setMessages(newMessages);
      set({ messages: newMessages });
    }
  },

  /**
   * Sends a user message to the AI Service.
   */
  sendMessage: async (textPrompt, systemPrompt) => {
    const promptText = (textPrompt || '').trim();
    if (!promptText || get().loading) return;

    const { messages, attachedFile } = get();

    // Set loading state and reset input
    set({ loading: true, input: '' });

    // Append file content to prompt if attached
    let fullPrompt = promptText;
    if (attachedFile) {
      fullPrompt += `\n\n[ATTACHED FILE (${attachedFile.name})]:\n${attachedFile.content}`;
    }

    const userMsg = { role: 'user', content: promptText, ts: Date.now() };
    const updatedMessages = [...messages, userMsg];

    set({ messages: updatedMessages, attachedFile: null });
    storage.setMessages(updatedMessages);

    try {
      const response = await sendChatMessage({
        systemPrompt,
        messages: updatedMessages,
        overrideLastMessage: fullPrompt,
      });

      const assistantMsg = {
        role: 'assistant',
        content: response.success ? response.text : (response.error || '⚠️ Error occurred.'),
        ts: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      storage.setMessages(finalMessages);
      set({ messages: finalMessages, loading: false });

    } catch (err) {
      Logger.error('Chat error in chatStore', err, 'chatStore');
      const errorMsg = {
        role: 'assistant',
        content: '⚠️ Connection error. Check your API key or network connection.',
        ts: Date.now(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      storage.setMessages(finalMessages);
      set({ messages: finalMessages, loading: false });
    }
  },

  clearSessionMessages: (startupName) => {
    const newMessages = [{
      role: 'assistant',
      content: `Session reset. Ready to assist **${startupName || 'your startup'}**. Ask a strategy question or use the tools in the right panel.`,
      ts: Date.now(),
    }];
    storage.setMessages(newMessages);
    set({ messages: newMessages, attachedFile: null });
  },

  bookmarkMessage: (content) => {
    const snippet = content.slice(0, 120) + (content.length > 120 ? '…' : '');
    const newBookmark = { id: Date.now(), snippet, full: content, ts: Date.now() };
    set((state) => {
      const updated = [newBookmark, ...state.savedInsights];
      storage.setSavedInsights(updated);
      return { savedInsights: updated };
    });
  },

  deleteBookmark: (id) => {
    set((state) => {
      const updated = state.savedInsights.filter((item) => item.id !== id);
      storage.setSavedInsights(updated);
      return { savedInsights: updated };
    });
  },

  exportSession: (format = 'txt', { startupName, stage, username, persona, pitchSlides }) => {
    const { messages, savedInsights } = get();
    let text = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      text = JSON.stringify({ startup: { name: startupName, stage }, username, persona, messages, savedInsights, pitchSlides }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      text = `# ${startupName || 'Startup'} - AI Co-Founder Strategy Session\n\n**Founder**: ${username} | **Stage**: ${stage}\n\n` +
        messages.map((m) => `### ${m.role.toUpperCase()}\n${m.content}`).join('\n\n---\n\n');
      ext = 'md';
    } else {
      text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    }

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(startupName || 'foundernexus').replace(/\s+/g, '-')}-copilot.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  },
}));
