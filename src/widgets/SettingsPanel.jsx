import React, { useState, useRef, useEffect } from 'react';
import { saveSettings, DEFAULT_SETTINGS } from '../settings.js';

const CATEGORY_SUGGESTIONS = ['Cybersecurity', 'CMMC/GRC', 'Tech', 'Local', 'Reef', 'Custom'];

const DEFAULT_FEEDS = [
  { url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity', name: 'Krebs on Security' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', category: 'Cybersecurity', name: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity', name: 'BleepingComputer' },
  { url: 'https://www.cisa.gov/news.xml', category: 'CMMC/GRC', name: 'CISA' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech', name: 'Ars Technica' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', name: 'The Verge' },
];

const DEFAULT_LINKS = [
  { name: 'M365 Admin', url: 'https://admin.microsoft.com' },
  { name: 'Intune', url: 'https://intune.microsoft.com' },
  { name: 'Defender', url: 'https://security.microsoft.com' },
  { name: 'Azure', url: 'https://portal.azure.com' },
  { name: 'Pax8', url: 'https://app.pax8.com' },
  { name: 'Claude', url: 'https://claude.ai' },
  { name: 'WGU', url: 'https://my.wgu.edu' },
  { name: 'GitHub', url: 'https://github.com' },
];

const WIDGET_OPTIONS = [
  { key: 'clock', label: 'Clock' },
  { key: 'search', label: 'Search Bar' },
  { key: 'quicklinks', label: 'Quick Links' },
  { key: 'weather', label: 'Weather' },
  { key: 'news', label: 'News Feed' },
  { key: 'notepad', label: 'Notepad' },
  { key: 'tasks', label: 'Task List' },
];

/* ── Accordion Section (controlled) ──────────────────── */
function Section({ title, isOpen, onToggle, children }) {
  return (
    <div className="sp-section">
      <button className="sp-section-hdr" onClick={onToggle}>
        <span>{title}</span>
        <span className="sp-chevron">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && <div className="sp-section-body">{children}</div>}
    </div>
  );
}

/* ── Location Section (extracted — has local state) ───── */
function LocationSection({ settings, save, isOpen, onToggle }) {
  const loc = settings.location || {};
  const [city, setCity] = useState(loc.city || '');
  const [lat, setLat] = useState(loc.lat ?? '');
  const [lon, setLon] = useState(loc.lon ?? '');
  const [geoStatus, setGeoStatus] = useState('');

  function saveLocation() {
    save({ location: { ...loc, city, lat: parseFloat(lat), lon: parseFloat(lon) } });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setGeoStatus('Geolocation not supported'); return; }
    setGeoStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setGeoStatus('');
      },
      () => setGeoStatus('Permission denied'),
    );
  }

  return (
    <Section title="Location" isOpen={isOpen} onToggle={onToggle}>
      <label className="sp-label">City</label>
      <input className="sp-input" value={city} onChange={e => setCity(e.target.value)} onBlur={saveLocation} />

      <label className="sp-label">Latitude</label>
      <input className="sp-input" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} onBlur={saveLocation} />

      <label className="sp-label">Longitude</label>
      <input className="sp-input" type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} onBlur={saveLocation} />

      <button className="sp-btn sp-btn-secondary" onClick={useCurrentLocation}>Use Current Location</button>
      {geoStatus && <span className="sp-helper">{geoStatus}</span>}
    </Section>
  );
}

/* ── API Keys Section (extracted — has local state) ───── */
function ApiKeysSection({ settings, save, isOpen, onToggle, showApiKey, setShowApiKey }) {
  const [key, setKey] = useState(settings.apiKeys?.openweathermap || '');

  function saveKey() {
    save({ apiKeys: { ...settings.apiKeys, openweathermap: key } });
  }

  return (
    <Section title="API Keys" isOpen={isOpen} onToggle={onToggle}>
      <label className="sp-label">OpenWeatherMap API Key</label>
      <div className="sp-input-group">
        <input
          className="sp-input"
          type={showApiKey ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          onBlur={saveKey}
          placeholder="Paste your API key"
        />
        <button className="sp-btn-icon" onClick={() => setShowApiKey(!showApiKey)} title={showApiKey ? 'Hide' : 'Show'}>
          {showApiKey ? 'Hide' : 'Show'}
        </button>
      </div>
      <span className="sp-helper">
        Free tier: 1,000 calls/day. <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="sp-link">Get a free API key</a>
      </span>

      <label className="sp-label" style={{ marginTop: '1rem', opacity: 0.5 }}>Alpha Vantage (coming soon)</label>
      <input className="sp-input" disabled placeholder="Coming soon" />
    </Section>
  );
}

/* ── Main Panel ───────────────────────────────────────── */
export default function SettingsPanel({ settings, onSettingsChange, onClose, initialSection }) {
  const panelRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState(() => {
    const initial = new Set(['general']);
    if (initialSection) initial.add(initialSection);
    return initial;
  });

  function toggleSection(key) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // RSS add form
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedCat, setFeedCat] = useState('Cybersecurity');

  // Quick link add form
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) close();
  }

  /* Save helper — saves partial, updates parent state */
  async function save(partial) {
    const updated = await saveSettings(partial);
    onSettingsChange(updated);
  }

  /* ── Derived data ────────────────────────────────────── */
  const currentWidgets = settings.widgets || [];
  const feeds = settings.rssFeeds?.length > 0 ? settings.rssFeeds : DEFAULT_FEEDS;
  const links = settings.quickLinks?.length > 0 ? settings.quickLinks : DEFAULT_LINKS;

  function toggleWidget(key) {
    const updated = currentWidgets.includes(key)
      ? currentWidgets.filter(w => w !== key)
      : [...currentWidgets, key];
    save({ widgets: updated });
  }

  function removeFeed(index) {
    save({ rssFeeds: feeds.filter((_, i) => i !== index) });
  }

  function addFeed() {
    const name = feedName.trim();
    let url = feedUrl.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    save({ rssFeeds: [...feeds, { name, url, category: feedCat }] });
    setFeedName('');
    setFeedUrl('');
  }

  function removeLink(index) {
    save({ quickLinks: links.filter((_, i) => i !== index) });
  }

  function addLink() {
    const name = linkName.trim();
    let url = linkUrl.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    save({ quickLinks: [...links, { name, url }] });
    setLinkName('');
    setLinkUrl('');
  }

  /* ── Render ───────────────────────────────────────── */
  return (
    <div
      className={`sp-overlay${visible ? ' sp-visible' : ''}`}
      onClick={handleOverlayClick}
    >
      <style>{cssText}</style>
      <div ref={panelRef} className={`sp-panel${visible ? ' sp-panel-open' : ''}`}>
        <div className="sp-panel-header">
          <span className="sp-panel-title">Settings</span>
          <button className="sp-close" onClick={close} title="Close">&times;</button>
        </div>
        <div className="sp-panel-body">

          {/* ── General ─────────────────────────────── */}
          <Section title="General" isOpen={openSections.has('general')} onToggle={() => toggleSection('general')}>
            <label className="sp-label">Clock Format</label>
            <div className="sp-toggle-row">
              {['12h', '24h'].map(v => (
                <button
                  key={v}
                  className={`sp-toggle-btn${settings.clockFormat === v ? ' sp-active' : ''}`}
                  onClick={() => save({ clockFormat: v })}
                >{v}</button>
              ))}
            </div>

            <label className="sp-label">Temperature Unit</label>
            <div className="sp-toggle-row">
              {['F', 'C'].map(v => (
                <button
                  key={v}
                  className={`sp-toggle-btn${settings.temperatureUnit === v ? ' sp-active' : ''}`}
                  onClick={() => save({ temperatureUnit: v })}
                >{v === 'F' ? '\u00B0F' : '\u00B0C'}</button>
              ))}
            </div>

            <label className="sp-label">Search Engine</label>
            <select
              className="sp-select"
              value={settings.searchEngine}
              onChange={e => save({ searchEngine: e.target.value })}
            >
              <option value="google">Google</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
            </select>

            <label className="sp-label">Theme</label>
            <select
              className="sp-select"
              value={settings.theme}
              onChange={e => save({ theme: e.target.value })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </Section>

          {/* ── Widgets ─────────────────────────────── */}
          <Section title="Widgets" isOpen={openSections.has('widgets')} onToggle={() => toggleSection('widgets')}>
            <span className="sp-helper" style={{ marginBottom: '0.5rem' }}>Show or hide dashboard widgets</span>
            {WIDGET_OPTIONS.map(({ key, label }) => (
              <label key={key} className="sp-checkbox-row">
                <input
                  type="checkbox"
                  className="sp-checkbox"
                  checked={currentWidgets.includes(key)}
                  onChange={() => toggleWidget(key)}
                />
                <span className="sp-checkbox-label">{label}</span>
              </label>
            ))}
          </Section>

          {/* ── Location (top-level component — has local state) ── */}
          <LocationSection
            settings={settings}
            save={save}
            isOpen={openSections.has('location')}
            onToggle={() => toggleSection('location')}
          />

          {/* ── API Keys (top-level component — has local state) ── */}
          <ApiKeysSection
            settings={settings}
            save={save}
            isOpen={openSections.has('apikeys')}
            onToggle={() => toggleSection('apikeys')}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
          />

          {/* ── RSS Feeds ───────────────────────────── */}
          <Section title="RSS Feeds" isOpen={openSections.has('feeds')} onToggle={() => toggleSection('feeds')}>
            <div className="sp-list">
              {feeds.map((f, i) => (
                <div key={`${f.url}-${i}`} className="sp-list-item">
                  <div>
                    <div className="sp-list-primary">{f.name}</div>
                    <div className="sp-list-secondary">{f.category} &middot; {f.url}</div>
                  </div>
                  <button className="sp-list-remove" onClick={() => removeFeed(i)}>&times;</button>
                </div>
              ))}
            </div>

            <div className="sp-add-form">
              <input className="sp-input" placeholder="Feed name" value={feedName} onChange={e => setFeedName(e.target.value)} />
              <input className="sp-input" placeholder="Feed URL" value={feedUrl} onChange={e => setFeedUrl(e.target.value)} />
              <select className="sp-select" value={feedCat} onChange={e => setFeedCat(e.target.value)}>
                {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="sp-btn sp-btn-primary" onClick={addFeed}>Add Feed</button>
            </div>

            <button className="sp-btn sp-btn-secondary sp-btn-small" onClick={() => save({ rssFeeds: [] })}>Reset to Defaults</button>
          </Section>

          {/* ── Quick Links ─────────────────────────── */}
          <Section title="Quick Links" isOpen={openSections.has('quicklinks')} onToggle={() => toggleSection('quicklinks')}>
            <div className="sp-list">
              {links.map((l, i) => (
                <div key={`${l.url}-${i}`} className="sp-list-item">
                  <div>
                    <div className="sp-list-primary">{l.name}</div>
                    <div className="sp-list-secondary">{l.url}</div>
                  </div>
                  <button className="sp-list-remove" onClick={() => removeLink(i)}>&times;</button>
                </div>
              ))}
            </div>

            <div className="sp-add-form">
              <input className="sp-input" placeholder="Link name" value={linkName} onChange={e => setLinkName(e.target.value)} />
              <input className="sp-input" placeholder="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
              <button className="sp-btn sp-btn-primary" onClick={addLink}>Add Link</button>
            </div>

            <button className="sp-btn sp-btn-secondary sp-btn-small" onClick={() => save({ quickLinks: [] })}>Reset to Defaults</button>
          </Section>

          {/* ── About ───────────────────────────────── */}
          <Section title="About" isOpen={openSections.has('about')} onToggle={() => toggleSection('about')}>
            <div className="sp-about">
              <strong>Dashboard</strong> v1.0.0
              <br />
              Custom new tab dashboard with weather, news, and productivity widgets.
              <br /><br />
              Built with Claude Code
              <br />
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="sp-link">GitHub Repository</a>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────── */
const cssText = `
  .sp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0);
    z-index: 1000;
    transition: background 0.25s;
  }
  .sp-overlay.sp-visible {
    background: rgba(0,0,0,0.55);
  }
  .sp-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    max-width: 90vw;
    height: 100vh;
    max-height: 100vh;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border);
    transform: translateX(100%);
    transition: transform 0.25s ease;
    display: flex;
    flex-direction: column;
    z-index: 1001;
  }
  .sp-panel.sp-panel-open {
    transform: translateX(0);
  }
  .sp-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .sp-panel-title {
    font-family: var(--font-sans);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .sp-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.15s;
  }
  .sp-close:hover {
    color: var(--text-primary);
  }
  .sp-panel-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.5rem 0;
    scrollbar-width: thin;
    scrollbar-color: var(--accent) transparent;
  }
  .sp-panel-body::-webkit-scrollbar { width: 4px; }
  .sp-panel-body::-webkit-scrollbar-track { background: transparent; }
  .sp-panel-body::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 4px; }

  /* Sections / Accordion */
  .sp-section {
    border-bottom: 1px solid var(--border);
  }
  .sp-section-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.85rem 1.25rem;
    cursor: pointer;
    transition: background 0.1s;
  }
  .sp-section-hdr:hover {
    background: rgba(255,255,255,0.03);
  }
  .sp-chevron {
    font-size: 0.55rem;
    color: var(--text-muted);
  }
  .sp-section-body {
    padding: 0 1.25rem 1rem;
  }

  /* Form controls */
  .sp-label {
    display: block;
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin: 0.75rem 0 0.3rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sp-input {
    display: block;
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    padding: 0.5rem 0.65rem;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .sp-input:focus {
    border-color: var(--accent);
  }
  .sp-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .sp-select {
    display: block;
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.85rem;
    padding: 0.5rem 0.65rem;
    outline: none;
    cursor: pointer;
    box-sizing: border-box;
  }
  .sp-select:focus {
    border-color: var(--accent);
  }
  .sp-input-group {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .sp-input-group .sp-input {
    flex: 1;
  }
  .sp-btn-icon {
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 0.7rem;
    cursor: pointer;
    padding: 0.5rem 0.5rem;
    white-space: nowrap;
    transition: border-color 0.15s;
  }
  .sp-btn-icon:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  /* Toggle row */
  .sp-toggle-row {
    display: flex;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .sp-toggle-btn {
    flex: 1;
    background: var(--bg-primary);
    border: none;
    border-right: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 0.8rem;
    padding: 0.45rem 0;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sp-toggle-btn:last-child { border-right: none; }
  .sp-toggle-btn:hover { color: var(--text-primary); }
  .sp-toggle-btn.sp-active {
    background: var(--accent);
    color: var(--bg-primary);
    font-weight: 600;
  }

  /* Buttons */
  .sp-btn {
    display: inline-block;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-top: 0.6rem;
    transition: opacity 0.15s;
  }
  .sp-btn:hover { opacity: 0.85; }
  .sp-btn-primary {
    background: var(--accent);
    color: var(--bg-primary);
    font-weight: 600;
  }
  .sp-btn-secondary {
    background: var(--bg-primary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
  }
  .sp-btn-small {
    font-size: 0.7rem;
    padding: 0.35rem 0.75rem;
  }

  /* Helper text */
  .sp-helper {
    display: block;
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 0.3rem;
  }
  .sp-link {
    color: var(--accent);
    text-decoration: none;
  }
  .sp-link:hover {
    text-decoration: underline;
  }

  /* List */
  .sp-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 0.5rem 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    max-height: 240px;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  .sp-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid var(--border);
    gap: 0.5rem;
  }
  .sp-list-item:last-child { border-bottom: none; }
  .sp-list-primary {
    font-size: 0.8rem;
    color: var(--text-primary);
  }
  .sp-list-secondary {
    font-size: 0.65rem;
    color: var(--text-muted);
    word-break: break-all;
  }
  .sp-list-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0 0.25rem;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  .sp-list-remove:hover {
    color: var(--error, #ef4444);
  }

  /* Add form */
  .sp-add-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.6rem;
  }

  /* Checkbox rows */
  .sp-checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0;
    cursor: pointer;
  }
  .sp-checkbox {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .sp-checkbox-label {
    font-size: 0.8rem;
    color: var(--text-primary);
  }

  /* About */
  .sp-about {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }
`;
