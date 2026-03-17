import React, { useState, useRef, useEffect } from 'react';
import { saveSettings, DEFAULT_SETTINGS } from '../settings.js';

const CATEGORY_SUGGESTIONS = ['Cybersecurity', 'CMMC/GRC', 'Tech', 'World', 'Local', 'Science', 'Finance', 'Interesting', 'Reef', 'Custom'];

const DEFAULT_FEEDS = [
  { url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity', name: 'Krebs on Security' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', category: 'Cybersecurity', name: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity', name: 'BleepingComputer' },
  { url: 'https://www.cisa.gov/news.xml', category: 'CMMC/GRC', name: 'CISA' },
  { url: 'https://www.darkreading.com/rss.xml', category: 'Cybersecurity', name: 'Dark Reading' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', name: 'The Verge' },
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'World', name: 'BBC News' },
  { url: 'https://feeds.npr.org/1001/rss.xml', category: 'World', name: 'NPR Top Stories' },
  { url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', category: 'World', name: 'Google News' },
  { url: 'https://www.cleveland.com/arc/outboundfeeds/rss/?outputType=xml', category: 'Local', name: 'Cleveland.com' },
  { url: 'https://www.wkyc.com/feeds/syndication/rss/news', category: 'Local', name: 'WKYC Cleveland' },
  { url: 'https://news.google.com/rss/search?q=Cleveland+Ohio&hl=en-US&gl=US&ceid=US:en', category: 'Local', name: 'Cleveland (Google)' },
  { url: 'https://www.nasa.gov/news-release/feed/', category: 'Science', name: 'NASA' },
  { url: 'https://feeds.npr.org/1007/rss.xml', category: 'Science', name: 'NPR Science' },
  { url: 'https://www.smithsonianmag.com/rss/latest_articles/', category: 'Science', name: 'Smithsonian' },
  { url: 'https://www.marketwatch.com/rss/topstories', category: 'Finance', name: 'MarketWatch' },
  { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', category: 'Finance', name: 'Business (Google)' },
  { url: 'https://theconversation.com/us/articles.atom', category: 'Interesting', name: 'The Conversation' },
  { url: 'https://news.ycombinator.com/rss', category: 'Interesting', name: 'Hacker News' },
  { url: 'https://reefbuilders.com/feed/', category: 'Reef', name: 'Reef Builders' },
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
  { key: 'briefing', label: 'Top Stories Briefing' },
  { key: 'todaybar', label: 'Today Context Bar' },
  { key: 'news', label: 'News Feed' },
  { key: 'notepad', label: 'Notepad' },
  { key: 'tasks', label: 'Task List' },
];

const FEED_PACKS = {
  'World News': [
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News', category: 'World' },
    { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR', category: 'World' },
    { url: 'https://feeds.npr.org/1004/rss.xml', name: 'NPR World', category: 'World' },
  ],
  'Cleveland Local': [
    { url: 'https://www.cleveland.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Cleveland.com', category: 'Local' },
    { url: 'https://www.wkyc.com/feeds/syndication/rss/news', name: 'WKYC', category: 'Local' },
    { url: 'https://news.google.com/rss/search?q=Cleveland+Ohio&hl=en-US&gl=US&ceid=US:en', name: 'Cleveland (Google)', category: 'Local' },
  ],
  'Science & Space': [
    { url: 'https://www.nasa.gov/news-release/feed/', name: 'NASA', category: 'Science' },
    { url: 'https://feeds.npr.org/1007/rss.xml', name: 'NPR Science', category: 'Science' },
    { url: 'https://www.smithsonianmag.com/rss/latest_articles/', name: 'Smithsonian', category: 'Science' },
  ],
  'Business & Markets': [
    { url: 'https://www.marketwatch.com/rss/topstories', name: 'MarketWatch', category: 'Finance' },
    { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', name: 'Business (Google)', category: 'Finance' },
  ],
  'Interesting Reads': [
    { url: 'https://theconversation.com/us/articles.atom', name: 'The Conversation', category: 'Interesting' },
    { url: 'https://news.ycombinator.com/rss', name: 'Hacker News', category: 'Interesting' },
  ],
  'Reef Keeping': [
    { url: 'https://reefbuilders.com/feed/', name: 'Reef Builders', category: 'Reef' },
  ],
};

/* ── Shared Components ──────────────────────────────────── */
function Toggle({ value, options, onChange }) {
  return (
    <div className="sp-switch-row">
      {options.map(opt => (
        <button key={opt.value} className={`sp-switch-opt${value === opt.value ? ' sp-switch-active' : ''}`} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, isOpen, onToggle, children }) {
  return (
    <div className="sp-section">
      <button className="sp-section-hdr" onClick={onToggle}>
        <span className="sp-section-title"><span className="sp-dot" />{title}</span>
        <span className="sp-chevron">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && <div className="sp-section-body">{children}</div>}
    </div>
  );
}

/* ── Location Section ───────────────────────────────────── */
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
    if (!navigator.geolocation) { setGeoStatus('Not supported'); return; }
    setGeoStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(4)); setLon(pos.coords.longitude.toFixed(4)); setGeoStatus(''); },
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

/* ── API Keys Section ───────────────────────────────────── */
function ApiKeysSection({ settings, save, isOpen, onToggle, showApiKey, setShowApiKey }) {
  const [key, setKey] = useState(settings.apiKeys?.openweathermap || '');

  function saveKey(value) {
    const k = value !== undefined ? value : key;
    save({ apiKeys: { ...settings.apiKeys, openweathermap: k } });
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text');
    setKey(pasted);
    setTimeout(() => saveKey(pasted), 0);
  }

  return (
    <Section title="API Keys" isOpen={isOpen} onToggle={onToggle}>
      <label className="sp-label">OpenWeatherMap API Key</label>
      <div className="sp-input-group">
        <input className="sp-input" type={showApiKey ? 'text' : 'password'} value={key}
          onChange={e => setKey(e.target.value)} onPaste={handlePaste} onBlur={() => saveKey()} placeholder="Paste your API key" />
        <button className="sp-btn-icon" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? 'Hide' : 'Show'}</button>
      </div>
      <span className="sp-helper">
        Free tier: 1,000 calls/day. <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="sp-link">Get a free API key</a>
      </span>
    </Section>
  );
}

/* ── Main Panel ─────────────────────────────────────────── */
export default function SettingsPanel({ settings, onSettingsChange, onClose, initialSection }) {
  const panelRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [openSections, setOpenSections] = useState(() => {
    const initial = new Set(['general']);
    if (initialSection) initial.add(initialSection);
    return initial;
  });

  function toggleSection(key) {
    setOpenSections(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedCat, setFeedCat] = useState('Cybersecurity');
  const [customTopic, setCustomTopic] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function close() { setVisible(false); setTimeout(onClose, 250); }
  function handleOverlayClick(e) { if (e.target === e.currentTarget) close(); }

  async function save(partial) {
    const updated = await saveSettings(partial);
    onSettingsChange(updated);
  }

  const currentWidgets = settings.widgets || [];
  const feeds = settings.rssFeeds?.length > 0 ? settings.rssFeeds : DEFAULT_FEEDS;
  const links = settings.quickLinks?.length > 0 ? settings.quickLinks : DEFAULT_LINKS;

  function toggleWidget(key) {
    const updated = currentWidgets.includes(key) ? currentWidgets.filter(w => w !== key) : [...currentWidgets, key];
    save({ widgets: updated });
  }

  function toggleFeedEnabled(index) {
    const updated = feeds.map((f, i) => i === index ? { ...f, enabled: f.enabled === false ? true : false } : f);
    save({ rssFeeds: updated });
  }

  function removeFeed(index) {
    save({ rssFeeds: feeds.filter((_, i) => i !== index) });
  }

  function addFeed() {
    const name = feedName.trim();
    let url = feedUrl.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    save({ rssFeeds: [...feeds, { name, url, category: feedCat, enabled: true }] });
    setFeedName(''); setFeedUrl('');
  }

  function addCustomTopic() {
    const topic = customTopic.trim();
    if (!topic) return;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
    save({ rssFeeds: [...feeds, { name: topic, url, category: 'Custom', enabled: true }] });
    setCustomTopic('');
  }

  function feedExists(url) {
    return feeds.some(f => f.url === url);
  }

  function addPackFeed(feed) {
    if (feedExists(feed.url)) return;
    save({ rssFeeds: [...feeds, { ...feed, enabled: true }] });
  }

  function addAllPackFeeds(packFeeds) {
    const toAdd = packFeeds.filter(f => !feedExists(f.url)).map(f => ({ ...f, enabled: true }));
    if (toAdd.length === 0) return;
    save({ rssFeeds: [...feeds, ...toAdd] });
  }

  function removeLink(index) { save({ quickLinks: links.filter((_, i) => i !== index) }); }

  function addLink() {
    const name = linkName.trim();
    let url = linkUrl.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    save({ quickLinks: [...links, { name, url }] });
    setLinkName(''); setLinkUrl('');
  }

  return (
    <div className={`sp-overlay${visible ? ' sp-visible' : ''}`} onClick={handleOverlayClick}>
      <style>{cssText}</style>
      <div ref={panelRef} className={`sp-panel${visible ? ' sp-panel-open' : ''}`}>
        <div className="sp-panel-header">
          <span className="sp-panel-title">Settings</span>
          <button className="sp-close" onClick={close} title="Close (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="sp-panel-body">

          {/* ── General ──────────────────────────────── */}
          <Section title="General" isOpen={openSections.has('general')} onToggle={() => toggleSection('general')}>
            <label className="sp-label">Your Name</label>
            <input className="sp-input" value={settings.userName || ''} onChange={e => save({ userName: e.target.value })} placeholder="Enter your name" />

            <label className="sp-label">Clock Format</label>
            <Toggle value={settings.clockFormat} options={[{ value: '12h', label: '12h' }, { value: '24h', label: '24h' }]} onChange={v => save({ clockFormat: v })} />

            <label className="sp-label">Temperature Unit</label>
            <Toggle value={settings.temperatureUnit} options={[{ value: 'F', label: '\u00B0F' }, { value: 'C', label: '\u00B0C' }]} onChange={v => save({ temperatureUnit: v })} />

            <label className="sp-label">Search Engine</label>
            <select className="sp-select" value={settings.searchEngine} onChange={e => save({ searchEngine: e.target.value })}>
              <option value="google">Google</option><option value="bing">Bing</option><option value="duckduckgo">DuckDuckGo</option>
            </select>

            <label className="sp-label">Theme</label>
            <select className="sp-select" value={settings.theme} onChange={e => save({ theme: e.target.value })}>
              <option value="dark">Dark</option><option value="light">Light</option>
            </select>
          </Section>

          {/* ── Widgets ──────────────────────────────── */}
          <Section title="Widgets" isOpen={openSections.has('widgets')} onToggle={() => toggleSection('widgets')}>
            <span className="sp-helper" style={{ marginBottom: '0.5rem' }}>Show or hide dashboard widgets</span>
            {WIDGET_OPTIONS.map(({ key, label }) => (
              <label key={key} className="sp-checkbox-row">
                <input type="checkbox" className="sp-checkbox" checked={currentWidgets.includes(key)} onChange={() => toggleWidget(key)} />
                <span className="sp-checkbox-label">{label}</span>
              </label>
            ))}
          </Section>

          {/* ── News Display ─────────────────────────── */}
          <Section title="News Display" isOpen={openSections.has('newsdisplay')} onToggle={() => toggleSection('newsdisplay')}>
            <label className="sp-label">Article Density</label>
            <Toggle value={settings.newsDisplayMode || 'standard'} options={[
              { value: 'headlines', label: 'Headlines' },
              { value: 'standard', label: 'Standard' },
              { value: 'detailed', label: 'Detailed' },
            ]} onChange={v => save({ newsDisplayMode: v })} />
            <span className="sp-helper">Headlines: titles only. Standard: title + 1-line snippet. Detailed: title + 2-line snippet.</span>

            <label className="sp-label">Category Selector Style</label>
            <Toggle value={settings.feedCategoryStyle || 'auto'} options={[
              { value: 'tabs', label: 'Tabs' },
              { value: 'auto', label: 'Auto' },
              { value: 'dropdown', label: 'Dropdown' },
            ]} onChange={v => save({ feedCategoryStyle: v })} />
            <span className="sp-helper">Auto switches to dropdown when there are 7+ categories.</span>
          </Section>

          {/* ── Location ─────────────────────────────── */}
          <LocationSection settings={settings} save={save} isOpen={openSections.has('location')} onToggle={() => toggleSection('location')} />

          {/* ── API Keys ─────────────────────────────── */}
          <ApiKeysSection settings={settings} save={save} isOpen={openSections.has('apikeys')} onToggle={() => toggleSection('apikeys')} showApiKey={showApiKey} setShowApiKey={setShowApiKey} />

          {/* ── RSS Feeds ────────────────────────────── */}
          <Section title="RSS Feeds" isOpen={openSections.has('feeds')} onToggle={() => toggleSection('feeds')}>
            <span className="sp-helper" style={{ marginBottom: '0.5rem' }}>{feeds.filter(f => f.enabled !== false).length} of {feeds.length} feeds active</span>
            <div className="sp-list sp-list-tall">
              {feeds.map((f, i) => (
                <div key={`${f.url}-${i}`} className={`sp-list-item${f.enabled === false ? ' sp-disabled' : ''}`}>
                  <button className="sp-feed-toggle" onClick={() => toggleFeedEnabled(i)} title={f.enabled === false ? 'Enable' : 'Disable'}>
                    <span className={`sp-toggle-dot${f.enabled !== false ? ' sp-toggle-on' : ''}`} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sp-list-primary">{f.name}</div>
                    <div className="sp-list-secondary">{f.category}</div>
                  </div>
                  <button className="sp-list-remove" onClick={() => removeFeed(i)}>&times;</button>
                </div>
              ))}
            </div>

            {/* Add feed form */}
            <div className="sp-add-form">
              <input className="sp-input" placeholder="Feed name" value={feedName} onChange={e => setFeedName(e.target.value)} />
              <input className="sp-input" placeholder="Feed URL" value={feedUrl} onChange={e => setFeedUrl(e.target.value)} />
              <select className="sp-select" value={feedCat} onChange={e => setFeedCat(e.target.value)}>
                {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="sp-btn sp-btn-primary" onClick={addFeed}>Add Feed</button>
            </div>

            {/* Custom Google News topic */}
            <label className="sp-label" style={{ marginTop: '1rem' }}>Track a Topic (Google News)</label>
            <div className="sp-input-group">
              <input className="sp-input" placeholder='e.g. "artificial intelligence"' value={customTopic}
                onChange={e => setCustomTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomTopic()} />
              <button className="sp-btn-icon" onClick={addCustomTopic}>Add</button>
            </div>
            <span className="sp-helper">Creates a Google News RSS feed for any topic.</span>

            <button className="sp-btn sp-btn-secondary sp-btn-small" style={{ marginTop: '0.75rem' }} onClick={() => save({ rssFeeds: [] })}>Reset to Defaults</button>
          </Section>

          {/* ── Discover Feeds ───────────────────────── */}
          <Section title="Discover Feeds" isOpen={openSections.has('discover')} onToggle={() => toggleSection('discover')}>
            <span className="sp-helper" style={{ marginBottom: '0.5rem' }}>Pre-built feed packs — add with one click</span>
            {Object.entries(FEED_PACKS).map(([packName, packFeeds]) => (
              <div key={packName} className="sp-pack">
                <div className="sp-pack-header">
                  <span className="sp-pack-name">{packName}</span>
                  <button className="sp-btn sp-btn-primary sp-btn-small" style={{ marginTop: 0 }}
                    onClick={() => addAllPackFeeds(packFeeds)}
                    disabled={packFeeds.every(f => feedExists(f.url))}>
                    {packFeeds.every(f => feedExists(f.url)) ? 'Added' : 'Add all'}
                  </button>
                </div>
                <div className="sp-pack-feeds">
                  {packFeeds.map(f => (
                    <div key={f.url} className="sp-pack-feed">
                      <span className="sp-pack-feed-name">{f.name}</span>
                      {feedExists(f.url) ? (
                        <span className="sp-pack-check">{'\u2713'}</span>
                      ) : (
                        <button className="sp-btn-icon sp-btn-tiny" onClick={() => addPackFeed(f)}>+</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          {/* ── Quick Links ──────────────────────────── */}
          <Section title="Quick Links" isOpen={openSections.has('quicklinks')} onToggle={() => toggleSection('quicklinks')}>
            <div className="sp-list">
              {links.map((l, i) => (
                <div key={`${l.url}-${i}`} className="sp-list-item">
                  <div><div className="sp-list-primary">{l.name}</div><div className="sp-list-secondary">{l.url}</div></div>
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

          {/* ── About ────────────────────────────────── */}
          <Section title="About" isOpen={openSections.has('about')} onToggle={() => toggleSection('about')}>
            <div className="sp-about">
              <strong>Dashboard</strong> v1.1.0<br />
              Custom new tab dashboard with weather, news, briefing, and productivity widgets.<br /><br />
              Built with Claude Code<br />
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="sp-link">GitHub Repository</a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

const cssText = `
  .sp-overlay { position:fixed; inset:0; background:rgba(0,0,0,0); z-index:1000; transition:background 0.25s; backdrop-filter:blur(0px); }
  .sp-overlay.sp-visible { background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); }
  .sp-panel {
    position:fixed; top:0; right:0; width:420px; max-width:90vw; height:100vh;
    background:rgba(15,17,23,0.85); backdrop-filter:blur(24px) saturate(150%); -webkit-backdrop-filter:blur(24px) saturate(150%);
    border-left:1px solid var(--border); transform:translateX(100%); transition:transform 0.25s ease;
    display:flex; flex-direction:column; z-index:1001;
  }
  .sp-panel.sp-panel-open { transform:translateX(0); }
  .sp-panel-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid var(--border); flex-shrink:0; }
  .sp-panel-title { font-size:1.1rem; font-weight:600; color:var(--text-primary); }
  .sp-close { background:none; border:none; color:var(--text-muted); cursor:pointer; padding:0.25rem; display:flex; border-radius:6px; transition:color 0.15s; }
  .sp-close:hover { color:var(--text-primary); background:rgba(255,255,255,0.05); }
  .sp-panel-body { flex:1; min-height:0; overflow-y:auto; padding:0.5rem 0; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.08) transparent; }
  .sp-panel-body::-webkit-scrollbar { width:4px; }
  .sp-panel-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }

  .sp-section { border-bottom:1px solid var(--border); }
  .sp-section-hdr { display:flex; justify-content:space-between; align-items:center; width:100%; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:0.85rem; padding:0.85rem 1.25rem; cursor:pointer; transition:background 0.1s; }
  .sp-section-hdr:hover { background:rgba(255,255,255,0.02); }
  .sp-section-title { display:flex; align-items:center; gap:0.5rem; }
  .sp-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); flex-shrink:0; }
  .sp-chevron { font-size:0.55rem; color:var(--text-muted); }
  .sp-section-body { padding:0 1.25rem 1rem; }

  .sp-switch-row { display:flex; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .sp-switch-opt { flex:1; background:none; border:none; color:var(--text-muted); font-size:0.75rem; padding:0.45rem 0; cursor:pointer; transition:all 0.2s; }
  .sp-switch-opt:not(:last-child) { border-right:1px solid var(--border); }
  .sp-switch-active { background:var(--accent); color:var(--bg-primary); font-weight:600; box-shadow:0 0 12px var(--accent-glow); }

  .sp-label { display:block; font-size:0.72rem; color:var(--text-secondary); margin:0.75rem 0 0.3rem; text-transform:uppercase; letter-spacing:0.04em; }
  .sp-input { display:block; width:100%; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; color:var(--text-primary); font-size:0.85rem; padding:0.5rem 0.65rem; outline:none; transition:border-color 0.15s,box-shadow 0.15s; box-sizing:border-box; box-shadow:inset 0 1px 3px rgba(0,0,0,0.2); }
  .sp-input:focus { border-color:var(--accent); box-shadow:inset 0 1px 3px rgba(0,0,0,0.2),0 0 0 2px var(--accent-glow); }
  .sp-input:disabled { opacity:0.4; cursor:not-allowed; }
  .sp-select { display:block; width:100%; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; color:var(--text-primary); font-size:0.85rem; padding:0.5rem 0.65rem; outline:none; cursor:pointer; box-sizing:border-box; }
  .sp-select:focus { border-color:var(--accent); }
  .sp-input-group { display:flex; gap:0.4rem; align-items:center; }
  .sp-input-group .sp-input { flex:1; }
  .sp-btn-icon { background:none; border:1px solid var(--border); border-radius:8px; color:var(--text-secondary); font-size:0.7rem; cursor:pointer; padding:0.5rem 0.5rem; white-space:nowrap; transition:border-color 0.15s,color 0.15s; }
  .sp-btn-icon:hover { border-color:var(--accent); color:var(--text-primary); }
  .sp-btn-tiny { padding:0.2rem 0.4rem; font-size:0.65rem; border-radius:4px; }

  .sp-btn { display:inline-block; border:none; border-radius:8px; font-size:0.8rem; padding:0.5rem 1rem; cursor:pointer; margin-top:0.6rem; transition:opacity 0.15s; }
  .sp-btn:hover { opacity:0.85; }
  .sp-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .sp-btn-primary { background:var(--accent); color:var(--bg-primary); font-weight:600; }
  .sp-btn-secondary { background:var(--bg-input); color:var(--text-secondary); border:1px solid var(--border); }
  .sp-btn-small { font-size:0.7rem; padding:0.35rem 0.75rem; }

  .sp-helper { display:block; font-size:0.7rem; color:var(--text-muted); margin-top:0.3rem; }
  .sp-link { color:var(--accent); text-decoration:none; }
  .sp-link:hover { text-decoration:underline; }

  .sp-list { display:flex; flex-direction:column; margin:0.5rem 0; border:1px solid var(--border); border-radius:8px; overflow:hidden; max-height:240px; overflow-y:auto; scrollbar-width:thin; }
  .sp-list-tall { max-height:320px; }
  .sp-list-item { display:flex; align-items:center; padding:0.45rem 0.65rem; border-bottom:1px solid var(--border); gap:0.4rem; }
  .sp-list-item:last-child { border-bottom:none; }
  .sp-list-item.sp-disabled { opacity:0.4; }
  .sp-list-primary { font-size:0.78rem; color:var(--text-primary); }
  .sp-list-secondary { font-size:0.6rem; color:var(--text-muted); }
  .sp-list-remove { background:none; border:none; color:var(--text-muted); font-size:1rem; cursor:pointer; padding:0 0.2rem; flex-shrink:0; transition:color 0.15s; }
  .sp-list-remove:hover { color:var(--error); }

  /* Feed toggle dot */
  .sp-feed-toggle { background:none; border:none; cursor:pointer; padding:0.15rem; display:flex; align-items:center; flex-shrink:0; }
  .sp-toggle-dot { width:10px; height:10px; border-radius:50%; background:var(--text-muted); opacity:0.3; transition:all 0.15s; }
  .sp-toggle-on { background:var(--success); opacity:1; box-shadow:0 0 6px rgba(0,200,83,0.3); }

  .sp-add-form { display:flex; flex-direction:column; gap:0.4rem; margin-top:0.6rem; }

  .sp-checkbox-row { display:flex; align-items:center; gap:0.6rem; padding:0.4rem 0; cursor:pointer; }
  .sp-checkbox { accent-color:var(--accent); width:16px; height:16px; cursor:pointer; flex-shrink:0; }
  .sp-checkbox-label { font-size:0.8rem; color:var(--text-primary); }

  /* Feed packs */
  .sp-pack { margin-bottom:0.75rem; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .sp-pack-header { display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.65rem; background:rgba(255,255,255,0.02); }
  .sp-pack-name { font-size:0.8rem; font-weight:600; color:var(--text-primary); }
  .sp-pack-feeds { padding:0 0.65rem 0.4rem; }
  .sp-pack-feed { display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0; font-size:0.75rem; color:var(--text-secondary); }
  .sp-pack-feed-name { flex:1; }
  .sp-pack-check { color:var(--success); font-size:0.75rem; }

  .sp-about { font-size:0.8rem; color:var(--text-secondary); line-height:1.6; }
`;
