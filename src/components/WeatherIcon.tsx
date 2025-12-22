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
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
              </radialGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#87CEEB" />
            {/* 太陽 */}
            <circle cx="50" cy="50" r="20" fill="url(#sunGradient)" />
            {/* 太陽の光線 */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 50 + Math.cos(angle) * 25
              const y1 = 50 + Math.sin(angle) * 25
              const x2 = 50 + Math.cos(angle) * 32
              const y2 = 50 + Math.sin(angle) * 32
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="2"
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
                <stop offset="100%" stopColor="#B0B0B0" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#D3D3D3" />
            {/* 雲 */}
            <ellipse cx="50" cy="50" rx="30" ry="18" fill="url(#cloudGradient)" />
            <ellipse cx="40" cy="45" rx="22" ry="14" fill="url(#cloudGradient)" />
            <ellipse cx="60" cy="45" rx="22" ry="14" fill="url(#cloudGradient)" />
          </svg>
        )

      case 'partly-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="partlySunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
              </radialGradient>
              <linearGradient id="partlyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#B0B0B0" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#87CEEB" />
            {/* 太陽（左側） */}
            <circle cx="30" cy="30" r="15" fill="url(#partlySunGradient)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 18
              const y1 = 30 + Math.sin(angle) * 18
              const x2 = 30 + Math.cos(angle) * 23
              const y2 = 30 + Math.sin(angle) * 23
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雲（右側） */}
            <ellipse cx="70" cy="50" rx="25" ry="15" fill="url(#partlyCloudGradient)" />
            <ellipse cx="60" cy="45" rx="18" ry="12" fill="url(#partlyCloudGradient)" />
            <ellipse cx="80" cy="45" rx="18" ry="12" fill="url(#partlyCloudGradient)" />
          </svg>
        )

      case 'sunny-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyCloudySun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
              </radialGradient>
              <linearGradient id="sunnyCloudyCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#B0B0B0" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#87CEEB" />
            {/* 太陽 */}
            <circle cx="35" cy="35" r="18" fill="url(#sunnyCloudySun)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 35 + Math.cos(angle) * 21
              const y1 = 35 + Math.sin(angle) * 21
              const x2 = 35 + Math.cos(angle) * 26
              const y2 = 35 + Math.sin(angle) * 26
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="28" ry="16" fill="url(#sunnyCloudyCloud)" />
            <ellipse cx="60" cy="45" rx="20" ry="13" fill="url(#sunnyCloudyCloud)" />
            <ellipse cx="80" cy="45" rx="20" ry="13" fill="url(#sunnyCloudyCloud)" />
          </svg>
        )

      case 'rainy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#808080" stopOpacity="1" />
                <stop offset="100%" stopColor="#606060" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#A0A0A0" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="30" ry="18" fill="url(#rainCloudGradient)" />
            <ellipse cx="40" cy="40" rx="22" ry="14" fill="url(#rainCloudGradient)" />
            <ellipse cx="60" cy="40" rx="22" ry="14" fill="url(#rainCloudGradient)" />
            {/* 雨 */}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = 40 + (i * 5)
              const delay = (i * 0.1) % 1
              return (
                <line
                  key={i}
                  x1={x}
                  y1="65"
                  x2={x}
                  y2="85"
                  stroke="#4A90E2"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <animate attributeName="y1" values="65;75;65" dur="0.8s" repeatCount="indefinite" begin={`${delay}s`} />
                  <animate attributeName="y2" values="85;95;85" dur="0.8s" repeatCount="indefinite" begin={`${delay}s`} />
                </line>
              )
            })}
          </svg>
        )

      case 'cloudy-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#808080" stopOpacity="1" />
                <stop offset="100%" stopColor="#606060" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#A0A0A0" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="30" ry="18" fill="url(#cloudyRainCloud)" />
            <ellipse cx="40" cy="40" rx="22" ry="14" fill="url(#cloudyRainCloud)" />
            <ellipse cx="60" cy="40" rx="22" ry="14" fill="url(#cloudyRainCloud)" />
            {/* 雨 */}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = 40 + (i * 5)
              const delay = (i * 0.1) % 1
              return (
                <line
                  key={i}
                  x1={x}
                  y1="65"
                  x2={x}
                  y2="85"
                  stroke="#4A90E2"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <animate attributeName="y1" values="65;75;65" dur="0.8s" repeatCount="indefinite" begin={`${delay}s`} />
                  <animate attributeName="y2" values="85;95;85" dur="0.8s" repeatCount="indefinite" begin={`${delay}s`} />
                </line>
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
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
              </radialGradient>
              <linearGradient id="sunnyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#808080" stopOpacity="1" />
                <stop offset="100%" stopColor="#606060" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#87CEEB" />
            {/* 太陽 */}
            <circle cx="30" cy="30" r="15" fill="url(#sunnyRainSun)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 18
              const y1 = 30 + Math.sin(angle) * 18
              const x2 = 30 + Math.cos(angle) * 23
              const y2 = 30 + Math.sin(angle) * 23
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="28" ry="16" fill="url(#sunnyRainCloud)" />
            <ellipse cx="60" cy="45" rx="20" ry="13" fill="url(#sunnyRainCloud)" />
            <ellipse cx="80" cy="45" rx="20" ry="13" fill="url(#sunnyRainCloud)" />
            {/* 雨 */}
            {Array.from({ length: 4 }).map((_, i) => {
              const x = 60 + (i * 5)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="68"
                  x2={x}
                  y2="88"
                  stroke="#4A90E2"
                  strokeWidth="2"
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
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#D0D0D0" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#D3D3D3" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="30" ry="18" fill="url(#snowCloudGradient)" />
            <ellipse cx="40" cy="40" rx="22" ry="14" fill="url(#snowCloudGradient)" />
            <ellipse cx="60" cy="40" rx="22" ry="14" fill="url(#snowCloudGradient)" />
            {/* 雪の結晶 */}
            {Array.from({ length: 4 }).map((_, i) => {
              const x = 35 + (i * 10)
              const y = 70 + (i % 2) * 10
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-3" y1="-3" x2="3" y2="3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-3" y1="3" x2="3" y2="-3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x} ${y};360 ${x} ${y}`}
                    dur={`${2 + (i % 2)}s`}
                    repeatCount="indefinite"
                  />
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
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#D0D0D0" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#D3D3D3" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="30" ry="18" fill="url(#cloudySnowCloud)" />
            <ellipse cx="40" cy="40" rx="22" ry="14" fill="url(#cloudySnowCloud)" />
            <ellipse cx="60" cy="40" rx="22" ry="14" fill="url(#cloudySnowCloud)" />
            {/* 雪の結晶 */}
            {Array.from({ length: 4 }).map((_, i) => {
              const x = 35 + (i * 10)
              const y = 70 + (i % 2) * 10
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-3" y1="-3" x2="3" y2="3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-3" y1="3" x2="3" y2="-3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x} ${y};360 ${x} ${y}`}
                    dur={`${2 + (i % 2)}s`}
                    repeatCount="indefinite"
                  />
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
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
              </radialGradient>
              <linearGradient id="sunnySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#D0D0D0" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#87CEEB" />
            {/* 太陽 */}
            <circle cx="30" cy="30" r="15" fill="url(#sunnySnowSun)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 18
              const y1 = 30 + Math.sin(angle) * 18
              const x2 = 30 + Math.cos(angle) * 23
              const y2 = 30 + Math.sin(angle) * 23
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFD700"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="28" ry="16" fill="url(#sunnySnowCloud)" />
            <ellipse cx="60" cy="45" rx="20" ry="13" fill="url(#sunnySnowCloud)" />
            <ellipse cx="80" cy="45" rx="20" ry="13" fill="url(#sunnySnowCloud)" />
            {/* 雪の結晶 */}
            {Array.from({ length: 3 }).map((_, i) => {
              const x = 60 + (i * 8)
              const y = 70 + (i % 2) * 8
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-3" y1="-3" x2="3" y2="3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-3" y1="3" x2="3" y2="-3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
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
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#87CEEB" />
            <circle cx="50" cy="50" r="20" fill="url(#defaultGradient)" />
          </svg>
        )
    }
  }

  return <div className="weather-icon-container">{renderIcon()}</div>
}

export default WeatherIcon
