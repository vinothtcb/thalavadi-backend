const { isValidLatitude, isValidLongitude } = require("../utils/validators");

// Uses Open-Meteo (https://open-meteo.com) — a free, open-source-friendly
// weather API that needs no API key or account.

// Approximate coordinates for Thalavadi, Erode District, Tamil Nadu — used
// as the default when the caller doesn't supply a real location (e.g. the
// person declined location permission).
const DEFAULT_LATITUDE = 11.554;
const DEFAULT_LONGITUDE = 77.028;
const DEFAULT_LOCATION_NAME = "Thalavadi, Erode District";

// Open-Meteo "weather code" -> a short human description.
const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
};

// GET /api/weather?lat=&lon=&location_name=  — returns current conditions
// plus a 7-day forecast, for the given coordinates if valid, otherwise
// falling back to Thalavadi's coordinates.
async function getWeather(req, res, next) {
  try {
    const { lat, lon, location_name } = req.query;
    const useCustomLocation = isValidLatitude(lat) && isValidLongitude(lon) && lat !== undefined && lon !== undefined;
    const latitude = useCustomLocation ? lat : DEFAULT_LATITUDE;
    const longitude = useCustomLocation ? lon : DEFAULT_LONGITUDE;
    const locationLabel = useCustomLocation ? (location_name || `${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}`) : DEFAULT_LOCATION_NAME;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather service unavailable");
    const data = await response.json();

    const current = data.current;
    const daily = data.daily.time.map((date, i) => ({
      date,
      max_c: data.daily.temperature_2m_max[i],
      min_c: data.daily.temperature_2m_min[i],
      condition: WEATHER_CODES[data.daily.weather_code[i]] || "Unknown",
    }));

    res.json({
      location: locationLabel,
      is_custom_location: useCustomLocation,
      temperature_c: current.temperature_2m,
      humidity_percent: current.relative_humidity_2m,
      wind_speed_kmh: current.wind_speed_10m,
      condition: WEATHER_CODES[current.weather_code] || "Unknown",
      observed_at: current.time,
      daily,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeather };
