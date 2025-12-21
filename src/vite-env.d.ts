/// <reference types="vite/client" />

// バージョン情報の型定義
declare const __APP_VERSION__: string
declare const __GIT_HASH__: string
declare const __BUILD_DATE__: string

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY?: string
  readonly VITE_WEATHERNEWS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

