import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import './Clock.css'

interface TodayWeatherData {
  condition: string
  icon: string
  maxTemp?: number
  minTemp?: number
  description?: string
  prefecture: string
  city: string
}

interface HourlyForecast {
  time: Date
  temp: number
  condition: string
  icon: string
  precipitation: number
}

const Clock = () => {
  const [time, setTime] = useState(new Date())
  const [todayWeather, setTodayWeather] = useState<TodayWeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')

  // 時刻更新
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  // 天気情報を取得
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 設定から取得した都道府県と市に基づいて座標とエリアコードを設定
        // 新潟県新発田市の座標とエリアコード
        let lat = 37.95
        let lon = 139.33
        let areaCode = '150000' // 新潟地方
        
        // 都道府県と市に応じて座標とエリアコードを変更
        if (prefecture === '新潟県' && city === '新発田市') {
          lat = 37.95
          lon = 139.33
          areaCode = '150000' // 新潟地方
        } else if (prefecture === '新潟県') {
          // 新潟県の他の市の場合
          lat = 37.9161
          lon = 139.0364
          areaCode = '150000' // 新潟地方
        } else {
          // その他の都道府県の場合（デフォルトは新潟県新発田市）
          lat = 37.95
          lon = 139.33
          areaCode = '150000'
        }
        
        // 気象庁APIから本日の天気予報を取得
        try {
          const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            
            if (forecastData && forecastData.length > 0) {
              const areaData = forecastData[0]
              const timeSeries = areaData.timeSeries?.[0]
              
              if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
                // 新発田市に該当するエリアを探す
                // エリア名に「新発田」が含まれるエリアを優先的に選択
                let area = timeSeries.areas[0] // デフォルトは最初のエリア
                
                // 新発田市に該当するエリアを探す
                if (city === '新発田市') {
                  const shibataArea = timeSeries.areas.find((a: any) => 
                    a.area && (a.area.name && (a.area.name.includes('新発田') || a.area.name.includes('新発田市')))
                  )
                  if (shibataArea) {
                    area = shibataArea
                  } else {
                    // エリア名で見つからない場合は、エリアコードで探す
                    // 新発田市のエリアコードは152020（新発田市）または152110（新発田）の可能性
                    const shibataAreaByCode = timeSeries.areas.find((a: any) => 
                      a.area && (a.area.code === '152020' || a.area.code === '152110')
                    )
                    if (shibataAreaByCode) {
                      area = shibataAreaByCode
                    }
                  }
                }
                
                const weatherCodes = area.weatherCodes || []
                const temps = area.temps || []
                
                const getWeatherCondition = (code: string) => {
                  const codeNum = parseInt(code)
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                const todayWeatherCode = weatherCodes.length > 0 ? weatherCodes[0] : null
                const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                
                let maxTemp: number | undefined
                let minTemp: number | undefined
                if (temps && temps.length >= 2) {
                  maxTemp = parseInt(temps[0])
                  minTemp = parseInt(temps[1])
                }
                
                // 基本的な説明を生成
                let basicDescription = `今日の天気は${weatherInfo.text}`
                if (maxTemp !== undefined && minTemp !== undefined) {
                  basicDescription += `。最高気温${maxTemp}度、最低気温${minTemp}度の見込み`
                }
                
                // OpenAI APIでより詳細な説明を生成
                let aiDescription = basicDescription
                try {
                  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY
                  if (openaiApiKey) {
                    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiApiKey}`
                      },
                      body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                          {
                            role: 'system',
                            content: 'あなたは天気予報の専門家です。天気情報を分かりやすく、親しみやすい日本語で説明してください。'
                          },
                          {
                            role: 'user',
                            content: `${prefecture}${city}の今日の天気予報です。天気: ${weatherInfo.text}${maxTemp !== undefined && minTemp !== undefined ? `、最高気温${maxTemp}度、最低気温${minTemp}度` : ''}。この天気について、50文字程度で分かりやすく説明してください。`
                          }
                        ],
                        max_tokens: 100,
                        temperature: 0.7
                      })
                    })
                    
                    if (aiResponse.ok) {
                      const aiData = await aiResponse.json()
                      if (aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
                        aiDescription = aiData.choices[0].message.content.trim()
                      }
                    }
                  }
                } catch (aiError) {
                  console.error('OpenAI APIエラー:', aiError)
                  // AI生成に失敗した場合は基本説明を使用
                }
                
                setTodayWeather({
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  description: aiDescription,
                  prefecture: prefecture,
                  city: city
                })
                
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: weatherInfo.condition } 
                }))
              }
            }
          }
        } catch (apiError) {
          console.error('気象庁APIエラー:', apiError)
        }
        
        // 2時間ごとの予報を取得（OpenWeatherMap API）
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
        
        if (apiKey) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            const getWeatherIcon = (condition: string) => {
              if (condition.includes('Rain') || condition.includes('雨')) return '🌧️'
              if (condition.includes('Cloud') || condition.includes('曇')) return '☁️'
              if (condition.includes('Snow') || condition.includes('雪')) return '❄️'
              return '☀️'
            }
            
            const getWeatherCondition = (condition: string) => {
              if (condition.includes('Rain') || condition.includes('雨')) return '雨'
              if (condition.includes('Cloud') || condition.includes('曇')) return '曇り'
              if (condition.includes('Snow') || condition.includes('雪')) return '雪'
              return '晴れ'
            }
            
            const now = new Date()
            const forecast: HourlyForecast[] = []
            
            for (let i = 0; i < 6; i++) {
              const forecastTime = new Date(now)
              forecastTime.setHours(now.getHours() + (i + 1) * 2, 0, 0, 0)
              
              const closestItem = data.list.reduce((prev: any, curr: any) => {
                const prevTimeDiff = Math.abs(new Date(prev.dt_txt).getTime() - forecastTime.getTime())
                const currTimeDiff = Math.abs(new Date(curr.dt_txt).getTime() - forecastTime.getTime())
                return (currTimeDiff < prevTimeDiff) ? curr : prev
              })
              
              forecast.push({
                time: forecastTime,
                temp: Math.round(closestItem.main.temp),
                condition: getWeatherCondition(closestItem.weather[0].main),
                icon: getWeatherIcon(closestItem.weather[0].main),
                precipitation: Math.round(closestItem.pop * 100)
              })
            }
            
            setHourlyForecast(forecast)
            return
          }
        }
        
        // フォールバック: モックデータ
        setTodayWeather({
          condition: '曇り',
          icon: '☁️',
          maxTemp: 15,
          minTemp: 8,
          description: '今日の天気は曇り。最高気温15度、最低気温8度の見込み',
          prefecture: prefecture,
          city: city
        })
        
        const now = new Date()
        const mockForecast: HourlyForecast[] = []
        for (let i = 0; i < 6; i++) {
          const forecastTime = new Date(now)
          forecastTime.setHours(now.getHours() + (i + 1) * 2, 0, 0, 0)
          mockForecast.push({
            time: forecastTime,
            temp: 12 - i,
            condition: i % 2 === 0 ? '曇り' : '晴れ',
            icon: i % 2 === 0 ? '☁️' : '☀️',
            precipitation: 30 + i * 10
          })
        }
        setHourlyForecast(mockForecast)
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])


  return (
    <div className="clock">
      {/* 上: 日時 */}
      <div className="clock-datetime">
        <div className="clock-date">
          {format(time, 'yyyy年MM月dd日')}
        </div>
        <div className="clock-time">
          {format(time, 'HH:mm:ss')}
        </div>
      </div>

      {/* 下: 天気 */}
      {todayWeather && (
        <div className="clock-weather">
          <div className="clock-weather-summary">
            <div className="clock-weather-main">
              <div className="clock-weather-header">
                <div className="clock-weather-icon">{todayWeather.icon}</div>
                <div className="clock-weather-info">
                  <div className="clock-weather-location">
                    {todayWeather.prefecture} {todayWeather.city}
                  </div>
                  <div className="clock-weather-condition">{todayWeather.condition}</div>
                  {todayWeather.maxTemp !== undefined && todayWeather.minTemp !== undefined && (
                    <div className="clock-weather-temp">
                      <span className="temp-max">{todayWeather.maxTemp}°</span>
                      <span className="temp-separator">/</span>
                      <span className="temp-min">{todayWeather.minTemp}°</span>
                    </div>
                  )}
                </div>
              </div>
              {todayWeather.description && (
                <div className="clock-weather-description">{todayWeather.description}</div>
              )}
            </div>
          </div>

          {/* 2時間ごとの天気と降水確率 */}
          <div className="clock-weather-hourly-list">
            {hourlyForecast.map((forecast, index) => (
              <div key={index} className="clock-weather-hourly-item">
                <div className="clock-weather-hourly-time">{format(forecast.time, 'HH時')}</div>
                <div className="clock-weather-hourly-icon">{forecast.icon}</div>
                <div className="clock-weather-hourly-condition">{forecast.condition}</div>
                <div className="clock-weather-hourly-precipitation">💧{forecast.precipitation}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Clock
