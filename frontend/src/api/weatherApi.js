import axios from 'axios';

// Open-Meteo is free for non-commercial use and doesn't require an API key
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export const fetchLiveWeather = async (lat, lon) => {
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
        timezone: 'auto'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch weather data", error);
    return null;
  }
};

export const getWeatherCondition = (code) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Heavy Rain';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
};
