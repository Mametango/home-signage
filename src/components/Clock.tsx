import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import WeatherIcon from './WeatherIcon'
import './Clock.css'

interface WeatherData {
  temp: number // 現在の気温または最高気温
  maxTemp?: number // 最高気温
  minTemp?: number // 最低気温
  condition: string
  icon: string
  weatherCode?: string // 天気コード（WeatherIcon用）
  precipitation: number // 降水確率（%）
  // 今日と明日の天気
  today?: {
    condition: string
    icon: string
    weatherCode?: string // 天気コード（WeatherIcon用）
    maxTemp?: number
    minTemp?: number
    precipitation?: number
  }
  tomorrow?: {
    condition: string
    icon: string
    weatherCode?: string // 天気コード（WeatherIcon用）
    maxTemp?: number
    minTemp?: number
    precipitation?: number
  }
}

interface WarningInfo {
  title: string
  status: string // '警報' | '注意報'
  kind: string // 警報の種類（例: '大雨', '洪水'など）
}

interface ClockProps {
  showTimeOnly?: boolean
  renderMode?: 'time' | 'weather' | 'both'
}

interface WeeklyWeatherItem {
  date: string
  condition?: string
  icon?: string
  maxTemp?: number
  minTemp?: number
  rainProbability?: number
}

const Clock = ({ showTimeOnly = false, renderMode }: ClockProps = {}) => {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')
  const [_warnings, setWarnings] = useState<WarningInfo[]>([])
  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeatherItem[]>([])

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
    // 初期時刻を設定
    setTime(new Date())

    // 1秒ごとに更新（ドリフト補正付き）
    let expectedTime = Date.now() + 1000
    const timer = setInterval(() => {
      const now = Date.now()
      const drift = now - expectedTime

      // ドリフトが大きい場合は即座に修正
      if (Math.abs(drift) > 100) {
        setTime(new Date())
        expectedTime = now + 1000
      } else {
        setTime(new Date())
        expectedTime += 1000
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 警報・注意報を取得する関数
  const fetchWarnings = async (): Promise<WarningInfo[]> => {
    try {
      // 新潟県のエリアコード（150000は新潟県全体、150013は下越地方）
      const areaCodes = ['150000', '150013'] // 新潟県全体と下越地方を試す

      const areaWarnings: WarningInfo[] = []

      // 複数のエリアコードを試す
      for (const areaCode of areaCodes) {
        try {
          // 気象庁の警報・注意報API（詳細版）
          let warningResponse = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${areaCode}.json`)

          if (!warningResponse.ok) {
            // 詳細版が失敗した場合は概要版を試す
            warningResponse = await fetch(`https://www.jma.go.jp/bosai/warning/data/overview_warning/${areaCode}.json`)
          }

          if (warningResponse.ok) {
            const warningData = await warningResponse.json()
            console.log(`警報データ (${areaCode}):`, warningData)

            if (warningData && typeof warningData === 'object') {
              // 気象庁APIの構造: { "150013": { "0": { "areas": [...] } } }
              Object.keys(warningData).forEach((regionCode) => {
                const regionData = warningData[regionCode]

                if (regionData && typeof regionData === 'object') {
                  // タイムスタンプキー（通常 "0" が最新）を取得
                  Object.keys(regionData).forEach((timeKey) => {
                    const timeData = regionData[timeKey]

                    if (timeData && timeData.areas && Array.isArray(timeData.areas)) {
                      // 各エリアを処理
                      timeData.areas.forEach((area: any) => {
                        // 新発田市を含むエリアを探す（コード 1510150 または名前で判定）
                        const areaName = area.name || ''
                        const areaCodeValue = area.code || ''
                        const isShibataArea = areaName.includes('新発田') || areaCodeValue === '1510150'

                        if (area.warnings && typeof area.warnings === 'object') {
                          // 警告の種類ごとに処理
                          Object.keys(area.warnings).forEach((warningTypeKey) => {
                            const warningArray = area.warnings[warningTypeKey]

                            if (Array.isArray(warningArray)) {
                              warningArray.forEach((warning: any) => {
                                if (warning && typeof warning === 'object') {
                                  const status = warning.status || ''
                                  const kindName = warning.kindName || warning.kind || ''

                                  // 警報または注意報の場合
                                  if ((status === '警報' || status === '注意報') && kindName) {
                                    // 新発田市のエリアのみ、またはすべてのエリアから取得
                                    if (isShibataArea || areaCodes.length === 1) {
                                      areaWarnings.push({
                                        title: kindName,
                                        status: status,
                                        kind: kindName
                                      })
                                    }
                                  }
                                }
                              })
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          }
        } catch (error) {
          console.error(`エリアコード ${areaCode} の警報取得エラー:`, error)
        }
      }

      // 重複を除去（同じ種類の警報が複数ある場合）
      const uniqueWarnings = areaWarnings.filter((warning, index, self) =>
        index === self.findIndex((w) => w.kind === warning.kind && w.status === warning.status)
      )

      console.log('抽出された警報:', uniqueWarnings)
      return uniqueWarnings
    } catch (error) {
      console.error('警報・注意報の取得に失敗しました:', error)
      return []
    }
  }

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

                const wxCode = currentForecast?.wx || todayForecast?.wx || 100
                const weatherInfo = getWeatherCondition(wxCode)
                const maxTemp = todayForecast?.maxtemp || currentForecast?.temp
                const minTemp = todayForecast?.mintemp
                const precipitation = todayForecast?.pop || 0

                setWeather({
                  temp: currentForecast?.temp || maxTemp || 12,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  weatherCode: String(wxCode),
                  precipitation: precipitation
                })

                // 警報・注意報も取得
                const warningsData = await fetchWarnings()
                setWarnings(warningsData)

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

        // 気象庁のXMLフィードから新潟の天気予報を取得
        try {
          const feedResponse = await fetch('https://www.data.jma.go.jp/developer/xml/feed/regular_l.xml')
          if (feedResponse.ok) {
            const feedText = await feedResponse.text()
            const parser = new DOMParser()
            const feedDoc = parser.parseFromString(feedText, 'text/xml')

            // 新潟県の府県天気予報のリンクを探す
            const entries = feedDoc.querySelectorAll('entry')
            let niigataForecastUrl: string | null = null

            for (const entry of Array.from(entries)) {
              const title = entry.querySelector('title')?.textContent
              const link = entry.querySelector('link[type="application/xml"]')?.getAttribute('href')

              if (title?.includes('府県天気予報') && link?.includes('_150000.xml')) {
                niigataForecastUrl = link
                break
              }
            }

            // 新潟県の天気予報XMLを取得
            if (niigataForecastUrl) {
              const forecastXmlResponse = await fetch(niigataForecastUrl)
              if (forecastXmlResponse.ok) {
                const forecastXmlText = await forecastXmlResponse.text()
                const forecastDoc = parser.parseFromString(forecastXmlText, 'text/xml')

                // XMLから天気情報を抽出
                const timeSeries = forecastDoc.querySelector('TimeSeries')
                if (timeSeries) {
                  const weatherParts = timeSeries.querySelectorAll('WeatherPart')
                  const temps = timeSeries.querySelectorAll('Temperature')

                  // 今日の天気を取得
                  if (weatherParts.length > 0) {
                    const todayWeather = weatherParts[0]
                    const weatherCode = todayWeather.querySelector('WeatherCode')?.textContent || '100'
                    // 気温を取得
                    let maxTemp: number | undefined
                    let minTemp: number | undefined
                    temps.forEach((temp) => {
                      const type = temp.querySelector('Type')?.textContent
                      const value = temp.querySelector('Value')?.textContent
                      if (type === '最高' && value) {
                        maxTemp = parseInt(value)
                      } else if (type === '最低' && value) {
                        minTemp = parseInt(value)
                      }
                    })

                    const getWeatherCondition = (code: string) => {
                      const codeNum = parseInt(code)
                      if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                      if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                      if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                      if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                      return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                    }

                    const weatherInfo = getWeatherCondition(weatherCode)

                    setWeather({
                      temp: maxTemp || minTemp || 12,
                      maxTemp: maxTemp,
                      minTemp: minTemp,
                      condition: weatherInfo.condition,
                      icon: weatherInfo.icon,
                      weatherCode: weatherCode,
                      precipitation: 0
                    })

                    // 警報・注意報も取得
                    const warningsData = await fetchWarnings()
                    setWarnings(warningsData)

                    window.dispatchEvent(new CustomEvent('weatherChanged', {
                      detail: { condition: weatherInfo.condition }
                    }))
                    return
                  }
                }
              }
            }
          }
        } catch (xmlError) {
          console.log('XMLフィードからの取得エラー:', xmlError)
          // フォールバック処理に進む
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

                // 今日と明日の日付を取得
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)

                // 今日と明日の気温を取得（スコープ外で定義）
                let tomorrowMaxTemp: number | undefined
                let tomorrowMinTemp: number | undefined

                // 明日の天気コードを取得（スコープ外で定義）
                let tomorrowWeatherCode: string | null = null

                // 今日と明日の降水確率を取得（スコープ外で定義）
                let todayPop = 0
                let tomorrowPop = 0

                // 明日の気温を取得（temps配列から）
                if (temps && temps.length >= 4) {
                  // temps配列は[今日最高, 今日最低, 明日最高, 明日最低]の形式
                  tomorrowMaxTemp = parseInt(temps[2])
                  tomorrowMinTemp = parseInt(temps[3])
                }

                // 今日と明日の降水確率を取得
                if (pops && pops.length > 0 && timeDefines.length > 0) {
                  const todayPops: number[] = []
                  const tomorrowPops: number[] = []
                  for (let i = 0; i < Math.min(pops.length, timeDefines.length); i++) {
                    const timeDef = new Date(timeDefines[i])
                    const timeDefDate = new Date(timeDef.getFullYear(), timeDef.getMonth(), timeDef.getDate())
                    const popValue = parseInt(pops[i])
                    if (!isNaN(popValue)) {
                      if (timeDefDate.getTime() === today.getTime()) {
                        todayPops.push(popValue)
                      } else if (timeDefDate.getTime() === tomorrow.getTime()) {
                        tomorrowPops.push(popValue)
                      }
                    }
                  }
                  if (todayPops.length > 0) {
                    todayPop = Math.max(...todayPops)
                  }
                  if (tomorrowPops.length > 0) {
                    tomorrowPop = Math.max(...tomorrowPops)
                  }
                }

                // 明日の天気コードを取得
                if (weatherCodes.length > 0 && timeDefines.length > 0) {
                  for (let i = 0; i < Math.min(weatherCodes.length, timeDefines.length); i++) {
                    const timeDef = new Date(timeDefines[i])
                    const timeDefDate = new Date(timeDef.getFullYear(), timeDef.getMonth(), timeDef.getDate())
                    const isTomorrow = timeDefDate.getTime() === tomorrow.getTime()
                    if (isTomorrow && tomorrowWeatherCode === null) {
                      tomorrowWeatherCode = weatherCodes[i]
                    }
                  }
                }

                // 今日の天気予報を取得（複数の時間帯を考慮）
                let displayCondition = '晴れ'
                let displayIcon = '☀️'
                let todayWeatherCodeForIcon = '100' // デフォルトは晴れ

                // 今日の天気コードから表示用の天気を決定
                if (weatherCodes.length > 0 && timeDefines.length > 0) {
                  // 今日の日付に該当する天気コードを取得
                  const todayWeatherCodes: string[] = []
                  for (let i = 0; i < Math.min(weatherCodes.length, timeDefines.length); i++) {
                    const timeDef = new Date(timeDefines[i])
                    const timeDefDate = new Date(timeDef.getFullYear(), timeDef.getMonth(), timeDef.getDate())
                    if (timeDefDate.getTime() === today.getTime()) {
                      todayWeatherCodes.push(weatherCodes[i])
                    }
                  }

                  if (todayWeatherCodes.length > 0) {
                    // 時間帯の順序を保持して天気を取得
                    interface WeatherItem {
                      order: number
                      text: string
                      code: string
                    }
                    const weatherTexts: WeatherItem[] = []
                    for (let i = 0; i < todayWeatherCodes.length; i++) {
                      const codeIndex = weatherCodes.indexOf(todayWeatherCodes[i])
                      if (codeIndex >= 0 && codeIndex < timeDefines.length) {
                        const timeDef = new Date(timeDefines[codeIndex])
                        const hour = timeDef.getHours()
                        // 時間帯の順序を考慮（午前→午後→夜の順）
                        const timeOrder = hour < 12 ? 0 : hour < 18 ? 1 : 2
                        const weatherInfo = getWeatherCondition(todayWeatherCodes[i])
                        weatherTexts.push({ order: timeOrder, text: weatherInfo.text, code: todayWeatherCodes[i] })
                      }
                    }

                    // 時間帯の順序でソート
                    weatherTexts.sort((a, b) => a.order - b.order)

                    // 重複を除去しつつ順序を保持
                    const uniqueWeathers: string[] = []
                    const seenWeathers = new Set<string>()
                    for (const item of weatherTexts) {
                      if (!seenWeathers.has(item.text)) {
                        uniqueWeathers.push(item.text)
                        seenWeathers.add(item.text)
                      }
                    }

                    // 複数の時間帯で天気が変わる場合は「のち」で結合
                    if (uniqueWeathers.length > 1) {
                      displayCondition = uniqueWeathers.join('のち')
                      // 最後の天気のアイコンを使用
                      const lastWeatherInfo = getWeatherCondition(weatherTexts[weatherTexts.length - 1].code)
                      displayIcon = lastWeatherInfo.icon
                      todayWeatherCodeForIcon = weatherTexts[weatherTexts.length - 1].code
                    } else if (uniqueWeathers.length === 1) {
                      displayCondition = uniqueWeathers[0]
                      const weatherInfo = getWeatherCondition(todayWeatherCodes[0])
                      displayIcon = weatherInfo.icon
                      todayWeatherCodeForIcon = todayWeatherCodes[0]
                    } else {
                      // フォールバック
                      const firstWeatherInfo = getWeatherCondition(todayWeatherCodes[0])
                      displayCondition = firstWeatherInfo.condition
                      displayIcon = firstWeatherInfo.icon
                      todayWeatherCodeForIcon = todayWeatherCodes[0]
                    }
                  } else {
                    // フォールバック: 最初の天気コードを使用
                    const todayWeatherCode = weatherCodes[0]
                    const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                    displayCondition = weatherInfo.condition
                    displayIcon = weatherInfo.icon
                    todayWeatherCodeForIcon = todayWeatherCode || '100'
                  }
                } else {
                  // フォールバック
                  const todayWeatherCode = timeDefines.length > 0 && weatherCodes.length > 0 ? weatherCodes[0] : null
                  const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  displayCondition = weatherInfo.condition
                  displayIcon = weatherInfo.icon
                  todayWeatherCodeForIcon = todayWeatherCode || '100'
                }

                // 降水確率を取得（最大値を表示）
                let pop = 0
                if (pops && pops.length > 0) {
                  const popValues = pops.map((p: string) => parseInt(p)).filter((p: number) => !isNaN(p))
                  if (popValues.length > 0) {
                    pop = Math.max(...popValues)
                  }
                }

                // 今日の天気情報を構築
                const todayInfo = {
                  condition: displayCondition,
                  icon: displayIcon,
                  weatherCode: todayWeatherCodeForIcon,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  precipitation: todayPop
                }

                // 明日の天気情報を構築
                let tomorrowInfo = undefined
                if (tomorrowWeatherCode) {
                  const tomorrowWeatherInfo = getWeatherCondition(tomorrowWeatherCode)
                  tomorrowInfo = {
                    condition: tomorrowWeatherInfo.text,
                    icon: tomorrowWeatherInfo.icon,
                    weatherCode: tomorrowWeatherCode,
                    maxTemp: tomorrowMaxTemp,
                    minTemp: tomorrowMinTemp,
                    precipitation: tomorrowPop
                  }
                }

                setWeather({
                  temp: currentTemp,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: displayCondition,
                  icon: displayIcon,
                  weatherCode: todayWeatherCodeForIcon,
                  precipitation: pop,
                  today: todayInfo,
                  tomorrow: tomorrowInfo
                })

                // 警報・注意報も取得
                const warningsData = await fetchWarnings()
                setWarnings(warningsData)

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
                  detail: { condition: displayCondition }
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

            const getWeatherCodeFromOpenWeather = (main: string) => {
              // OpenWeatherMapの天気状態から天気コードを推測
              if (main.includes('Rain')) return '300'
              if (main.includes('Snow')) return '400'
              if (main.includes('Cloud')) return '200'
              return '100' // デフォルトは晴れ
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

            const conditionText = data.weather?.[0]?.description || data.weather?.[0]?.main || '晴れ'

            // 今日と明日の天気情報を構築（OpenWeatherMap APIでは簡易版）
            const weatherCode = getWeatherCodeFromOpenWeather(data.weather[0].main)
            const todayInfo = {
              condition: conditionText,
              icon: getWeatherIcon(data.weather[0].main),
              weatherCode: weatherCode,
              maxTemp: maxTemp,
              minTemp: minTemp
            }

            setWeather({
              temp: Math.round(data.main.temp),
              maxTemp: maxTemp,
              minTemp: minTemp,
              condition: conditionText,
              icon: getWeatherIcon(data.weather[0].main),
              weatherCode: weatherCode,
              precipitation: precipitation,
              today: todayInfo
            })

            // 警報・注意報も取得
            const warningsData = await fetchWarnings()
            setWarnings(warningsData)

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
          weatherCode: '200',
          precipitation: 30,
        })
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
        setWeather({
          temp: 12,
          condition: '曇り',
          icon: '☁️',
          weatherCode: '200',
          precipitation: 30
        })
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000)

    return () => clearInterval(interval)
  }, [prefecture, city])

  // 週間（10日間）天気を取得
  useEffect(() => {
    const fetchWeeklyWeather = async () => {
      try {
        // JMA の週間天気予報 JSON を直接取得（新潟 150000）
        const response = await fetch('https://www.jma.go.jp/bosai/forecast/data/forecast/150000.json')
        if (!response.ok) {
          console.error('週間天気取得エラー: status=', response.status)
          return
        }
        const data = await response.json()

        // JMA JSON: data[1] が週間予報（7日先まで）
        const weeklyData = data[1]
        if (!weeklyData || !weeklyData.timeSeries || weeklyData.timeSeries.length === 0) {
          console.log('週間天気データが見つかりません。data[0]から取得を試みます。')

          // data[0] の timeSeries[2] に気温データがある場合
          if (data[0] && data[0].timeSeries) {
            const tempSeries = data[0].timeSeries.find((ts: any) =>
              ts.areas && ts.areas[0] && (ts.areas[0].temps || ts.areas[0].tempsMax)
            )
            if (tempSeries && tempSeries.areas && tempSeries.areas[0]) {
              const area = tempSeries.areas[0]
              const temps = area.temps || []
              const timeDefines = tempSeries.timeDefines || []
              const items: WeeklyWeatherItem[] = []

              for (let i = 0; i < timeDefines.length && i < temps.length; i += 2) {
                const date = new Date(timeDefines[Math.floor(i / 2)] || timeDefines[0])
                items.push({
                  date: `${date.getMonth() + 1}/${date.getDate()}`,
                  maxTemp: temps[i] ? parseInt(temps[i]) : undefined,
                  minTemp: temps[i + 1] ? parseInt(temps[i + 1]) : undefined,
                })
              }
              if (items.length > 0) {
                console.log('data[0]から週間天気取得成功:', items.length, '件')
                setWeeklyWeather(items.slice(0, 6))
                return
              }
            }
          }
          setWeeklyWeather([])
          return
        }

        // 週間予報の気温を取得
        const tempSeries = weeklyData.timeSeries.find((ts: any) =>
          ts.areas && ts.areas[0] && (ts.areas[0].tempsMax || ts.areas[0].temps)
        )
        const weatherSeries = weeklyData.timeSeries.find((ts: any) =>
          ts.areas && ts.areas[0] && ts.areas[0].weatherCodes
        )

        if (!tempSeries || !tempSeries.areas || !tempSeries.areas[0]) {
          console.log('週間天気の気温データが見つかりません')
          setWeeklyWeather([])
          return
        }

        const area = tempSeries.areas[0]
        const tempsMax = area.tempsMax || area.tempsMaxUpper || []
        const tempsMin = area.tempsMin || area.tempsMinUpper || []
        const timeDefines = tempSeries.timeDefines || []

        // 天気コードを取得（別のtimeSeriesにある場合）
        let weatherCodes: string[] = []
        if (weatherSeries && weatherSeries.areas && weatherSeries.areas[0]) {
          weatherCodes = weatherSeries.areas[0].weatherCodes || []
        }

        const items: WeeklyWeatherItem[] = []
        for (let i = 0; i < timeDefines.length; i++) {
          const date = new Date(timeDefines[i])
          const maxT = tempsMax[i] ? parseInt(tempsMax[i]) : undefined
          const minT = tempsMin[i] ? parseInt(tempsMin[i]) : undefined
          const code = weatherCodes[i] || ''

          // 天気コードから天気の説明を生成
          let condition = '晴れ'
          if (code.startsWith('3') || code.startsWith('4')) condition = '雨'
          else if (code.startsWith('2')) condition = '曇り'
          else if (code.startsWith('5')) condition = '雪'

          items.push({
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            condition,
            maxTemp: isNaN(maxT as number) ? undefined : maxT,
            minTemp: isNaN(minT as number) ? undefined : minT,
          })
        }

        console.log('週間天気取得成功:', items.length, '件')
        setWeeklyWeather(items.slice(0, 6))
      } catch (err) {
        console.error('週間天気取得エラー:', err)
        setWeeklyWeather([])
      }
    }

    fetchWeeklyWeather()
    const interval = setInterval(fetchWeeklyWeather, 3600000) // 1時間ごとに更新（Vercel無料枠節約）

    return () => clearInterval(interval)
  }, [prefecture, city])


  const mode = renderMode || (showTimeOnly ? 'time' : 'both')

  // Left column: Time, Date & 3-day forecast
  if (mode === 'time') {
    const forecastDays: { date: string; weekday: string; condition: string; maxTemp?: number; minTemp?: number; weatherCode?: string }[] = []

    // Today
    const todayDate = new Date()
    forecastDays.push({
      date: format(todayDate, 'M/d'),
      weekday: 'TODAY',
      condition: weather?.today?.condition ?? weather?.condition ?? '晴れ',
      maxTemp: weather?.temp,
      weatherCode: weather?.today?.weatherCode || '100',
    })

    // Tomorrow & Day after
    if (weeklyWeather.length > 1) {
      for (let i = 1; i < Math.min(3, weeklyWeather.length); i++) {
        const w = weeklyWeather[i]
        const d = new Date()
        d.setDate(d.getDate() + i)
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        forecastDays.push({
          date: w.date || format(d, 'M/d'),
          weekday: dayNames[d.getDay()],
          condition: w.condition || '晴れ',
          maxTemp: w.maxTemp,
          minTemp: w.minTemp,
        })
      }
    } else {
      for (let i = 1; i <= 2; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        forecastDays.push({
          date: format(d, 'M/d'),
          weekday: dayNames[d.getDay()],
          condition: i === 1 ? (weather?.tomorrow?.condition ?? '曇り') : '曇り',
          maxTemp: i === 1 ? weather?.tomorrow?.maxTemp : undefined,
          minTemp: i === 1 ? weather?.tomorrow?.minTemp : undefined,
        })
      }
    }

    // English date: "SUNDAY, FEBRUARY 22, 2026"
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const dayNamesLong = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const dateStr = `${dayNamesLong[time.getDay()]}, ${monthNames[time.getMonth()]} ${time.getDate()}`

    return (
      <div className="clock bento-time">
        <div className="bento-time-content">
          <div className="clock-date-large">
            {dateStr}
          </div>
          <div className="clock-time-row">
            <div className="clock-time-large">
              {format(time, 'HH:mm')}
            </div>
            <div className="clock-time-seconds">
              {format(time, 'ss')}
            </div>
          </div>
        </div>

        {/* 3-day forecast (horizontal) */}
        <div className="bento-forecast-inline">
          {forecastDays.map((day, index) => (
            <div key={`fc-${index}`} className="forecast-inline-item">
              <span className="forecast-inline-day">{day.weekday}</span>
              <WeatherIcon code={day.weatherCode || (day.condition === '晴れ' ? '100' : day.condition?.includes('雨') ? '300' : day.condition?.includes('雪') ? '400' : '200')} size={36} />
              <span className="forecast-inline-temp">{day.maxTemp !== undefined ? `${day.maxTemp}°` : '--'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 中央カラム: 現在の天気のみ（アイコン + 気温 + 天候）
  if (mode === 'weather') {
    return (
      <div className="clock bento-weather">
        {weather && weather.today ? (
          <div className="bento-weather-current">
            <WeatherIcon code={weather.today.weatherCode || '100'} size={120} className="bento-weather-hero-icon" />
            <div className="bento-weather-hero-info">
              <div className="bento-weather-hero-temp">{weather.temp !== undefined ? `${weather.temp}°C` : '--'}</div>
              <div className="bento-weather-hero-condition">{weather.condition}</div>
            </div>
          </div>
        ) : (
          <div className="bento-weather-current-loading">気象情報を取得中...</div>
        )}
      </div>
    )
  }

  // フォールバック
  return null
}

export default Clock

