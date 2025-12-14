import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import './Clock.css'

interface WeatherData {
  temp: number // 現在の気温または最高気温
  maxTemp?: number // 最高気温
  minTemp?: number // 最低気温
  condition: string
  icon: string
  precipitation: number // 降水確率（%）
  description?: string // 天気の解説
}

const Clock = () => {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
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
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 天気情報を取得
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const lat = 37.95
        const lon = 139.33
        const areaCode = '150000'
        
        // ウェザーニューズAPIを試行（APIキーが必要な場合はエラーになる）
        const weathernewsApiKey = import.meta.env.VITE_WEATHERNEWS_API_KEY || ''
        if (weathernewsApiKey) {
          try {
            const weathernewsResponse = await fetch(
              `https://api.wxtech.weathernews.com/api/v1/ss1wx?lat=${lat}&lon=${lon}`,
              {
                headers: {
                  'X-API-Key': weathernewsApiKey
                }
              }
            )
            
            if (weathernewsResponse.ok) {
              const weathernewsData = await weathernewsResponse.json()
              
              if (weathernewsData.wxdata && weathernewsData.wxdata.length > 0) {
                const wx = weathernewsData.wxdata[0]
                const srf = wx.srf || [] // 短期予報
                const mrf = wx.mrf || [] // 中期予報
                
                // 今日のデータを取得
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                // 短期予報から現在時刻に最も近いデータを取得
                let currentForecast = srf[0]
                if (srf.length > 0) {
                  const now = new Date()
                  currentForecast = srf.reduce((prev: any, curr: any) => {
                    const prevTime = Math.abs(new Date(prev.date).getTime() - now.getTime())
                    const currTime = Math.abs(new Date(curr.date).getTime() - now.getTime())
                    return currTime < prevTime ? curr : prev
                  })
                }
                
                // 中期予報から今日のデータを取得
                let todayForecast = mrf.find((f: any) => {
                  const forecastDate = new Date(f.date)
                  forecastDate.setHours(0, 0, 0, 0)
                  return forecastDate.getTime() === today.getTime()
                }) || mrf[0]
                
                const getWeatherCondition = (wxCode: number) => {
                  if (wxCode >= 100 && wxCode < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (wxCode >= 200 && wxCode < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (wxCode >= 300 && wxCode < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (wxCode >= 400 && wxCode < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                const weatherInfo = getWeatherCondition(currentForecast?.wx || todayForecast?.wx || 100)
                const maxTemp = todayForecast?.maxtemp || currentForecast?.temp
                const minTemp = todayForecast?.mintemp
                const precipitation = todayForecast?.pop || 0
                
                // 詳細な解説を作成
                let description = `今日の天気は${weatherInfo.text}`
                if (maxTemp !== undefined && minTemp !== undefined) {
                  const tempRange = maxTemp - minTemp
                  description += `。最高気温${maxTemp}度、最低気温${minTemp}度で、日中の気温差は${tempRange}度の見込み`
                  
                  // 昨日の気温と比較
                  try {
                    const yesterdayData = localStorage.getItem('yesterdayWeather')
                    if (yesterdayData) {
                      const parsed = JSON.parse(yesterdayData)
                      const yesterdayDate = new Date(parsed.date).toDateString()
                      const todayDate = new Date().toDateString()
                      
                      if (yesterdayDate !== todayDate && parsed.maxTemp !== undefined) {
                        const maxTempDiff = maxTemp - parsed.maxTemp
                        const minTempDiff = minTemp - (parsed.minTemp || parsed.maxTemp)
                        
                        if (Math.abs(maxTempDiff) >= 1) {
                          if (maxTempDiff > 0) {
                            description += `。最高気温は昨日より${Math.round(maxTempDiff)}度高い`
                          } else {
                            description += `。最高気温は昨日より${Math.abs(Math.round(maxTempDiff))}度低い`
                          }
                        }
                        
                        if (parsed.minTemp !== undefined && Math.abs(minTempDiff) >= 1) {
                          if (minTempDiff > 0) {
                            description += `。最低気温は昨日より${Math.round(minTempDiff)}度高い`
                          } else {
                            description += `。最低気温は昨日より${Math.abs(Math.round(minTempDiff))}度低い`
                          }
                        }
                      }
                    }
                  } catch (e) {
                    // localStorageの読み込みエラーは無視
                  }
                }
                if (precipitation > 0) {
                  description += `。降水確率${precipitation}%`
                }
                
                setWeather({
                  temp: currentForecast?.temp || maxTemp || 12,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  precipitation: precipitation,
                  description: description
                })
                
                // 今日の気温をlocalStorageに保存
                try {
                  const today = new Date()
                  const weatherData = {
                    date: today.toISOString(),
                    maxTemp: maxTemp,
                    minTemp: minTemp
                  }
                  localStorage.setItem('yesterdayWeather', JSON.stringify(weatherData))
                } catch (e) {
                  // localStorageの保存エラーは無視
                }
                
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: weatherInfo.condition } 
                }))
                return
              }
            }
          } catch (weathernewsError) {
            console.log('ウェザーニューズAPIエラー:', weathernewsError)
            // フォールバック処理に進む
          }
        }
        
        try {
          const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            
            if (forecastData && forecastData.length > 0) {
              const areaData = forecastData[0]
              const timeSeries = areaData.timeSeries?.[0] // 天気と気温
              const timeSeriesPops = areaData.timeSeries?.[1] // 降水確率
              
              if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
                const area = timeSeries.areas[0]
                
                // 天気の解説を作成（複数の時間帯の天気を組み合わせる）
                const getWeatherCondition = (code: string) => {
                  const codeNum = parseInt(code)
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                // 今日の天気予報を取得（複数の時間帯がある場合）
                const weatherCodes = area.weatherCodes || []
                const timeDefines = timeSeries.timeDefines || []
                const temps = area.temps || []
                
                // 降水確率を取得（timeSeries[1]から）
                let pops: string[] = []
                if (timeSeriesPops && timeSeriesPops.areas && timeSeriesPops.areas.length > 0) {
                  const popsArea = timeSeriesPops.areas[0]
                  pops = popsArea.pops || []
                }
                
                // 気温の処理（temps配列には最高気温と最低気温が含まれる可能性がある）
                let maxTemp: number | undefined
                let minTemp: number | undefined
                let currentTemp = 12
                
                if (temps && temps.length > 0) {
                  // 最高気温と最低気温を取得
                  if (temps.length >= 2) {
                    maxTemp = parseInt(temps[0]) // 最高気温
                    minTemp = parseInt(temps[1]) // 最低気温
                    currentTemp = maxTemp // 表示用には最高気温を使用
                  } else if (temps.length === 1) {
                    currentTemp = parseInt(temps[0])
                  }
                }
                
                // 天気の解説を作成（より詳細で自然な表現に）
                let description = ''
                if (weatherCodes.length > 0 && timeDefines.length > 0) {
                  const weatherParts: string[] = []
                  const popDetails: string[] = []
                  const weatherChanges: string[] = []
                  
                  // 各時間帯の天気と降水確率を取得
                  let prevWeather = ''
                  for (let i = 0; i < Math.min(weatherCodes.length, timeDefines.length); i++) {
                    const weatherInfo = getWeatherCondition(weatherCodes[i])
                    const timeDef = new Date(timeDefines[i])
                    const hour = timeDef.getHours()
                    
                    let timeLabel = ''
                    if (hour >= 0 && hour < 6) timeLabel = '未明'
                    else if (hour >= 6 && hour < 12) timeLabel = '午前'
                    else if (hour >= 12 && hour < 18) timeLabel = '午後'
                    else timeLabel = '夜'
                    
                    // 天気の表現を改善（より詳細に）
                    let weatherText = weatherInfo.text
                    if (weatherText === '雨') {
                      // 降水確率に応じて詳細な表現
                      if (pops && pops[i] && parseInt(pops[i]) >= 80) {
                        weatherText = '強い雨が降る'
                      } else if (pops && pops[i] && parseInt(pops[i]) >= 50) {
                        weatherText = '雨が降る'
                      } else {
                        weatherText = '一時的に雨が降る可能性'
                      }
                    } else if (weatherText === '雪') {
                      weatherText = '雪が降る'
                    } else if (weatherText === '曇り') {
                      weatherText = '曇りがち'
                    } else if (weatherText === '晴れ') {
                      weatherText = '晴れ'
                    }
                    
                    weatherParts.push(`${timeLabel}は${weatherText}`)
                    
                    // 天気の変化を検出
                    if (prevWeather && prevWeather !== weatherInfo.text) {
                      weatherChanges.push(`${timeLabel}から${weatherInfo.text === '雨' ? '雨' : weatherInfo.text === '雪' ? '雪' : weatherInfo.text}に変わる`)
                    }
                    prevWeather = weatherInfo.text
                    
                    // 降水確率の詳細情報
                    if (pops && pops[i] && parseInt(pops[i]) > 0) {
                      const popValue = parseInt(pops[i])
                      if (popValue >= 80) {
                        popDetails.push(`${timeLabel}の降水確率は${popValue}%で、雨が降る可能性が非常に高い`)
                      } else if (popValue >= 60) {
                        popDetails.push(`${timeLabel}の降水確率は${popValue}%で、雨が降る可能性が高い`)
                      } else if (popValue >= 40) {
                        popDetails.push(`${timeLabel}の降水確率は${popValue}%`)
                      }
                    }
                  }
                  
                  // 詳細な解説を組み立て
                  if (weatherParts.length > 0) {
                    // 基本の天気情報
                    description = `今日の天気は${weatherParts.join('、')}`
                    
                    // 天気の変化を追加
                    if (weatherChanges.length > 0) {
                      description += `。${weatherChanges.join('、')}`
                    }
                    
                    // 降水確率の詳細情報を追加
                    if (popDetails.length > 0) {
                      description += `。${popDetails.join('。')}`
                    }
                    
                    // 気温の詳細情報を追加
                    if (maxTemp !== undefined && minTemp !== undefined) {
                      const tempRange = maxTemp - minTemp
                      description += `。気温は最高${maxTemp}度、最低${minTemp}度で、日中の気温差は${tempRange}度の見込み`
                      
                      // 昨日の気温と比較
                      try {
                        const yesterdayData = localStorage.getItem('yesterdayWeather')
                        
                        if (yesterdayData) {
                          const parsed = JSON.parse(yesterdayData)
                          const yesterdayDate = new Date(parsed.date).toDateString()
                          const todayDate = new Date().toDateString()
                          
                          // 昨日のデータが存在し、日付が異なる場合
                          if (yesterdayDate !== todayDate && parsed.maxTemp !== undefined) {
                            const maxTempDiff = maxTemp - parsed.maxTemp
                            const minTempDiff = minTemp - (parsed.minTemp || parsed.maxTemp)
                            
                            if (Math.abs(maxTempDiff) >= 1) {
                              if (maxTempDiff > 0) {
                                description += `。最高気温は昨日より${Math.round(maxTempDiff)}度高い`
                              } else {
                                description += `。最高気温は昨日より${Math.abs(Math.round(maxTempDiff))}度低い`
                              }
                            }
                            
                            if (parsed.minTemp !== undefined && Math.abs(minTempDiff) >= 1) {
                              if (minTempDiff > 0) {
                                description += `。最低気温は昨日より${Math.round(minTempDiff)}度高い`
                              } else {
                                description += `。最低気温は昨日より${Math.abs(Math.round(minTempDiff))}度低い`
                              }
                            }
                          }
                        }
                      } catch (e) {
                        // localStorageの読み込みエラーは無視
                      }
                    } else if (maxTemp !== undefined) {
                      description += `。最高気温は${maxTemp}度の見込み`
                      
                      // 昨日の最高気温と比較
                      try {
                        const yesterdayData = localStorage.getItem('yesterdayWeather')
                        if (yesterdayData) {
                          const parsed = JSON.parse(yesterdayData)
                          const yesterdayDate = new Date(parsed.date).toDateString()
                          const todayDate = new Date().toDateString()
                          
                          if (yesterdayDate !== todayDate && parsed.maxTemp !== undefined) {
                            const maxTempDiff = maxTemp - parsed.maxTemp
                            if (Math.abs(maxTempDiff) >= 1) {
                              if (maxTempDiff > 0) {
                                description += `。昨日より${Math.round(maxTempDiff)}度高い`
                              } else {
                                description += `。昨日より${Math.abs(Math.round(maxTempDiff))}度低い`
                              }
                            }
                          }
                        }
                      } catch (e) {
                        // localStorageの読み込みエラーは無視
                      }
                    }
                    
                    // 天気の傾向を追加
                    if (weatherCodes.length >= 2) {
                      const morningWeather = getWeatherCondition(weatherCodes[0]).text
                      const afternoonWeather = weatherCodes.length > 1 ? getWeatherCondition(weatherCodes[1]).text : morningWeather
                      if (morningWeather !== afternoonWeather) {
                        if (afternoonWeather === '雨' || afternoonWeather === '雪') {
                          description += `。午後から天気が崩れる見込み`
                        } else if (afternoonWeather === '晴れ' && morningWeather !== '晴れ') {
                          description += `。午後から天気が回復する見込み`
                        }
                      }
                    }
                  }
                }
                
                // 今日の天気予報を取得（timeDefines[0]は今日）
                const todayWeatherCode = timeDefines.length > 0 && weatherCodes.length > 0 ? weatherCodes[0] : null
                const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                
                // 降水確率を取得（最大値を表示）
                let pop = 0
                if (pops && pops.length > 0) {
                  const popValues = pops.map((p: string) => parseInt(p)).filter((p: number) => !isNaN(p))
                  if (popValues.length > 0) {
                    pop = Math.max(...popValues)
                  }
                }
                
                setWeather({
                  temp: currentTemp,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  precipitation: pop,
                  description: description || undefined
                })
                
                // 今日の気温をlocalStorageに保存（明日の比較用）
                try {
                  const today = new Date()
                  const weatherData = {
                    date: today.toISOString(),
                    maxTemp: maxTemp,
                    minTemp: minTemp
                  }
                  localStorage.setItem('yesterdayWeather', JSON.stringify(weatherData))
                } catch (e) {
                  // localStorageの保存エラーは無視
                }
                
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: weatherInfo.condition } 
                }))
                return
              }
            }
          }
        } catch (apiError) {
          console.error('気象庁APIエラー:', apiError)
        }
        
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
        
        if (apiKey) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            const getWeatherIcon = (condition: string) => {
              if (condition.includes('Rain') || condition.includes('雨')) return '🌧️'
              if (condition.includes('Cloud') || condition.includes('曇')) return '☁️'
              if (condition.includes('Snow') || condition.includes('雪')) return '❄️'
              return '☀️'
            }
            
            // 降水確率を取得（OpenWeatherMapの場合は3時間予報から取得）
            const forecastResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
            )
            
            let precipitation = 0
            if (forecastResponse.ok) {
              const forecastData = await forecastResponse.json()
              if (forecastData.list && forecastData.list.length > 0) {
                precipitation = Math.round(forecastData.list[0].pop * 100) // 降水確率（0-1を0-100に変換）
              }
            }
            
            // 最高気温と最低気温を取得
            const maxTemp = data.main.temp_max ? Math.round(data.main.temp_max) : undefined
            const minTemp = data.main.temp_min ? Math.round(data.main.temp_min) : undefined
            
            // 天気のコメントを作成
            const conditionText = data.weather[0].description || '晴れ'
            let description = `${conditionText}`
            if (maxTemp !== undefined && minTemp !== undefined) {
              const tempRange = maxTemp - minTemp
              description += `。最高気温${maxTemp}度、最低気温${minTemp}度で、日中の気温差は${tempRange}度の見込み`
              
              // 昨日の気温と比較
              try {
                const yesterdayData = localStorage.getItem('yesterdayWeather')
                if (yesterdayData) {
                  const parsed = JSON.parse(yesterdayData)
                  const yesterdayDate = new Date(parsed.date).toDateString()
                  const todayDate = new Date().toDateString()
                  
                  if (yesterdayDate !== todayDate && parsed.maxTemp !== undefined) {
                    const maxTempDiff = maxTemp - parsed.maxTemp
                    const minTempDiff = minTemp - (parsed.minTemp || parsed.maxTemp)
                    
                    if (Math.abs(maxTempDiff) >= 1) {
                      if (maxTempDiff > 0) {
                        description += `。最高気温は昨日より${Math.round(maxTempDiff)}度高い`
                      } else {
                        description += `。最高気温は昨日より${Math.abs(Math.round(maxTempDiff))}度低い`
                      }
                    }
                    
                    if (parsed.minTemp !== undefined && Math.abs(minTempDiff) >= 1) {
                      if (minTempDiff > 0) {
                        description += `。最低気温は昨日より${Math.round(minTempDiff)}度高い`
                      } else {
                        description += `。最低気温は昨日より${Math.abs(Math.round(minTempDiff))}度低い`
                      }
                    }
                  }
                }
              } catch (e) {
                // localStorageの読み込みエラーは無視
              }
            } else if (maxTemp !== undefined) {
              description += `。最高気温${maxTemp}度の見込み`
              
              // 昨日の最高気温と比較
              try {
                const yesterdayData = localStorage.getItem('yesterdayWeather')
                if (yesterdayData) {
                  const parsed = JSON.parse(yesterdayData)
                  const yesterdayDate = new Date(parsed.date).toDateString()
                  const todayDate = new Date().toDateString()
                  
                  if (yesterdayDate !== todayDate && parsed.maxTemp !== undefined) {
                    const maxTempDiff = maxTemp - parsed.maxTemp
                    if (Math.abs(maxTempDiff) >= 1) {
                      if (maxTempDiff > 0) {
                        description += `。昨日より${Math.round(maxTempDiff)}度高い`
                      } else {
                        description += `。昨日より${Math.abs(Math.round(maxTempDiff))}度低い`
                      }
                    }
                  }
                }
              } catch (e) {
                // localStorageの読み込みエラーは無視
              }
            }
            if (precipitation > 0) {
              description += `。降水確率${precipitation}%`
            }
            
            setWeather({
              temp: Math.round(data.main.temp),
              maxTemp: maxTemp,
              minTemp: minTemp,
              condition: conditionText,
              icon: getWeatherIcon(data.weather[0].main),
              precipitation: precipitation,
              description: description
            })
            
            // 今日の気温をlocalStorageに保存（明日の比較用）
            try {
              const today = new Date()
              const weatherData = {
                date: today.toISOString(),
                maxTemp: maxTemp,
                minTemp: minTemp
              }
              localStorage.setItem('yesterdayWeather', JSON.stringify(weatherData))
            } catch (e) {
              // localStorageの保存エラーは無視
            }
            
            window.dispatchEvent(new CustomEvent('weatherChanged', { 
              detail: { condition: data.weather[0].main } 
            }))
            return
          }
        }
        
        // フォールバック
        setWeather({
          temp: 12,
          condition: '曇り',
          icon: '☁️',
          precipitation: 30,
          description: '曇りがち。降水確率30%'
        })
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
        setWeather({
          temp: 12,
          condition: '曇り',
          icon: '☁️',
          precipitation: 30
        })
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000)

    return () => clearInterval(interval)
  }, [prefecture, city])

  return (
    <div className="clock clock-large">
      <div className="clock-time-section">
        <div className="clock-time">
          {format(time, 'HH:mm:ss')}
        </div>
      </div>
      {weather && (
        <div className="clock-weather-summary">
          <div className="clock-weather-header">
            <div className="clock-weather-icon-large">{weather.icon}</div>
            <div className="clock-weather-condition-large">{weather.condition}</div>
          </div>
          
          {weather.description && (
            <div className="clock-weather-description-full">{weather.description}</div>
          )}
          
          <div className="clock-weather-info-grid">
            {weather.maxTemp !== undefined && weather.minTemp !== undefined ? (
              <>
                <div className="clock-weather-info-item">
                  <div className="clock-weather-info-label">最高気温</div>
                  <div className="clock-weather-info-value temp-max">{weather.maxTemp}°</div>
                </div>
                <div className="clock-weather-info-item">
                  <div className="clock-weather-info-label">最低気温</div>
                  <div className="clock-weather-info-value temp-min">{weather.minTemp}°</div>
                </div>
                <div className="clock-weather-info-item">
                  <div className="clock-weather-info-label">気温差</div>
                  <div className="clock-weather-info-value">{weather.maxTemp - weather.minTemp}°</div>
                </div>
              </>
            ) : (
              <div className="clock-weather-info-item">
                <div className="clock-weather-info-label">気温</div>
                <div className="clock-weather-info-value">{weather.temp}°C</div>
              </div>
            )}
            <div className="clock-weather-info-item">
              <div className="clock-weather-info-label">💧 降水確率</div>
              <div className="clock-weather-info-value precipitation">{weather.precipitation}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clock
