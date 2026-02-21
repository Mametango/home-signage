import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import WeatherMap from './WeatherMap'
import './Weather.css'

interface WeatherData {
  temp: number
  condition: string
  icon: string
  prefecture: string
  city: string
  humidity?: number
  windSpeed?: number
  pressure?: number
}

interface HourlyForecast {
  time: Date
  temp: number
  condition: string
  icon: string
}

const Weather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings()
      setPrefecture(settings.prefecture)
      setCity(settings.city || '')
    }

    loadSettings()

    // 設定変更イベントを監視
    const handleSettingsChange = () => {
      loadSettings()
    }
    window.addEventListener('settingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  useEffect(() => {
    // 天気APIの例（OpenWeatherMapなど）
    // 実際の使用時はAPIキーが必要です
    const fetchWeather = async () => {
      try {
        // 新潟の代表的な緯度経度 (新潟市: 37.9161, 139.0364) または設定から取得
        const lat = 37.9161;
        const lon = 139.0364;

        // Open-Meteo API で現在の天気と時間別予報を取得
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=Asia%2FTokyo`);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // WMO Weather interpretation codes
        const getWeatherCondition = (code: number) => {
          if (code === 0) return { condition: '快晴', icon: '☀️' };
          if (code === 1 || code === 2 || code === 3) return { condition: '晴れ / 曇り', icon: '⛅' };
          if (code >= 45 && code <= 48) return { condition: '霧', icon: '🌫️' };
          if (code >= 51 && code <= 55) return { condition: '霧雨', icon: '🌧️' };
          if (code >= 61 && code <= 67) return { condition: '雨', icon: '☔' };
          if (code >= 71 && code <= 77) return { condition: '雪', icon: '❄️' };
          if (code >= 80 && code <= 82) return { condition: 'にわか雨', icon: '🌦️' };
          if (code >= 85 && code <= 86) return { condition: '雪・吹雪', icon: '🌨️' };
          if (code >= 95) return { condition: '雷雨', icon: '⛈️' };
          return { condition: '不明', icon: '❓' };
        };

        const currentCondition = getWeatherCondition(data.current.weather_code);

        const weatherData = {
          temp: Math.round(data.current.temperature_2m),
          condition: currentCondition.condition,
          icon: currentCondition.icon,
          prefecture: prefecture,
          city: city,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          pressure: data.current.pressure_msl
        };

        setWeather(weatherData)

        window.dispatchEvent(new CustomEvent('weatherChanged', {
          detail: { condition: weatherData.condition }
        }))

        // 時刻別予報（直近から2時間おきに7個取得）
        const forecast: HourlyForecast[] = [];
        const currentHour = new Date().getHours();

        // Open-Meteoのhourlyデータを使用
        // data.hourly.time はISO文字列の配列
        for (let i = 0; i < 24; i++) {
          const timeStr = data.hourly.time[i];
          const dt = new Date(timeStr);
          if (dt.getHours() >= currentHour && dt.getHours() % 2 === 0 && forecast.length < 7) {
            const cond = getWeatherCondition(data.hourly.weather_code[i]);
            forecast.push({
              time: dt,
              temp: Math.round(data.hourly.temperature_2m[i]),
              condition: cond.condition,
              icon: cond.icon
            });
          }
        }

        setHourlyForecast(forecast)
        setLoading(false)
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])

  if (loading) {
    return (
      <div className="weather-full">
        <div className="weather-loading">読み込み中...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="weather-full">
        <div className="weather-loading">天気情報が取得できませんでした</div>
      </div>
    )
  }

  return (
    <div className="weather-full">
      <div className="weather-full-header">
        <div className="weather-full-icon">{weather.icon}</div>
        <div className="weather-full-main">
          <div className="weather-full-temp">{weather.temp}°C</div>
          <div className="weather-full-condition">{weather.condition}</div>
          <div className="weather-full-location">
            {weather.city ? `${weather.prefecture} ${weather.city}` : weather.prefecture}
          </div>
        </div>
      </div>
      <div className="weather-full-details">
        <div className="weather-detail-item">
          <span className="weather-detail-label">湿度</span>
          <span className="weather-detail-value">{weather.humidity !== undefined ? `${weather.humidity}%` : '-'}</span>
        </div>
        <div className="weather-detail-item">
          <span className="weather-detail-label">風速</span>
          <span className="weather-detail-value">{weather.windSpeed !== undefined ? `${weather.windSpeed}km/h` : '-'}</span>
        </div>
        <div className="weather-detail-item">
          <span className="weather-detail-label">気圧</span>
          <span className="weather-detail-value">{weather.pressure !== undefined ? `${weather.pressure}hPa` : '-'}</span>
        </div>
      </div>

      {/* 地図と天気表示 */}
      <WeatherMap
        prefecture={weather.prefecture}
        city={weather.city}
        condition={weather.condition}
      />

      {/* 時刻別天気予報 */}
      <div className="weather-hourly-forecast">
        <h3 className="weather-hourly-title">時刻別予報（2時間おき）</h3>
        <div className="weather-hourly-list">
          {hourlyForecast.map((forecast, index) => (
            <div key={index} className="weather-hourly-item">
              <div className="weather-hourly-time">
                {format(forecast.time, 'HH時')}
              </div>
              <div className="weather-hourly-icon">{forecast.icon}</div>
              <div className="weather-hourly-temp">{forecast.temp}°C</div>
              <div className="weather-hourly-condition">{forecast.condition}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Weather
