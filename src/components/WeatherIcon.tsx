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
            <circle cx="50" cy="50" r="25" fill="#FFD700" className="sun-circle">
              <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <g className="sun-rays">
              <line x1="50" y1="10" x2="50" y2="20" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="50" y1="80" x2="50" y2="90" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="10" y1="50" x2="20" y2="50" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.5s" />
              </line>
              <line x1="80" y1="50" x2="90" y2="50" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.5s" />
              </line>
              <line x1="25" y1="25" x2="30" y2="30" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.25s" />
              </line>
              <line x1="70" y1="70" x2="75" y2="75" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.25s" />
              </line>
              <line x1="75" y1="25" x2="70" y2="30" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.75s" />
              </line>
              <line x1="30" y1="70" x2="25" y2="75" stroke="#FFD700" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.75s" />
              </line>
            </g>
          </svg>
        )

      case 'cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <ellipse cx="50" cy="50" rx="35" ry="20" fill="#E0E0E0" opacity="0.9">
              <animate attributeName="cx" values="50;52;50" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="40" cy="45" rx="25" ry="15" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="40;42;40" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="60" cy="45" rx="25" ry="15" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="60;62;60" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </svg>
        )

      case 'partly-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 太陽 */}
            <circle cx="30" cy="30" r="12" fill="#FFD700" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.7;0.9" dur="2s" repeatCount="indefinite" />
            </circle>
            <g className="sun-rays-small">
              <line x1="30" y1="15" x2="30" y2="20" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="30" y1="40" x2="30" y2="45" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="15" y1="30" x2="20" y2="30" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="40" y1="30" x2="45" y2="30" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>
            {/* 雲 */}
            <ellipse cx="65" cy="50" rx="25" ry="15" fill="#E0E0E0" opacity="0.9">
              <animate attributeName="cx" values="65;67;65" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="55" cy="45" rx="20" ry="12" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="55;57;55" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="75" cy="45" rx="20" ry="12" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="75;77;75" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </svg>
        )

      case 'sunny-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 太陽 */}
            <circle cx="35" cy="35" r="15" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.6;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* 雲 */}
            <ellipse cx="65" cy="50" rx="30" ry="18" fill="#E0E0E0" opacity="0.9">
              <animate attributeName="cx" values="65;67;65" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="55" cy="45" rx="22" ry="14" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="55;57;55" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="75" cy="45" rx="22" ry="14" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="75;77;75" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </svg>
        )

      case 'rainy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="35" ry="20" fill="#808080" opacity="0.9">
              <animate attributeName="cx" values="50;52;50" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="40" cy="40" rx="25" ry="15" fill="#707070" opacity="0.8">
              <animate attributeName="cx" values="40;42;40" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="60" cy="40" rx="25" ry="15" fill="#707070" opacity="0.8">
              <animate attributeName="cx" values="60;62;60" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雨 */}
            <g className="rain-drops">
              <line x1="40" y1="65" x2="40" y2="75" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="65;75;65" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="y2" values="75;85;75" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
              </line>
              <line x1="50" y1="70" x2="50" y2="80" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="70;80;70" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
                <animate attributeName="y2" values="80;90;80" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
                <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
              </line>
              <line x1="60" y1="65" x2="60" y2="75" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="65;75;65" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
                <animate attributeName="y2" values="75;85;75" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
                <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
              </line>
            </g>
          </svg>
        )

      case 'cloudy-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="35" ry="20" fill="#808080" opacity="0.9">
              <animate attributeName="cx" values="50;52;50" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="40" cy="40" rx="25" ry="15" fill="#707070" opacity="0.8">
              <animate attributeName="cx" values="40;42;40" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="60" cy="40" rx="25" ry="15" fill="#707070" opacity="0.8">
              <animate attributeName="cx" values="60;62;60" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雨 */}
            <g className="rain-drops">
              <line x1="40" y1="65" x2="40" y2="75" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="65;75;65" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="y2" values="75;85;75" dur="0.5s" repeatCount="indefinite" />
              </line>
              <line x1="50" y1="70" x2="50" y2="80" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="70;80;70" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
                <animate attributeName="y2" values="80;90;80" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
              </line>
              <line x1="60" y1="65" x2="60" y2="75" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="65;75;65" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
                <animate attributeName="y2" values="75;85;75" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
              </line>
            </g>
          </svg>
        )

      case 'sunny-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 太陽 */}
            <circle cx="30" cy="30" r="12" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.6;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* 雲 */}
            <ellipse cx="65" cy="50" rx="30" ry="18" fill="#808080" opacity="0.9">
              <animate attributeName="cx" values="65;67;65" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="55" cy="45" rx="22" ry="14" fill="#707070" opacity="0.8">
              <animate attributeName="cx" values="55;57;55" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="75" cy="45" rx="22" ry="14" fill="#707070" opacity="0.8">
              <animate attributeName="cx" values="75;77;75" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雨 */}
            <g className="rain-drops">
              <line x1="55" y1="68" x2="55" y2="78" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="68;78;68" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="y2" values="78;88;78" dur="0.5s" repeatCount="indefinite" />
              </line>
              <line x1="65" y1="70" x2="65" y2="80" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="70;80;70" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
                <animate attributeName="y2" values="80;90;80" dur="0.5s" repeatCount="indefinite" begin="0.2s" />
              </line>
              <line x1="75" y1="68" x2="75" y2="78" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="68;78;68" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
                <animate attributeName="y2" values="78;88;78" dur="0.5s" repeatCount="indefinite" begin="0.4s" />
              </line>
            </g>
          </svg>
        )

      case 'snowy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="35" ry="20" fill="#E0E0E0" opacity="0.9">
              <animate attributeName="cx" values="50;52;50" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="40" cy="40" rx="25" ry="15" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="40;42;40" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="60" cy="40" rx="25" ry="15" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="60;62;60" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雪 */}
            <g className="snowflakes">
              <g transform="translate(40, 70)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="y1" values="-5;-8;-5" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="y2" values="5;8;5" dur="1s" repeatCount="indefinite" />
                </line>
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-5;-8;-5" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="5;8;5" dur="1s" repeatCount="indefinite" />
                </line>
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-3.5;-5;-3.5" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" />
                </line>
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-3.5;-5;-3.5" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" />
                </line>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </g>
              <g transform="translate(50, 75)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="y1" values="-5;-8;-5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="y2" values="5;8;5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                </line>
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-5;-8;-5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="x2" values="5;8;5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                </line>
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-3.5;-5;-3.5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="x2" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                </line>
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-3.5;-5;-3.5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="x2" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" begin="0.3s" />
                </line>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;-360 0 0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </g>
              <g transform="translate(60, 70)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="y1" values="-5;-8;-5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                  <animate attributeName="y2" values="5;8;5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                </line>
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-5;-8;-5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                  <animate attributeName="x2" values="5;8;5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                </line>
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-3.5;-5;-3.5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                  <animate attributeName="x2" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                </line>
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="x1" values="-3.5;-5;-3.5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                  <animate attributeName="x2" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" begin="0.6s" />
                </line>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </g>
            </g>
          </svg>
        )

      case 'cloudy-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="35" ry="20" fill="#E0E0E0" opacity="0.9">
              <animate attributeName="cx" values="50;52;50" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="40" cy="40" rx="25" ry="15" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="40;42;40" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="60" cy="40" rx="25" ry="15" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="60;62;60" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雪 */}
            <g className="snowflakes">
              <g transform="translate(40, 70)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </g>
              <g transform="translate(50, 75)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;-360 0 0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </g>
              <g transform="translate(60, 70)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </g>
            </g>
          </svg>
        )

      case 'sunny-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            {/* 太陽 */}
            <circle cx="30" cy="30" r="12" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.6;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* 雲 */}
            <ellipse cx="65" cy="50" rx="30" ry="18" fill="#E0E0E0" opacity="0.9">
              <animate attributeName="cx" values="65;67;65" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="55" cy="45" rx="22" ry="14" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="55;57;55" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="75" cy="45" rx="22" ry="14" fill="#D0D0D0" opacity="0.8">
              <animate attributeName="cx" values="75;77;75" dur="3s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雪 */}
            <g className="snowflakes">
              <g transform="translate(55, 70)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </g>
              <g transform="translate(65, 75)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;-360 0 0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </g>
              <g transform="translate(75, 70)">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </g>
            </g>
          </svg>
        )

      default:
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <circle cx="50" cy="50" r="25" fill="#FFD700" />
          </svg>
        )
    }
  }

  return <div className="weather-icon-container">{renderIcon()}</div>
}

export default WeatherIcon

