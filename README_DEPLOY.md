# デプロイ手順

このアプリケーションをWEB上に配置する方法を説明します。

## 方法1: Vercel（推奨・最も簡単）

### 手順

1. **GitHubにリポジトリを作成**
   - GitHubで新しいリポジトリを作成
   - 以下のコマンドでコードをプッシュ：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
   git push -u origin main
   ```

2. **Vercelにデプロイ**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン
   - "New Project"をクリック
   - GitHubリポジトリを選択
   - 設定：
     - Framework Preset: `Vite`
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Environment Variables（環境変数）を設定（必要に応じて）：
     - `VITE_OPENWEATHER_API_KEY`: OpenWeatherMap APIキー
     - `VITE_WEATHERNEWS_API_KEY`: Weathernews APIキー
   - "Deploy"をクリック

3. **完了**
   - 数分でデプロイが完了し、URLが発行されます
   - 例: `https://your-project.vercel.app`

## 方法2: Netlify

### 手順

1. **GitHubにリポジトリを作成**（方法1と同じ）

2. **Netlifyにデプロイ**
   - https://www.netlify.com にアクセス
   - GitHubアカウントでログイン
   - "New site from Git"をクリック
   - GitHubリポジトリを選択
   - 設定：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Environment Variablesを設定（必要に応じて）
   - "Deploy site"をクリック

## 方法3: GitHub Pages

### 手順

1. **package.jsonにスクリプトを追加**
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

2. **gh-pagesをインストール**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **vite.config.tsを更新**
   ```typescript
   export default defineConfig({
     base: '/リポジトリ名/',
     // ... 他の設定
   })
   ```

4. **デプロイ**
   ```bash
   npm run deploy
   ```

## 環境変数の設定

APIキーが必要な場合、デプロイ先の環境変数設定で以下を追加：

- `VITE_OPENWEATHER_API_KEY`: OpenWeatherMap APIキー
- `VITE_WEATHERNEWS_API_KEY`: Weathernews APIキー

**注意**: `VITE_`で始まる環境変数は、ビルド時にクライアント側のコードに埋め込まれます。機密情報は使用しないでください。

## カスタムドメインの設定

VercelやNetlifyでは、カスタムドメインを設定できます。設定画面からドメインを追加してください。

