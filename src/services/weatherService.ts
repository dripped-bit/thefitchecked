/**
 * Weather Service - Integrates with Open-Meteo API for real-time weather data
 * Used by the personalized fashion algorithm to suggest weather-appropriate outfits
 */

import UserService from './userService';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  precipitation: number;
  uvIndex: number;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  timestamp: string;
}

export interface WeatherConditions {
  temperature: 'hot' | 'warm' | 'mild' | 'cool' | 'cold' | 'freezing';
  precipitation: 'none' | 'light' | 'moderate' | 'heavy';
  wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
  humidity: 'low' | 'moderate' | 'high';
  uv: 'low' | 'moderate' | 'high' | 'very_high';
  overall: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';
}

export interface ClothingRecommendations {
  layers: 'single' | 'light_layering' | 'heavy_layering';
  materials: string[];
  colors: 'light' | 'dark' | 'neutral' | 'any';
  coverage: 'minimal' | 'moderate' | 'full';
  accessories: string[];
  avoid: string[];
}

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

class WeatherService {
  private readonly OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
  private readonly GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';
  private weatherCache = new Map<string, { data: WeatherData; expiry: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Clear weather cache (useful for debugging temperature issues)
   */
  clearCache(): void {
    this.weatherCache.clear();
    console.log('🗑️ [WEATHER] Cache cleared');
  }

  /**
   * Get user's current location using geolocation API
   */
  private async getUserLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Default to San Francisco coordinates
        resolve({ latitude: 37.7749, longitude: -122.4194 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('🌍 [WEATHER] Geolocation failed, using default location:', error);
          // Default to San Francisco coordinates
          resolve({ latitude: 37.7749, longitude: -122.4194 });
        },
        {
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Geocode city/state to coordinates using Open-Meteo Geocoding API
   * Tries multiple formats to increase success rate
   */
  async geocodeLocation(city: string, state?: string): Promise<{ latitude: number; longitude: number; displayName: string }> {
    // Generate multiple search query formats to try
    const searchQueries: string[] = [];

    if (state) {
      // Try various formats for better geocoding success
      const cityTitle = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
      const stateUpper = state.toUpperCase();
      const stateTitle = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();

      searchQueries.push(
        `${cityTitle}, ${stateTitle}, USA`,    // "Austin, Texas, USA" (most specific)
        `${cityTitle}, ${stateUpper}, USA`,    // "Austin, TEXAS, USA"
        `${cityTitle}, ${stateTitle}`,         // "Austin, Texas"
        `${cityTitle}, ${stateUpper}`,         // "Austin, TEXAS"
        `${city}, ${state}`,                   // Original: "austin, texas"
        `${cityTitle} ${stateTitle}`,          // "Austin Texas" (no comma)
        cityTitle                              // Just "Austin"
      );
    } else {
      const cityTitle = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
      searchQueries.push(cityTitle, city);
    }

    // Try each query format until one succeeds
    for (let i = 0; i < searchQueries.length; i++) {
      const searchQuery = searchQueries[i];

      try {
        console.log(`🌍 [WEATHER] Geocoding attempt ${i + 1}/${searchQueries.length}: "${searchQuery}"`);

        const response = await fetch(
          `${this.GEOCODING_BASE}/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`
        );

        if (!response.ok) {
          console.warn(`⚠️ [WEATHER] Geocoding request failed (${response.status}), trying next format...`);
          continue;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
          console.warn(`⚠️ [WEATHER] No results for "${searchQuery}", trying next format...`);
          continue;
        }

        const result = data.results[0];
        console.log(`✅ [WEATHER] Location found: ${result.name}, ${result.admin1 || ''} (used format: "${searchQuery}")`);
        console.log(`📍 [WEATHER] Coordinates: ${result.latitude}, ${result.longitude}`);

        return {
          latitude: result.latitude,
          longitude: result.longitude,
          displayName: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}`
        };
      } catch (error) {
        console.warn(`⚠️ [WEATHER] Error with format "${searchQuery}":`, error);
        if (i === searchQueries.length - 1) {
          // Last attempt failed, throw error
          throw new Error(`All geocoding formats failed for: ${city}${state ? ', ' + state : ''}`);
        }
        // Try next format
        continue;
      }
    }

    throw new Error(`Location not found after trying all formats: ${city}${state ? ', ' + state : ''}`);
  }

  /**
   * Get weather by city/state name
   */
  async getWeatherByCity(city: string, state?: string): Promise<WeatherData> {
    try {
      const coords = await this.geocodeLocation(city, state);
      const weather = await this.getCurrentWeather(coords.latitude, coords.longitude);

      // Add city name to weather data
      weather.location.city = coords.displayName;

      return weather;
    } catch (error) {
      console.error('❌ [WEATHER] Failed to get weather by city:', error);
      throw error;
    }
  }

  /**
   * Detect timezone from city and state
   */
  async detectTimezone(city: string, state?: string): Promise<string> {
    try {
      console.log(`🌍 [WEATHER] Detecting timezone for ${city}${state ? ', ' + state : ''}...`);

      // Geocode to get coordinates
      const coords = await this.geocodeLocation(city, state);

      // Fetch weather with timezone info
      const response = await fetch(
        `${this.OPEN_METEO_BASE}/forecast?` +
        `latitude=${coords.latitude}&longitude=${coords.longitude}&` +
        `timezone=auto&forecast_days=1`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch timezone: ${response.status}`);
      }

      const data = await response.json();
      const timezone = data.timezone || 'America/Los_Angeles'; // Default fallback

      console.log(`✅ [WEATHER] Detected timezone: ${timezone}`);
      return timezone;

    } catch (error) {
      console.error('❌ [WEATHER] Failed to detect timezone:', error);
      // Return default timezone
      return 'America/Los_Angeles';
    }
  }

  /**
   * Get current weather data for user's location
   */
  async getCurrentWeather(latitude?: number, longitude?: number): Promise<WeatherData> {
    try {
      // Get user location if not provided
      if (!latitude || !longitude) {
        const coords = await this.getUserLocation();
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      // Check cache first
      const cacheKey = `${latitude},${longitude}`;
      const cached = this.weatherCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        console.log('🌤️ [WEATHER] Using cached weather data');
        return cached.data;
      }

      console.log('🌤️ [WEATHER] Fetching fresh weather data...');

      const response = await fetch(
        `${this.OPEN_METEO_BASE}/forecast?` +
        `latitude=${latitude}&longitude=${longitude}&` +
        `current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
        `wind_speed_10m,weather_code,is_day,precipitation,uv_index&` +
        `temperature_unit=fahrenheit&` +
        `timezone=auto&forecast_days=1`
      );

      if (!response.ok) {
        throw new Error(`Weather API failed: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;

      const weatherData: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        weatherDescription: this.getWeatherDescription(current.weather_code),
        isDay: current.is_day === 1,
        precipitation: current.precipitation || 0,
        uvIndex: current.uv_index || 0,
        location: {
          latitude,
          longitude
        },
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.weatherCache.set(cacheKey, {
        data: weatherData,
        expiry: Date.now() + this.CACHE_DURATION
      });

      console.log('✅ [WEATHER] Weather data retrieved successfully');
      console.log(`🌡️ [WEATHER] Temperature: ${weatherData.temperature}°F (feels like ${weatherData.feelsLike}°F)`);
      console.log(`🌤️ [WEATHER] Condition: ${weatherData.weatherDescription}`);
      return weatherData;

    } catch (error) {
      console.error('❌ [WEATHER] Failed to get weather data:', error);
      // Return fallback weather data
      return this.getFallbackWeather(latitude, longitude);
    }
  }

  /**
   * Get weather using user's saved location (from onboarding) or fall back to geolocation
   */
  async getUserSavedLocation(): Promise<WeatherData> {
    try {
      const userData = UserService.getUserData();
      
      if (userData?.city && userData?.state) {
        console.log(`🌤️ [WEATHER] Using saved location: ${userData.city}, ${userData.state}`);
        // Use saved location
        return this.getWeatherByCity(userData.city, userData.state);
      } else {
        console.log('🌤️ [WEATHER] No saved location, using geolocation');
        // Fall back to geolocation
        return this.getCurrentWeather();
      }
    } catch (error) {
      console.error('❌ [WEATHER] Failed to get user location weather:', error);
      return this.getCurrentWeather();
    }
  }

  /**
   * Get weather forecast for a specific date
   */
  async getWeatherForecast(latitude: number, longitude: number, targetDate: Date): Promise<WeatherData> {
    try {
      // Calculate days ahead
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      const daysAhead = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Open-Meteo supports up to 16 days forecast
      if (daysAhead < 0 || daysAhead > 16) {
        console.warn('🌤️ [WEATHER] Date out of forecast range, using current weather');
        return this.getCurrentWeather(latitude, longitude);
      }

      console.log(`🌤️ [WEATHER] Fetching ${daysAhead}-day forecast...`);

      const response = await fetch(
        `${this.OPEN_METEO_BASE}/forecast?` +
        `latitude=${latitude}&longitude=${longitude}&` +
        `daily=temperature_2m_max,temperature_2m_min,weathercode,` +
        `precipitation_sum,windspeed_10m_max,uv_index_max&` +
        `temperature_unit=fahrenheit&` +
        `timezone=auto&forecast_days=${Math.max(daysAhead + 1, 1)}`
      );

      if (!response.ok) {
        throw new Error(`Weather API failed: ${response.status}`);
      }

      const data = await response.json();
      const daily = data.daily;
      const dayIndex = Math.min(daysAhead, daily.time.length - 1);

      // Convert daily forecast to WeatherData format
      const forecastData: WeatherData = {
        temperature: Math.round((daily.temperature_2m_max[dayIndex] + daily.temperature_2m_min[dayIndex]) / 2),
        feelsLike: Math.round((daily.temperature_2m_max[dayIndex] + daily.temperature_2m_min[dayIndex]) / 2),
        humidity: 50, // Daily forecast doesn't include humidity
        windSpeed: daily.windspeed_10m_max[dayIndex],
        weatherCode: daily.weathercode[dayIndex],
        weatherDescription: this.getWeatherDescription(daily.weathercode[dayIndex]),
        isDay: true,
        precipitation: daily.precipitation_sum[dayIndex],
        uvIndex: daily.uv_index_max[dayIndex] || 0,
        location: {
          latitude,
          longitude
        },
        timestamp: daily.time[dayIndex]
      };

      console.log('✅ [WEATHER] Forecast data retrieved successfully');
      return forecastData;

    } catch (error) {
      console.error('❌ [WEATHER] Failed to get forecast:', error);
      return this.getFallbackWeather(latitude, longitude);
    }
  }

  /**
   * Get weather forecast by city and date
   */
  async getWeatherForecastByCity(city: string, state: string | undefined, targetDate: Date): Promise<WeatherData> {
    try {
      const coords = await this.geocodeLocation(city, state);
      const weather = await this.getWeatherForecast(coords.latitude, coords.longitude, targetDate);
      weather.location.city = coords.displayName;
      return weather;
    } catch (error) {
      console.error('❌ [WEATHER] Failed to get forecast by city:', error);
      throw error;
    }
  }

  /**
   * Convert weather code to human-readable description
   */
  private getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    return weatherCodes[code] || 'Unknown weather';
  }

  /**
   * Get fallback weather data when API fails
   */
  private getFallbackWeather(latitude?: number, longitude?: number): WeatherData {
    return {
      temperature: 70,
      feelsLike: 72,
      humidity: 50,
      windSpeed: 5,
      weatherCode: 1,
      weatherDescription: 'Mainly clear',
      isDay: true,
      precipitation: 0,
      uvIndex: 4,
      location: {
        latitude: latitude || 37.7749,
        longitude: longitude || -122.4194,
        city: 'Unknown'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze weather conditions for clothing recommendations
   */
  analyzeWeatherConditions(weather: WeatherData): WeatherConditions {
    const temp = weather.temperature;
    const feelsLike = weather.feelsLike;

    // Temperature analysis (using feels-like temperature)
    let temperature: WeatherConditions['temperature'];
    if (feelsLike >= 80) temperature = 'hot';
    else if (feelsLike >= 70) temperature = 'warm';
    else if (feelsLike >= 60) temperature = 'mild';
    else if (feelsLike >= 45) temperature = 'cool';
    else if (feelsLike >= 32) temperature = 'cold';
    else temperature = 'freezing';

    // Precipitation analysis
    let precipitation: WeatherConditions['precipitation'];
    if (weather.precipitation === 0) precipitation = 'none';
    else if (weather.precipitation < 0.1) precipitation = 'light';
    else if (weather.precipitation < 0.5) precipitation = 'moderate';
    else precipitation = 'heavy';

    // Wind analysis
    let wind: WeatherConditions['wind'];
    if (weather.windSpeed < 5) wind = 'calm';
    else if (weather.windSpeed < 15) wind = 'breezy';
    else if (weather.windSpeed < 25) wind = 'windy';
    else wind = 'very_windy';

    // Humidity analysis
    let humidity: WeatherConditions['humidity'];
    if (weather.humidity < 40) humidity = 'low';
    else if (weather.humidity < 70) humidity = 'moderate';
    else humidity = 'high';

    // UV analysis
    let uv: WeatherConditions['uv'];
    if (weather.uvIndex < 3) uv = 'low';
    else if (weather.uvIndex < 6) uv = 'moderate';
    else if (weather.uvIndex < 8) uv = 'high';
    else uv = 'very_high';

    // Overall weather analysis
    let overall: WeatherConditions['overall'];
    if (weather.weatherCode === 0 || weather.weatherCode === 1) overall = 'sunny';
    else if (weather.weatherCode <= 3) overall = 'cloudy';
    else if (weather.weatherCode >= 61 && weather.weatherCode <= 82) overall = 'rainy';
    else if (weather.weatherCode >= 71 && weather.weatherCode <= 86) overall = 'snowy';
    else if (weather.weatherCode >= 95) overall = 'stormy';
    else if (weather.weatherCode === 45 || weather.weatherCode === 48) overall = 'foggy';
    else overall = 'cloudy';

    return {
      temperature,
      precipitation,
      wind,
      humidity,
      uv,
      overall
    };
  }

  /**
   * Get clothing recommendations based on weather conditions
   */
  getClothingRecommendations(conditions: WeatherConditions): ClothingRecommendations {
    const recommendations: ClothingRecommendations = {
      layers: 'single',
      materials: [],
      colors: 'any',
      coverage: 'moderate',
      accessories: [],
      avoid: []
    };

    // Temperature-based recommendations
    switch (conditions.temperature) {
      case 'hot':
        recommendations.layers = 'single';
        recommendations.materials = ['cotton', 'linen', 'bamboo', 'light_fabrics'];
        recommendations.colors = 'light';
        recommendations.coverage = 'minimal';
        recommendations.accessories = ['sunglasses', 'hat', 'light_scarf'];
        recommendations.avoid = ['heavy_fabrics', 'dark_colors', 'layers'];
        break;

      case 'warm':
        recommendations.layers = 'single';
        recommendations.materials = ['cotton', 'light_fabrics'];
        recommendations.colors = 'light';
        recommendations.coverage = 'moderate';
        recommendations.accessories = ['sunglasses'];
        recommendations.avoid = ['heavy_fabrics', 'wool'];
        break;

      case 'mild':
        recommendations.layers = 'light_layering';
        recommendations.materials = ['cotton', 'light_wool', 'denim'];
        recommendations.colors = 'neutral';
        recommendations.coverage = 'moderate';
        recommendations.accessories = ['light_jacket'];
        break;

      case 'cool':
        recommendations.layers = 'light_layering';
        recommendations.materials = ['wool', 'cotton', 'fleece'];
        recommendations.colors = 'dark';
        recommendations.coverage = 'full';
        recommendations.accessories = ['jacket', 'scarf'];
        recommendations.avoid = ['shorts', 'sandals'];
        break;

      case 'cold':
        recommendations.layers = 'heavy_layering';
        recommendations.materials = ['wool', 'fleece', 'insulated_fabrics'];
        recommendations.colors = 'dark';
        recommendations.coverage = 'full';
        recommendations.accessories = ['coat', 'scarf', 'gloves', 'hat'];
        recommendations.avoid = ['light_fabrics', 'open_shoes'];
        break;

      case 'freezing':
        recommendations.layers = 'heavy_layering';
        recommendations.materials = ['wool', 'down', 'heavy_insulation'];
        recommendations.colors = 'dark';
        recommendations.coverage = 'full';
        recommendations.accessories = ['heavy_coat', 'warm_scarf', 'gloves', 'warm_hat', 'boots'];
        recommendations.avoid = ['light_fabrics', 'open_shoes', 'thin_materials'];
        break;
    }

    // Weather-specific adjustments
    if (conditions.precipitation !== 'none') {
      recommendations.accessories.push('umbrella', 'waterproof_jacket');
      recommendations.materials.push('waterproof', 'quick_dry');
      recommendations.avoid.push('suede', 'light_colors');
    }

    if (conditions.wind !== 'calm') {
      recommendations.accessories.push('windbreaker');
      recommendations.avoid.push('loose_clothing', 'light_scarves');
    }

    if (conditions.uv === 'high' || conditions.uv === 'very_high') {
      recommendations.accessories.push('sunglasses', 'hat', 'long_sleeves');
      recommendations.coverage = 'full';
    }

    return recommendations;
  }

  /**
   * Get cached weather data if available
   */
  getCachedWeather(latitude: number, longitude: number): WeatherData | null {
    const cacheKey = `${latitude},${longitude}`;
    const cached = this.weatherCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    return null;
  }
}

// Singleton instance
export const weatherService = new WeatherService();
export default weatherService;