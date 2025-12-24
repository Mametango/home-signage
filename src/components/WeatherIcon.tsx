import './WeatherIcon.css'

interface WeatherIconProps {
  code: string
  size?: number
  className?: string
}

const WeatherIcon = ({ code, size = 64, className = '' }: WeatherIconProps) => {
  const iconSize = size
  const codeNum = parseInt(code)

  // 天気コードに基づいてアイコンを決定
  const getIconType = () => {
    if (codeNum >= 100 && codeNum < 200) {
      // 晴れ系
      if (codeNum === 100) return 'sunny'
      if (codeNum === 101 || codeNum === 201) return 'partly-cloudy'
      if (codeNum === 102 || codeNum === 103) return 'sunny-cloudy'
      if (codeNum === 104 || codeNum === 105) return 'sunny-rain'
      if (codeNum === 106 || codeNum === 107) return 'sunny-snow'
      return 'sunny'
    }
    if (codeNum >= 200 && codeNum < 300) {
      // 曇り系
      if (codeNum === 200) return 'cloudy'
      if (codeNum === 202 || codeNum === 203) return 'cloudy-rain'
      if (codeNum === 204 || codeNum === 205) return 'cloudy-snow'
      return 'cloudy'
    }
    if (codeNum >= 300 && codeNum < 400) {
      // 雨系
      return 'rainy'
    }
    if (codeNum >= 400 && codeNum < 500) {
      // 雪系
      return 'snowy'
    }
    return 'sunny' // デフォルト
  }

  const iconType = getIconType()

  const renderIcon = () => {
    switch (iconType) {
      case 'sunny':
        // 太陽
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            <circle cx="50" cy="50" r="28" fill="url(#sunGradient)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * Math.PI / 180
              const x1 = 50 + Math.cos(angle) * 30
              const y1 = 50 + Math.sin(angle) * 30
              const x2 = 50 + Math.cos(angle) * 42
              const y2 = 50 + Math.sin(angle) * 42
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'cloudy':
        // 雲
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#9E9E9E" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#90A4AE" />
            <ellipse cx="50" cy="50" rx="38" ry="26" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="38" cy="44" rx="30" ry="22" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="62" cy="44" rx="30" ry="22" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="50" cy="40" rx="24" ry="18" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
          </svg>
        )

      case 'rainy':
        // 傘
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="umbrellaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1976D2" stopOpacity="1" />
                <stop offset="100%" stopColor="#0D47A1" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#78909C" />
            {/* 傘の本体 */}
            <path d="M 50 25 Q 30 25 30 45 L 50 60 L 70 45 Q 70 25 50 25 Z" fill="url(#umbrellaGradient)" stroke="#0D47A1" strokeWidth="2" />
            {/* 傘の骨 */}
            <line x1="50" y1="25" x2="50" y2="60" stroke="#0D47A1" strokeWidth="3" />
            <line x1="30" y1="45" x2="50" y2="60" stroke="#0D47A1" strokeWidth="2" />
            <line x1="70" y1="45" x2="50" y2="60" stroke="#0D47A1" strokeWidth="2" />
            {/* 傘の柄 */}
            <line x1="50" y1="60" x2="50" y2="85" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
            {/* 雨 */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 20 + (i * 12)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="70"
                  x2={x}
                  y2="90"
                  stroke="#1976D2"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'snowy':
        // 雪だるま
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="snowmanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#E0E0E0" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#90A4AE" />
            {/* 雪だるまの頭 */}
            <circle cx="50" cy="35" r="12" fill="url(#snowmanGradient)" stroke="#BDBDBD" strokeWidth="2" />
            {/* 雪だるまの体 */}
            <circle cx="50" cy="60" r="18" fill="url(#snowmanGradient)" stroke="#BDBDBD" strokeWidth="2" />
            {/* 目 */}
            <circle cx="46" cy="32" r="2" fill="#212121" />
            <circle cx="54" cy="32" r="2" fill="#212121" />
            {/* 鼻（にんじん） */}
            <polygon points="50,35 50,40 45,37.5" fill="#FF8C00" />
            {/* ボタン */}
            <circle cx="50" cy="55" r="1.5" fill="#212121" />
            <circle cx="50" cy="60" r="1.5" fill="#212121" />
            {/* 雪 */}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = 15 + (i * 17)
              const y = 75 + (i % 2) * 8
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                </g>
              )
            })}
          </svg>
        )

      case 'partly-cloudy':
        // 太陽と雲
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="partlySunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="partlyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#9E9E9E" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽（左側） */}
            <circle cx="30" cy="30" r="20" fill="url(#partlySunGradient)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 23
              const y1 = 30 + Math.sin(angle) * 23
              const x2 = 30 + Math.cos(angle) * 33
              const y2 = 30 + Math.sin(angle) * 33
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雲（右側） */}
            <ellipse cx="70" cy="50" rx="32" ry="22" fill="url(#partlyCloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="60" cy="45" rx="26" ry="18" fill="url(#partlyCloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="80" cy="45" rx="26" ry="18" fill="url(#partlyCloudGradient)" stroke="#616161" strokeWidth="3" />
          </svg>
        )

      case 'sunny-cloudy':
        // 太陽と雲
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyCloudySun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnyCloudyCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#9E9E9E" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽 */}
            <circle cx="35" cy="35" r="26" fill="url(#sunnyCloudySun)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 35 + Math.cos(angle) * 29
              const y1 = 35 + Math.sin(angle) * 29
              const x2 = 35 + Math.cos(angle) * 39
              const y2 = 35 + Math.sin(angle) * 39
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="36" ry="24" fill="url(#sunnyCloudyCloud)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="60" cy="45" rx="28" ry="20" fill="url(#sunnyCloudyCloud)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="80" cy="45" rx="28" ry="20" fill="url(#sunnyCloudyCloud)" stroke="#616161" strokeWidth="3" />
          </svg>
        )

      case 'cloudy-rain':
        // 雲と傘
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#BDBDBD" stopOpacity="1" />
                <stop offset="100%" stopColor="#424242" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="cloudyRainUmbrella" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1976D2" stopOpacity="1" />
                <stop offset="100%" stopColor="#0D47A1" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#78909C" />
            {/* 雲 */}
            <ellipse cx="50" cy="35" rx="38" ry="26" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="38" cy="30" rx="30" ry="22" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="62" cy="30" rx="30" ry="22" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            {/* 傘 */}
            <path d="M 50 50 Q 35 50 35 65 L 50 75 L 65 65 Q 65 50 50 50 Z" fill="url(#cloudyRainUmbrella)" stroke="#0D47A1" strokeWidth="2" />
            <line x1="50" y1="50" x2="50" y2="75" stroke="#0D47A1" strokeWidth="2" />
            <line x1="35" y1="65" x2="50" y2="75" stroke="#0D47A1" strokeWidth="2" />
            <line x1="65" y1="65" x2="50" y2="75" stroke="#0D47A1" strokeWidth="2" />
            <line x1="50" y1="75" x2="50" y2="90" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )

      case 'sunny-rain':
        // 太陽と傘
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyRainSun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnyRainUmbrella" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1976D2" stopOpacity="1" />
                <stop offset="100%" stopColor="#0D47A1" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽（左上） */}
            <circle cx="30" cy="30" r="22" fill="url(#sunnyRainSun)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 25
              const y1 = 30 + Math.sin(angle) * 25
              const x2 = 30 + Math.cos(angle) * 35
              const y2 = 30 + Math.sin(angle) * 35
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 傘（右下） */}
            <path d="M 70 55 Q 58 55 58 68 L 70 76 L 82 68 Q 82 55 70 55 Z" fill="url(#sunnyRainUmbrella)" stroke="#0D47A1" strokeWidth="2" />
            <line x1="70" y1="55" x2="70" y2="76" stroke="#0D47A1" strokeWidth="2" />
            <line x1="58" y1="68" x2="70" y2="76" stroke="#0D47A1" strokeWidth="2" />
            <line x1="82" y1="68" x2="70" y2="76" stroke="#0D47A1" strokeWidth="2" />
            <line x1="70" y1="76" x2="70" y2="88" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )

      case 'cloudy-snow':
        // 雲と雪だるま
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FAFAFA" stopOpacity="1" />
                <stop offset="100%" stopColor="#BDBDBD" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="cloudySnowmanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#E0E0E0" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#90A4AE" />
            {/* 雲 */}
            <ellipse cx="50" cy="30" rx="38" ry="26" fill="url(#cloudySnowCloud)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="38" cy="25" rx="30" ry="22" fill="url(#cloudySnowCloud)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="62" cy="25" rx="30" ry="22" fill="url(#cloudySnowCloud)" stroke="#616161" strokeWidth="3" />
            {/* 雪だるま */}
            <circle cx="50" cy="60" r="10" fill="url(#cloudySnowmanGradient)" stroke="#BDBDBD" strokeWidth="2" />
            <circle cx="50" cy="80" r="15" fill="url(#cloudySnowmanGradient)" stroke="#BDBDBD" strokeWidth="2" />
            <circle cx="48" cy="57" r="1.5" fill="#212121" />
            <circle cx="52" cy="57" r="1.5" fill="#212121" />
            <polygon points="50,60 50,64 47,62" fill="#FF8C00" />
            <circle cx="50" cy="75" r="1" fill="#212121" />
            <circle cx="50" cy="80" r="1" fill="#212121" />
          </svg>
        )

      case 'sunny-snow':
        // 太陽と雪だるま
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnySnowSun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnySnowmanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#E0E0E0" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽（左上） */}
            <circle cx="30" cy="30" r="22" fill="url(#sunnySnowSun)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 25
              const y1 = 30 + Math.sin(angle) * 25
              const x2 = 30 + Math.cos(angle) * 35
              const y2 = 30 + Math.sin(angle) * 35
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雪だるま（右下） */}
            <circle cx="70" cy="60" r="10" fill="url(#sunnySnowmanGradient)" stroke="#BDBDBD" strokeWidth="2" />
            <circle cx="70" cy="80" r="15" fill="url(#sunnySnowmanGradient)" stroke="#BDBDBD" strokeWidth="2" />
            <circle cx="68" cy="57" r="1.5" fill="#212121" />
            <circle cx="72" cy="57" r="1.5" fill="#212121" />
            <polygon points="70,60 70,64 67,62" fill="#FF8C00" />
            <circle cx="70" cy="75" r="1" fill="#212121" />
            <circle cx="70" cy="80" r="1" fill="#212121" />
          </svg>
        )

      default:
        // デフォルトは太陽
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="defaultGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            <circle cx="50" cy="50" r="28" fill="url(#defaultGradient)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * Math.PI / 180
              const x1 = 50 + Math.cos(angle) * 30
              const y1 = 50 + Math.sin(angle) * 30
              const x2 = 50 + Math.cos(angle) * 42
              const y2 = 50 + Math.sin(angle) * 42
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )
    }
  }

  return <div className="weather-icon-container">{renderIcon()}</div>
}

export default WeatherIcon
