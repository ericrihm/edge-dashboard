import React, { useState, useEffect } from 'react';
import { getSettings } from './settings.js';
import Weather from './widgets/Weather.jsx';
import NewsFeed from './widgets/NewsFeed.jsx';
import SearchBar from './widgets/SearchBar.jsx';
import QuickLinks from './widgets/QuickLinks.jsx';
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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const clockFormat = settings?.clockFormat || '12h';

  return (
    <div style={styles.container}>
      {/* Gear icon — top right */}
      <button
        style={styles.gearBtn}
        onClick={() => setShowSettings(true)}
        title="Settings"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <header style={styles.header}>
        <div style={styles.clock}>{formatTime(now, clockFormat)}</div>
        <div style={styles.date}>{formatDate(now)}</div>
      </header>

      {settings && (
        <div style={styles.searchRow}>
          <SearchBar settings={settings} onSettingsChange={setSettings} />
        </div>
      )}

      {settings && (
        <div style={styles.quickLinksRow}>
          <QuickLinks settings={settings} onSettingsChange={setSettings} />
        </div>
      )}

      <main style={styles.widgetGrid}>
        {settings && <Weather settings={settings} />}
        {settings && <NewsFeed settings={settings} />}
      </main>

      <footer style={styles.footer}>
        <button style={styles.settingsBtn} onClick={() => setShowSettings(true)}>Settings</button>
      </footer>

      {showSettings && settings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateRows: 'auto auto auto 1fr auto',
    minHeight: '100vh',
    padding: '2rem',
    gap: '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    position: 'relative',
  },
  gearBtn: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'color 0.15s, background 0.15s',
    zIndex: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center',
  },
  clock: {
    fontSize: '3rem',
    fontWeight: 300,
    letterSpacing: '0.05em',
    color: 'var(--text-primary)',
  },
  date: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  searchRow: {
    maxWidth: '680px',
    width: '100%',
    margin: '0 auto',
  },
  quickLinksRow: {
    maxWidth: '680px',
    width: '100%',
    margin: '0 auto',
  },
  widgetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  footer: {
    textAlign: 'center',
    paddingBottom: '1rem',
  },
  settingsBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
  },
};
