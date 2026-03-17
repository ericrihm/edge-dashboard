import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getLocal, setLocal } from '../storage.js';

const STORAGE_KEY = 'notepad_content';
const SAVE_DELAY = 1000;

export default function Notepad() {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    getLocal(STORAGE_KEY).then(val => {
      if (val) setText(val);
    });
  }, []);

  const debouncedSave = useCallback((value) => {
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await setLocal(STORAGE_KEY, value);
      setSaved(true);
    }, SAVE_DELAY);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    debouncedSave(val);
  }

  return (
    <div className="widget-card" style={s.card}>
      <style>{cssText}</style>
      <div className="widget-header">
        <span>Notepad</span>
        <div style={s.headerRight}>
          {!saved && <span className="np-saving">saving...</span>}
          <button className="np-expand-btn" onClick={() => setExpanded(!expanded)} title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? '\u25B2' : '\u25BC'}
          </button>
        </div>
      </div>
      <div className="widget-content">
        <textarea
          className="np-textarea"
          style={{ height: expanded ? '240px' : '120px' }}
          value={text}
          onChange={handleChange}
          placeholder="Quick notes..."
        />
        <div className="np-footer">
          <span>{text.length} chars</span>
        </div>
      </div>
    </div>
  );
}

const cssText = `
  .np-textarea {
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.6;
    padding: 0.65rem;
    resize: none;
    outline: none;
    transition: border-color 0.15s, height 0.2s ease;
    box-sizing: border-box;
  }
  .np-textarea:focus {
    border-color: var(--accent);
  }
  .np-textarea::placeholder {
    color: var(--text-muted);
  }
  .np-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.35rem;
    font-size: 0.65rem;
    color: var(--text-muted);
  }
  .np-saving {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-style: italic;
  }
  .np-expand-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.55rem;
    padding: 0.1rem 0.3rem;
    transition: color 0.15s;
  }
  .np-expand-btn:hover {
    color: var(--text-primary);
  }
`;

const s = {
  card: {
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};
