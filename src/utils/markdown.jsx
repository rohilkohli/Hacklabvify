// src/utils/markdown.jsx
// Stateless markdown-to-JSX renderer. No state. No hooks.

/**
 * Converts markdown text to an array of React elements.
 * Supports: headings, bold, inline code, code blocks, tables,
 * blockquotes, ordered lists, unordered lists, paragraphs.
 */
export function parseMarkdown(text) {
  if (!text) return null;
  const elements = [];
  let key = 0;

  const parseInline = (str) => {
    if (!str) return '';
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index).replace(/\*/g, ''));
      }
      if (match[2]) {
        parts.push(<strong key={`b-${key++}`} className="md-bold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<code key={`c-${key++}`} className="md-code-inline">{match[3]}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex).replace(/\*/g, ''));
    }
    return parts.length === 0 ? '' : parts.length === 1 ? parts[0] : parts;
  };

  const blocks = text.split(/\n{2,}/);
  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    const lines = trimmed.split('\n');

    // 1. Code Block ```
    if (lines[0].startsWith('```') && lines[lines.length - 1].endsWith('```')) {
      const codeContent = lines.slice(1, lines.length - 1).join('\n');
      elements.push(
        <pre key={`pre-${key++}`} className="md-code-block">
          <code>{codeContent}</code>
        </pre>
      );
      return;
    }

    // 2. Table Block
    if (lines.length >= 2 && lines[0].includes('|') && (lines[1].includes('---') || lines[1].includes('|'))) {
      const headerCells = lines[0].split('|').map((s) => s.trim()).filter(Boolean);
      const rowLines = lines.slice(lines[1].includes('---') ? 2 : 1);
      elements.push(
        <div key={`tbl-wrap-${key++}`} className="md-table-wrapper">
          <table className="md-table">
            <thead>
              <tr>
                {headerCells.map((h, hi) => <th key={hi}>{parseInline(h.replace(/\*\*/g, ''))}</th>)}
              </tr>
            </thead>
            <tbody>
              {rowLines.map((row, ri) => {
                const cells = row.split('|').map((s) => s.trim()).filter(Boolean);
                if (cells.length === 0) return null;
                return (
                  <tr key={ri}>
                    {cells.map((c, ci) => <td key={ci}>{parseInline(c)}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      return;
    }

    // 3. Blockquote
    if (lines.every((l) => l.trim().startsWith('>'))) {
      const quoteText = lines.map((l) => l.trim().replace(/^>\s?/, '')).join(' ');
      elements.push(
        <blockquote key={`bq-${key++}`} className="md-callout">
          <span className="md-callout-icon">💡</span>
          <div>{parseInline(quoteText)}</div>
        </blockquote>
      );
      return;
    }

    // 4. Single Heading
    if (/^#{1,3}\s/.test(lines[0]) && lines.length === 1) {
      const ht = lines[0].replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
      elements.push(<h3 key={`h-${key++}`} className="md-heading">{ht}</h3>);
      return;
    }

    // 5. Numbered List
    const isNumBullet = (l) => /^\d+\.\s/.test(l.trim());
    if (lines.every(isNumBullet)) {
      elements.push(
        <ol key={`ol-${key++}`} className="md-num-list">
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.trim().replace(/^\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      );
      return;
    }

    // 6. Unordered Bullet List
    const isBullet = (l) => /^[-•*]\s/.test(l.trim());
    if (lines.every(isBullet)) {
      elements.push(
        <ul key={`ul-${key++}`} className="md-list">
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.trim().replace(/^[-•*]\s+/, ''))}</li>
          ))}
        </ul>
      );
      return;
    }

    // 7. Mixed block — line-by-line parsing
    const subElements = [];
    let curList = [];
    let curListType = null;

    const flushList = () => {
      if (curList.length > 0) {
        if (curListType === 'ol') {
          subElements.push(
            <ol key={`ol-${key++}`} className="md-num-list">
              {curList.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
            </ol>
          );
        } else {
          subElements.push(
            <ul key={`ul-${key++}`} className="md-list">
              {curList.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
            </ul>
          );
        }
        curList = [];
        curListType = null;
      }
    };

    lines.forEach((line) => {
      const t = line.trim();
      if (!t) return;
      if (isBullet(t)) {
        if (curListType && curListType !== 'ul') flushList();
        curListType = 'ul';
        curList.push(t.replace(/^[-•*]\s+/, ''));
      } else if (isNumBullet(t)) {
        if (curListType && curListType !== 'ol') flushList();
        curListType = 'ol';
        curList.push(t.replace(/^\d+\.\s+/, ''));
      } else if (/^#{1,3}\s/.test(t)) {
        flushList();
        subElements.push(<h3 key={`h-${key++}`} className="md-heading">{t.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '')}</h3>);
      } else if (t.startsWith('>')) {
        flushList();
        subElements.push(
          <blockquote key={`bq-${key++}`} className="md-callout">
            <span className="md-callout-icon">💡</span>
            <div>{parseInline(t.replace(/^>\s?/, ''))}</div>
          </blockquote>
        );
      } else {
        flushList();
        subElements.push(<p key={`p-${key++}`} className="md-paragraph">{parseInline(t)}</p>);
      }
    });
    flushList();
    elements.push(...subElements);
  });

  return elements;
}

/**
 * Formats a Unix timestamp as HH:MM.
 */
export function formatTimestamp(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
