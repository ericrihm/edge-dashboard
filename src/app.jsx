import React, { useState, useEffect } from 'react';
import { getSettings } from './settings.js';
import Weather from './widgets/Weather.jsx';
import NewsFeed from './widgets/NewsFeed.jsx';
import SearchBar from './widgets/SearchBar.jsx';
import QuickLinks from './widgets/QuickLinks.jsx';
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
        <button style={styles.settingsBtn}>Settings</button>
      </footer>
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
