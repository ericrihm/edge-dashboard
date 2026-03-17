# Edge Dashboard

A custom new tab extension for Microsoft Edge (and Chrome) with weather, news, and productivity widgets.

## Features

- **Live Clock** — 12h/24h format with JetBrains Mono typography
- **Search Bar** — Google, Bing, or DuckDuckGo with auto-focus and `/` keyboard shortcut
- **Quick Links** — Customizable grid of bookmarks with favicons
- **Weather Widget** — Current conditions + 5-day forecast + hourly preview via OpenWeatherMap
- **News Feed** — Aggregated RSS feeds with category filtering (Cybersecurity, CMMC/GRC, Tech)
- **Settings Panel** — Slide-out drawer to configure everything

## Setup

```bash
npm install
npm run build
```

### Load as Edge Extension

1. Open `edge://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

### Load as Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

## OpenWeatherMap API Key

The weather widget requires a free API key from OpenWeatherMap:

1. Sign up at https://openweathermap.org/api
2. Copy your API key from the dashboard
3. Open the extension's Settings (gear icon) > API Keys
4. Paste your key and it saves automatically

Free tier allows 1,000 API calls/day, which is more than enough.

## RSS Feeds

Default feeds include Krebs on Security, The Hacker News, BleepingComputer, CISA, Ars Technica, and The Verge. To customize:

1. Open Settings > RSS Feeds
2. Add/remove feeds with name, URL, and category
3. Use "Reset to Defaults" to restore the original feed list

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `Escape` | Close settings panel |
| `Enter` | Execute search |

## Development

```bash
npm run dev     # Vite dev server
npm run build   # Production build to dist/
```

## Built With

- React 19
- Vite
- Claude Code
