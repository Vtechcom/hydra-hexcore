🌐 **Language / 言語 / Ngôn ngữ:** [English](README.md) | 日本語 | [Tiếng Việt](README_VI.md)

# Hydra HexCore

Hydra HexCoreは、Cardanoブロックチェーン上のレイヤー2スケーリングソリューションであるHydra Headの管理と相互作用を行うNestJSで構築されたバックエンドサービスです。Hydraノードの管理、トランザクション処理、およびCardano上でのマルチパーティオペレーションの管理を行うAPIを提供します。

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

- **Node.js** >= 20.x
- **pnpm** (`npm install -g pnpm`)
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- 以下のいずれか：
    - **Blockfrost** アカウント（簡単 — APIキーのみ必要）、または
    - 稼働中の **Cardano Node**（上級 — フルノード同期が必要）

## 🛠️ インストール & セットアップ（クイックスタート）

本プロジェクトはCardanoネットワークへの **2つの接続モード** をサポートしています：

|                | Blockfrostモード               | Cardano Nodeモード                     |
| -------------- | ------------------------------ | -------------------------------------- |
| **難易度**     | ⭐ 簡単 — APIキーのみ          | ⭐⭐⭐ 難しい — フルノードが必要       |
| **必要なもの** | Blockfrostアカウント           | 稼働中の `cardano-node`                |
| **利点**       | 高速、ブロックチェーン同期不要 | サードパーティ依存なし、オフライン可能 |

> 📖 **詳細ガイド:** [docs/SETUP_GUIDE_JP.md](docs/SETUP_GUIDE_JP.md)

### 1. クローン & インストール

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

### 2. 環境設定

```bash
cp .env.example .env
```

主要な環境変数：

```env
# 接続モード: "blockfrost" または "cardano-node"
CARDANO_CONNECTION_MODE=blockfrost

# Blockfrost（blockfrostモード使用時）
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0

# Cardanoネットワーク
CARDANO_NETWORK='testnet'

# Hydra Node
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='<バージョンとネットワークに対応するscript-tx-ids>'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'

# データベース
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true

# Docker
NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'

# JWT & Hydra Hub
JWT_SECRET=your_jwt_secret_key
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/
HUB_API_KEY=your_hub_api_key

# RabbitMQ（オプション、プロバイダー承認後に有効化）
RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue

# サーバー
PORT=3010
MAX_ACTIVE_NODES=20
LOG_DIR=logs
```

> 各変数の詳細説明、バージョン/ネットワーク別Hydra Script TX IDs、バージョン互換性テーブルは [docs/SETUP_GUIDE_JP.md](docs/SETUP_GUIDE_JP.md) を参照してください。

### 3. MySQLを起動

```bash
cd configs/mysql-databases && docker compose up -d && cd ../..
```

### 4. ディレクトリ & 権限の設定

```bash
mkdir -p logs && chmod -R 755 logs
mkdir -p /path/to/hydra/preprod && chmod -R 755 /path/to/hydra/preprod
sudo usermod -aG docker $USER
```

> **Cardano Nodeモードのみ:** `chmod 777 /path/to/cardano-node/node.socket` も実行してください

### 5. ビルド & 実行

```bash
# プロダクション
pnpm build
pnpm start:prod

# または開発モード
pnpm run start:dev
```

サーバー起動先: **API** `http://localhost:3010` | **Swagger** `http://localhost:3010/api-docs`

### 6. 管理者アカウント作成 & プロバイダー登録

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --connection-type=blockfrost \
  --network=preprod \
  --hexcore-url=https://your-domain.com \
  --email=contact@example.com
```

Hubチームの承認後、**HUB API Key** がメールで届きます — `.env` の `HUB_API_KEY` を更新してください。

> パラメータの詳細、プロバイダー更新手順、Cardano Node固有の設定、トラブルシューティングは [docs/SETUP_GUIDE_JP.md](docs/SETUP_GUIDE_JP.md) を参照してください。

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
