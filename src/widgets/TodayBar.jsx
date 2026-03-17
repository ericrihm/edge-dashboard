import React, { useState, useEffect } from 'react';
import { getLocal } from '../storage.js';

/* ── Notable Dates ──────────────────────────────────────── */
const FIXED_DATES = {
  '01-01': "New Year's Day",
  '01-20': 'Inauguration Day',
  '02-02': 'Groundhog Day',
  '02-12': "Lincoln's Birthday",
  '02-14': "Valentine's Day",
  '03-14': 'Pi Day',
  '03-17': "St. Patrick's Day",
  '04-01': "April Fools' Day",
  '04-15': 'Tax Day',
  '04-22': 'Earth Day',
  '05-04': 'Star Wars Day',
  '05-05': 'Cinco de Mayo',
  '06-14': 'Flag Day',
  '06-19': 'Juneteenth',
  '07-04': 'Independence Day',
  '07-20': 'Moon Landing Day',
  '08-26': "Women's Equality Day",
  '09-11': 'Patriot Day',
  '09-17': 'Constitution Day',
  '10-31': 'Halloween',
  '11-11': "Veterans Day",
  '12-07': 'Pearl Harbor Day',
  '12-24': 'Christmas Eve',
  '12-25': 'Christmas Day',
  '12-31': "New Year's Eve",
};

function nthDayOfMonth(year, month, dayOfWeek, n) {
  const first = new Date(year, month, 1);
  let day = 1 + ((dayOfWeek - first.getDay() + 7) % 7);
  day += (n - 1) * 7;
  return new Date(year, month, day);
}

function lastDayOfMonth(year, month, dayOfWeek) {
  const last = new Date(year, month + 1, 0);
  let day = last.getDate() - ((last.getDay() - dayOfWeek + 7) % 7);
  return new Date(year, month, day);
}

function getVariableDates(year) {
  const dates = {};
  const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // MLK Day: 3rd Monday of January
  dates[fmt(nthDayOfMonth(year, 0, 1, 3))] = 'MLK Day';
  // Presidents Day: 3rd Monday of February
  dates[fmt(nthDayOfMonth(year, 1, 1, 3))] = "Presidents' Day";
  // Memorial Day: last Monday of May
  dates[fmt(lastDayOfMonth(year, 4, 1))] = 'Memorial Day';
  // Labor Day: 1st Monday of September
  dates[fmt(nthDayOfMonth(year, 8, 1, 1))] = 'Labor Day';
  // Columbus Day: 2nd Monday of October
  dates[fmt(nthDayOfMonth(year, 9, 1, 2))] = 'Columbus Day';
  // Thanksgiving: 4th Thursday of November
  dates[fmt(nthDayOfMonth(year, 10, 4, 4))] = 'Thanksgiving';
  // Sysadmin Day: last Friday of July
  dates[fmt(lastDayOfMonth(year, 6, 5))] = 'SysAdmin Day';
  // Mother's Day: 2nd Sunday of May
  dates[fmt(nthDayOfMonth(year, 4, 0, 2))] = "Mother's Day";
  // Father's Day: 3rd Sunday of June
  dates[fmt(nthDayOfMonth(year, 5, 0, 3))] = "Father's Day";
  // Election Day: 1st Tuesday after 1st Monday of November
  const firstMon = nthDayOfMonth(year, 10, 1, 1);
  const electionDay = new Date(firstMon);
  electionDay.setDate(firstMon.getDate() + 1);
  dates[fmt(electionDay)] = 'Election Day';

  // Easter (anonymous Gregorian algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  dates[fmt(new Date(year, month, day))] = 'Easter';

  return dates;
}

function getNotableDate(now) {
  const key = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const variable = getVariableDates(now.getFullYear());
  return FIXED_DATES[key] || variable[key] || null;
}

/* ── Sunrise/Sunset formatting ──────────────────────────── */
function formatUnixTime(unix) {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function daylightDuration(sunrise, sunset) {
  if (!sunrise || !sunset) return '';
  const diff = sunset - sunrise;
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  return `${hrs}h ${mins}m of daylight`;
}

export default function TodayBar({ settings }) {
  const [weatherData, setWeatherData] = useState(null);
  const now = new Date();
  const notable = getNotableDate(now);

  useEffect(() => {
    getLocal('weather_current').then(cached => {
      if (cached?.data) setWeatherData(cached.data);
    });
  }, []);

  const sunrise = weatherData?.sys?.sunrise;
  const sunset = weatherData?.sys?.sunset;
  const daylight = daylightDuration(sunrise, sunset);

  const items = [];

  if (notable) {
    items.push({ icon: '\uD83D\uDCC5', text: notable });
  }

  if (sunrise) {
    items.push({ icon: '\uD83C\uDF05', text: `Sunrise ${formatUnixTime(sunrise)}` });
  }
  if (sunset) {
    items.push({ icon: '\uD83C\uDF07', text: `Sunset ${formatUnixTime(sunset)}` });
  }

  items.push({
    icon: '\uD83D\uDCC8',
    text: 'Markets',
    link: 'https://www.marketwatch.com/',
  });

  items.push({
    icon: '\uD83C\uDFC8',
    text: 'Cleveland Sports',
    link: 'https://www.espn.com/nba/team/_/name/cle/cleveland-cavaliers',
  });

  if (items.length === 0) return null;

  return (
    <div className="today-bar">
      <style>{cssText}</style>
      {items.map((item, i) => (
        <span key={i} className="tb-item">
          {i > 0 && <span className="tb-sep">&middot;</span>}
          <span className="tb-icon">{item.icon}</span>
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="tb-link" title={item.text}>
              {item.text}
            </a>
          ) : (
            <span className="tb-text" title={item === items.find(x => x.icon === '\uD83C\uDF07') ? daylight : ''}>{item.text}</span>
          )}
        </span>
      ))}
    </div>
  );
}

const cssText = `
  .today-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 0.15rem 0;
  }
  .today-bar::-webkit-scrollbar { display: none; }
  .tb-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.5px;
  }
  .tb-sep {
    color: var(--text-muted);
    opacity: 0.4;
    margin: 0 0.35rem;
    font-size: 0.8rem;
  }
  .tb-icon {
    font-size: 0.7rem;
  }
  .tb-text {
    cursor: default;
  }
  .tb-link {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .tb-link:hover {
    color: var(--accent);
  }
`;
