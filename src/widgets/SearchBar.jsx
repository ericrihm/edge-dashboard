import React, { useState, useEffect, useRef } from 'react';
import { saveSettings } from '../settings.js';

const ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
};

export default function SearchBar({ settings, onSettingsChange, inputRef: externalRef }) {
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState(settings.searchEngine || 'google');
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;

  useEffect(() => {
    const timer = setTimeout(() => ref.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setEngine(settings.searchEngine || 'google');
  }, [settings.searchEngine]);

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    window.location.href = ENGINES[engine].url + encodeURIComponent(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  async function switchEngine(key) {
    setEngine(key);
    setShowDropdown(false);
    const updated = await saveSettings({ searchEngine: key });
    if (onSettingsChange) onSettingsChange(updated);
  }

  return (
    <div className="widget-card" style={s.card}>
      <style>{cssText}</style>
      <div className={`sb-wrapper${focused ? ' sb-focused' : ''}`}>
        <div className="sb-engine-toggle">
          <button
            className="sb-engine-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Switch search engine"
          >
            {ENGINES[engine].name}
            <span style={s.caret}>{showDropdown ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showDropdown && (
            <div className="sb-dropdown">
              {Object.entries(ENGINES).map(([key, { name }]) => (
                <button
                  key={key}
                  className={`sb-dropdown-item${key === engine ? ' sb-active' : ''}`}
                  onClick={() => switchEngine(key)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          ref={ref}
          type="text"
          className="sb-input"
          placeholder={`Search ${ENGINES[engine].name}...`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {!focused && !query && (
          <span className="sb-hint">
            <kbd>/</kbd>
          </span>
        )}
        <button className="sb-search-btn" onClick={handleSearch} title="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const cssText = `
  .sb-wrapper {
    display: flex;
    align-items: center;
    height: 48px;
    background: var(--bg-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sb-wrapper.sb-focused {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.15);
  }
  .sb-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 1rem;
    padding: 0 1rem;
    height: 100%;
  }
  .sb-input::placeholder {
    color: var(--text-muted);
  }
  .sb-hint {
    display: flex;
    align-items: center;
    margin-right: 0.25rem;
  }
  .sb-hint kbd {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    padding: 0.15rem 0.45rem;
    line-height: 1;
  }
  .sb-search-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }
  .sb-search-btn:hover {
    color: var(--accent);
  }
  .sb-engine-toggle {
    position: relative;
  }
  .sb-engine-btn {
    background: none;
    border: none;
    border-right: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    padding: 0 0.85rem;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
    transition: color 0.15s;
  }
  .sb-engine-btn:hover {
    color: var(--text-primary);
  }
  .sb-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    z-index: 100;
    min-width: 120px;
    box-shadow: var(--shadow);
  }
  .sb-dropdown-item {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 0.8rem;
    padding: 0.5rem 0.85rem;
    text-align: left;
    transition: background 0.1s;
  }
  .sb-dropdown-item:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
  .sb-dropdown-item.sb-active {
    color: var(--accent);
  }
`;

const s = {
  card: {
    padding: 0,
    overflow: 'visible',
  },
  caret: {
    fontSize: '0.55rem',
  },
};
