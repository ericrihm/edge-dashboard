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
          <div className="widget-col widget-col-left">
            {settings && isVisible('weather') && (
              <Weather settings={settings} onOpenSettings={() => openSettings('apikeys')} />
            )}
            {settings && isVisible('notepad') && <Notepad />}
            {settings && isVisible('tasks') && <TaskList />}
          </div>
          <div className="widget-col widget-col-right">
            {settings && isVisible('news') && (
              <NewsFeed settings={settings} onOpenSettings={() => openSettings('feeds')} />
            )}
          </div>
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
  .dashboard {
    display: grid;
    grid-template-rows: auto auto auto 1fr auto;
    height: 100vh;
    padding: 1.5rem 2rem;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    overflow: hidden;
  }
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
  .dash-header {
    text-align: center;
    padding-top: 0.5rem;
  }
  .clock {
    font-family: var(--font-mono);
    font-size: 2.5rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--text-primary);
  }
  .date {
    font-family: var(--font-sans);
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin-top: 0.2rem;
  }
  .search-row {
    max-width: 680px;
    width: 100%;
    margin: 0 auto;
  }
  .quick-links-row {
    max-width: 680px;
    width: 100%;
    margin: 0 auto;
  }
  .widget-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem;
    align-items: start;
    min-height: 0;
    overflow-y: auto;
  }
  .widget-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }
  .dash-footer {
    text-align: center;
    padding-bottom: 0.25rem;
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

  /* Responsive: medium */
  @media (max-width: 1000px) {
    .widget-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  /* Responsive: narrow */
  @media (max-width: 700px) {
    .dashboard {
      padding: 1rem;
      gap: 0.75rem;
    }
    .clock {
      font-size: 2rem;
    }
    .widget-grid {
      grid-template-columns: 1fr;
    }
    .search-row, .quick-links-row {
      max-width: 100%;
    }
  }
`;
