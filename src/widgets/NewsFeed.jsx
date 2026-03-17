import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLocal, setLocal } from '../storage.js';
import { fetchAllFeeds } from '../utils/rss.js';

const CACHE_KEY = 'newsfeed_cache';
const VISITED_KEY = 'visitedArticles';
const REFRESH_INTERVAL = 15 * 60 * 1000;
const MAX_ARTICLES = 50;
const MAX_VISITED = 500;

const DEFAULT_FEEDS = [
  // Cybersecurity
  { url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity', name: 'Krebs on Security' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', category: 'Cybersecurity', name: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity', name: 'BleepingComputer' },
  { url: 'https://www.cisa.gov/news.xml', category: 'CMMC/GRC', name: 'CISA' },
  { url: 'https://www.darkreading.com/rss.xml', category: 'Cybersecurity', name: 'Dark Reading' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', name: 'The Verge' },
  // World & Headlines
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'World', name: 'BBC News' },
  { url: 'https://feeds.npr.org/1001/rss.xml', category: 'World', name: 'NPR Top Stories' },
  { url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', category: 'World', name: 'Google News' },
  // Local (Cleveland)
  { url: 'https://www.cleveland.com/arc/outboundfeeds/rss/?outputType=xml', category: 'Local', name: 'Cleveland.com' },
  { url: 'https://www.wkyc.com/feeds/syndication/rss/news', category: 'Local', name: 'WKYC Cleveland' },
  { url: 'https://news.google.com/rss/search?q=Cleveland+Ohio&hl=en-US&gl=US&ceid=US:en', category: 'Local', name: 'Cleveland (Google)' },
  // Science & Space
  { url: 'https://www.nasa.gov/news-release/feed/', category: 'Science', name: 'NASA' },
  { url: 'https://feeds.npr.org/1007/rss.xml', category: 'Science', name: 'NPR Science' },
  { url: 'https://www.smithsonianmag.com/rss/latest_articles/', category: 'Science', name: 'Smithsonian' },
  // Business & Finance
  { url: 'https://www.marketwatch.com/rss/topstories', category: 'Finance', name: 'MarketWatch' },
  { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', category: 'Finance', name: 'Business (Google)' },
  // Interesting
  { url: 'https://theconversation.com/us/articles.atom', category: 'Interesting', name: 'The Conversation' },
  { url: 'https://news.ycombinator.com/rss', category: 'Interesting', name: 'Hacker News' },
  // Reef
  { url: 'https://reefbuilders.com/feed/', category: 'Reef', name: 'Reef Builders' },
];

function timeAgo(dateString) {
  if (!dateString) return '';
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < 0) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const CATEGORY_STYLES = {
  Cybersecurity: { bg: 'rgba(255, 23, 68, 0.15)', color: '#ff4081' },
  'CMMC/GRC': { bg: 'rgba(255, 214, 0, 0.15)', color: '#ffd600' },
  Tech: { bg: 'rgba(0, 180, 216, 0.15)', color: '#00e5ff' },
  World: { bg: 'rgba(100, 181, 246, 0.15)', color: '#64b5f6' },
  Local: { bg: 'rgba(129, 199, 132, 0.15)', color: '#81c784' },
  Science: { bg: 'rgba(186, 104, 200, 0.15)', color: '#ba68c8' },
  Finance: { bg: 'rgba(255, 183, 77, 0.15)', color: '#ffb74d' },
  Interesting: { bg: 'rgba(77, 208, 225, 0.15)', color: '#4dd0e1' },
  Reef: { bg: 'rgba(0, 200, 83, 0.15)', color: '#00c853' },
};

function getSourceStyle(category) {
  return CATEGORY_STYLES[category] || { bg: 'rgba(136, 136, 160, 0.15)', color: 'var(--text-muted)' };
}

function getStatusInfo(loading, fetching, failures, feedCount) {
  if (fetching) return { color: 'var(--accent)', spin: true, label: 'Fetching feeds...' };
  if (loading) return { color: 'var(--text-muted)', spin: false, label: 'Loading...' };
  if (failures.length === 0) return { color: 'var(--success)', spin: false, label: 'All feeds loaded' };
  if (failures.length < feedCount) {
    const names = failures.map(f => `${f.name} (${f.reason})`).join(', ');
    return { color: 'var(--warning)', spin: false, label: `${failures.length} failed: ${names}` };
  }
  return { color: 'var(--error)', spin: false, label: 'All feeds failed' };
}

/* ── Catch-Up Overlay ───────────────────────────────────── */
function CatchUpOverlay({ articles, visited, onMarkVisited, onClose }) {
  const readCount = articles.filter(a => visited.has(a.link)).length;

  return (
    <div className="cu-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cu-panel">
        <div className="cu-header">
          <span className="cu-title">Quick Catch-Up</span>
          <span className="cu-count">{readCount} of {articles.length} read</span>
          <button className="cu-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="cu-body">
          {articles.map((article, i) => {
            const catStyle = getSourceStyle(article.category);
            const isRead = visited.has(article.link);
            return (
              <div key={`${article.link}-${i}`} className={`cu-article${isRead ? ' cu-read' : ''}`}>
                <button className="cu-check" onClick={() => onMarkVisited(article.link)} title={isRead ? 'Read' : 'Mark as read'}>
                  {isRead ? '\u2713' : '\u25CB'}
                </button>
                <div className="cu-content">
                  <div className="cu-meta">
                    <span className="cu-source" style={{ color: catStyle.color, background: catStyle.bg }}>{article.category}</span>
                    <span className="cu-feed-name">{article.source}</span>
                    <span className="cu-time">{timeAgo(article.pubDate)}</span>
                  </div>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="cu-link" onClick={() => onMarkVisited(article.link)}>
                    {article.title}
                  </a>
                  {article.snippet && <div className="cu-snippet">{article.snippet}</div>}
                </div>
              </div>
            );
          })}
          {readCount === articles.length && (
            <div className="cu-done">You're all caught up</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main NewsFeed ──────────────────────────────────────── */
export default function NewsFeed({ settings, onOpenSettings }) {
  const rawFeeds = settings.rssFeeds?.length > 0 ? settings.rssFeeds : DEFAULT_FEEDS;
  const feedList = rawFeeds.filter(f => f.enabled !== false);
  const displayMode = settings.newsDisplayMode || 'standard';
  const catStyle = settings.feedCategoryStyle || 'auto';

  const [articles, setArticles] = useState([]);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [visited, setVisited] = useState(new Set());
  const [showCatchUp, setShowCatchUp] = useState(false);
  const lastFetchRef = useRef(0);

  const categories = ['All', ...Array.from(new Set(feedList.map(f => f.category)))];
  const useDropdown = catStyle === 'dropdown' || (catStyle === 'auto' && categories.length > 7);

  useEffect(() => {
    getLocal(VISITED_KEY).then(arr => {
      if (Array.isArray(arr)) setVisited(new Set(arr));
    });
  }, []);

  const doFetch = useCallback(async () => {
    if (!feedList.length) return;
    setFetching(true);
    try {
      const result = await fetchAllFeeds(feedList);
      setArticles(result.articles.slice(0, MAX_ARTICLES));
      setFailures(result.failures);
      lastFetchRef.current = Date.now();
      await setLocal(CACHE_KEY, { articles: result.articles.slice(0, MAX_ARTICLES), failures: result.failures, ts: Date.now() });
    } catch {
      // keep existing
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, [feedList]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const cached = await getLocal(CACHE_KEY);
      if (!cancelled && cached?.articles?.length) {
        setArticles(cached.articles);
        setFailures(cached.failures || []);
        setLoading(false);
        lastFetchRef.current = cached.ts || 0;
      }
      doFetch();
    }
    init();
    const interval = setInterval(doFetch, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [doFetch]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && (Date.now() - lastFetchRef.current) > REFRESH_INTERVAL) {
        doFetch();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [doFetch]);

  // Listen for 'C' key to open catch-up
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'c' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !showCatchUp) {
        e.preventDefault();
        setShowCatchUp(true);
      }
      if (e.key === 'Escape' && showCatchUp) {
        setShowCatchUp(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showCatchUp]);

  async function markVisited(url) {
    if (!url) return;
    const updated = new Set(visited);
    updated.add(url);
    const arr = Array.from(updated);
    if (arr.length > MAX_VISITED) arr.splice(0, arr.length - MAX_VISITED);
    setVisited(new Set(arr));
    await setLocal(VISITED_KEY, arr);
  }

  function openAllInCategory(cat) {
    const catArticles = cat === 'All' ? articles : articles.filter(a => a.category === cat);
    catArticles.slice(0, 5).forEach(a => {
      window.open(a.link, '_blank', 'noopener,noreferrer');
      markVisited(a.link);
    });
  }

  const filtered = activeCategory === 'All'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const status = getStatusInfo(loading, fetching, failures, feedList.length);

  if (!feedList.length) {
    return (
      <div className="widget-card">
        <div className="widget-header"><span>News</span></div>
        <div className="widget-content" style={s.emptyMsg}>
          <p>No RSS feeds configured</p>
          {onOpenSettings && <button style={s.onboardingBtn} onClick={onOpenSettings}>Configure Feeds</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card" style={s.card}>
      <style>{cssText}</style>
      <div className="widget-header">
        <span style={s.headerLeft}>
          <span className={`nf-status-dot${status.spin ? ' nf-spin' : ''}`} style={{ background: status.color }} title={status.label} />
          News
        </span>
        <span style={s.headerRight}>
          {failures.length > 0 && (
            <span style={s.warnBadge} title={failures.map(f => `${f.name}: ${f.reason}`).join('\n')}>
              {failures.length} unavailable
            </span>
          )}
          <button className="nf-catchup-btn" onClick={() => setShowCatchUp(true)} title="Quick Catch-Up (C)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button className="nf-refresh-btn" onClick={doFetch} disabled={fetching} title="Refresh feeds">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={fetching ? 'nf-spin-svg' : ''}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </span>
      </div>
      <div className="widget-content">
        {/* Category selector */}
        {useDropdown ? (
          <div style={s.dropdownRow}>
            <select className="nf-cat-dropdown" value={activeCategory} onChange={e => setActiveCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {filtered.length > 0 && (
              <button className="nf-tab nf-open-all" onClick={() => openAllInCategory(activeCategory)} title="Open top 5">Open all</button>
            )}
          </div>
        ) : (
          <div className="nf-tabs-scroll">
            {categories.map(cat => (
              <button key={cat} className={`nf-tab${activeCategory === cat ? ' nf-tab-active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
            {filtered.length > 0 && (
              <button className="nf-tab nf-open-all" onClick={() => openAllInCategory(activeCategory)} title="Open top 5">Open all</button>
            )}
          </div>
        )}

        {/* Article list */}
        <div className="nf-scroll-area">
          {loading && !articles.length ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="nf-skeleton-row">
                <div className="nf-skeleton-line" style={{ width: '25%', height: '0.55rem' }} />
                <div className="nf-skeleton-line" style={{ width: '90%' }} />
                <div className="nf-skeleton-line" style={{ width: '70%' }} />
                <div className="nf-skeleton-line" style={{ width: '50%', height: '0.6rem' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={s.emptyMsg}>
              {articles.length === 0 && failures.length > 0 ? (
                <div>
                  <p>Feeds unavailable — try reloading the extension</p>
                  <button style={s.reloadBtn} onClick={() => location.reload()}>Reload</button>
                </div>
              ) : 'No articles in this category.'}
            </div>
          ) : (
            filtered.map((article, i) => {
              const catSt = getSourceStyle(article.category);
              const isVisited = visited.has(article.link);
              return (
                <div key={`${article.link}-${i}`} className={`nf-article${isVisited ? ' nf-visited' : ''}`}>
                  <div className="nf-article-meta">
                    <span className="nf-source" style={{ color: catSt.color, background: catSt.bg }}>{article.source}</span>
                    <span className="nf-time">{timeAgo(article.pubDate)}</span>
                  </div>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="nf-title" onClick={() => markVisited(article.link)}>
                    {article.title}
                  </a>
                  {displayMode !== 'headlines' && article.snippet && (
                    <div className={`nf-snippet${displayMode === 'detailed' ? ' nf-snippet-full' : ''}`}>{article.snippet}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Catch-Up overlay */}
      {showCatchUp && (
        <CatchUpOverlay
          articles={articles.slice(0, 15)}
          visited={visited}
          onMarkVisited={markVisited}
          onClose={() => setShowCatchUp(false)}
        />
      )}
    </div>
  );
}

const cssText = `
  .nf-status-dot {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }
  .nf-spin { animation: nf-pulse 1s ease-in-out infinite; }
  @keyframes nf-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .nf-refresh-btn, .nf-catchup-btn {
    background: none; border: none; color: var(--text-muted); cursor: pointer;
    padding: 0.15rem; display: flex; align-items: center; transition: color 0.15s; border-radius: 4px;
  }
  .nf-refresh-btn:hover, .nf-catchup-btn:hover { color: var(--accent); }
  .nf-refresh-btn:disabled { cursor: wait; }
  .nf-spin-svg { animation: nf-rotate 1s linear infinite; }
  @keyframes nf-rotate { from{transform:rotate(0)} to{transform:rotate(360deg)} }

  /* Tabs — scrollable */
  .nf-tabs-scroll {
    display: flex; gap: 0.3rem; overflow-x: auto; scrollbar-width: none;
    margin-bottom: 0.75rem; align-items: center; padding-bottom: 2px;
  }
  .nf-tabs-scroll::-webkit-scrollbar { display: none; }
  .nf-tab {
    background: none; border: 1px solid var(--border); border-radius: 999px;
    color: var(--text-muted); cursor: pointer; font-size: 0.6rem; font-weight: 500;
    padding: 0.2rem 0.55rem; transition: all 0.2s ease; white-space: nowrap; flex-shrink: 0;
  }
  .nf-tab:hover { border-color: var(--accent); color: var(--text-primary); }
  .nf-tab-active {
    background: var(--accent); border-color: var(--accent); color: var(--bg-primary);
    font-weight: 600; box-shadow: 0 0 12px var(--accent-glow);
  }
  .nf-open-all {
    margin-left: auto; border-style: dashed; font-size: 0.55rem; color: var(--text-muted);
  }
  .nf-open-all:hover { color: var(--accent); border-color: var(--accent); border-style: solid; }

  /* Dropdown mode */
  .nf-cat-dropdown {
    background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-primary); font-size: 0.75rem; padding: 0.3rem 0.5rem;
    outline: none; cursor: pointer; flex: 1;
  }
  .nf-cat-dropdown:focus { border-color: var(--accent); }

  /* Scroll area */
  .nf-scroll-area {
    max-height: 60vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: transparent transparent;
  }
  .nf-scroll-area:hover { scrollbar-color: var(--accent) transparent; }
  .nf-scroll-area::-webkit-scrollbar { width: 4px; }
  .nf-scroll-area::-webkit-scrollbar-track { background: transparent; }
  .nf-scroll-area::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
  .nf-scroll-area:hover::-webkit-scrollbar-thumb { background: var(--accent); }

  /* Articles */
  .nf-article {
    padding: 0.55rem 0 0.55rem 0.6rem; border-bottom: 1px solid var(--border);
    border-left: 2px solid var(--accent); transition: border-left-color 0.15s, opacity 0.15s;
  }
  .nf-article:last-child { border-bottom: none; }
  .nf-article:hover { border-left-color: var(--accent-hover); }
  .nf-article.nf-visited { opacity: 0.5; }
  .nf-article.nf-visited:hover { opacity: 0.7; }
  .nf-article-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem; }
  .nf-source {
    font-size: 0.55rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;
    padding: 0.12rem 0.45rem; border-radius: 999px; line-height: 1;
  }
  .nf-time { font-size: 0.55rem; color: var(--text-muted); }
  .nf-title {
    display: block; color: var(--text-primary); text-decoration: none; font-weight: 500;
    font-size: 0.82rem; line-height: 1.3; transition: color 0.15s ease;
  }
  .nf-title:hover { color: var(--accent); }
  .nf-snippet {
    color: var(--text-secondary); font-size: 0.72rem; line-height: 1.4; margin-top: 0.15rem;
    display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
  }
  .nf-snippet-full { -webkit-line-clamp: 2; }

  /* Skeletons */
  .nf-skeleton-row {
    padding: 0.65rem 0 0.65rem 0.6rem; border-bottom: 1px solid var(--border);
    border-left: 2px solid var(--border); display: flex; flex-direction: column; gap: 0.35rem;
  }
  .nf-skeleton-line {
    height: 0.7rem; border-radius: 4px;
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card-solid) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%; animation: nf-shimmer 1.5s infinite;
  }
  @keyframes nf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Catch-Up Overlay ──────────────────────────────── */
  .cu-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: cu-fade-in 0.2s ease;
  }
  @keyframes cu-fade-in { from{opacity:0} to{opacity:1} }
  .cu-panel {
    background: rgba(15,17,23,0.92); backdrop-filter: blur(24px); border: 1px solid var(--border);
    border-radius: 16px; width: 90vw; max-width: 900px; max-height: 85vh;
    display: flex; flex-direction: column; box-shadow: 0 16px 64px rgba(0,0,0,0.5);
  }
  .cu-header {
    display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .cu-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); }
  .cu-count { font-size: 0.7rem; color: var(--text-muted); margin-left: auto; }
  .cu-close {
    background: none; border: none; color: var(--text-muted); cursor: pointer;
    padding: 0.25rem; display: flex; border-radius: 6px; transition: color 0.15s;
  }
  .cu-close:hover { color: var(--text-primary); }
  .cu-body {
    flex: 1; overflow-y: auto; padding: 0.5rem 1.25rem;
    scrollbar-width: thin; scrollbar-color: var(--accent) transparent;
  }
  .cu-article {
    display: flex; gap: 0.75rem; padding: 0.75rem 0;
    border-bottom: 1px solid var(--border); transition: opacity 0.15s;
  }
  .cu-article:last-child { border-bottom: none; }
  .cu-article.cu-read { opacity: 0.4; }
  .cu-check {
    background: none; border: 1px solid var(--border); border-radius: 50%;
    width: 24px; height: 24px; flex-shrink: 0; cursor: pointer;
    color: var(--text-muted); font-size: 0.7rem;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .cu-read .cu-check { border-color: var(--success); color: var(--success); }
  .cu-content { flex: 1; min-width: 0; }
  .cu-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap; }
  .cu-source {
    font-size: 0.6rem; text-transform: uppercase; font-weight: 600;
    padding: 0.12rem 0.5rem; border-radius: 999px; line-height: 1;
  }
  .cu-feed-name { font-size: 0.6rem; color: var(--text-muted); }
  .cu-time { font-size: 0.6rem; color: var(--text-muted); opacity: 0.6; }
  .cu-link {
    display: block; color: var(--text-primary); text-decoration: none;
    font-size: 0.9rem; font-weight: 500; line-height: 1.35; transition: color 0.15s;
  }
  .cu-link:hover { color: var(--accent); }
  .cu-snippet { color: var(--text-secondary); font-size: 0.78rem; line-height: 1.4; margin-top: 0.2rem; }
  .cu-done {
    text-align: center; padding: 2rem; color: var(--success); font-size: 0.85rem; font-weight: 500;
  }

  @media (min-width: 700px) {
    .cu-body { columns: 2; column-gap: 1.5rem; }
    .cu-article { break-inside: avoid; }
  }
`;

const s = {
  card: { minWidth: 0, display: 'flex', flexDirection: 'column' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dropdownRow: { display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', alignItems: 'center' },
  emptyMsg: { textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' },
  reloadBtn: {
    background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '0.75rem', padding: '0.4rem 1rem', cursor: 'pointer', marginTop: '0.75rem',
  },
  warnBadge: { fontSize: '0.55rem', color: 'var(--warning)', cursor: 'help', letterSpacing: 'normal', textTransform: 'none', fontWeight: 400 },
  onboardingBtn: {
    background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px',
    fontSize: '0.8rem', fontWeight: 600, padding: '0.5rem 1.25rem', cursor: 'pointer', marginTop: '0.5rem',
  },
};
