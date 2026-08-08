// src/hooks/useChat.js
// All chat state, message handling, export, and bookmarking. No UI rendering.

import { useState, useRef, useEffect, useCallback } from 'react';
import { storage } from '../services/storage.service.js';
import { callGemini, GeminiError } from '../services/gemini.service.js';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export function useChat({ systemPrompt, startupName, username, onToast }) {
  const [messages, setMessages] = useState(() => storage.getMessages());
  const [savedInsights, setSavedInsights] = useState(() => storage.getSavedInsights());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const customApiKey = storage.getCustomApiKey();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  // Persist messages and insights
  useEffect(() => { storage.setMessages(messages); }, [messages]);
  useEffect(() => { storage.setSavedInsights(savedInsights); }, [savedInsights]);

  /**
   * Sends a message and awaits an AI response.
   */
  const sendMessage = useCallback(async (userMessage) => {
    const text = userMessage?.trim();
    if (!text || loading) return;

    setLoading(true);

    // Append file content to prompt if attached
    let fullPrompt = text;
    if (attachedFile) {
      fullPrompt += `\n\n[ATTACHED FILE (${attachedFile.name})]:\n${attachedFile.content}`;
    }

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const activeKey = customApiKey.trim() || GEMINI_API_KEY;

    try {
      const reply = await callGemini({
        apiKey: activeKey,
        systemPrompt,
        messages: newMessages,
        overridePrompt: fullPrompt,
      });

      setMessages([...newMessages, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch (err) {
      const errorText = err instanceof GeminiError
        ? `⚠️ ${err.message}`
        : '⚠️ Connection error. Check your API key or network connection.';
      setMessages([...newMessages, { role: 'assistant', content: errorText, ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, loading, systemPrompt, customApiKey, attachedFile]);

  /**
   * Clears the session and resets to a welcome message.
   */
  const clearSession = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: `Session reset. Ready to assist **${startupName || 'your startup'}**. Ask a strategy question or use the tools in the right panel.`,
      ts: Date.now(),
    }]);
    setAttachedFile(null);
    onToast?.('Session cleared');
  }, [startupName, onToast]);

  /**
   * Exports the session in the specified format.
   */
  const exportSession = useCallback((format = 'txt', { startup, stage, persona, pitchSlides } = {}) => {
    let text = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      text = JSON.stringify({ startup: { name: startup, stage }, persona, messages, savedInsights, pitchSlides }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      text = `# ${startup || 'Startup'} - AI Co-Founder Strategy Session\n\n**Founder**: ${username} | **Stage**: ${stage}\n\n` +
        messages.map((m) => `### ${m.role.toUpperCase()}\n${m.content}`).join('\n\n---\n\n');
      ext = 'md';
    } else {
      text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    }

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(startup || 'foundernexus').replace(/\s+/g, '-')}-copilot.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    onToast?.(`Exported as .${ext}`);
  }, [messages, savedInsights, username, onToast]);

  /**
   * Copies message content to clipboard.
   */
  const copyMessage = useCallback((content) => {
    navigator.clipboard.writeText(content);
    onToast?.('Copied to clipboard');
  }, [onToast]);

  /**
   * Saves an AI message as a bookmarked insight.
   */
  const bookmarkMessage = useCallback((content) => {
    const snippet = content.slice(0, 120) + (content.length > 120 ? '…' : '');
    setSavedInsights((prev) => [{ id: Date.now(), snippet, full: content, ts: Date.now() }, ...prev]);
    onToast?.('Insight saved');
  }, [onToast]);

  /**
   * Removes a bookmark by ID.
   */
  const deleteBookmark = useCallback((id) => {
    setSavedInsights((prev) => prev.filter((i) => i.id !== id));
    onToast?.('Bookmark removed');
  }, [onToast]);

  /**
   * Handles file attachment.
   */
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setAttachedFile({ name: file.name, content: typeof content === 'string' ? content : '[Binary File]' });
      onToast?.(`Attached ${file.name}`);
    };
    reader.readAsText(file);
  }, [onToast]);

  /**
   * Removes the attached file.
   */
  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null);
  }, []);

  /**
   * Toggles voice input via SpeechRecognition API.
   */
  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onToast?.('Speech recognition not supported in browser');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => { setIsListening(true); onToast?.('Listening... Speak now'); };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => { setIsListening(false); onToast?.('Voice input error'); };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, onToast]);

  /**
   * Initializes the session with a welcome message.
   */
  const initSession = useCallback((name, startup, stage) => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Welcome **${name}**! I'm your AI Co-Founder for **${startup}** (${stage} stage). Ask me anything strategic, or start with a quick action below.`,
        ts: Date.now(),
      }]);
    }
  }, [messages.length]);

  return {
    // State
    messages,
    savedInsights,
    input,
    loading,
    isListening,
    attachedFile,

    // Refs
    chatEndRef,
    textareaRef,
    fileInputRef,

    // Actions
    setInput,
    sendMessage,
    clearSession,
    exportSession,
    copyMessage,
    bookmarkMessage,
    deleteBookmark,
    handleFileUpload,
    removeAttachedFile,
    toggleVoiceInput,
    initSession,
  };
}
