import React, { useState, useEffect } from 'react';
import { WeatherData, LocationSuggestion } from './types/weather';
import { getCurrentWeather, getWeatherByLocation } from './utils/weatherApi';
import { generateAIInsights } from './utils/aiInsights';
import { LocationSearch } from './components/LocationSearch';
import { CurrentWeather } from './components/CurrentWeather';
import { WeatherForecast } from './components/WeatherForecast';
import { AIInsights } from './components/AIInsights';
import { WeatherAlerts } from './components/WeatherAlerts';
import { MapPin, RefreshCw, Brain } from 'lucide-react';

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const weatherData = await getWeatherByLocation(lat, lon);
      setWeather(weatherData);
      setCurrentLocation(`${weatherData.location.name}, ${weatherData.location.country}`);
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    fetchWeatherData(location.lat, location.lon);
  };

  const handleRefresh = () => {
    if (weather) {
      fetchWeatherData(weather.location.lat, weather.location.lon);
    }
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to default location (New York)
          fetchWeatherData(40.7128, -74.0060);
        }
      );
    } else {
      // Fallback to default location
      fetchWeatherData(40.7128, -74.0060);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const getBackgroundGradient = () => {
    if (!weather) return 'from-blue-600 via-blue-700 to-indigo-800';
    
    const condition = weather.current.condition.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    
    if (isNight) {
      return 'from-indigo-900 via-purple-900 to-blue-900';
    }
    
    switch (condition) {
      case 'clear':
      case 'sunny':
        return 'from-blue-400 via-blue-500 to-cyan-600';
      case 'clouds':
      case 'cloudy':
        return 'from-gray-500 via-gray-600 to-blue-700';
      case 'rain':
      case 'drizzle':
        return 'from-gray-600 via-blue-700 to-indigo-800';
      case 'snow':
        return 'from-blue-200 via-blue-400 to-indigo-600';
      case 'thunderstorm':
        return 'from-gray-800 via-purple-900 to-indigo-900';
      default:
        return 'from-blue-600 via-blue-700 to-indigo-800';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} flex items-center justify-center`}>
        <div className="text-center bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          <p className="text-white text-xl mb-4">{error}</p>
          <button
            onClick={requestLocation}
            className="px-6 py-3 bg-white/20 text-white rounded-2xl hover:bg-white/30 transition-colors border border-white/30"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const insights = weather ? generateAIInsights(weather) : [];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} transition-all duration-1000`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Weather</h1>
              <p className="text-white/70">Intelligent weather insights powered by AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LocationSearch 
              onLocationSelect={handleLocationSelect}
              currentLocation={currentLocation}
            />
            <button
              onClick={requestLocation}
              className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-colors"
              title="Use current location"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              disabled={loading}
              title="Refresh weather data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {weather && (
          <div className="space-y-8">
            {/* Weather Alerts */}
            <WeatherAlerts weather={weather} />
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Current Weather - Spans 2 columns on large screens */}
              <div className="xl:col-span-2">
                <CurrentWeather weather={weather} />
              </div>
              
              {/* AI Insights */}
              <div>
                <AIInsights insights={insights} />
              </div>
            </div>
            
            {/* Weather Forecast */}
            <WeatherForecast weather={weather} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;