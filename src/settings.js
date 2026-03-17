import { getSync, setSync } from './storage.js';

export const DEFAULT_SETTINGS = {
  location: { city: 'Cleveland', state: 'OH', lat: 41.4993, lon: -81.6944 },
  temperatureUnit: 'F',
  clockFormat: '12h',
  searchEngine: 'google',
  accentColor: '#00b4d8',
  theme: 'dark',
  userName: 'Eric',
  widgets: ['weather', 'news', 'clock', 'quicklinks', 'search', 'notepad', 'tasks'],
  apiKeys: { openweathermap: '' },
  rssFeeds: [],
};

export async function getSettings() {
  const stored = await getSync('settings');
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await setSync('settings', updated);
  return updated;
}
