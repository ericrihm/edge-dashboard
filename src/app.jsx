import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings } from './settings.js';
import { getLocal, setLocal } from './storage.js';
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
  if (format === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();
}

function getGreeting(date, name) {
  const h = date.getHours();
  let greeting;
  if (h >= 5 && h < 12) greeting = 'Good morning';
  else if (h >= 12 && h < 17) greeting = 'Good afternoon';
  else if (h >= 17 && h < 21) greeting = 'Good evening';
  else greeting = 'Burning the midnight oil';
  return name ? `${greeting}, ${name}` : greeting;
}

function timeAgoShort(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef(null);

  // Update clock every 60 seconds (no seconds display)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Check last updated timestamps
  useEffect(() => {
    async function checkTimestamps() {
      const [weatherCache, newsCache] = await Promise.all([
        getLocal('weather_current'),
        getLocal('newsfeed_cache'),
      ]);
      const ts = Math.max(weatherCache?.ts || 0, newsCache?.ts || 0);
      if (ts > 0) setLastUpdated(ts);
    }
    checkTimestamps();
    const interval = setInterval(checkTimestamps, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut tooltip (show once)
  useEffect(() => {
    async function checkShortcuts() {
      const seen = await getLocal('hasSeenShortcuts');
      if (!seen) {
        setShowShortcuts(true);
        await setLocal('hasSeenShortcuts', true);
        setTimeout(() => setShowShortcuts(false), 5000);
      }
    }
    checkShortcuts();
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
      if (e.key === 's' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !showSettings) {
        e.preventDefault();
        openSettings();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showSettings, openSettings]);

  const clockFormat = settings?.clockFormat || '12h';
  const widgets = settings?.widgets || [];
  const isVisible = (name) => widgets.includes(name);
  const userName = settings?.userName || '';

  const hasLeftCol = settings && (isVisible('weather'));
  const hasCenterCol = settings && (isVisible('news'));
  const hasRightCol = settings && (isVisible('notepad') || isVisible('tasks'));

  function handleRefresh() {
    window.location.reload();
  }

  return (
    <>
      <style>{responsiveCSS}</style>

      {/* Animated gradient background */}
      <div className="dashboard-bg" />

      <div className="dashboard">
        <button
          className="gear-btn"
          onClick={() => openSettings()}
          title="Settings (S)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <header className="dash-header">
          <div className="clock">{formatTime(now, clockFormat)}</div>
          <div className="date">{formatDate(now)}</div>
          <div className="greeting">{getGreeting(now, userName)}</div>
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
          {lastUpdated && (
            <button className="footer-updated-btn" onClick={handleRefresh} title="Click to refresh">
              Updated {timeAgoShort(lastUpdated)}
            </button>
          )}
        </footer>

        {/* Keyboard shortcut tooltip */}
        {showShortcuts && (
          <div className="shortcut-toast">
            <kbd>/</kbd> search &nbsp; <kbd>S</kbd> settings &nbsp; <kbd>Esc</kbd> close
          </div>
        )}

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
  /* ── Animated gradient background ──────────────────── */
  .dashboard-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(0, 180, 216, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(0, 200, 83, 0.04) 0%, transparent 50%),
      var(--bg-primary);
    animation: bgShift 60s ease-in-out infinite alternate;
  }

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
    z-index: 1;
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
    transition: color 0.3s, background 0.3s, transform 0.3s;
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gear-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
    transform: rotate(90deg);
  }

  /* ── Header (clock + date + greeting) ─────────────── */
  .dash-header {
    text-align: center;
    padding-top: 0.25rem;
    flex-shrink: 0;
    animation: fadeInDown 0.5s ease forwards;
  }
  .clock {
    font-family: var(--font-mono);
    font-size: 2.5rem;
    font-weight: 300;
    letter-spacing: 4px;
    color: var(--text-primary);
    transition: opacity 0.3s ease;
  }
  .date {
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 300;
    color: var(--text-secondary);
    letter-spacing: 1px;
    margin-top: 0.15rem;
  }
  .greeting {
    font-family: var(--font-sans);
    font-size: 1.1rem;
    font-weight: 300;
    color: var(--text-secondary);
    letter-spacing: 0.5px;
    margin-top: 0.5rem;
    animation: fadeIn 0.8s ease 0.3s forwards;
    opacity: 0;
  }

  /* ── Search bar row ───────────────────────────────── */
  .search-row {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    flex-shrink: 0;
    animation: fadeIn 0.5s ease 0.15s forwards;
    opacity: 0;
  }

  /* ── Quick links row ──────────────────────────────── */
  .quick-links-row {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    flex-shrink: 0;
    animation: fadeIn 0.5s ease 0.2s forwards;
    opacity: 0;
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
  .footer-updated-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.7rem;
    font-family: var(--font-sans);
    padding: 0.4rem 1rem;
    transition: color 0.15s;
  }
  .footer-updated-btn:hover {
    color: var(--text-secondary);
  }

  /* ── Keyboard shortcut toast ──────────────────────── */
  .shortcut-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-card);
    backdrop-filter: var(--blur);
    -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 1.25rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    z-index: 800;
    animation: toastIn 0.3s ease forwards, toastOut 0.3s ease 4.7s forwards;
    white-space: nowrap;
  }
  .shortcut-toast kbd {
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
    margin: 0 0.1rem;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes toastOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  /* ── Breakpoint: 900px+ (2 columns) ──────────────── */
  @media (min-width: 900px) {
    .dashboard {
      padding: 1.25rem 1.5rem;
      gap: 0.85rem;
    }
    .clock {
      font-size: 3rem;
    }
    .widget-grid {
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
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
