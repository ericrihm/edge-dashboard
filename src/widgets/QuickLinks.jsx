import React, { useState } from 'react';
import { saveSettings } from '../settings.js';

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

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function FaviconImg({ url, name }) {
  const [failed, setFailed] = useState(false);
  const domain = getDomain(url);
  const letter = (name || domain || '?')[0].toUpperCase();
  const hue = letter.charCodeAt(0) * 37 % 360;

  if (failed || !domain) {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `hsl(${hue}, 55%, 45%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 600, color: '#fff',
      }}>
        {letter}
      </div>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      width={28}
      height={28}
      style={{ borderRadius: 8, background: 'rgba(0,0,0,0.3)', padding: 2 }}
      onError={() => setFailed(true)}
    />
  );
}

export default function QuickLinks({ settings, onSettingsChange }) {
  const [editing, setEditing] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const links = settings.quickLinks?.length > 0 ? settings.quickLinks : DEFAULT_LINKS;

  async function removeLink(index) {
    const updated = links.filter((_, i) => i !== index);
    const newSettings = await saveSettings({ quickLinks: updated });
    if (onSettingsChange) onSettingsChange(newSettings);
  }

  async function addLink() {
    const name = addName.trim();
    let url = addUrl.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const updated = [...links, { name, url }];
    const newSettings = await saveSettings({ quickLinks: updated });
    if (onSettingsChange) onSettingsChange(newSettings);
    setAddName('');
    setAddUrl('');
  }

  function handleAddKeyDown(e) {
    if (e.key === 'Enter') addLink();
  }

  return (
    <div className="widget-card" style={s.card}>
      <style>{cssText}</style>
      <div className="widget-header">
        <span>Quick Links</span>
        <button className="ql-edit-btn" onClick={() => setEditing(!editing)} title={editing ? 'Done' : 'Edit'}>
          {editing ? 'Done' : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
        </button>
      </div>
      <div className="ql-grid">
        {links.map((link, i) => (
          <div key={`${link.url}-${i}`} className="ql-tile-wrap">
            {editing && (
              <button className="ql-remove" onClick={() => removeLink(i)} title="Remove">&times;</button>
            )}
            <a href={link.url} className="ql-tile" title={link.url}>
              <FaviconImg url={link.url} name={link.name} />
              <span className="ql-name">{link.name}</span>
            </a>
          </div>
        ))}
        {editing && (
          <div className="ql-tile ql-add-tile">
            <div style={s.addForm}>
              <input
                className="ql-add-input"
                placeholder="Name"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                onKeyDown={handleAddKeyDown}
              />
              <input
                className="ql-add-input"
                placeholder="URL"
                value={addUrl}
                onChange={e => setAddUrl(e.target.value)}
                onKeyDown={handleAddKeyDown}
              />
              <button className="ql-add-btn" onClick={addLink}>+</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cssText = `
  .ql-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  @media (min-width: 600px) {
    .ql-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (min-width: 900px) {
    .ql-grid { grid-template-columns: repeat(6, 1fr); }
  }
  @media (min-width: 1400px) {
    .ql-grid { grid-template-columns: repeat(8, 1fr); }
  }
  .ql-tile-wrap {
    position: relative;
  }
  .ql-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    background: var(--bg-card);
    backdrop-filter: var(--blur);
    -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.5rem 0.4rem;
    min-height: 60px;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    cursor: pointer;
  }
  @media (min-width: 1200px) {
    .ql-tile {
      padding: 0.6rem 0.5rem;
      min-height: 68px;
    }
  }
  .ql-tile:hover {
    transform: scale(1.03);
    border-color: var(--accent);
    box-shadow: 0 0 16px var(--accent-glow);
  }
  .ql-name {
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .ql-remove {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--error);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }
  .ql-edit-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.15rem;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }
  .ql-edit-btn:hover {
    color: var(--accent);
  }
  .ql-add-tile {
    border: 1px dashed rgba(255, 255, 255, 0.1);
    background: transparent;
    backdrop-filter: none;
  }
  .ql-add-input {
    width: 100%;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 0.6rem;
    padding: 0.2rem 0.35rem;
    outline: none;
  }
  .ql-add-input:focus {
    border-color: var(--accent);
  }
  .ql-add-btn {
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    width: 100%;
  }
`;

const s = {
  card: {
    minWidth: 0,
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
  },
};
