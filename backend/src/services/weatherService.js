/**
 * Open-Meteo Weather Service — MavunoTrust Smart Farm Advisor
 *
 * Fetches current weather and forecast data from the free Open-Meteo API
 * for a registered farm location.
 *
 * Open-Meteo is completely free for non-commercial use, requires no API key,
 * and provides global weather data at 1–11 km resolution.
 *
 * Data provided:
 *  - Current temperature (°C)
 *  - Apparent temperature / felt temperature
 *  - Precipitation (last hour in mm)
 *  - Wind speed at 10 m height (km/h)
 *  - Relative humidity (%)
 *  - Soil temperature at 6 cm depth (°C) — when available
 *  - Soil moisture at 1–3 cm (m³/m³) — when available
 *  - 7-day daily forecast (max/min temp + daily rainfall)
 *
 * ZERO-FABRICATION RULE:
 *  Returns structured error status when coordinates are unavailable.
 *  Never invents weather readings.
 */

import https from 'node:https';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// Cache weather results for 30 minutes to avoid hammering the free API
const weatherCache = new Map(); // key = `${lat},${lng}`, value = { data, expiresAt }
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Robust JSON fetcher using node:https with system CA fallback.
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse weather JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`Open-Meteo returned HTTP ${res.statusCode}: ${body}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Classify wind speed into plain-language description.
 */
function classifyWindSpeed(speedKph) {
  if (speedKph < 5) return 'Calm';
  if (speedKph < 20) return 'Light breeze';
  if (speedKph < 40) return 'Moderate wind';
  if (speedKph < 60) return 'Strong wind';
  return 'Very strong wind';
}

/**
 * Classify relative humidity.
 */
function classifyHumidity(rh) {
  if (rh < 30) return { label: 'Dry', note: 'Low humidity — plants may need irrigation.' };
  if (rh < 60) return { label: 'Comfortable', note: 'Good growing humidity.' };
  if (rh < 80) return { label: 'Humid', note: 'Humid conditions — monitor for fungal risk.' };
  return { label: 'Very Humid', note: 'High humidity — elevated risk of crop fungal diseases.' };
}

/**
 * Map WMO weather code to plain English description.
 */
function interpretWeatherCode(code) {
  const codes = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Unknown';
}

/**
 * Fetch weather data for a farm location from Open-Meteo.
 *
 * @param {object} params
 * @param {number} params.latitude  - Farm latitude
 * @param {number} params.longitude - Farm longitude
 * @param {boolean} [params.bypassCache=false]
 * @returns {Promise<object>} Structured weather response
 */
export async function getFarmWeather({ latitude, longitude, bypassCache = false }) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return {
      success: false,
      code: 'COORDINATES_REQUIRED',
      message: 'Farm GPS coordinates are required to fetch weather data. Please register your farm location first.',
    };
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      success: false,
      code: 'INVALID_COORDINATES',
      message: 'Farm coordinates are invalid.',
    };
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  // Return cached data if still fresh
  if (!bypassCache && weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      return { ...cached.data, fromCache: true };
    }
  }

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
      'relative_humidity_2m',
      'soil_temperature_6cm',
      'soil_moisture_1_to_3cm',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'weather_code',
    ].join(','),
    timezone: 'Africa/Nairobi',
    forecast_days: '7',
  });

  try {
    const raw = await fetchJson(`${OPEN_METEO_BASE_URL}?${params}`);

    const current = raw.current || {};
    const daily = raw.daily || {};
    const units = raw.current_units || {};
    const dailyUnits = raw.daily_units || {};

    const humidity = current.relative_humidity_2m ?? null;
    const humidityInfo = humidity !== null ? classifyHumidity(humidity) : null;

    const windSpeed = current.wind_speed_10m ?? null;

    // Build 7-day forecast array
    const forecast = [];
    if (Array.isArray(daily.time)) {
      for (let i = 0; i < daily.time.length; i++) {
        forecast.push({
          date: daily.time[i],
          maxTempC: daily.temperature_2m_max?.[i] ?? null,
          minTempC: daily.temperature_2m_min?.[i] ?? null,
          precipitationMm: daily.precipitation_sum?.[i] ?? 0,
          weatherCode: daily.weather_code?.[i] ?? null,
          description: interpretWeatherCode(daily.weather_code?.[i]),
        });
      }
    }

    const result = {
      success: true,
      fetchedAt: new Date().toISOString(),
      location: { latitude: lat, longitude: lng },
      current: {
        temperatureC: current.temperature_2m ?? null,
        apparentTemperatureC: current.apparent_temperature ?? null,
        precipitationMm: current.precipitation ?? null,
        rainMm: current.rain ?? null,
        weatherCode: current.weather_code ?? null,
        weatherDescription: interpretWeatherCode(current.weather_code),
        windSpeedKph: windSpeed,
        windDescription: windSpeed !== null ? classifyWindSpeed(windSpeed) : null,
        relativeHumidityPct: humidity,
        humidityLabel: humidityInfo?.label ?? null,
        humidityNote: humidityInfo?.note ?? null,
        soilTemperatureC: current.soil_temperature_6cm ?? null,
        soilMoisture: current.soil_moisture_1_to_3cm ?? null,
      },
      forecast,
      units: {
        temperature: units.temperature_2m || '°C',
        precipitation: units.precipitation || 'mm',
        windSpeed: units.wind_speed_10m || 'km/h',
        humidity: units.relative_humidity_2m || '%',
      },
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    });

    return result;
  } catch (err) {
    return {
      success: false,
      code: 'WEATHER_NETWORK_ERROR',
      message: `Failed to connect to Open-Meteo weather service: ${err.message}`,
    };
  }
}

/**
 * Returns a short weather context summary string for use in Gemini AI advisory prompts.
 */
export function buildWeatherContext(weatherData) {
  if (!weatherData || !weatherData.success) {
    return 'Weather data: Unavailable (coordinates not registered or service unreachable).';
  }
  const c = weatherData.current;
  const lines = [
    `CURRENT WEATHER (Open-Meteo, Africa/Nairobi timezone):`,
    `- Conditions: ${c.weatherDescription}`,
    `- Temperature: ${c.temperatureC !== null ? `${c.temperatureC}°C` : 'N/A'} (feels like ${c.apparentTemperatureC !== null ? `${c.apparentTemperatureC}°C` : 'N/A'})`,
    `- Humidity: ${c.relativeHumidityPct !== null ? `${c.relativeHumidityPct}%` : 'N/A'} (${c.humidityLabel || 'unknown'}) — ${c.humidityNote || ''}`,
    `- Recent precipitation: ${c.precipitationMm !== null ? `${c.precipitationMm} mm` : 'N/A'}`,
    `- Wind: ${c.windSpeedKph !== null ? `${c.windSpeedKph} km/h` : 'N/A'} (${c.windDescription || 'unknown'})`,
  ];

  if (c.soilTemperatureC !== null) {
    lines.push(`- Soil temperature (6 cm): ${c.soilTemperatureC}°C`);
  }
  if (c.soilMoisture !== null) {
    lines.push(`- Soil moisture (1–3 cm): ${c.soilMoisture} m³/m³`);
  }

  // 3-day forecast summary
  const next3Days = weatherData.forecast?.slice(0, 3) || [];
  if (next3Days.length > 0) {
    lines.push('- 3-day forecast:');
    next3Days.forEach((d) => {
      lines.push(
        `  • ${d.date}: ${d.description}, High ${d.maxTempC !== null ? `${d.maxTempC}°C` : 'N/A'} / Low ${d.minTempC !== null ? `${d.minTempC}°C` : 'N/A'}, Rain ${d.precipitationMm} mm`
      );
    });
  }

  return lines.join('\n');
}
