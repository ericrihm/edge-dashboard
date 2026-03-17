import React, { useState, useEffect, useCallback } from 'react';
import { getLocal, setLocal } from '../storage.js';
import { fetchFeed } from '../utils/rss.js';

const CACHE_KEY = 'topstories_cache';
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const STORY_COUNT = 5;

const BRIEFING_SOURCES = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC', take: 3 },
  { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR', take: 2 },
];

function timeAgo(dateString) {
  if (!dateString) return '';
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < 0) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function wordSet(title) {
  return new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
}

function isSimilar(a, b) {
  const setA = wordSet(a);
  const setB = wordSet(b);
  if (setA.size === 0 || setB.size === 0) return false;
  let overlap = 0;
  for (const w of setA) {
    if (setB.has(w)) overlap++;
  }
  const minSize = Math.min(setA.size, setB.size);
  return minSize > 0 && (overlap / minSize) > 0.6;
}

function deduplicateStories(stories) {
  const result = [];
  for (const story of stories) {
    const isDupe = result.some(r => isSimilar(r.title, story.title));
    if (!isDupe) result.push(story);
  }
  return result;
}

export default function TopStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const doFetch = useCallback(async () => {
    try {
      const allStories = [];
      const results = await Promise.allSettled(
        BRIEFING_SOURCES.map(async (src) => {
          const items = await fetchFeed(src.url);
          return items.slice(0, src.take).map(item => ({
            ...item,
            source: src.name,
          }));
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') allStories.push(...r.value);
      }
      const deduped = deduplicateStories(allStories).slice(0, STORY_COUNT);
      if (deduped.length > 0) {
        setStories(deduped);
        await setLocal(CACHE_KEY, { stories: deduped, ts: Date.now() });
      }
    } catch {
      // keep cached
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const cached = await getLocal(CACHE_KEY);
      if (!cancelled && cached?.stories?.length) {
        setStories(cached.stories);
        setLoading(false);
      }
      doFetch();
    }
    init();
    const interval = setInterval(doFetch, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [doFetch]);

  if (loading && !stories.length) {
    return (
      <div className="widget-card" style={s.card}>
        <style>{cssText}</style>
        <div className="widget-header">
          <span style={s.headerLeft}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            </svg>
            Briefing
          </span>
        </div>
        <div className="widget-content">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ts-skeleton">
              <div className="ts-skel-num" />
              <div className="ts-skel-lines">
                <div className="ts-skel-line" style={{ width: '85%' }} />
                <div className="ts-skel-line" style={{ width: '40%', height: '0.5rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stories.length) return null;

  return (
    <div className="widget-card" style={s.card}>
      <style>{cssText}</style>
      <div className="widget-header">
        <span style={s.headerLeft}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          </svg>
          Briefing
        </span>
      </div>
      <div className="widget-content">
        {stories.map((story, i) => (
          <div key={story.link || i} className="ts-row">
            <span className="ts-num">{i + 1}</span>
            <div className="ts-body">
              <a href={story.link} target="_blank" rel="noopener noreferrer" className="ts-title">
                {story.title}
              </a>
              <div className="ts-meta">
                <span className="ts-source">{story.source}</span>
                <span className="ts-time">{timeAgo(story.pubDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const cssText = `
  .ts-row {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border);
  }
  .ts-row:last-child {
    border-bottom: none;
  }
  .ts-num {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--accent);
    opacity: 0.6;
    min-width: 1rem;
    text-align: right;
    padding-top: 0.1rem;
    flex-shrink: 0;
  }
  .ts-body {
    flex: 1;
    min-width: 0;
  }
  .ts-title {
    display: block;
    color: var(--text-primary);
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.3;
    transition: color 0.15s;
  }
  .ts-title:hover {
    color: var(--accent);
  }
  .ts-meta {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.15rem;
  }
  .ts-source {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-muted);
  }
  .ts-time {
    font-size: 0.6rem;
    color: var(--text-muted);
    opacity: 0.6;
  }
  .ts-skeleton {
    display: flex;
    gap: 0.6rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .ts-skeleton:last-child { border-bottom: none; }
  .ts-skel-num {
    width: 1rem;
    height: 0.7rem;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card-solid) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: ts-shimmer 1.5s infinite;
    flex-shrink: 0;
  }
  .ts-skel-lines { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
  .ts-skel-line {
    height: 0.7rem;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card-solid) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: ts-shimmer 1.5s infinite;
  }
  @keyframes ts-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const s = {
  card: {
    minWidth: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
};
