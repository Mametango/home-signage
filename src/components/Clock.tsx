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
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

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
                
                // 気温データの取得（気象庁APIの構造に合わせて修正）
                let maxTemp: number | undefined
                let minTemp: number | undefined
                
                // 気温データはtimeSeries[1]（2日目の予報）にある場合もある
                if (temps && Array.isArray(temps) && temps.length > 0) {
                  // 最高気温と最低気温を取得
                  // 気象庁APIでは、temps[0]が最高気温、temps[1]が最低気温の場合が多い
                  // ただし、nullの可能性もあるので注意
                  const tempValues = temps.filter((t: any) => t !== null && t !== undefined && t !== '').map((t: any) => parseInt(String(t)))
                  
                  if (tempValues.length >= 2) {
                    // より高い方が最高気温、低い方が最低気温
                    maxTemp = Math.max(...tempValues)
                    minTemp = Math.min(...tempValues)
                  } else if (tempValues.length === 1) {
                    maxTemp = tempValues[0]
                  }
                }
                
                // 気温データが取得できなかった場合、timeSeries[1]を確認
                if (maxTemp === undefined && minTemp === undefined) {
                  const tempSeries = areaData.timeSeries?.[1]
                  if (tempSeries && tempSeries.areas && tempSeries.areas.length > 0) {
                    const tempArea = tempSeries.areas.find((a: any) => 
                      a.area && (a.area.name && (a.area.name.includes('新発田') || a.area.name.includes('新発田市')))
                    ) || tempSeries.areas[0]
                    
                    if (tempArea && tempArea.temps && Array.isArray(tempArea.temps) && tempArea.temps.length > 0) {
                      const tempValues = tempArea.temps.filter((t: any) => t !== null && t !== undefined && t !== '').map((t: any) => parseInt(String(t)))
                      
                      if (tempValues.length >= 2) {
                        maxTemp = Math.max(...tempValues)
                        minTemp = Math.min(...tempValues)
                      } else if (tempValues.length === 1) {
                        maxTemp = tempValues[0]
                      }
                    }
                  }
                }
                
                // それでも取得できなかった場合、OpenWeatherMap APIから取得を試す
                if (maxTemp === undefined && minTemp === undefined) {
                  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
                  if (apiKey) {
                    try {
                      const currentResponse = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
                      )
                      
                      if (currentResponse.ok) {
                        const currentData = await currentResponse.json()
                        const currentTemp = Math.round(currentData.main.temp)
                        // 現在の気温から最高・最低を推定（簡易的な方法）
                        maxTemp = currentTemp + 3
                        minTemp = currentTemp - 3
                      }
                    } catch (owmError) {
                      console.error('OpenWeatherMap APIエラー:', owmError)
                    }
                  }
                }
                
                // 無料のルールベース方式で説明を生成（フォールバック）
                const generateRuleBasedDescription = (): string => {
                  const avgTemp = maxTemp !== undefined && minTemp !== undefined ? Math.round((maxTemp + minTemp) / 2) : null
                  
                  // ルールベースで生成したことが分かるようにラベルを付与
                  let description = `【ルール】今日の${prefecture}${city}は${weatherInfo.text}`
                  
                  if (avgTemp !== null) {
                    if (avgTemp >= 25) {
                      description += `。暑い一日になりそうです。熱中症にご注意ください`
                    } else if (avgTemp >= 20) {
                      description += `。過ごしやすい気温です。お出かけに最適な天気です`
                    } else if (avgTemp >= 15) {
                      description += `。少し肌寒いかもしれません。上着があると安心です`
                    } else if (avgTemp >= 10) {
                      description += `。寒い一日になりそうです。暖かい服装でお出かけください`
                    } else {
                      description += `。とても寒い一日になりそうです。防寒対策をしっかりと`
                    }
                  }
                  
                  if (weatherInfo.text === '雨') {
                    description += `。傘をお忘れなく`
                  } else if (weatherInfo.text === '雪') {
                    description += `。路面が滑りやすくなります。お気をつけて`
                  } else if (weatherInfo.text === '曇り') {
                    description += `。雲が多いですが、お出かけには問題ありません`
                  }
                  
                  if (maxTemp !== undefined && minTemp !== undefined) {
                    description += `（最高${maxTemp}度、最低${minTemp}度）`
                  }
                  
                  return description
                }
                
                // AI APIで天気説明を生成（毎朝一回だけ）
                const generateDescription = async (): Promise<string> => {
                  const today = format(new Date(), 'yyyy-MM-dd')
                  const cacheKey = `weather-description-${today}-${prefecture}-${city}`
                  
                  // キャッシュを確認（同じ日は再利用）
                  const cached = localStorage.getItem(cacheKey)
                  if (cached) {
                    try {
                      const cachedData = JSON.parse(cached)
                      if (cachedData.date === today) {
                        return cachedData.description
                      }
                    } catch (e) {
                      console.error('キャッシュの読み込みエラー:', e)
                    }
                  }
                  
                  const avgTemp = maxTemp !== undefined && minTemp !== undefined ? Math.round((maxTemp + minTemp) / 2) : null
                  const tempInfo = maxTemp !== undefined && minTemp !== undefined 
                    ? `最高気温${maxTemp}度、最低気温${minTemp}度` 
                    : avgTemp !== null ? `平均気温${avgTemp}度程度` : ''
                  
                  const prompt = `今日の${prefecture}${city}の天気は${weatherInfo.text}です。${tempInfo ? tempInfo + 'の見込みです。' : ''}簡潔で分かりやすい天気予報の説明を日本語で50文字程度で教えてください。`
                  
                  // Gemini API（サーバー側プロキシ）を優先的に試す
                  try {
                    const response = await fetch('/api/gemini-weather', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ prompt })
                    })

                    if (response.ok) {
                      const data = await response.json()
                      const description =
                        data && typeof data.description === 'string' && data.description.trim().length > 0
                          ? data.description.trim()
                          : generateRuleBasedDescription()

                      // キャッシュに保存
                      localStorage.setItem(cacheKey, JSON.stringify({
                        date: today,
                        description: description
                      }))

                      return description
                    } else {
                      console.error('Gemini APIエラー(サーバー):', response.status, response.statusText)
                      return generateRuleBasedDescription()
                    }
                  } catch (error) {
                    console.error('Gemini API呼び出しエラー(サーバー):', error)
                    return generateRuleBasedDescription()
                  }
                }
                
                // 説明を生成（非同期）
                // 必ず一度はGemini（サーバー側）を試し、失敗したらルールベース
                setIsGeneratingDescription(true)

                generateDescription()
                  .then((description) => {
                    setIsGeneratingDescription(false)
                    setTodayWeather({
                      condition: weatherInfo.condition,
                      icon: weatherInfo.icon,
                      maxTemp: maxTemp,
                      minTemp: minTemp,
                      description: description,
                      prefecture: prefecture,
                      city: city
                    })
                  })
                  .catch((error) => {
                    console.error('説明生成エラー:', error)
                    setIsGeneratingDescription(false)
                    // エラー時はルールベースの説明を使用
                    const fallbackDescription = generateRuleBasedDescription()
                    setTodayWeather({
                      condition: weatherInfo.condition,
                      icon: weatherInfo.icon,
                      maxTemp: maxTemp,
                      minTemp: minTemp,
                      description: fallbackDescription,
                      prefecture: prefecture,
                      city: city
                    })
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
        
        // フォールバック: モックデータ（説明も生成）
        const mockMaxTemp = 15
        const mockMinTemp = 8
        const mockAvgTemp = Math.round((mockMaxTemp + mockMinTemp) / 2)
        
        let mockDescription = `今日の${prefecture}${city}は曇り`
        if (mockAvgTemp >= 25) {
          mockDescription += `。暑い一日になりそうです。熱中症にご注意ください`
        } else if (mockAvgTemp >= 20) {
          mockDescription += `。過ごしやすい気温です。お出かけに最適な天気です`
        } else if (mockAvgTemp >= 15) {
          mockDescription += `。少し肌寒いかもしれません。上着があると安心です`
        } else if (mockAvgTemp >= 10) {
          mockDescription += `。寒い一日になりそうです。暖かい服装でお出かけください`
        } else {
          mockDescription += `。とても寒い一日になりそうです。防寒対策をしっかりと`
        }
        mockDescription += `。雲が多いですが、お出かけには問題ありません（最高${mockMaxTemp}度、最低${mockMinTemp}度）`
        
        setTodayWeather({
          condition: '曇り',
          icon: '☁️',
          maxTemp: mockMaxTemp,
          minTemp: mockMinTemp,
          description: mockDescription,
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
                  {isGeneratingDescription ? (
                    <div className="clock-weather-description clock-weather-description-loading">
                      <span className="loading-dots">Geminiに問い合わせ中</span>
                    </div>
                  ) : todayWeather.description ? (
                    <div className="clock-weather-description">{todayWeather.description}</div>
                  ) : null}
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
