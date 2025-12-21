# サイネージで表示されない場合のデバッグ手順

## 確認事項

### 1. ブラウザの開発者ツールでエラーを確認

サイネージのブラウザで以下を確認してください：

1. **F12キー**または**右クリック→検証**で開発者ツールを開く
2. **Console（コンソール）タブ**でエラーメッセージを確認
3. **Network（ネットワーク）タブ**でリソースの読み込み状況を確認

### 2. よくある問題と解決方法

#### 問題A: "Failed to fetch" または CORS エラー
- **原因**: 外部APIへのアクセスがブロックされている
- **解決**: ネットワーク接続を確認、またはAPIのCORS設定を確認

#### 問題B: "Cannot read property 'xxx' of undefined"
- **原因**: JavaScriptの実行エラー
- **解決**: コンソールのエラーメッセージを確認して修正

#### 問題C: 白い画面が表示される
- **原因**: CSSが読み込まれていない、またはJavaScriptが実行されていない
- **解決**: 
  - NetworkタブでCSS/JSファイルが読み込まれているか確認
  - ブラウザのキャッシュをクリア

#### 問題D: "Module not found" エラー
- **原因**: ビルドが正しく行われていない
- **解決**: 再度 `npm run build` を実行してVercelに再デプロイ

### 3. テスト用のシンプルなHTMLページを作成

サイネージで基本的なHTMLが表示できるか確認：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test</title>
    <style>
        body {
            background: #808080;
            color: white;
            font-size: 48px;
            text-align: center;
            padding: 50px;
        }
    </style>
</head>
<body>
    <h1>テストページ</h1>
    <p>現在時刻: <span id="time"></span></p>
    <script>
        function updateTime() {
            document.getElementById('time').textContent = new Date().toLocaleTimeString('ja-JP');
        }
        updateTime();
        setInterval(updateTime, 1000);
    </script>
</body>
</html>
```

このページが表示できれば、基本的なHTML/JavaScriptは動作しています。

### 4. Vercelのデプロイログを確認

1. Vercelのダッシュボードにアクセス
2. プロジェクト → **Deployments** タブ
3. 最新のデプロイをクリック
4. **Logs** タブでビルドエラーがないか確認

### 5. ネットワーク接続の確認

- サイネージがインターネットに接続されているか確認
- ファイアウォールでHTTPS（443ポート）がブロックされていないか確認

### 6. ブラウザのバージョン確認

Android 7.1のデフォルトブラウザは古い可能性があります：

- Chrome 59以下: ES modulesのサポートが限定的
- 解決策: Chromeを最新版に更新、または別のブラウザをインストール

## 緊急時のフォールバック

もしどうしても表示されない場合、以下のシンプルなバージョンを作成できます：

1. 静的HTMLファイルのみのバージョン
2. 外部APIに依存しないバージョン
3. より古いブラウザに対応したバージョン

必要であれば、これらのバージョンを作成します。












