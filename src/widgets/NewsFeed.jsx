import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLocal, setLocal } from '../storage.js';
import { fetchAllFeeds } from '../utils/rss.js';

const CACHE_KEY = 'newsfeed_cache';
const VISITED_KEY = 'visitedArticles';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_ARTICLES = 30;
const MAX_VISITED = 500;

const DEFAULT_FEEDS = [
  { url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity', name: 'Krebs on Security' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', category: 'Cybersecurity', name: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity', name: 'BleepingComputer' },
  { url: 'https://www.cisa.gov/news.xml', category: 'CMMC/GRC', name: 'CISA' },
  { url: 'https://www.darkreading.com/rss.xml', category: 'Cybersecurity', name: 'Dark Reading' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', name: 'The Verge' },
];

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return '';
  const diff = now - then;
  if (diff < 0) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const CATEGORY_STYLES = {
  Cybersecurity: { bg: 'rgba(255, 23, 68, 0.15)', color: '#ff4081', border: 'rgba(255, 23, 68, 0.3)' },
  'CMMC/GRC': { bg: 'rgba(255, 214, 0, 0.15)', color: '#ffd600', border: 'rgba(255, 214, 0, 0.3)' },
  Tech: { bg: 'rgba(0, 180, 216, 0.15)', color: '#00e5ff', border: 'rgba(0, 180, 216, 0.3)' },
};

function getSourceStyle(category) {
  return CATEGORY_STYLES[category] || { bg: 'rgba(136, 136, 160, 0.15)', color: 'var(--text-muted)', border: 'rgba(136, 136, 160, 0.3)' };
}

/* Status dot color logic */
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

export default function NewsFeed({ settings, onOpenSettings }) {
  const feedList = settings.rssFeeds?.length > 0 ? settings.rssFeeds : DEFAULT_FEEDS;

  const [articles, setArticles] = useState([]);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [visited, setVisited] = useState(new Set());
  const lastFetchRef = useRef(0);

  const categories = ['All', ...Array.from(new Set(feedList.map(f => f.category)))];

  // Load visited articles on mount
  useEffect(() => {
    getLocal(VISITED_KEY).then(arr => {
      if (Array.isArray(arr)) setVisited(new Set(arr));
    });
  }, []);

  const doFetch = useCallback(async () => {
    setFetching(true);
    try {
      const result = await fetchAllFeeds(feedList);
      setArticles(result.articles.slice(0, MAX_ARTICLES));
      setFailures(result.failures);
      lastFetchRef.current = Date.now();
      await setLocal(CACHE_KEY, { articles: result.articles.slice(0, MAX_ARTICLES), failures: result.failures, ts: Date.now() });
    } catch {
      // keep existing data
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

  // Refresh on visibility change if stale (>15 min)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchRef.current;
        if (elapsed > REFRESH_INTERVAL) {
          doFetch();
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [doFetch]);

  async function markVisited(url) {
    if (!url || visited.has(url)) return;
    const updated = new Set(visited);
    updated.add(url);
    // Cap at MAX_VISITED
    const arr = Array.from(updated);
    if (arr.length > MAX_VISITED) arr.splice(0, arr.length - MAX_VISITED);
    setVisited(new Set(arr));
    await setLocal(VISITED_KEY, arr);
  }

  function openAllInCategory(cat) {
    const catArticles = cat === 'All' ? articles : articles.filter(a => a.category === cat);
    const toOpen = catArticles.slice(0, 5);
    toOpen.forEach(a => {
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
          {onOpenSettings && (
            <button style={s.onboardingBtn} onClick={onOpenSettings}>Configure Feeds</button>
          )}
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
              {failures.length} feed{failures.length > 1 ? 's' : ''} unavailable
            </span>
          )}
          <button
            className="nf-refresh-btn"
            onClick={doFetch}
            disabled={fetching}
            title="Refresh feeds"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={fetching ? 'nf-spin-svg' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </span>
      </div>
      <div className="widget-content">
        {/* Category tabs */}
        <div style={s.tabs}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`nf-tab${activeCategory === cat ? ' nf-tab-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
          {filtered.length > 0 && (
            <button
              className="nf-tab nf-open-all"
              onClick={() => openAllInCategory(activeCategory)}
              title={`Open top 5 ${activeCategory} articles in new tabs`}
            >
              Open all
            </button>
          )}
        </div>

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
              ) : (
                'No articles in this category.'
              )}
            </div>
          ) : (
            filtered.map((article, i) => {
              const catStyle = getSourceStyle(article.category);
              const isVisited = visited.has(article.link);
              return (
                <div key={`${article.link}-${i}`} className={`nf-article${isVisited ? ' nf-visited' : ''}`}>
                  <div className="nf-article-meta">
                    <span
                      className="nf-source"
                      style={{
                        color: catStyle.color,
                        background: catStyle.bg,
                      }}
                    >
                      {article.source}
                    </span>
                    <span className="nf-time">{timeAgo(article.pubDate)}</span>
                  </div>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nf-title"
                    onClick={() => markVisited(article.link)}
                  >
                    {article.title}
                  </a>
                  {article.snippet && (
                    <div className="nf-snippet">{article.snippet}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const cssText = `
  .nf-status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .nf-spin {
    animation: nf-pulse 1s ease-in-out infinite;
  }
  @keyframes nf-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .nf-refresh-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.15rem;
    display: flex;
    align-items: center;
    transition: color 0.15s;
    border-radius: 4px;
  }
  .nf-refresh-btn:hover {
    color: var(--accent);
  }
  .nf-refresh-btn:disabled {
    cursor: wait;
  }
  .nf-spin-svg {
    animation: nf-rotate 1s linear infinite;
  }
  @keyframes nf-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .nf-tab {
    background: none;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.65rem;
    font-weight: 500;
    padding: 0.25rem 0.65rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .nf-tab:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }
  .nf-tab-active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg-primary);
    font-weight: 600;
    box-shadow: 0 0 12px var(--accent-glow);
  }
  .nf-open-all {
    margin-left: auto;
    border-style: dashed;
    font-size: 0.6rem;
    color: var(--text-muted);
  }
  .nf-open-all:hover {
    color: var(--accent);
    border-color: var(--accent);
    border-style: solid;
  }
  .nf-scroll-area {
    max-height: 60vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .nf-scroll-area:hover {
    scrollbar-color: var(--accent) transparent;
  }
  .nf-scroll-area::-webkit-scrollbar {
    width: 4px;
  }
  .nf-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .nf-scroll-area::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .nf-scroll-area:hover::-webkit-scrollbar-thumb {
    background: var(--accent);
  }
  .nf-article {
    padding: 0.65rem 0 0.65rem 0.65rem;
    border-bottom: 1px solid var(--border);
    border-left: 2px solid var(--accent);
    margin-left: 0;
    transition: border-left-color 0.15s, opacity 0.15s;
  }
  .nf-article:last-child {
    border-bottom: none;
  }
  .nf-article:hover {
    border-left-color: var(--accent-hover);
  }
  .nf-article.nf-visited {
    opacity: 0.5;
  }
  .nf-article.nf-visited:hover {
    opacity: 0.7;
  }
  .nf-article-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  .nf-source {
    font-size: 0.6rem;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    line-height: 1;
  }
  .nf-time {
    font-size: 0.6rem;
    color: var(--text-muted);
  }
  .nf-title {
    display: block;
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.85rem;
    line-height: 1.35;
    transition: color 0.15s ease;
  }
  .nf-title:hover {
    color: var(--accent);
  }
  .nf-snippet {
    color: var(--text-secondary);
    font-size: 0.75rem;
    line-height: 1.4;
    margin-top: 0.2rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .nf-skeleton-row {
    padding: 0.75rem 0 0.75rem 0.65rem;
    border-bottom: 1px solid var(--border);
    border-left: 2px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .nf-skeleton-line {
    height: 0.75rem;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card-solid) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: nf-shimmer 1.5s infinite;
  }
  @keyframes nf-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const s = {
  card: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.35rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
    alignItems: 'center',
  },
  emptyMsg: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  reloadBtn: {
    background: 'var(--bg-input)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '0.75rem',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    marginTop: '0.75rem',
    transition: 'border-color 0.15s',
  },
  warnBadge: {
    fontSize: '0.6rem',
    color: 'var(--warning)',
    cursor: 'help',
    letterSpacing: 'normal',
    textTransform: 'none',
    fontWeight: 400,
  },
  onboardingBtn: {
    background: 'var(--accent)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.5rem 1.25rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'opacity 0.15s',
  },
};
