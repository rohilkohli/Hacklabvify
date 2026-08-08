// src/components/chat/InputComposer.jsx
import { PlusIcon, MicIcon, UpArrowIcon } from '../icons.jsx';

export function InputComposer({
  input, setInput, onSend, onKeyDown,
  onVoiceInput, isListening, loading,
  onFileUpload, fileInputRef,
  attachedFile, onRemoveFile,
  placeholder,
}) {
  return (
    <footer className="chat-footer">
      <div className="input-pill">
        <label htmlFor="file-upload" className="action-btn" title="Attach file">
          <PlusIcon />
        </label>
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={onFileUpload}
          accept="image/*,.txt,.js,.ts,.py,.json,.md,.csv"
        />

        <button className="action-btn" onClick={onVoiceInput} title="Voice dictation">
          <MicIcon active={isListening} />
        </button>

        <textarea
          className="chat-input-textarea"
          rows={1}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          aria-label="Message input"
        />

        <button
          className="send-btn-round"
          onClick={onSend}
          disabled={!input.trim() || loading}
          title="Send Message"
          aria-label="Send message"
        >
          <UpArrowIcon />
        </button>
      </div>

      {attachedFile && (
        <div style={{
          marginTop: '6px', fontSize: '11px', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)',
        }}>
          📎 {attachedFile.name}
          <button
            style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
            onClick={onRemoveFile}
            aria-label="Remove attached file"
          >
            ✕
          </button>
        </div>
      )}
    </footer>
  );
}
