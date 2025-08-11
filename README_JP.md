# Hydra HexCore

Hydra HexCoreは、Cardanoブロックチェーン上のレイヤー2スケーリングソリューションであるHydra Headの管理と相互作用を行うNestJSで構築されたバックエンドサービスです。Hydraノードの管理、トランザクション処理、およびCardano上でのマルチパーティゲーミングの管理を行うAPIを提供します。

## 🚀 主な機能

- **Hydra Node Management**: Hydraノードの作成と管理
- **Multi-Party Support**: Hydra Head内の参加者（パーティ）の作成と管理
- **Transaction Processing**: Hydraレイヤー上でのトランザクション処理と送信
- **Docker Integration**: CardanoとHydraコンテナの管理
- **Database Management**: MySQL/SQLiteでのデータ保存
- **Caching**: パフォーマンス最適化のためのRedisキャッシング
- **Authentication**: JWTベースの認証システム

## 🏗️ アーキテクチャ

アプリケーションは以下の主要モジュールに分かれています：

- **HydraMainModule**: コアHydra管理機能
- **ShellModule**: シェルコマンド実行ユーティリティ
- **AuthModule**: 認証と認可

## 📋 システム要件

- Node.js 20+
- Docker & Docker Compose
- MySQL 8.0+ または SQLite
- Redis（キャッシングのためのオプション）
- Cardano Node
- Hydra Node バイナリ

## 🛠️ インストール

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd hydra-hexcore
```

### 2. 依存関係のインストール

```bash
# pnpmを使用（推奨）
pnpm install

# またはnpm
npm install
```

### 3. 環境設定

`.env`ファイルを作成し、環境変数を設定します：

```env
# サーバー設定
PORT=3010
NODE_ENV=development

# データベース設定
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=hexcore
DB_SYNCHRONIZE=true

# Redis設定
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Hydra設定
NEST_HYDRA_BIN_DIR_PATH=/path/to/hydra/bin
NEST_HYDRA_NODE_IMAGE=ghcr.io/cardano-scaling/hydra-node:0.19.0
NEST_HYDRA_NODE_FOLDER=/path/to/hydra/preprod

# Cardano設定
NEST_CARDANO_NODE_SERVICE_NAME=cardano-node
NEST_CARDANO_NODE_IMAGE=ghcr.io/intersectmbo/cardano-node:10.1.4
NEST_CARDANO_NODE_FOLDER=/path/to/cardano-node
NEST_CARDANO_NODE_SOCKER_PATH=/path/to/cardano-node/node.socket

# Docker設定
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock
NEST_DOCKER_ENABLE_NETWORK_HOST=true
```

### 4. Docker Composeで実行

```bash
docker-compose up -d
```

### 5. 開発モードで実行

```bash
# 開発
pnpm run start:dev

# デバッグモード
pnpm run start:debug

# プロダクション
pnpm run start:prod
```

## 📚 APIドキュメント

### Hydra管理API

#### アカウント作成
```http
POST /hydra/account
Content-Type: application/json

{
  "mnemonic": "your 24-word mnemonic phrase"
}
```

#### パーティ作成
```http
POST /hydra/party
Content-Type: application/json

{
  "name": "party-name",
  "accountId": "account-id"
}
```

#### Hydraノード作成
```http
POST /hydra/node
Content-Type: application/json

{
  "partyId": "party-id",
  "nodeConfig": { ... }
}
```

#### Hydraへのコミット
```http
POST /hydra/commit
Content-Type: application/json

{
  "partyId": "party-id",
  "amount": 1000000
}
```

#### トランザクション送信
```http
POST /hydra/submit-tx
Content-Type: application/json

{
  "partyId": "party-id",
  "transaction": "signed-transaction-cbor"
}
```

### 管理者API

#### 管理者ログイン
```http
POST /hydra/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

## 🧪 テスト

```bash
# ユニットテスト
pnpm run test

# E2Eテスト
pnpm run test:e2e

# テストカバレッジ
pnpm run test:cov

# ウォッチモード
pnpm run test:watch
```

## 📁 プロジェクト構造

```
src/
├── auth/                   # 認証と認可
├── common/                 # 共通ユーティリティ
│   ├── exceptions/         # カスタム例外
│   └── interceptors/       # レスポンスインターセプター
├── config/                 # 設定ファイル
├── constants/              # アプリケーション定数
├── decorators/             # カスタムデコレーター
├── enums/                  # 列挙型定義
├── event/                  # イベントエミッター
├── hydra-main/             # コアHydra機能
├── interfaces/             # TypeScriptインターフェース
├── middlewares/            # カスタムミドルウェア
├── migrations/             # データベースマイグレーション
├── proxy/                  # プロキシサービス
├── shell/                  # シェルコマンドユーティリティ
└── utils/                  # ユーティリティ関数
```

## 🔧 NPMスクリプト

```bash
# 開発
pnpm run start:dev          # ウォッチモードで開発サーバーを実行
pnpm run start:debug        # デバッグモードを実行

# ビルド & プロダクション
pnpm run build              # アプリケーションをビルド
pnpm run start:prod         # プロダクションビルドを実行

# コード品質
pnpm run lint               # ESLintでコードをリント
pnpm run format             # Prettierでコードをフォーマット

# データベース
pnpm run typeorm            # TypeORM CLIコマンド
```

## 🐳 Dockerデプロイメント

```bash
# Dockerイメージをビルド
docker build -t hydra-hexcore .

# Docker Composeで実行
docker-compose up -d

# ログを表示
docker-compose logs -f hydra-hexcore

# サービスを停止
docker-compose down
```

## 🔒 セキュリティ

- JWTベースの認証
- ロールベースのアクセス制御（RBAC）
- class-validatorによる入力検証
- レート制限（追加設定が必要）
- CORS設定

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add some amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを作成

## 📄 ライセンス

UNLICENSED - プライベートプロジェクト

## 📞 サポート

サポートやバグ報告については、GitHubリポジトリでissueを作成してください。

---

**注意**: これはCardanoブロックチェーン上のHydra Head管理アプリケーションです。効果的に使用するには、CardanoとHydraに関する知識が必要です。
