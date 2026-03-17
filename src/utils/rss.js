function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function truncate(str, len) {
  if (!str) return '';
  const clean = str.trim();
  return clean.length > len ? clean.slice(0, len).trimEnd() + '...' : clean;
}

function parseRSSItems(doc, sourceTitle) {
  const items = doc.querySelectorAll('item');
  return Array.from(items).map(item => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const descRaw = item.querySelector('description')?.textContent || '';
    return {
      title,
      link,
      pubDate,
      snippet: truncate(stripHtml(descRaw), 150),
      source: sourceTitle,
    };
  });
}

function parseAtomEntries(doc, sourceTitle) {
  const entries = doc.querySelectorAll('entry');
  return Array.from(entries).map(entry => {
    const title = entry.querySelector('title')?.textContent?.trim() || '';
    const linkEl = entry.querySelector('link[href]');
    const link = linkEl?.getAttribute('href') || '';
    const pubDate =
      entry.querySelector('published')?.textContent?.trim() ||
      entry.querySelector('updated')?.textContent?.trim() || '';
    const summaryRaw =
      entry.querySelector('summary')?.textContent ||
      entry.querySelector('content')?.textContent || '';
    return {
      title,
      link,
      pubDate,
      snippet: truncate(stripHtml(summaryRaw), 150),
      source: sourceTitle,
    };
  });
}

export async function fetchFeed(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid XML');

  const feedTitle =
    doc.querySelector('channel > title')?.textContent?.trim() ||
    doc.querySelector('feed > title')?.textContent?.trim() || '';

  // Detect format
  if (doc.querySelector('channel')) {
    return parseRSSItems(doc, feedTitle);
  }
  if (doc.querySelector('feed')) {
    return parseAtomEntries(doc, feedTitle);
  }
  throw new Error('Unknown feed format');
}

export async function fetchAllFeeds(feedList) {
  const results = await Promise.allSettled(
    feedList.map(async (feed) => {
      const items = await fetchFeed(feed.url);
      return items.map(item => ({
        ...item,
        category: feed.category,
        source: feed.name || item.source,
      }));
    })
  );

  const articles = [];
  const failures = [];

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      articles.push(...results[i].value);
    } else {
      console.warn(`Feed failed: ${feedList[i].url}`, results[i].reason);
      failures.push(feedList[i].name || feedList[i].url);
    }
  }

  articles.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return { articles, failures };
}
