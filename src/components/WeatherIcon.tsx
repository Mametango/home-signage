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
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽 */}
            <circle cx="50" cy="50" r="28" fill="url(#sunGradient)" stroke="#FF6F00" strokeWidth="3" />
            {/* 太陽の光線（12本） */}
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
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#9E9E9E" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#90A4AE" />
            {/* 雲（大きく、はっきりと） */}
            <ellipse cx="50" cy="50" rx="38" ry="26" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="38" cy="44" rx="30" ry="22" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="62" cy="44" rx="30" ry="22" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="50" cy="40" rx="24" ry="18" fill="url(#cloudGradient)" stroke="#616161" strokeWidth="3" />
          </svg>
        )

      case 'partly-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="partlySunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="partlyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#757575" stopOpacity="1" />
              </linearGradient>
              <filter id="partlySunGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="partlyCloudShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            {/* 太陽（左側） */}
            <circle cx="30" cy="30" r="19" fill="url(#partlySunGradient)" stroke="#E65100" strokeWidth="4" filter="url(#partlySunGlow)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 22
              const y1 = 30 + Math.sin(angle) * 22
              const x2 = 30 + Math.cos(angle) * 32
              const y2 = 30 + Math.sin(angle) * 32
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFEB3B"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  filter="url(#partlySunGlow)"
                />
              )
            })}
            {/* 雲（右側） */}
            <ellipse cx="70" cy="50" rx="29" ry="19" fill="url(#partlyCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#partlyCloudShadow)" />
            <ellipse cx="60" cy="45" rx="22" ry="16" fill="url(#partlyCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#partlyCloudShadow)" />
            <ellipse cx="80" cy="45" rx="22" ry="16" fill="url(#partlyCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#partlyCloudShadow)" />
          </svg>
        )

      case 'sunny-cloudy':
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
            {/* 青空背景 */}
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

      case 'rainy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#BDBDBD" stopOpacity="1" />
                <stop offset="100%" stopColor="#424242" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#78909C" />
            {/* 雲（大きく、はっきりと） */}
            <ellipse cx="50" cy="42" rx="38" ry="26" fill="url(#rainCloudGradient)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="38" cy="37" rx="30" ry="22" fill="url(#rainCloudGradient)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="62" cy="37" rx="30" ry="22" fill="url(#rainCloudGradient)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="50" cy="33" rx="24" ry="18" fill="url(#rainCloudGradient)" stroke="#212121" strokeWidth="3" />
            {/* 雨（太く、はっきりと） */}
            {Array.from({ length: 9 }).map((_, i) => {
              const x = 28 + (i * 5.5)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="55"
                  x2={x}
                  y2="95"
                  stroke="#1976D2"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'cloudy-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9E9E9E" stopOpacity="1" />
                <stop offset="100%" stopColor="#424242" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#546E7A" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="34" ry="22" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="40" cy="40" rx="26" ry="18" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="60" cy="40" rx="26" ry="18" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            {/* 雨 */}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = 32 + (i * 6)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="58"
                  x2={x}
                  y2="92"
                  stroke="#0D47A1"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'sunny-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyRainSun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#BDBDBD" stopOpacity="1" />
                <stop offset="100%" stopColor="#424242" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽 */}
            <circle cx="30" cy="30" r="24" fill="url(#sunnyRainSun)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 27
              const y1 = 30 + Math.sin(angle) * 27
              const x2 = 30 + Math.cos(angle) * 37
              const y2 = 30 + Math.sin(angle) * 37
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
            <ellipse cx="70" cy="50" rx="36" ry="24" fill="url(#sunnyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="60" cy="45" rx="28" ry="20" fill="url(#sunnyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="80" cy="45" rx="28" ry="20" fill="url(#sunnyRainCloud)" stroke="#212121" strokeWidth="3" />
            {/* 雨（太く、はっきりと） */}
            {Array.from({ length: 8 }).map((_, i) => {
              const x = 52 + (i * 5)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="59"
                  x2={x}
                  y2="95"
                  stroke="#1976D2"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'snowy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="snowCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FAFAFA" stopOpacity="1" />
                <stop offset="100%" stopColor="#BDBDBD" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#90A4AE" />
            {/* 雲（大きく、はっきりと） */}
            <ellipse cx="50" cy="42" rx="38" ry="26" fill="url(#snowCloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="38" cy="37" rx="30" ry="22" fill="url(#snowCloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="62" cy="37" rx="30" ry="22" fill="url(#snowCloudGradient)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="50" cy="33" rx="24" ry="18" fill="url(#snowCloudGradient)" stroke="#616161" strokeWidth="3" />
            {/* 雪の結晶（大きく、はっきりと） */}
            {Array.from({ length: 8 }).map((_, i) => {
              const x = 20 + (i * 7.5)
              const y = 58 + (i % 2) * 18
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-9" x2="0" y2="9" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <line x1="-9" y1="0" x2="9" y2="0" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <line x1="-6.5" y1="-6.5" x2="6.5" y2="6.5" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <line x1="-6.5" y1="6.5" x2="6.5" y2="-6.5" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                </g>
              )
            })}
          </svg>
        )

      case 'cloudy-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#BDBDBD" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#607D8B" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="34" ry="22" fill="url(#cloudySnowCloud)" stroke="#424242" strokeWidth="3" />
            <ellipse cx="40" cy="40" rx="26" ry="18" fill="url(#cloudySnowCloud)" stroke="#424242" strokeWidth="3" />
            <ellipse cx="60" cy="40" rx="26" ry="18" fill="url(#cloudySnowCloud)" stroke="#424242" strokeWidth="3" />
            {/* 雪の結晶 */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 25 + (i * 9)
              const y = 63 + (i % 2) * 14
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-7" x2="0" y2="7" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="-7" y1="0" x2="7" y2="0" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="-5" y1="-5" x2="5" y2="5" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="-5" y1="5" x2="5" y2="-5" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              )
            })}
          </svg>
        )

      case 'sunny-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnySnowSun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FAFAFA" stopOpacity="1" />
                <stop offset="100%" stopColor="#BDBDBD" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#4FC3F7" />
            {/* 太陽 */}
            <circle cx="30" cy="30" r="24" fill="url(#sunnySnowSun)" stroke="#FF6F00" strokeWidth="3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 27
              const y1 = 30 + Math.sin(angle) * 27
              const x2 = 30 + Math.cos(angle) * 37
              const y2 = 30 + Math.sin(angle) * 37
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
            <ellipse cx="70" cy="50" rx="36" ry="24" fill="url(#sunnySnowCloud)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="60" cy="45" rx="28" ry="20" fill="url(#sunnySnowCloud)" stroke="#616161" strokeWidth="3" />
            <ellipse cx="80" cy="45" rx="28" ry="20" fill="url(#sunnySnowCloud)" stroke="#616161" strokeWidth="3" />
            {/* 雪の結晶（大きく、はっきりと） */}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = 52 + (i * 5)
              const y = 62 + (i % 2) * 16
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-9" x2="0" y2="9" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <line x1="-9" y1="0" x2="9" y2="0" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <line x1="-6.5" y1="-6.5" x2="6.5" y2="6.5" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <line x1="-6.5" y1="6.5" x2="6.5" y2="-6.5" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                </g>
              )
            })}
          </svg>
        )

      default:
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
