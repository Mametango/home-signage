import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import ja from 'date-fns/locale/ja'
import { getSettings } from './Settings'
import WeatherIcon from './WeatherIcon'
import './WeeklyWeather.css'

interface DayWeather {
  date: Date
  condition: string
  icon: string
  weatherCode?: string // 天気コード（WeatherIcon用）
}

interface WeeklyWeatherProps {
  onBack?: () => void
}

const WeeklyWeather = ({ onBack }: WeeklyWeatherProps) => {
  const [weatherData, setWeatherData] = useState<DayWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings()
      setPrefecture(settings.prefecture || '新潟県')
      setCity(settings.city || '新発田市')
    }

    loadSettings()
    
    const handleSettingsChange = () => {
      loadSettings()
    }
    window.addEventListener('settingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const areaCode = '150000'
        
        // まずXMLフィードから週間予報を取得を試みる
        try {
          const feedResponse = await fetch('https://www.data.jma.go.jp/developer/xml/feed/regular_l.xml')
          if (feedResponse.ok) {
            const feedText = await feedResponse.text()
            const parser = new DOMParser()
            const feedDoc = parser.parseFromString(feedText, 'text/xml')
            
            // 週間天気予報のリンクを探す（週間予報は別のエントリにある可能性がある）
            const entries = feedDoc.querySelectorAll('entry')
            let weeklyForecastUrl: string | null = null
            
            for (const entry of Array.from(entries)) {
              const title = entry.querySelector('title')?.textContent
              const link = entry.querySelector('link[type="application/xml"]')?.getAttribute('href')
              
              // 週間天気予報のエントリを探す（タイトルに「週間」が含まれる、または新潟県の週間予報）
              if (title && (title.includes('週間') || title.includes('150000'))) {
                weeklyForecastUrl = link || null
                if (weeklyForecastUrl) break
              }
            }
            
            // XMLフィードから週間予報が見つからない場合は、JSON APIにフォールバック
            if (!weeklyForecastUrl) {
              console.log('XMLフィードから週間予報が見つかりません。JSON APIを使用します。')
            }
          }
        } catch (xmlError) {
          console.log('XMLフィードからの取得エラー:', xmlError)
          // フォールバック処理に進む
        }
        
        const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
        
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json()
          
          // 週間天気予報はforecastData[1]から取得
          if (forecastData && forecastData.length > 1) {
            const weeklyData = forecastData[1]
            const timeSeries = weeklyData.timeSeries?.[0] // 週間天気予報のデータ
            if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
              const area = timeSeries.areas[0]
              const weatherCodes = area.weatherCodes || []
              const timeDefines = timeSeries.timeDefines || []
              
              // 詳細な天気コードマッピング（Clock.tsxと同じ）
              const getWeatherCondition = (code: string) => {
                switch (code) {
                  case '100': return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  case '101': return { condition: '曇り時々晴れ', icon: '⛅', text: '曇り時々晴れ' }
                  case '102': return { condition: '晴れ時々曇り', icon: '🌤️', text: '晴れ時々曇り' }
                  case '103': return { condition: '晴れのち曇り', icon: '🌥️', text: '晴れのち曇り' }
                  case '104': return { condition: '晴れ時々雨', icon: '🌦️', text: '晴れ時々雨' }
                  case '105': return { condition: '晴れのち雨', icon: '🌧️', text: '晴れのち雨' }
                  case '106': return { condition: '晴れ時々雪', icon: '🌨️', text: '晴れ時々雪' }
                  case '107': return { condition: '晴れのち雪', icon: '❄️', text: '晴れのち雪' }
                  case '200': return { condition: '曇り', icon: '☁️', text: '曇り' }
                  case '201': return { condition: '曇り時々晴れ', icon: '⛅', text: '曇り時々晴れ' }
                  case '202': return { condition: '曇り時々雨', icon: '🌧️', text: '曇り時々雨' }
                  case '203': return { condition: '曇りのち雨', icon: '☔', text: '曇りのち雨' }
                  case '204': return { condition: '曇り時々雪', icon: '🌨️', text: '曇り時々雪' }
                  case '205': return { condition: '曇りのち雪', icon: '❄️', text: '曇りのち雪' }
                  case '300': return { condition: '雨', icon: '☔', text: '雨' }
                  case '301': return { condition: '雨時々曇り', icon: '🌧️', text: '雨時々曇り' }
                  case '302': return { condition: '雨のち曇り', icon: '🌧️', text: '雨のち曇り' }
                  case '303': return { condition: '雨時々晴れ', icon: '🌦️', text: '雨時々晴れ' }
                  case '304': return { condition: '雨のち晴れ', icon: '🌦️', text: '雨のち晴れ' }
                  case '400': return { condition: '雪', icon: '❄️', text: '雪' }
                  case '401': return { condition: '雪時々曇り', icon: '🌨️', text: '雪時々曇り' }
                  case '402': return { condition: '雪のち曇り', icon: '🌨️', text: '雪のち曇り' }
                  case '403': return { condition: '雪時々晴れ', icon: '🌨️', text: '雪時々晴れ' }
                  case '404': return { condition: '雪のち晴れ', icon: '🌨️', text: '雪のち晴れ' }
                  default: return { condition: '不明', icon: '❓', text: '不明' }
                }
              }
              
              const days: DayWeather[] = []
              
              // 週間天気予報のデータを取得（最大7日分）
              for (let i = 0; i < Math.min(7, weatherCodes.length, timeDefines.length); i++) {
                const weatherCode = weatherCodes[i]
                const weatherInfo = getWeatherCondition(weatherCode)
                const date = new Date(timeDefines[i])
                
                days.push({
                  date: date,
                  condition: weatherInfo.text,
                  icon: weatherInfo.icon,
                  weatherCode: weatherCode
                })
              }
              
              // データが7日分ない場合は残りを追加（モックデータ）
              if (days.length < 7) {
                const lastDate = days.length > 0 ? days[days.length - 1].date : new Date()
                for (let i = days.length; i < 7; i++) {
                  days.push({
                    date: addDays(lastDate, i - days.length + 1),
                    condition: '晴れ',
                    icon: '☀️',
                    weatherCode: '100'
                  })
                }
              }
              
              setWeatherData(days)
              setLoading(false)
              return
            }
          }
        }
        
        // フォールバック: モックデータ
        const mockData: DayWeather[] = []
        for (let i = 0; i < 7; i++) {
          mockData.push({
            date: addDays(new Date(), i),
            condition: i % 2 === 0 ? '晴れ' : '曇り',
            icon: i % 2 === 0 ? '☀️' : '☁️',
            weatherCode: i % 2 === 0 ? '100' : '200'
          })
        }
        setWeatherData(mockData)
        setLoading(false)
      } catch (error) {
        console.error('週間天気予報の取得に失敗しました:', error)
        // エラー時もモックデータを表示
        const mockData: DayWeather[] = []
        for (let i = 0; i < 7; i++) {
          mockData.push({
            date: addDays(new Date(), i),
            condition: i % 2 === 0 ? '晴れ' : '曇り',
            icon: i % 2 === 0 ? '☀️' : '☁️',
            weatherCode: i % 2 === 0 ? '100' : '200'
          })
        }
        setWeatherData(mockData)
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])

  if (loading) {
    return (
      <div className="weekly-weather">
        <div className="weekly-weather-loading">読み込み中...</div>
      </div>
    )
  }

  const getDayLabel = (date: Date, index: number) => {
    if (index === 0) return '今日'
    if (index === 1) return '明日'
    return format(date, 'M/d(E)', { locale: ja })
  }

  // 天気コードから天気タイプを取得する関数
  const getWeatherTypeClass = (code?: string) => {
    if (!code) return 'weather-sunny'
    const codeNum = parseInt(code)
    if (codeNum >= 100 && codeNum < 200) return 'weather-sunny'
    if (codeNum >= 200 && codeNum < 300) return 'weather-cloudy'
    if (codeNum >= 300 && codeNum < 400) return 'weather-rainy'
    if (codeNum >= 400 && codeNum < 500) return 'weather-snowy'
    return 'weather-sunny'
  }

  return (
    <div className="weekly-weather">
      <div className="weekly-weather-header">
        <h2 className="weekly-weather-title">週間天気予報</h2>
      </div>
      <div className="weekly-weather-grid">
        {weatherData.map((day, index) => (
          <div key={index} className={`weekly-weather-day ${getWeatherTypeClass(day.weatherCode)}`}>
            <div className="weekly-weather-background">
              <WeatherIcon code={day.weatherCode || '100'} size={200} className="weather-background-icon" />
            </div>
            <div className="weekly-weather-date">
              {getDayLabel(day.date, index)}
            </div>
            <div className="weekly-weather-condition">{day.condition}</div>
          </div>
        ))}
      </div>
      {onBack && (
        <button
          className="weekly-weather-back-button"
          onClick={onBack}
          title="通常画面に戻る"
          aria-label="通常画面に戻る"
        >
          ← 戻る
        </button>
      )}
    </div>
  )
}

export default WeeklyWeather
