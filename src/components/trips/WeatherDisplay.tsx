import { Cloud, Sun, CloudRain, Wind, Droplets, CloudSnow, CloudDrizzle } from 'lucide-react';
import type { WeatherData } from '../../services/weatherService';

interface WeatherDisplayProps {
  weather: WeatherData;
  className?: string;
}

export function WeatherDisplay({ weather, className = '' }: WeatherDisplayProps) {
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-8 h-8 text-yellow-500" />;
    if (code <= 3) return <Cloud className="w-8 h-8 text-gray-400" />;
    if (code <= 48) return <Cloud className="w-8 h-8 text-gray-500" />;
    if (code <= 57) return <CloudDrizzle className="w-8 h-8 text-blue-400" />;
    if (code <= 67) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (code <= 77) return <CloudSnow className="w-8 h-8 text-blue-300" />;
    return <CloudRain className="w-8 h-8 text-blue-600" />;
  };

  const getWeatherEmoji = (code: number): string => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '☁️';
    if (code <= 57) return '🌦️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    return '⛈️';
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 text-4xl">
          {getWeatherEmoji(weather.weatherCode || 0)}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(weather.temperature)}°F {weather.weatherDescription || 'Clear'}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Droplets className="w-4 h-4" />
              Feels like {Math.round(weather.feelsLike || weather.temperature)}°F
            </span>
            {weather.windSpeed && (
              <span className="flex items-center gap-1">
                <Wind className="w-4 h-4" />
                {Math.round(weather.windSpeed)} mph
              </span>
            )}
            {weather.uvIndex !== undefined && (
              <span>UV: {weather.uvIndex}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
