import React, { useState, useEffect, useCallback } from 'react';
import { getLocal, setLocal } from '../storage.js';

const CACHE_KEY_CURRENT = 'weather_current';
const CACHE_KEY_FORECAST = 'weather_forecast';
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function convertTemp(tempF, unit) {
  if (unit === 'C') return Math.round((tempF - 32) * 5 / 9);
  return Math.round(tempF);
}

function getDayName(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

function formatHour(dt) {
  const d = new Date(dt * 1000);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h} ${ampm}`;
}

function groupForecastByDay(list) {
  const days = {};
  for (const item of list) {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = [];
    days[date].push(item);
  }
  return Object.entries(days).map(([date, items]) => {
    const temps = items.map(i => i.main.temp);
    const midday = items.find(i => i.dt_txt.includes('12:00')) || items[Math.floor(items.length / 2)];
    return {
      date,
      high: Math.max(...temps),
      low: Math.min(...temps),
      icon: midday.weather[0].icon,
      description: midday.weather[0].description,
    };
  });
}

function todayHighLow(forecastDays) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = forecastDays.find(d => d.date === today);
  return todayData ? { high: todayData.high, low: todayData.low } : null;
}

export default function Weather({ settings }) {
  const { location, apiKeys, temperatureUnit } = settings;
  const apiKey = apiKeys?.openweathermap;
  const unit = temperatureUnit || 'F';

  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [forecastDays, setForecastDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHourly, setShowHourly] = useState(false);

  const fetchWeather = useCallback(async () => {
    if (!apiKey) {
      setLoading(false);
      return;
    }
    try {
      const { lat, lon } = location;
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`),
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        throw new Error('API request failed');
      }

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      setCurrent(currentData);
      setForecast(forecastData);
      setForecastDays(groupForecastByDay(forecastData.list));
      setError(null);

      await setLocal(CACHE_KEY_CURRENT, { data: currentData, ts: Date.now() });
      await setLocal(CACHE_KEY_FORECAST, { data: forecastData, ts: Date.now() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, location]);

  // Load cache on mount, then fetch fresh
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const [cachedCurrent, cachedForecast] = await Promise.all([
        getLocal(CACHE_KEY_CURRENT),
        getLocal(CACHE_KEY_FORECAST),
      ]);
      if (!cancelled && cachedCurrent?.data) {
        setCurrent(cachedCurrent.data);
        setLoading(false);
      }
      if (!cancelled && cachedForecast?.data) {
        setForecast(cachedForecast.data);
        setForecastDays(groupForecastByDay(cachedForecast.data.list));
      }
      fetchWeather();
    }
    init();
    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchWeather]);

  if (!apiKey) {
    return (
      <div className="widget-card">
        <div className="widget-header"><span>Weather</span></div>
        <div className="widget-content" style={s.noKey}>
          <p>Add OpenWeatherMap API key in Settings</p>
          <a
            href="https://home.openweathermap.org/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            style={s.link}
          >
            Get a free API key
          </a>
        </div>
      </div>
    );
  }

  if (loading && !current) {
    return (
      <div className="widget-card">
        <div className="widget-header"><span>Weather</span></div>
        <div className="widget-content">
          <div style={s.skeleton} />
          <div style={{ ...s.skeleton, width: '60%', height: '1rem' }} />
          <div style={{ ...s.skeleton, width: '40%', height: '1rem', marginTop: '0.5rem' }} />
        </div>
      </div>
    );
  }

  const hl = todayHighLow(forecastDays);
  const today = new Date().toISOString().split('T')[0];
  const hourlyItems = forecast ? forecast.list.slice(0, 8) : [];

  return (
    <div className="widget-card" style={s.card}>
      <div className="widget-header">
        <span>Weather</span>
        {error && <span style={s.errorBadge}>Update failed</span>}
      </div>
      <div className="widget-content">
        {/* Current conditions */}
        {current && (
          <div style={s.currentSection}>
            <div style={s.currentMain}>
              <div>
                <div style={s.cityLabel}>{location.city} &middot; Now</div>
                <div style={s.tempLarge}>{convertTemp(current.main.temp, unit)}°{unit}</div>
                <div style={s.condition}>{current.weather[0].description}</div>
              </div>
              <img
                src={iconUrl(current.weather[0].icon)}
                alt={current.weather[0].description}
                style={s.iconLarge}
              />
            </div>
            <div style={s.details}>
              <span>Feels like {convertTemp(current.main.feels_like, unit)}°</span>
              <span>Humidity {current.main.humidity}%</span>
              <span>Wind {Math.round(current.wind.speed)} mph</span>
              {hl && <span>H: {convertTemp(hl.high, unit)}° L: {convertTemp(hl.low, unit)}°</span>}
            </div>
          </div>
        )}

        {/* 5-day forecast */}
        {forecastDays.length > 0 && (
          <div style={s.forecastRow}>
            {forecastDays.slice(0, 5).map(day => (
              <div
                key={day.date}
                style={{
                  ...s.forecastCard,
                  ...(day.date === today ? s.forecastCardToday : {}),
                }}
              >
                <div style={s.forecastDay}>{getDayName(day.date)}</div>
                <img src={iconUrl(day.icon)} alt={day.description} style={s.iconSmall} />
                <div style={s.forecastTemps}>
                  <span>{convertTemp(day.high, unit)}°</span>
                  <span style={s.lowTemp}>{convertTemp(day.low, unit)}°</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hourly preview */}
        {hourlyItems.length > 0 && (
          <div>
            <button style={s.hourlyToggle} onClick={() => setShowHourly(!showHourly)}>
              {showHourly ? 'Hide Hourly \u25B2' : 'Show Hourly \u25BC'}
            </button>
            {showHourly && (
              <div style={s.hourlyRow}>
                {hourlyItems.map(item => (
                  <div key={item.dt} style={s.hourlyCard}>
                    <div style={s.hourlyTime}>{formatHour(item.dt)}</div>
                    <img src={iconUrl(item.weather[0].icon)} alt="" style={s.iconSmall} />
                    <div>{convertTemp(item.main.temp, unit)}°</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  card: {
    minWidth: 0,
  },
  noKey: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--text-secondary)',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '0.5rem',
  },
  skeleton: {
    background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
    height: '3rem',
    width: '100%',
    marginBottom: '0.75rem',
  },
  currentSection: {
    marginBottom: '1.25rem',
  },
  currentMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cityLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  tempLarge: {
    fontSize: '3rem',
    fontWeight: 300,
    lineHeight: 1.1,
  },
  condition: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize',
    marginTop: '0.25rem',
  },
  iconLarge: {
    width: '80px',
    height: '80px',
    flexShrink: 0,
  },
  details: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '0.75rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  errorBadge: {
    fontSize: '0.7rem',
    color: 'var(--error)',
  },
  forecastRow: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.25rem',
  },
  forecastCard: {
    flex: '1 0 60px',
    minWidth: '60px',
    textAlign: 'center',
    padding: '0.5rem',
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
  },
  forecastCardToday: {
    border: '1px solid var(--accent)',
  },
  forecastDay: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  iconSmall: {
    width: '36px',
    height: '36px',
  },
  forecastTemps: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
  },
  lowTemp: {
    color: 'var(--text-muted)',
  },
  hourlyToggle: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0.5rem 0',
    marginTop: '0.75rem',
    width: '100%',
    textAlign: 'center',
  },
  hourlyRow: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingTop: '0.5rem',
    paddingBottom: '0.25rem',
  },
  hourlyCard: {
    flex: '0 0 auto',
    textAlign: 'center',
    padding: '0.5rem',
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
    fontSize: '0.8rem',
    minWidth: '60px',
  },
  hourlyTime: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
};
