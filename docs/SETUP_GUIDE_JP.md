🌐 **Language / 言語 / Ngôn ngữ:** [English](SETUP_GUIDE.md) | 日本語 | [Tiếng Việt](SETUP_GUIDE_VI.md)

# Hydra Hexcoreのインストールと実行ガイド

本プロジェクトは、Cardanoネットワークへの **2つの接続モード** をサポートしています：

|            | Blockfrostモード               | Cardano Nodeモード                         |
| ---------- | ------------------------------ | ------------------------------------------ |
| **難易度** | ⭐ 簡単 — APIキーのみ必要      | ⭐⭐⭐ 難しい — フルノードの実行が必要     |
| **要件**   | Blockfrostアカウント           | 稼働中の`cardano-node`                     |
| **利点**   | 高速、ブロックチェーン同期不要 | サードパーティ依存なし、オフライン実行可能 |

> **一方を選択** して、以下の対応する手順に従ってください。

---

# パートA — Blockfrostを使用

## A1. システム要件

- **Node.js** >= 20.x
- **pnpm** — インストール: `npm install -g pnpm`
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- **Blockfrost** アカウント（無料登録：[blockfrost.io](https://blockfrost.io)）

---

## A2. クローンと依存関係のインストール

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## A3. 環境設定（.env）

テンプレートファイルをコピー：

```bash
cp .env.example .env
```

その後、`.env`ファイルを開き、以下のガイドに従って変数を編集します。

### A3.1. Cardano接続モード → Blockfrost

```dotenv
# 接続モードを選択
CARDANO_CONNECTION_MODE=blockfrost

# https://blockfrost.io/dashboard からProject IDを取得
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Blockfrost APIのBase URL（ネットワークに応じて選択：preprodまたはmainnet）
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
```

> **注意：** Blockfrostでプロジェクトを作成する際、**Preprod**ネットワークを選択して対応するProject IDを取得してください。

### A3.2. Hydra Node設定

```dotenv
# 使用中のCardanoネットワーク：testnetまたはmainnet
CARDANO_NETWORK='testnet'

NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### `NEST_HYDRA_NODE_IMAGE`の取得方法

バージョンリストはこちら：[https://github.com/cardano-scaling/hydra/releases](https://github.com/cardano-scaling/hydra/releases)

フォーマット：`ghcr.io/cardano-scaling/hydra-node:<version>`

#### `NEST_HYDRA_NODE_SCRIPT_TX_ID`の取得方法

各Hydraバージョンは、ネットワークごとに**Script TX IDs**を公開しています。使用中のバージョンとネットワークに対応する正しいTX IDを取得する必要があります。

詳細は[Vietnamese guide](SETUP_GUIDE_VI.md)のセクションA3.2を参照してください。

#### `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`の選択方法

| ネットワーク          | 値                                        |
| --------------------- | ----------------------------------------- |
| **Preview** (testnet) | `2`                                       |
| **Preprod** (testnet) | `1`                                       |
| **Mainnet**           | 不要（`CARDANO_NETWORK='mainnet'`を使用） |

### A3.3. データベース設定（MySQL）

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true
```

### A3.4. Docker設定

```dotenv
NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'
```

### A3.5. JWT & Hydra Hub設定

```dotenv
JWT_SECRET=your_jwt_secret_key
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/
HUB_API_KEY=your_hub_api_key
```

### A3.6. その他の設定

```dotenv
MAX_ACTIVE_NODES=20
PORT=3010
LOG_DIR=logs
```

### A3.7. RabbitMQ設定

```dotenv
RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue
RABBITMQ_PREFETCH_COUNT=1
RABBITMQ_NO_ACK=false
RABBITMQ_QUEUE_DURABLE=true
```

---

## A4. Docker ComposeでMySQLを起動

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

---

## A5. ディレクトリの権限設定

```bash
mkdir -p logs
chmod -R 755 logs
mkdir -p /path/to/hydra/preprod
chmod -R 755 /path/to/hydra/preprod
sudo usermod -aG docker $USER
```

---

## A6. プロジェクトの実行

```bash
pnpm build
pnpm start:prod
```

サーバー起動先：

- **API:** `http://localhost:3010`
- **Swagger:** `http://localhost:3010/api-docs`

---

## A7. 管理者アカウントの作成とプロバイダー登録

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --logo-url=https://example.com/logo.png \
  --provider-url=https://example.com \
  --connection-type=blockfrost \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

Hubチームの承認後、**HUB API Key**がメールで送信されます — `.env`の`HUB_API_KEY`を更新してください。

---

## クイックステップ（Blockfrost）

```bash
# 1. インストール
pnpm install

# 2. .envを設定
cp .env.example .env
# 上記のガイドに従って.envを編集

# 3. データベースを起動
cd configs/mysql-databases && docker compose up -d && cd ../..

# 4. ディレクトリの権限設定
mkdir -p logs && chmod -R 755 logs

# 5. サーバーを実行
pnpm build
pnpm start:prod

# 6. 管理者を作成してプロバイダーを登録
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

---

## よくあるエラー（Blockfrost）

| エラー                                    | 原因                         | 解決方法                                                |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `BlockFrost API configuration is missing` | Blockfrost未設定             | `.env`の`BLOCKFROST_PROJECT_ID`を確認                   |
| `ECONNREFUSED 127.0.0.1:3309`             | MySQL未実行                  | `configs/mysql-databases`で`docker compose up -d`を実行 |
| `EACCES: permission denied`               | ディレクトリ書き込み権限なし | 対応するディレクトリに`chmod -R 755`を実行              |
| `connect ENOENT /var/run/docker.sock`     | Dockerデーモン未実行         | Dockerサービスを起動                                    |

---

# パートB — Cardano Nodeを使用

> ⚠️ **前提条件：** `cardano-node`のインストールと実行経験が必要です。初めての場合は、まず**パートA**（Blockfrost）をお試しください。

## B1. クローンと依存関係のインストール

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## B2. Cardano Nodeの実行

続行する前に、実行中のCardano Nodeについて以下を確認してください：

- **コンテナ名**（または`cardano-cli`の呼び出し方法）
- ホストマシン上の`node.socket`と`shelley-genesis.json`を含む**ディレクトリパス**
- コンテナ内の**`node.socket`パス**

> **重要：** cardano-nodeが**ブロックチェーンの同期を完了**するまで待つ必要があります。これには**数時間から数日**かかる場合があります。

同期状態の確認：

```bash
docker exec cardano-node cardano-cli query tip \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

`syncProgress`が`"100.00"`を返したら同期完了です。

---

## B3. `node.socket`の権限設定

Hydra Nodeコンテナがソケットにアクセスできるよう、`777`権限が必要です：

```bash
chmod 777 /path/to/cardano-node/node.socket
chmod -R 777 /path/to/cardano-node/
```

---

## B4. 環境設定（.env）

```bash
cp .env.example .env
```

### 接続モード → Cardano Node

```dotenv
CARDANO_CONNECTION_MODE=cardano-node
CARDANO_NETWORK='testnet'
```

### Cardano Node設定

```dotenv
NEST_CARDANO_NODE_SERVICE_NAME='cardano-node'
NEST_CARDANO_NODE_IMAGE='ghcr.io/intersectmbo/cardano-node:10.2.1'
NEST_CARDANO_NODE_FOLDER='/home/user/hydra-hexcore/configs/cardano'
NEST_CARDANO_NODE_SOCKET_PATH='/home/user/hydra-hexcore/configs/cardano/node.socket'
```

### Hydra Node設定

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/home/user/hydra-hexcore/hydra/preprod'
```

データベース、Docker、JWT、RabbitMQの設定はパートAと同じです。

---

## B5. MySQLの起動

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

---

## B6. ストレージディレクトリの権限設定

```bash
mkdir -p logs
chmod -R 755 logs
mkdir -p /home/user/hydra-hexcore/hydra/preprod
chmod -R 755 /home/user/hydra-hexcore/hydra/preprod
chmod -R 777 /path/to/cardano-node/
chmod 777 /path/to/cardano-node/node.socket
sudo usermod -aG docker $USER
```

---

## B7. プロジェクトの実行

```bash
pnpm build
pnpm start:prod
```

- **API:** `http://localhost:3010`
- **Swagger:** `http://localhost:3010/api-docs`

---

## B8. 管理者アカウントの作成とプロバイダー登録

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

---

## よくあるエラー（Cardano Node）

| エラー                                                   | 原因                               | 解決方法                                           |
| -------------------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `connect ENOENT .../node.socket`                         | Cardano Node未実行または権限未設定 | コンテナが実行中か確認 + `chmod 777 node.socket`   |
| `cardano-cli: Network.Socket.connect: permission denied` | `node.socket`に777権限なし         | `chmod 777 /path/to/node.socket`                   |
| `Failed to query protocol parameters`                    | Cardano Node同期未完了             | 同期完了まで待つ、`docker logs cardano-node`で確認 |

---

詳細な設定、トラブルシューティング、バージョン互換性テーブルについては、[Vietnamese guide](SETUP_GUIDE_VI.md)を参照してください。
