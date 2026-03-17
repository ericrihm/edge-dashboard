# Edge Dashboard

A Microsoft Edge extension (Manifest V3) that overrides the new tab page with a custom dark-themed dashboard.

## Features

- Live clock with date display
- Weather widget with 5-day forecast (OpenWeatherMap API)
- Dark theme with CSS variable-based theming

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Load the `dist/` folder as an unpacked extension in `edge://extensions` (developer mode).

## Configuration

Add your OpenWeatherMap API key in the Settings panel to enable the weather widget. Get a free key at https://home.openweathermap.org/api_keys.
