# GitHubへのコードプッシュ手順

## ステップ1: GitHubでリポジトリを作成

1. https://github.com にアクセスしてログイン
2. 右上の「+」ボタン → 「New repository」をクリック
3. リポジトリ名を入力（例: `home-signage`）
4. 「Public」または「Private」を選択
5. **「Initialize this repository with a README」はチェックを外す**（既にコードがあるため）
6. 「Create repository」をクリック

## ステップ2: ローカルでGitを初期化

以下のコマンドを順番に実行してください：

```bash
# 1. Gitリポジトリを初期化
git init

# 2. すべてのファイルをステージング（追加）
git add .

# 3. 最初のコミットを作成
git commit -m "Initial commit: Home Signage application"

# 4. メインブランチに名前を変更（オプション、GitHubのデフォルトに合わせるため）
git branch -M main

# 5. GitHubリポジトリをリモートとして追加
# （YOUR_USERNAMEとYOUR_REPO_NAMEを実際の値に置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. コードをプッシュ
git push -u origin main
```

## ステップ3: 認証

初めてプッシュする場合、GitHubの認証が必要です：

### 方法A: Personal Access Token（推奨）

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token (classic)」をクリック
3. スコープで「repo」にチェック
4. トークンを生成してコピー
5. プッシュ時にパスワードの代わりにトークンを入力

### 方法B: GitHub CLI

```bash
# GitHub CLIをインストール（未インストールの場合）
# Windows: winget install GitHub.cli
# または https://cli.github.com からダウンロード

# ログイン
gh auth login

# その後、通常通りプッシュ
git push -u origin main
```

## よくあるエラーと解決方法

### エラー: "remote origin already exists"
```bash
# 既存のリモートを削除
git remote remove origin
# 再度追加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### エラー: "failed to push some refs"
```bash
# リモートの変更を取得してマージ
git pull origin main --allow-unrelated-histories
# 再度プッシュ
git push -u origin main
```

## 今後の更新方法

コードを変更した後は、以下のコマンドで更新できます：

```bash
# 変更を確認
git status

# 変更を追加
git add .

# コミット
git commit -m "変更内容の説明"

# プッシュ
git push
```

