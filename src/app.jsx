import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings } from './settings.js';
import Weather from './widgets/Weather.jsx';
import NewsFeed from './widgets/NewsFeed.jsx';
import SearchBar from './widgets/SearchBar.jsx';
import QuickLinks from './widgets/QuickLinks.jsx';
import Notepad from './widgets/Notepad.jsx';
import TaskList from './widgets/TaskList.jsx';
import SettingsPanel from './widgets/SettingsPanel.jsx';
import '../src/styles/widgets.css';

function formatTime(date, format) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  if (format === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const openSettings = useCallback((section) => {
    setSettingsSection(section || null);
    setShowSettings(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showSettings]);

  const clockFormat = settings?.clockFormat || '12h';
  const widgets = settings?.widgets || [];
  const isVisible = (name) => widgets.includes(name);

  const hasLeftCol = settings && (isVisible('weather'));
  const hasCenterCol = settings && (isVisible('news'));
  const hasRightCol = settings && (isVisible('notepad') || isVisible('tasks'));

  return (
    <>
      <style>{responsiveCSS}</style>
      <div className="dashboard">
        <button
          className="gear-btn"
          onClick={() => openSettings()}
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <header className="dash-header">
          <div className="clock">{formatTime(now, clockFormat)}</div>
          <div className="date">{formatDate(now)}</div>
        </header>

        {settings && isVisible('search') && (
          <div className="search-row">
            <SearchBar settings={settings} onSettingsChange={setSettings} inputRef={searchRef} />
          </div>
        )}

        {settings && isVisible('quicklinks') && (
          <div className="quick-links-row">
            <QuickLinks settings={settings} onSettingsChange={setSettings} />
          </div>
        )}

        <main className="widget-grid">
          {hasLeftCol && (
            <div className="wg-col wg-col-left">
              {isVisible('weather') && (
                <Weather settings={settings} onOpenSettings={() => openSettings('apikeys')} />
              )}
            </div>
          )}
          {hasCenterCol && (
            <div className="wg-col wg-col-center">
              {isVisible('news') && (
                <NewsFeed settings={settings} onOpenSettings={() => openSettings('feeds')} />
              )}
            </div>
          )}
          {hasRightCol && (
            <div className="wg-col wg-col-right">
              {isVisible('notepad') && <Notepad />}
              {isVisible('tasks') && <TaskList />}
            </div>
          )}
        </main>

        <footer className="dash-footer">
          <button className="footer-settings-btn" onClick={() => openSettings()}>Settings</button>
        </footer>

        {showSettings && settings && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => { setShowSettings(false); setSettingsSection(null); }}
            initialSection={settingsSection}
          />
        )}
      </div>
    </>
  );
}

const responsiveCSS = `
  /* ── Dashboard container ──────────────────────────── */
  .dashboard {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1rem 1.5rem;
    gap: 0.75rem;
    max-width: 1800px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  /* ── Gear button ──────────────────────────────────── */
  .gear-btn {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: color 0.15s, background 0.15s;
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gear-btn:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  /* ── Header (clock + date) ────────────────────────── */
  .dash-header {
    text-align: center;
    padding-top: 0.25rem;
    flex-shrink: 0;
  }
  .clock {
    font-family: var(--font-mono);
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--text-primary);
  }
  .date {
    font-family: var(--font-sans);
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
  }

  /* ── Search bar row ───────────────────────────────── */
  .search-row {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    flex-shrink: 0;
  }

  /* ── Quick links row ──────────────────────────────── */
  .quick-links-row {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    flex-shrink: 0;
  }

  /* ── Widget grid — mobile-first (single column) ──── */
  .widget-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    align-items: start;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  }

  .wg-col {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
  }

  /* News should fill height when in a taller column */
  .wg-col-center {
    min-height: 300px;
  }
  .wg-col-center .widget-card {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 300px;
  }
  .wg-col-center .widget-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .wg-col-center .nf-scroll-area {
    flex: 1;
    max-height: none;
    min-height: 0;
  }

  /* ── Footer ───────────────────────────────────────── */
  .dash-footer {
    text-align: center;
    padding-bottom: 0.25rem;
    flex-shrink: 0;
  }
  .footer-settings-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.8rem;
    font-family: var(--font-sans);
    padding: 0.4rem 1rem;
    transition: color 0.15s;
  }
  .footer-settings-btn:hover {
    color: var(--text-secondary);
  }

  /* ── Breakpoint: 900px+ (2 columns) ──────────────── */
  @media (min-width: 900px) {
    .dashboard {
      padding: 1.25rem 1.5rem;
      gap: 0.85rem;
    }
    .clock {
      font-size: 2.25rem;
    }
    .widget-grid {
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    /* Right col (notepad+tasks) goes under left col */
    .wg-col-left  { grid-column: 1; }
    .wg-col-center { grid-column: 2; }
    .wg-col-right { grid-column: 1; }
  }

  /* ── Breakpoint: 1200px+ (weighted 2 columns) ───── */
  @media (min-width: 1200px) {
    .dashboard {
      padding: 1.5rem 2rem;
      gap: 1rem;
    }
    .clock {
      font-size: 2.5rem;
    }
    .widget-grid {
      grid-template-columns: 1fr 1.5fr;
    }
  }

  /* ── Breakpoint: 1800px+ (3 columns, ultrawide) ─── */
  @media (min-width: 1800px) {
    .widget-grid {
      grid-template-columns: 1fr 1.5fr 1fr;
    }
    .wg-col-left   { grid-column: 1; }
    .wg-col-center { grid-column: 2; grid-row: 1; }
    .wg-col-right  { grid-column: 3; grid-row: 1; }
  }
`;
