import { useEffect, useState, useCallback } from 'react'
import './App.css'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  rainChance: number
  condition: string
  icon: string
  location: string
  description: string
}

interface ForecastDay {
  label: string
  icon: string
  condition: string
  hi: number
  lo: number
}

interface NewsItem {
  source: string
  title: string
  ago: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const DAYS_JP   = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

// 初期表示用フォールバック（読み込み中にならないよう即表示）
const FALLBACK_WEATHER: WeatherData = {
  temp: 14, feelsLike: 11, humidity: 62,
  windSpeed: 8, rainChance: 20,
  condition: '晴れ時々曇り', icon: '🌤',
  location: '新潟市',
  description: '今日は晴れ時々曇りの予報です。良い一日をお過ごしください。',
}

const FALLBACK_FORECAST: ForecastDay[] = [
  { label: '今日', icon: '🌤', condition: '晴れ時々曇り', hi: 14, lo: 7 },
  { label: '明日', icon: '🌧', condition: '雨',           hi: 11, lo: 5 },
  { label: '土',   icon: '⛅', condition: '曇り時々晴れ', hi: 13, lo: 6 },
  { label: '日',   icon: '☀️', condition: '晴れ',         hi: 17, lo: 8 },
  { label: '月',   icon: '🌤', condition: '晴れ時々曇り', hi: 15, lo: 7 },
]

const FALLBACK_NEWS: NewsItem[] = [
  { source: 'NHK',        title: '日銀、追加利上げを検討　政策決定会合を来週に控え市場が注目', ago: '3分前' },
  { source: 'REUTERS',    title: '米国株式市場、AIセクター主導で続伸　ナスダック最高値更新', ago: '21分前' },
  { source: '朝日新聞',   title: '春一番が全国各地で観測　気象庁が発表、今年最も早い記録に並ぶ', ago: '45分前' },
  { source: 'TechCrunch', title: 'OpenAI、新モデルを発表へ　動画生成分野での競争が激化', ago: '1時間前' },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function weatherCodeToInfo(code: number): { icon: string; condition: string } {
  if (code === 800)               return { icon: '☀️', condition: '晴れ' }
  if (code === 801)               return { icon: '🌤', condition: '晴れ時々曇り' }
  if (code >= 802 && code <= 804) return { icon: '⛅', condition: '曇り' }
  if (code >= 500 && code < 600)  return { icon: '🌧', condition: '雨' }
  if (code >= 600 && code < 700)  return { icon: '❄️', condition: '雪' }
  if (code >= 200 && code < 300)  return { icon: '⛈', condition: '雷雨' }
  if (code >= 300 && code < 400)  return { icon: '🌦', condition: '霧雨' }
  if (code >= 700 && code < 800)  return { icon: '🌫', condition: '霧' }
  return { icon: '🌡', condition: '---' }
}

function ruleBasedDescription(w: WeatherData): string {
  if (w.rainChance >= 60) return `本日は${w.condition}の予報です。傘をお持ちください。`
  if (w.temp >= 28)       return `気温が高めです。こまめな水分補給をお忘れなく。`
  if (w.temp <= 5)        return `寒い一日です。暖かい服装でお出かけください。`
  return `本日は${w.condition}の予報です。良い一日をお過ごしください。`
}

function parseAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function useWeather() {
  const [weather,  setWeather]  = useState<WeatherData>(FALLBACK_WEATHER)
  const [forecast, setForecast] = useState<ForecastDay[]>(FALLBACK_FORECAST)

  const fetchWeather = useCallback(async () => {
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
    const LAT  = import.meta.env.VITE_WEATHER_LAT  || '37.9026'
    const LON  = import.meta.env.VITE_WEATHER_LON  || '139.0232'
    const CITY = import.meta.env.VITE_WEATHER_CITY || '新潟市'
    if (!API_KEY) return

    try {
      const [curRes, fcRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=ja`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=ja&cnt=40`),
      ])
      if (!curRes.ok || !fcRes.ok) return
      const cur = await curRes.json()
      const fc  = await fcRes.json()

      const { icon, condition } = weatherCodeToInfo(cur.weather[0].id)
      const w: WeatherData = {
        temp:       Math.round(cur.main.temp),
        feelsLike:  Math.round(cur.main.feels_like),
        humidity:   cur.main.humidity,
        windSpeed:  Math.round(cur.wind.speed),
        rainChance: 0,
        condition, icon, location: CITY, description: '',
      }
      w.description = ruleBasedDescription(w)
      setWeather(w)

      const days: ForecastDay[] = []
      const seen = new Set<string>()
      for (const item of fc.list) {
        const date = new Date(item.dt * 1000)
        const key  = `${date.getMonth()}-${date.getDate()}`
        const hour = date.getHours()
        if (!seen.has(key) && hour >= 11 && hour <= 14) {
          seen.add(key)
          const { icon: fi, condition: fc_ } = weatherCodeToInfo(item.weather[0].id)
          days.push({
            label: days.length === 0 ? '今日' : DAYS_JP[date.getDay()],
            icon: fi, condition: fc_,
            hi: Math.round(item.main.temp_max),
            lo: Math.round(item.main.temp_min),
          })
          if (days.length >= 5) break
        }
      }
      if (days.length > 0) setForecast(days)
    } catch { /* フォールバックのまま */ }
  }, [])

  useEffect(() => {
    fetchWeather()
    const id = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchWeather])

  return { weather, forecast }
}

function useNews() {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS)

  const fetchNews = useCallback(async () => {
    // rss2json.com: 無料・CORS対応のRSSプロキシ
    const feeds = [
      { url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',         source: 'NHK' },
      { url: 'https://jp.reuters.com/rss/topNews',                source: 'REUTERS' },
      { url: 'https://feed.japan.cnet.com/rss/all',               source: 'CNET Japan' },
      { url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', source: 'ITmedia' },
    ]
    const API = 'https://api.rss2json.com/v1/api.json?rss_url='
    const results: NewsItem[] = []

    await Promise.allSettled(
      feeds.map(async ({ url, source }) => {
        try {
          const res  = await fetch(`${API}${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) })
          const data = await res.json()
          if (data.status === 'ok' && data.items?.length > 0) {
            results.push({
              source,
              title: data.items[0].title?.replace(/<[^>]+>/g, '').trim() || '',
              ago:   parseAgo(data.items[0].pubDate),
            })
          }
        } catch { /* スキップ */ }
      })
    )
    if (results.length > 0) setNews(results)
  }, [])

  useEffect(() => {
    fetchNews()
    const id = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchNews])

  return news
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────
function ClockCol() {
  const now = useClock()
  const h   = now.getHours()
  const [top, bot] =
    h >= 5  && h < 12 ? ['GOOD', 'MORNING']   :
    h >= 12 && h < 18 ? ['GOOD', 'AFTERNOON'] :
    h >= 18 && h < 22 ? ['GOOD', 'EVENING']   : ['GOOD', 'NIGHT']

  return (
    <div className="col col--clock">
      <div className="sec-label">時刻</div>
      <div className="clock-time">
        <span>{pad(h)}</span>
        <span className="clock-colon">:</span>
        <span>{pad(now.getMinutes())}</span>
      </div>
      <div className="clock-sub">
        <span className="clock-sec">{pad(now.getSeconds())} <em>SEC</em></span>
        <span className="clock-ampm">{h < 12 ? 'AM' : 'PM'}</span>
      </div>
      <div className="clock-meta">
        <div className="clock-dayname">{DAYS_JP[now.getDay()]}曜日</div>
        <div className="clock-date">{now.getFullYear()} / {MONTHS_JP[now.getMonth()]} / {pad(now.getDate())}</div>
      </div>
      <div className="greeting">
        <span className="greeting-accent">{top}</span><br />{bot}
      </div>
    </div>
  )
}

function WeatherCol({ weather }: { weather: WeatherData }) {
  return (
    <div className="col col--weather">
      <div className="sec-label">天気</div>
      <div className="weather-hero">
        <div className="weather-emoji">{weather.icon}</div>
        <div>
          <div className="weather-temp">{weather.temp}<sup>°C</sup></div>
          <div className="weather-cond">{weather.condition}</div>
          <div className="weather-loc">📍 {weather.location}</div>
        </div>
      </div>
      <div className="stat-grid">
        <StatCell label="体感"   value={weather.feelsLike}  unit="°C" />
        <StatCell label="湿度"   value={weather.humidity}   unit="%" />
        <StatCell label="風速"   value={weather.windSpeed}  unit="m/s" />
        <StatCell label="降水率" value={weather.rainChance} unit="%" />
      </div>
    </div>
  )
}

function StatCell({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="stat-cell">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}<span className="stat-unit">{unit}</span></div>
    </div>
  )
}

function NewsCol({ news }: { news: NewsItem[] }) {
  return (
    <div className="col col--news">
      <div className="sec-label">ニュース</div>
      <div className="news-list">
        {news.slice(0, 4).map((item, i) => (
          <div className={`news-item${i === 0 ? ' news-item--first' : ''}`} key={i}>
            <span className="news-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="news-body">
              <div className="news-source">{item.source}</div>
              <div className="news-title">{item.title}</div>
              {item.ago && <div className="news-ago">{item.ago}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ForecastCol({ forecast }: { forecast: ForecastDay[] }) {
  return (
    <div className="col col--forecast">
      <div className="sec-label">5日間予報</div>
      <div className="fc-list">
        {forecast.map((day, i) => (
          <div className={`fc-row${i === 0 ? ' fc-row--today' : ''}`} key={i}>
            <span className="fc-day">{day.label}</span>
            <span className="fc-icon">{day.icon}</span>
            <span className="fc-cond">{day.condition}</span>
            <span className="fc-temps"><b>{day.hi}°</b><small>{day.lo}°</small></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusCol({ weather }: { weather: WeatherData }) {
  const now     = useClock()
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  return (
    <div className="col col--status">
      <div className="sec-label">ステータス</div>
      <div className="weather-desc">{weather.description}</div>
      <div className="status-table">
        <div className="status-row">
          <span className="status-key">接続</span>
          <span className="status-val status-val--ok">ONLINE</span>
        </div>
        <div className="status-row">
          <span className="status-key">最終更新</span>
          <span className="status-val">{timeStr}</span>
        </div>
      </div>
      <div className="progress-stack">
        <ProgressBar label="降水確率" display={`${weather.rainChance}%`} pct={weather.rainChance} color={weather.rainChance >= 60 ? 'blue' : 'accent'} />
        <ProgressBar label="湿度"     display={`${weather.humidity}%`}   pct={weather.humidity}   color="green" />
      </div>
    </div>
  )
}

function ProgressBar({ label, display, pct, color }: {
  label: string; display: string; pct: number; color: 'accent' | 'green' | 'blue'
}) {
  return (
    <div className="progress">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <strong className="progress-display">{display}</strong>
      </div>
      <div className="progress-track">
        <div className={`progress-fill progress-fill--${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function BottomBar() {
  const now = useClock()
  const t   = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  return (
    <div className="bottom-bar">
      <div className="bottom-left">
        <span className="b-dot b-dot--green" />
        <span className="b-item">ネットワーク正常</span>
        <span className="b-dot b-dot--blue" />
        <span className="b-item">天気API 接続中</span>
        <span className="b-dot b-dot--amber" />
        <span className="b-item">最終更新 <em>{t}</em></span>
      </div>
      <div className="brand">HOME <span>SIGNAGE</span></div>
      <div className="bottom-right">
        <span className="b-item">LG LD290EJS-FPN1</span>
        <span className="b-item">1920 × 540 · 32:9 · 60Hz</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────
export default function App() {
  const { weather, forecast } = useWeather()
  const news = useNews()
  return (
    <div className="signage-root">
      <div className="layout">
        <ClockCol />
        <div className="vdivider" />
        <WeatherCol weather={weather} />
        <div className="vdivider" />
        <NewsCol news={news} />
        <div className="vdivider" />
        <ForecastCol forecast={forecast} />
        <div className="vdivider" />
        <StatusCol weather={weather} />
        <BottomBar />
      </div>
    </div>
  )
}
