import React, { useState, useEffect } from 'react';
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
        background: 'var(--color-surface, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary, #f8fafc)' }}>
              Farm Weather
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #94a3b8)', margin: 0 }}>
              Open-Meteo · Real-time & 7-day forecast
            </p>
          </div>
        </div>
        <button
          onClick={loadWeather}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '6px',
            padding: '5px 10px',
            color: '#94a3b8',
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
        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
          <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Fetching weather for your farm...</p>
        </div>
      ) : !weather?.success ? (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <MapPin size={16} color="#eab308" />
          <div>
            <p style={{ fontSize: '0.85rem', color: '#fde047', margin: '0 0 2px', fontWeight: 500 }}>
              GPS Coordinates Required
            </p>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              {weather?.message || 'Register your farm GPS location to see local weather data.'}
            </p>
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
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Thermometer size={14} color="#f97316" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Temperature</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
                {weather.current.temperatureC !== null ? `${weather.current.temperatureC}°C` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Feels {weather.current.apparentTemperatureC !== null ? `${weather.current.apparentTemperatureC}°C` : 'N/A'}
              </div>
            </div>

            {/* Conditions */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <WeatherIcon code={weather.current.weatherCode} size={14} />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Conditions</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                {weather.current.weatherDescription}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Rain: {weather.current.rainMm !== null ? `${weather.current.rainMm} mm` : '0 mm'}
              </div>
            </div>

            {/* Humidity */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Droplets size={14} color="#60a5fa" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Humidity</span>
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
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                {weather.current.humidityLabel || ''}
              </div>
            </div>

            {/* Wind */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Wind size={14} color="#a78bfa" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Wind</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                {weather.current.windSpeedKph !== null ? `${weather.current.windSpeedKph} km/h` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                {weather.current.windDescription || ''}
              </div>
            </div>

            {/* Soil info if available */}
            {(weather.current.soilTemperatureC !== null || weather.current.soilMoisture !== null) && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--color-border, #334155)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Soil</div>
                {weather.current.soilTemperatureC !== null && (
                  <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>
                    Temp: {weather.current.soilTemperatureC}°C
                  </div>
                )}
                {weather.current.soilMoisture !== null && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
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
                color: '#93c5fd',
                marginBottom: '14px',
              }}
            >
              {weather.current.humidityNote}
            </div>
          )}

          {/* 7-day forecast */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                7-DAY FORECAST
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {weather.forecast.map((day) => (
                  <div
                    key={day.date}
                    style={{
                      flexShrink: 0,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--color-border, #334155)',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                      minWidth: '80px',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '4px' }}>
                      {new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <WeatherIcon code={day.weatherCode} size={16} />
                    <div style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600, marginTop: '4px' }}>
                      {day.maxTempC !== null ? `${day.maxTempC}°` : '–'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {day.minTempC !== null ? `${day.minTempC}°` : '–'}
                    </div>
                    {day.precipitationMm > 0 && (
                      <div style={{ fontSize: '0.65rem', color: '#60a5fa', marginTop: '2px' }}>
                        {day.precipitationMm}mm
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '10px' }}>
            Source: Open-Meteo (open-meteo.com) · Updated:{' '}
            {weather.fetchedAt ? new Date(weather.fetchedAt).toLocaleTimeString('en-KE') : 'Recently'}
            {weather.fromCache ? ' (cached)' : ''}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
          <AlertCircle size={20} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>{error || 'Weather data could not be loaded.'}</p>
        </div>
      )}
    </div>
  );
};
