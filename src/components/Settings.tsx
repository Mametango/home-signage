import { useState, useEffect } from 'react'
import { CITIES_BY_PREFECTURE } from '../utils/cities'
import './Settings.css'

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

const STORAGE_KEY = 'home-signage-settings'

interface SettingsData {
  prefecture: string
  city: string
  useCurrentLocation: boolean
}

// 逆ジオコーディングで市町村名を取得
const reverseGeocode = async (lat: number, lon: number): Promise<{ prefecture: string; city: string } | null> => {
  try {
    // OpenStreetMap Nominatim APIを使用（無料）
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=ja`,
      {
        headers: {
          'User-Agent': 'HomeSignage/1.0'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('逆ジオコーディングに失敗しました')
    }
    
    const data = await response.json()
    const address = data.address
    
    if (!address) {
      return null
    }
    
    // 日本の住所構造から都道府県と市町村を取得
    const prefecture = address.state || address.prefecture || ''
    const city = address.city || address.town || address.village || address.municipality || ''
    
    return { prefecture, city }
  } catch (error) {
    console.error('逆ジオコーディングエラー:', error)
    return null
  }
}

const Settings = () => {
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false)
  const [saved, setSaved] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // 都道府県に応じて市町村リストを更新
  useEffect(() => {
    const cities = CITIES_BY_PREFECTURE[prefecture] || []
    setAvailableCities(cities)
    // 現在の市町村が選択された都道府県にない場合はリセット
    if (city && !cities.includes(city)) {
      setCity('')
    }
  }, [prefecture, city])

  // 設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY)
    if (savedSettings) {
      try {
        const settings: SettingsData = JSON.parse(savedSettings)
        if (settings.prefecture) {
          setPrefecture(settings.prefecture)
        }
        if (settings.city) {
          setCity(settings.city)
        }
        if (settings.useCurrentLocation !== undefined) {
          setUseCurrentLocation(settings.useCurrentLocation)
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error)
      }
    }
  }, [])

  // 現在地を取得
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('位置情報サービスが利用できません')
      return
    }

    setGettingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const location = await reverseGeocode(latitude, longitude)
          
          if (location) {
            setPrefecture(location.prefecture)
            setCity(location.city)
            setUseCurrentLocation(true)
            setLocationError('')
          } else {
            setLocationError('位置情報の取得に失敗しました')
          }
        } catch (error) {
          console.error('位置情報の処理に失敗しました:', error)
          setLocationError('位置情報の処理に失敗しました')
        } finally {
          setGettingLocation(false)
        }
      },
      (error) => {
        console.error('位置情報の取得に失敗しました:', error)
        setLocationError('位置情報の取得に失敗しました。位置情報の許可を確認してください。')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // 設定を保存
  const saveSettings = () => {
    const settings: SettingsData = {
      prefecture,
      city,
      useCurrentLocation
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      
      // 設定変更を通知（カスタムイベント）
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }))
    } catch (error) {
      console.error('設定の保存に失敗しました:', error)
    }
  }

  return (
    <div className="settings">
      <h2 className="settings-title">設定</h2>
      
      <div className="settings-section">
        <button
          className="settings-location-button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
        >
          {gettingLocation ? '位置情報を取得中...' : '📍 現在地を取得'}
        </button>
        {locationError && (
          <p className="settings-error">{locationError}</p>
        )}
        {useCurrentLocation && city && (
          <p className="settings-success">
            ✓ 現在地: {prefecture} {city}
          </p>
        )}
      </div>

      <div className="settings-section">
        <label className="settings-label">
          <span className="settings-label-text">都道府県</span>
          <select
            className="settings-select"
            value={prefecture}
            onChange={(e) => {
              setPrefecture(e.target.value)
              setUseCurrentLocation(false)
            }}
          >
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-section">
        <label className="settings-label">
          <span className="settings-label-text">市町村（任意）</span>
          {availableCities.length > 0 ? (
            <select
              className="settings-select"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setUseCurrentLocation(false)
              }}
            >
              <option value="">選択しない</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="settings-input"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setUseCurrentLocation(false)
              }}
              placeholder="例: 千代田区、横浜市"
            />
          )}
        </label>
        <p className="settings-description">
          市町村を選択すると、より詳細な天気情報が表示されます
        </p>
      </div>

      <div className="settings-actions">
        <button
          className="settings-save-button"
          onClick={saveSettings}
        >
          {saved ? '✓ 保存しました' : '設定を保存'}
        </button>
      </div>
    </div>
  )
}

// 設定を取得する関数（他のコンポーネントから使用）
export const getSettings = (): SettingsData => {
  const savedSettings = localStorage.getItem(STORAGE_KEY)
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings)
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
    }
  }
  return { prefecture: '新潟県', city: '新発田市', useCurrentLocation: false }
}

export default Settings
