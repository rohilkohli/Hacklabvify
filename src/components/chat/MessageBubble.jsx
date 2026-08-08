// src/components/chat/MessageBubble.jsx
import { parseMarkdown, formatTimestamp } from '../../utils/markdown.jsx';
import { BotAvatar } from '../icons.jsx';

export function MessageBubble({ msg, onCopy, onBookmark }) {
  const isAssistant = msg.role === 'assistant';

  return (
    <div className={`msg-row ${msg.role}`}>
      {isAssistant && <BotAvatar />}
      <div className="msg-wrapper">
        <div className="msg-bubble">
          {isAssistant ? parseMarkdown(msg.content) : msg.content}
        </div>
        <div className="msg-timestamp">{formatTimestamp(msg.ts)}</div>
        {isAssistant && (
          <div className="msg-actions">
            <button className="msg-action-btn" onClick={() => onCopy(msg.content)}>Copy</button>
            <button className="msg-action-btn" onClick={() => onBookmark(msg.content)}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
}
