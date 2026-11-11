import React, { useState, useEffect } from 'react';
import { LoadSpinner } from './LoadSpinner';
import {
  Cloud,
  Droplets,
  Thermometer,
  Wind,
  RefreshCw,
  AlertCircle,
  Sun,
  MapPin,
} from 'lucide-react';
import { getFarmWeatherApi, type FarmWeatherDTO } from '../services/farmerService';

function WeatherIcon({ code, size = 20 }: { code: number | null; size?: number }) {
  // Clear sky or mainly clear
  if (code === 0 || code === 1) return <Sun size={size} color="#fbbf24" />;
  // Partly cloudy / overcast
  if (code !== null && code <= 3) return <Cloud size={size} color="#94a3b8" />;
  // Rain / drizzle / showers
  if (code !== null && (code >= 51 && code <= 82)) return <Droplets size={size} color="#60a5fa" />;
  // Thunderstorm
  if (code !== null && code >= 95) return <Cloud size={size} color="#f59e0b" />;
  return <Cloud size={size} color="#94a3b8" />;
}

function getSeverityColor(humidity: number | null): string {
  if (humidity === null) return '#94a3b8';
  if (humidity < 30) return '#f59e0b'; // dry
  if (humidity < 80) return '#10b981'; // comfortable / humid
  return '#ef4444'; // very humid
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<FarmWeatherDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmWeatherApi();
      setWeather(data);
      if (!data.success) {
        setError(data.message || 'Weather data unavailable.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load weather.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-surface-border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(251, 191, 36, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sun size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Farm Weather
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span>{weather?.locationName || 'Local Farm'} · 7-Day Forecast</span>
            </p>
          </div>
        </div>
        <button
          onClick={loadWeather}
          disabled={loading}
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: '6px',
            padding: '5px 10px',
            color: 'var(--color-text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
          <LoadSpinner size="sm" text="quering..." />
        </div>
      ) : !weather?.success ? (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          {weather?.code === 'COORDINATES_REQUIRED' ? (
            <MapPin size={18} color="#eab308" style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertCircle size={18} color="#eab308" style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', margin: '0 0 2px', fontWeight: 600 }}>
              {weather?.code === 'COORDINATES_REQUIRED' ? 'GPS Coordinates Required' : 'Weather Service Notice'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
              {weather?.code === 'COORDINATES_REQUIRED'
                ? 'Register your farm GPS coordinates in your profile to view automated weather conditions and satellite monitoring.'
                : weather?.message || 'Weather service is temporarily synchronizing. Click Refresh to reload.'}
            </p>
            {weather?.code === 'COORDINATES_REQUIRED' && (
              <a
                href="/farmer/profile"
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--color-primary, #16a34a)',
                  textDecoration: 'none',
                }}
              >
                Set Farm Location in Profile →
              </a>
            )}
          </div>
        </div>
      ) : weather.current ? (
        <>
          {/* Current conditions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {/* Temperature */}
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Thermometer size={14} color="#f97316" />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Temperature</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {weather.current.temperatureC !== null ? `${weather.current.temperatureC}°C` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Feels {weather.current.apparentTemperatureC !== null ? `${weather.current.apparentTemperatureC}°C` : 'N/A'}
              </div>
            </div>

            {/* Conditions */}
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <WeatherIcon code={weather.current.weatherCode} size={14} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Conditions</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {weather.current.weatherDescription}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Rain: {weather.current.rainMm !== null ? `${weather.current.rainMm} mm` : '0 mm'}
              </div>
            </div>

            {/* Humidity */}
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Droplets size={14} color="#60a5fa" />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Humidity</span>
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: getSeverityColor(weather.current.relativeHumidityPct),
                }}
              >
                {weather.current.relativeHumidityPct !== null
                  ? `${weather.current.relativeHumidityPct}%`
                  : 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {weather.current.humidityLabel || ''}
              </div>
            </div>

            {/* Wind */}
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Wind size={14} color="#a78bfa" />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Wind</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {weather.current.windSpeedKph !== null ? `${weather.current.windSpeedKph} km/h` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {weather.current.windDescription || ''}
              </div>
            </div>

            {/* Soil info if available */}
            {(weather.current.soilTemperatureC !== null || weather.current.soilMoisture !== null) && (
              <div
                style={{
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Soil</div>
                {weather.current.soilTemperatureC !== null && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    Temp: {weather.current.soilTemperatureC}°C
                  </div>
                )}
                {weather.current.soilMoisture !== null && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Moisture: {weather.current.soilMoisture.toFixed(3)} m³/m³
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Humidity note (agronomic context) */}
          {weather.current.humidityNote && (
            <div
              style={{
                background: 'rgba(96, 165, 250, 0.07)',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: '#0284c7',
                marginBottom: '14px',
              }}
            >
              {weather.current.humidityNote}
            </div>
          )}

          {/* 7-day forecast */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                7-DAY FORECAST
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {weather.forecast.map((day) => (
                  <div
                    key={day.date}
                    style={{
                      flexShrink: 0,
                      background: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-surface-border)',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                      minWidth: '80px',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      {new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <WeatherIcon code={day.weatherCode} size={16} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 600, marginTop: '4px' }}>
                      {day.maxTempC !== null ? `${day.maxTempC}°` : '–'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
                      {day.minTempC !== null ? `${day.minTempC}°` : '–'}
                    </div>
                    {day.precipitationMm > 0 && (
                      <div style={{ fontSize: '0.65rem', color: '#0284c7', marginTop: '2px' }}>
                        {day.precipitationMm}mm
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            {weather.locationName ? `Location: ${weather.locationName} · ` : ''}Updated:{' '}
            {weather.fetchedAt ? new Date(weather.fetchedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
            {weather.fromCache ? ' (cached)' : ''}
            {weather.isEstimate ? ' (regional climate estimate)' : ''}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
          <AlertCircle size={20} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>{error || 'Weather data could not be loaded.'}</p>
        </div>
      )}
    </div>
  );
};
