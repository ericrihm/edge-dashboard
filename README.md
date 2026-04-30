# rihm.io

Personal portfolio and resume site for Eric Rihm — Network Engineer, Systems Administrator, and Cybersecurity Practitioner.

**Live site:** [https://rihm.io](https://rihm.io)

## Overview

A single-page portfolio site with three sections: About Me, Resume, and Contact. Originally built on the Kerge CV/Resume template, fully rewritten in 2026-03 with vanilla HTML/CSS/JS (no frameworks).

## Running Locally

No build step required. Serve the root directory with any static file server:

```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8000
```

Then open `http://localhost:8000` (or the port shown).

## Deployment

- **Host:** Azure Static Web Apps
- **CI/CD:** GitHub Actions (`.github/workflows/azure-static-web-apps-zealous-ocean-0aa7e8610.yml`)
- **Trigger:** Push to `main` or PR against `main`
- **Build:** Skipped — static files served directly from `/`
- **Secret:** `AZURE_STATIC_WEB_APPS_API_TOKEN_ZEALOUS_OCEAN_0AA7E8610` (stored in GitHub repo secrets)

## File Structure

```
rihmio/
├── .github/workflows/     # Azure Static Web Apps CI/CD
├── css/
│   └── main.css           # All styles (CSS custom properties, Grid, Flexbox)
├── images/
│   ├── photo.png          # Profile avatar
│   └── sp_photo.jpg       # Hero background
├── js/
│   └── main.js            # All site logic (vanilla JS, no dependencies)
├── index.html             # Single-page site (all content)
├── ericrihm-resume.pdf    # Downloadable resume
├── favicon.svg            # SVG favicon
├── favicon.ico            # ICO favicon (fallback)
├── robots.txt             # Search engine directives
├── sitemap.xml            # Sitemap for SEO
└── README.md
```

## How to Update Content

All content lives in `index.html`. Common updates:

| What to change | Where in `index.html` |
|---|---|
| Job experience / certifications / education | `.timeline-item` blocks in `#resume` section |
| "What I Do" service cards | `.service-card` blocks in `#about-me` section |
| Contact info | `.contact-card` blocks in `#contact` section |
| Subtitle rotation text | `.text-rotation-item` divs in the hero |
| Resume PDF | Replace `ericrihm-resume.pdf` with the updated file |
| Profile photo | Replace `images/photo.png` |
| Hero background image | Replace `images/sp_photo.jpg` |

### Changing Colors

Edit the CSS custom properties in `:root` at the top of `css/main.css`:

```css
:root {
  --bg-primary: #222;      /* Main background */
  --bg-secondary: #333;    /* Cards, hero text panel */
  --accent: #0099e5;       /* Blue accent (links, buttons, timeline dots) */
  --accent-hover: #FF9800; /* Orange hover state */
  --text-primary: #f5f5f5; /* Headings */
  --text-secondary: #d5d5d5; /* Body text */
}
```

After changes, push to `main` and GitHub Actions will deploy automatically.

## Tech Stack

| Technology | Purpose |
|---|---|
| Vanilla JS | All site logic (no jQuery) |
| CSS Grid / Flexbox | Responsive layouts (no Bootstrap) |
| CSS Custom Properties | Theming and color management |
| Font Awesome (CDN) | Icons |
| Google Fonts (Poppins) | Typography |
| Microsoft Clarity | Analytics |
| Azure Static Web Apps | Hosting |
| GitHub Actions | CI/CD |

## External CDN Dependencies

These load at runtime — if they go down, icons/fonts/analytics break:

- `https://kit.fontawesome.com/71804fc742.js` — Font Awesome icons
- `https://www.clarity.ms/tag/s4mvk5gecw` — Microsoft Clarity analytics
- `https://fonts.googleapis.com/css?family=Poppins` — Google Fonts

## Future Roadmap

### Curl Resume API (Currently Offline)

A terminal-friendly resume originally built as part of the Cloud 100 Days / GPS cloud resume challenge (separate repo). The API was fully functional via `curl ericrihm.com/api/GetResume`, but access to the Azure webhost has since been lost, so the endpoint is no longer live.

This could be rebuilt in the future as an Azure Function integrated with Azure Static Web Apps (using the `api_location` config in the GitHub Actions workflow).

### Remaining Optimizations

1. **Image optimization** — Convert `photo.png` (472KB) and `sp_photo.jpg` (505KB) to WebP with responsive `srcset`
2. **Self-host fonts** — Download Poppins locally to remove the Google Fonts CDN dependency
3. **Open Graph meta tags** — Add OG and Twitter Card meta tags for social sharing
4. **Accessibility** — Add ARIA labels, improve color contrast, keyboard navigation
5. **Performance** — Inline critical CSS, lazy-load hero image, add `preconnect` hints
