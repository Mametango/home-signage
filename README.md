# Home Signage 🖥️✨

LG ld290ejs-fpn1用のデジタルサイネージアプリケーションです。

## 機能 📱

- ⏰ **時計表示**: リアルタイムで時刻と日付を表示
- 🌤️ **天気情報**: 現在の天気と気温を表示（API連携可能）
- 📅 **カレンダー**: 月間カレンダーを表示
- 🎬 **スライドショー**: 画像やテキストのスライドショー表示

## セットアップ 🚀

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### ビルド

本番用のビルドを作成する場合：

```bash
npm run build
```

ビルドされたファイルは `dist` フォルダに生成されます。

## カスタマイズ 🎨

### 天気APIの設定

#### OpenAI API（AIによる天気予報説明生成）

AIによる天気予報の説明を生成するには、OpenAI APIキーが必要です。

1. `.env`ファイルを作成（`.env.example`をコピー）
2. OpenAI APIキーを取得: https://platform.openai.com/api-keys
3. `.env`ファイルに`VITE_OPENAI_API_KEY=your_api_key_here`を設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してAPIキーを設定
VITE_OPENAI_API_KEY=sk-...
```

#### OpenWeatherMap API（2時間ごとの天気予報）

2時間ごとの天気予報を取得するには、OpenWeatherMap APIキーが必要です。

1. `.env`ファイルに`VITE_OPENWEATHER_API_KEY=your_api_key_here`を設定
2. OpenWeatherMap APIキーを取得: https://openweathermap.org/api

**注意**: APIキーは`.env`ファイルに保存し、Gitにコミットしないでください（`.gitignore`に含まれています）。

### スライドショーの追加

`src/components/Slideshow.tsx` の `slides` 配列に新しいスライドを追加できます。

### スタイルの変更

各コンポーネントのCSSファイルを編集して、デザインをカスタマイズできます。

## サイネージディスプレイでの表示 🖥️

### Webベースでの表示（推奨）

LG ld290ejs-fpn1のAndroid 7.1のブラウザで表示する方法：

1. **プロジェクトをビルド**
```bash
npm run build
```

2. **Webサーバーに配置**
   - `dist` フォルダの内容をWebサーバーにアップロード
   - または、ローカルネットワークでサーバーを起動

3. **サイネージディスプレイで表示**
   - サイネージディスプレイのブラウザで該当URLを開く
   - フルスクリーンモードで表示（F11キー、またはブラウザの設定）

### ローカル開発サーバーでの確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### ビルド済みファイルのプレビュー

```bash
npm run build
npm run preview
```

## デプロイ 🌐

詳細なデプロイ手順は `README_DEPLOY.md` を参照してください。

## ライセンス

MIT
