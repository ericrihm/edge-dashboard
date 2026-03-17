import React, { useState, useEffect, useCallback } from 'react';
import { getLocal, setLocal } from '../storage.js';
import { fetchAllFeeds } from '../utils/rss.js';

const CACHE_KEY = 'newsfeed_cache';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_ARTICLES = 30;

const DEFAULT_FEEDS = [
  { url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity', name: 'Krebs on Security' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', category: 'Cybersecurity', name: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity', name: 'BleepingComputer' },
  { url: 'https://www.cisa.gov/news.xml', category: 'CMMC/GRC', name: 'CISA' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech', name: 'Ars Technica' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', name: 'The Verge' },
];

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return '';
  const diff = now - then;
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

export default function NewsFeed({ settings, onOpenSettings }) {
  const feedList = settings.rssFeeds?.length > 0 ? settings.rssFeeds : DEFAULT_FEEDS;

  const [articles, setArticles] = useState([]);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(feedList.map(f => f.category)))];

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchAllFeeds(feedList);
      setArticles(result.articles.slice(0, MAX_ARTICLES));
      setFailures(result.failures);
      await setLocal(CACHE_KEY, { articles: result.articles.slice(0, MAX_ARTICLES), failures: result.failures, ts: Date.now() });
    } catch {
      // keep existing data
    } finally {
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
      }
      doFetch();
    }
    init();
    const interval = setInterval(doFetch, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [doFetch]);

  const filtered = activeCategory === 'All'
    ? articles
    : articles.filter(a => a.category === activeCategory);

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
        <span>News</span>
        {failures.length > 0 && (
          <span style={s.warnBadge} title={`Failed: ${failures.join(', ')}`}>
            {failures.length} feed{failures.length > 1 ? 's' : ''} unavailable
          </span>
        )}
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
        </div>

        {/* Article list */}
        <div className="nf-scroll-area">
          {loading && !articles.length ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="nf-skeleton-row">
                <div className="nf-skeleton-line" style={{ width: '30%' }} />
                <div className="nf-skeleton-line" style={{ width: '85%' }} />
                <div className="nf-skeleton-line" style={{ width: '60%' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={s.emptyMsg}>
              {articles.length === 0 && failures.length > 0
                ? 'Unable to fetch feeds. Check your connection.'
                : 'No articles in this category.'}
            </div>
          ) : (
            filtered.map((article, i) => {
              const catStyle = getSourceStyle(article.category);
              return (
                <div key={`${article.link}-${i}`} className="nf-article">
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
    transition: border-left-color 0.15s;
  }
  .nf-article:last-child {
    border-bottom: none;
  }
  .nf-article:hover {
    border-left-color: var(--accent-hover);
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
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
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
  tabs: {
    display: 'flex',
    gap: '0.35rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  emptyMsg: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
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
