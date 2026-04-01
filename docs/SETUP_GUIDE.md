🌐 **Language / 言語 / Ngôn ngữ:** English | [日本語](SETUP_GUIDE_JP.md) | [Tiếng Việt](SETUP_GUIDE_VI.md)

# Hydra Hexcore Installation and Setup Guide

The project supports **2 connection modes** to the Cardano network:

|                  | Blockfrost Mode               | Cardano Node Mode                          |
| ---------------- | ----------------------------- | ------------------------------------------ |
| **Difficulty**   | ⭐ Easy — only API key needed | ⭐⭐⭐ Hard — must run full node           |
| **Requirements** | Blockfrost account            | Successfully running `cardano-node`        |
| **Advantages**   | Fast, no blockchain sync      | No third-party dependency, can run offline |

> Choose **one of the two** modes and follow the corresponding guide below.

---

# Part A — Using Blockfrost

## A1. System Requirements

- **Node.js** >= 20.x
- **pnpm** — install: `npm install -g pnpm`
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- **Blockfrost** account (free registration at [blockfrost.io](https://blockfrost.io))

---

## A2. Clone and Install Dependencies

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## A3. Environment Configuration (.env)

Copy the template file:

```bash
cp .env.example .env
```

Then open the `.env` file and edit the variables according to the guide below.

### A3.1. Cardano Connection Mode → Blockfrost

```dotenv
# Choose connection mode
CARDANO_CONNECTION_MODE=blockfrost

# Get Project ID from https://blockfrost.io/dashboard
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Blockfrost API Base URL (choose correct network: preprod or mainnet)
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
```

> **Note:** When creating a project on Blockfrost, select the **Preprod** network to get the corresponding Project ID.

### A3.2. Hydra Node Configuration

```dotenv
# Cardano network in use: testnet or mainnet
# testnet → use --testnet-magic <NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID>
# mainnet → use --mainnet (ignore NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID)
CARDANO_NETWORK='testnet'

NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### How to Get `NEST_HYDRA_NODE_IMAGE`

See version list at: [https://github.com/cardano-scaling/hydra/releases](https://github.com/cardano-scaling/hydra/releases)

Format: `ghcr.io/cardano-scaling/hydra-node:<version>`

```text
ghcr.io/cardano-scaling/hydra-node:1.2.0   # Recommended
ghcr.io/cardano-scaling/hydra-node:1.1.0
ghcr.io/cardano-scaling/hydra-node:1.0.0
ghcr.io/cardano-scaling/hydra-node:0.21.0
```

#### How to Get `NEST_HYDRA_NODE_SCRIPT_TX_ID`

Each Hydra version publishes **Script TX IDs** for each network. You need to get the correct TX ID corresponding to your version and network.

**Step 1:** Go to the release page for that version:

```text
https://github.com/cardano-scaling/hydra/releases/tag/<version>
```

**Step 2:** Find the **"Hydra Scripts"** section, get the TX IDs for your network (`preview`, `preprod`, or `mainnet`).

**Step 3:** Or access the `networks.json` file directly:

```text
https://raw.githubusercontent.com/cardano-scaling/hydra/<version>/hydra-node/networks.json
```

Quick reference table:

<details>
<summary><b>📋 Hydra v1.2.0 (latest - recommended)</b></summary>

| Network     | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `3c275192a7b5ff199f2f3182f508e10f7e1da74a50c4c673ce0588b8c621ed45,`<br>`6f8a4b6404d4fdd0254507e95392fee6a983843eb168f9091192cbec2b99f83d,`<br>`60d61b2f10897bf687de440a0a8b348a57b1fc3786b7b8b1379a65ace1de199a` |
| **preprod** | `ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,`<br>`ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,`<br>`4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3` |
| **mainnet** | `e2512f44bb43f9c44dc3db495ce6a8ba6db6d8afaad2e3494b32d591845fb259,`<br>`a5e683efe3acd02b7a1d0c13d1517672b2c78a74abd08dd455c34290150ea4d7,`<br>`d0f70c628778a7d2e71ab366ad6112890b5fa5596ef553bc18accf66875af203` |

</details>

<details>
<summary><b>📋 Hydra v1.1.0</b></summary>

| Network     | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `ee449c99464c5419954f39b98e513b17406e24c9883e6342e073006e54878524,`<br>`d6e03afa86cf1d74011ba234ec32fbd102d4332c3891a49419dae318281bc96a,`<br>`0b32f7cf144090b3a2d6787cb5b4cabbc0a72c1ae77bf72de8e3d9aa9476bfb7` |
| **preprod** | `407bf714186db790f2624701b2e065850dd7b7cf998c931222d99a56d8ad256b,`<br>`4cae9ad9c1cc4f82ce2fd51f9e1155a37ac88957f81128ba1c51bc7c6734ce6c,`<br>`a3a27a3049be1fe931a0d99bf132a88b848b12dc50f50856cb86e12bb135f5d2` |
| **mainnet** | `f6ef3adbfdc6a6cbf63ec160cc9a61ca58ce63a0ba52f8f3fe6b5acb19e14ab8,`<br>`a699520a621bcc73918cf52ad8dfb097481573a43b9fb704f2b91df4ee56502c,`<br>`6a9562c2fce83951f90e72df8d7ecc9e2db48f3202ba15a55622474975c069b9` |

</details>

<details>
<summary><b>📋 Hydra v1.0.0</b></summary>

| Network     | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `08fea9f21fec08d47dd56cd632ece001616b247f6e2e893f98dcf1e69ddb58d0,`<br>`c6ba286b501c076ee494b4686e681c5aab8f903d930e8366dcbca1c3530264ee,`<br>`ed6b3ff639fb99b18916dd14b9837d893b1a053af38a27f604a7cdf543b86f6c` |
| **preprod** | `e10437a6913ca5f708c3f15cc6f06792b85459f32883c9ed3fac5659f2ba383f,`<br>`f217f72b3202ab0299e700e69094452ce177ecbc90daa461abceff7b32fb9898,`<br>`05ba60bb792572428a0128f655c6ec67966000886132697ed02d884b69fce472` |
| **mainnet** | `84cde037c71b6cb80755738459f63fb1c7cdea22beff1cb8e23cd7f9916f5696,`<br>`2a725d14075e4ce325569bcf6d0b4c98d9f5495b4bfa2d32de70c5ea4611b7cf,`<br>`d0e542221a0e1949b0d79e8ebdf987395dce097411a89e886bb897408c2cc878` |

</details>

<details>
<summary><b>📋 Hydra v0.21.0</b></summary>

| Network     | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `bdf8a262cd5e7c8f4961aed865c026d5b6314b22a4bc31e981363b5bb50d1da6,`<br>`0dbb43e152647c729c365aa18fce20133a212c6b43252fa25dbb7c0cf65ae011,`<br>`54aec058e43e5cfe5161e8f97cc43f4601da180dc8ac13f3f39eb2fa08148a01` |
| **preprod** | `557b6a6eaf6177407757cb82980ebc5b759b150ccfd329e1d8f81bbd16fecb01,`<br>`98e1a40224c5ed8eaff5fc1f865d89af47ae89fd4adc1c37fc80dfd901b0caf2,`<br>`8fbdf7de4934ca4d22ed9cfac0f6e2566990751b6f4b944470dafabbd079b965` |
| **mainnet** | `b5d5fa4d367005bdd6449dcca049aa61aa8b59a907231b03bb006eda01e8e73a,`<br>`696ec03023309d8e75f983d4285880dcfcfac58c06808e0191ef075f10034212,`<br>`48e09f38b208f4f30b1fe29232f450cfea88ffc9393ac34b1069dddce2758e8d` |

</details>

> **Important:** Script TX IDs **must match** the Docker Image version (`NEST_HYDRA_NODE_IMAGE`). For example: using image `1.2.0` requires TX IDs from version `1.2.0`.

#### How to Choose `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`

| Network               | Value                                        |
| --------------------- | -------------------------------------------- |
| **Preview** (testnet) | `2`                                          |
| **Preprod** (testnet) | `1`                                          |
| **Mainnet**           | Not needed (use `CARDANO_NETWORK='mainnet'`) |

> When `CARDANO_NETWORK='mainnet'`, the system automatically uses `--mainnet` and ignores this variable.

Example full configuration for **Preprod** network:

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### Version Compatibility Table

| Hydra Version | cardano-node | cardano-cli |
| ------------- | ------------ | ----------- |
| **1.2.0**     | 10.5.3       | 10.11.0.0   |
| **1.1.0**     | —            | —           |
| **1.0.0**     | 10.4.1       | 10.8.0.0    |
| **0.21.0**    | 10.1.4       | 10.1.1.0    |

### A3.3. Database Configuration (MySQL)

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true
```

### A3.4. Docker Configuration

```dotenv
# Linux / macOS
NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'
```

### A3.5. JWT & Hydra Hub Configuration

```dotenv
# Secret key for JWT signing (use a sufficiently long random string)
JWT_SECRET=your_jwt_secret_key

# Hydra Hub API Base URL
# dev:  https://dev-api.hydrahub.io.vn/
# uat:  https://uat-api.hydrahub.io.vn/
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/

# API Key — sent via email after provider is approved by Hydra Hub Team
HUB_API_KEY=your_hub_api_key
```

### A3.6. Limits & Other Configuration

```dotenv
# Number of Hydra Nodes that can be active simultaneously
MAX_ACTIVE_NODES=20
```

### A3.7. Port & Log

```dotenv
PORT=3010
LOG_DIR=logs
```

### A3.8. RabbitMQ Configuration

The system uses **RabbitMQ** to communicate metrics with **Hydra Hub**. Connection information will be **sent via email** when the provider is approved.

```dotenv
# Enable/disable RabbitMQ connection (default: false)
RABBITMQ_ENABLED=false

# Values below are provided via email when provider is approved
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue

# Self-configured values
RABBITMQ_PREFETCH_COUNT=1
RABBITMQ_NO_ACK=false
RABBITMQ_QUEUE_DURABLE=true
```

| Environment Variable      | Default Value                       | Source      | Description                                  |
| ------------------------- | ----------------------------------- | ----------- | -------------------------------------------- |
| `RABBITMQ_ENABLED`        | `false`                             | Self-config | Enable/disable RabbitMQ connection           |
| `RABBITMQ_URI`            | `amqp://guest:guest@localhost:5672` | **Email**   | AMQP connection URI (user, pass, host, port) |
| `RABBITMQ_EXCHANGE`       | `provider.metrics`                  | **Email**   | Topic exchange name                          |
| `RABBITMQ_QUEUE`          | `hexcore.queue`                     | **Email**   | Queue name                                   |
| `RABBITMQ_PREFETCH_COUNT` | `1`                                 | Self-config | Number of messages to prefetch per consumer  |
| `RABBITMQ_NO_ACK`         | `false`                             | Self-config | Auto-acknowledge messages                    |
| `RABBITMQ_QUEUE_DURABLE`  | `true`                              | Self-config | Queue persists after RabbitMQ restart        |

> **Note:** `RABBITMQ_URI`, `RABBITMQ_EXCHANGE`, `RABBITMQ_QUEUE` will be sent via email after provider approval. Do not change without guidance from Hub.

---

## A4. Start MySQL with Docker Compose

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

After startup:

| Service | Host      | Port | Username     | Password         |
| ------- | --------- | ---- | ------------ | ---------------- |
| MySQL   | localhost | 3327 | hexcore_user | hexcore_password |

> Ensure the `.env` file has correct `DB_PORT=3327` and `DB_PASSWORD=hexcore_password`.

---

## A5. Directory Permissions

```bash
# Create logs directory
mkdir -p logs
chmod -R 755 logs

# Create directory for Hydra Node data (persistence and keys)
mkdir -p /path/to/hydra/preprod
chmod -R 755 /path/to/hydra/preprod

# Allow Docker socket access (add user to docker group)
sudo usermod -aG docker $USER
```

> Replace `/path/to/hydra/preprod` with the path configured in `NEST_HYDRA_NODE_FOLDER`.

---

## A6. Run the Project

```bash
pnpm build
pnpm start:prod
```

Server starts at:

- **API:** `http://localhost:3010`
- **Swagger:** `http://localhost:3010/api-docs`

---

## A7. Create Admin Account & Register Provider

After the server is running and database is synced, run the following command to create admin and register provider with Hydra Hub:

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

**Parameter Explanation:**

| Parameter            | Required | Description                                                          |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `--username=`        | ✅       | Login username for admin account                                     |
| `--password=`        | ✅       | Admin password — minimum **8 characters**, use strong password       |
| `--ip=`              | ✅       | Server's public IPv4 address (e.g., `1.2.3.4`)                       |
| `--provider-name=`   | ✅       | Provider's display name on Hydra Hub                                 |
| `--logo-url=`        | ❌       | Provider's logo image URL                                            |
| `--provider-url=`    | ❌       | Provider/company website URL                                         |
| `--connection-type=` | ✅       | Connection mode: `blockfrost` or `cardano_node`                      |
| `--network=`         | ✅       | Cardano network: `mainnet`, `preprod`, or `preview`                  |
| `--hexcore-url=`     | ✅       | Provider's public API domain (e.g., `https://api.example.com`)       |
| `--email=`           | ✅       | Email to receive **HUB API Key** — Hub will send key to this address |

When run successfully, the seeder will:

1. Delete all old users and create a new admin account in the database
2. Automatically login and get **Access Token**
3. Send information to **Hydra Hub** to register provider
4. Hub team approves → **HUB API Key** will be sent to `--email=`

> **About HUB API Key:** This key is used to authenticate requests from Hub to your server. After receiving it, update `.env` with the `HUB_API_KEY` variable.

Example output when successful:

```text
Starting create account admin seeder...
  ✓ Admin account created with username: admin
Access token: eyJhbGciOi...
ID: 1
Code: PRV-XXXX
Name: My Provider
Logo Url: https://example.com/logo.png
Url: https://example.com
Is Verified: false
IP: 1.2.3.4
Connection Type: blockfrost
Network: preprod
Domain: https://api.example.com
Access Token: eyJhbGciOi...
Webhook Key: whk_XXXX...
Email: contact@example.com
Process finished successfully.
```

> **Note:** The seeder will **delete all old users** before creating a new admin. Ensure `HYDRA_HUB_API_BASE_URL` is correctly configured in `.env`.

### A7.1. Update Provider Information

If you need to change provider information (name, URL, logo, ...), run the seeder command again with new parameters. **Keep the same `--ip=`** so the system recognizes this as an update to the existing provider, not a new registration:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_new_password \
  --ip=1.2.3.4 \
  --provider-name="My Updated Provider" \
  --logo-url=https://example.com/new-logo.png \
  --provider-url=https://example.com \
  --connection-type=blockfrost \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

> **Note:**
>
> - If `--ip=` is changed to a different IP than currently registered, the system will treat it as a **new provider**.
> - After updating, you still need to wait for Hub Team **re-approval**. If approved, the HUB API Key and related configurations may be updated and sent again via email.

---

## A8. Using the API _(optional)_

After provider approval:

1. Access **Swagger UI** at `http://localhost:3010/api-docs`
2. Login with admin account to get JWT token
3. Use the token to call Hydra Head management APIs

---

## Quick Steps Summary (Blockfrost)

```bash
# 1. Install
pnpm install

# 2. Configure .env
cp .env.example .env
# Edit .env according to guide above

# 3. Start database
cd configs/mysql-databases && docker compose up -d && cd ../..

# 4. Set directory permissions
mkdir -p logs && chmod -R 755 logs

# 5. Run server
pnpm build
pnpm start:prod

# 6. Create admin & register provider (open another terminal)
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

## Common Errors (Blockfrost)

| Error                                     | Cause                             | Solution                                                |
| ----------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| `BlockFrost API configuration is missing` | Blockfrost not configured         | Check `BLOCKFROST_PROJECT_ID` in `.env`                 |
| `ECONNREFUSED 127.0.0.1:3309`             | MySQL not running                 | Run `docker compose up -d` in `configs/mysql-databases` |
| `EACCES: permission denied`               | No write permission for directory | Run `chmod -R 755` on the corresponding directory       |
| `connect ENOENT /var/run/docker.sock`     | Docker daemon not running         | Start Docker service                                    |
| `ECONNREFUSED 127.0.0.1:5672` (RabbitMQ)  | RabbitMQ not running or wrong URI | Check RabbitMQ service and `RABBITMQ_URI` in `.env`     |

---

# Part B — Using Cardano Node

> ⚠️ **Prerequisites:** You need experience installing and running `cardano-node`. If not, try **Part A** (Blockfrost) first.

## B1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## B2. Run Cardano Node

Before continuing, ensure you understand the following about your running Cardano Node:

- **Container name** (or how to call `cardano-cli`)
- **Directory path** containing `node.socket` and `shelley-genesis.json` on the host machine
- **`node.socket` path** inside the container

> **Important:** You must wait for cardano-node to **finish syncing the blockchain** before proceeding. This process can take **several hours to several days** depending on the network.
>
> ```bash
> # Monitor sync progress
> docker logs -f cardano-node
> ```

Check sync status:

```bash
docker exec cardano-node cardano-cli query tip \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

When `syncProgress` returns `"100.00"`, sync is complete.

---

## B3. Set Permissions for `node.socket`

Permission `777` is required so Hydra Node container can access the socket:

```bash
# Set permission for node.socket file only
chmod 777 /path/to/cardano-node/node.socket

# Set permission for entire cardano-node directory
chmod -R 777 /path/to/cardano-node/
```

If using the project's default Docker Compose:

```bash
chmod 777 configs/cardano/node.socket
chmod -R 777 configs/cardano/
```

> ⚠️ If you skip this step, Hydra Node will report `permission denied` or `ENOENT node.socket` error when activating head.

---

## B4. Environment Configuration (.env)

```bash
cp .env.example .env
```

### Connection Mode → Cardano Node

```dotenv
CARDANO_CONNECTION_MODE=cardano-node

# Cardano network: testnet or mainnet
CARDANO_NETWORK='testnet'
```

### Cardano Node Configuration

```dotenv
# cardano-node container name (must match container_name in docker-compose)
NEST_CARDANO_NODE_SERVICE_NAME='cardano-node'

# cardano-node Docker image (see compatibility table below)
NEST_CARDANO_NODE_IMAGE='ghcr.io/intersectmbo/cardano-node:10.2.1'

# ABSOLUTE path to directory containing cardano-node config files on host
# (this directory contains node.socket, shelley-genesis.json, config.json, ...)
# Will be mounted to /cardano-node inside Hydra container
NEST_CARDANO_NODE_FOLDER='/home/user/hydra-hexcore/configs/cardano'

# ABSOLUTE path to node.socket file on host
NEST_CARDANO_NODE_SOCKET_PATH='/home/user/hydra-hexcore/configs/cardano/node.socket'
```

### Hydra Node Configuration

For Script TX ID and Network ID, see [A3.2](#a32-hydra-node-configuration).

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/home/user/hydra-hexcore/hydra/preprod'
```

#### Version Compatibility Table (Cardano Node)

| Hydra Version | cardano-node | cardano-cli |
| ------------- | ------------ | ----------- |
| **1.2.0**     | 10.5.3       | 10.11.0.0   |
| **1.1.0**     | —            | —           |
| **1.0.0**     | 10.4.1       | 10.8.0.0    |
| **0.21.0**    | 10.1.4       | 10.1.1.0    |

### Database, Docker, JWT, RabbitMQ (same as Part A)

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true

NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'

JWT_SECRET=your_jwt_secret_key
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/
HUB_API_KEY=your_hub_api_key

MAX_ACTIVE_NODES=20
PORT=3010
LOG_DIR=logs

RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue
RABBITMQ_PREFETCH_COUNT=1
RABBITMQ_NO_ACK=false
RABBITMQ_QUEUE_DURABLE=true
```

> See [A3.8](#a38-rabbitmq-configuration) for detailed explanation of RabbitMQ variables. Values for `RABBITMQ_URI`, `RABBITMQ_EXCHANGE`, `RABBITMQ_QUEUE` are provided via email when provider is approved.

> **Note:** All paths in `.env` **must be absolute paths** as they are used to mount into Docker containers.

---

## B5. How the System Works with Cardano Node

### 1) Query protocol parameters via `cardano-cli`

When activating Hydra Head, the system executes:

```bash
docker exec cardano-node cardano-cli query protocol-parameters \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

- `cardano-node` — container name (= `NEST_CARDANO_NODE_SERVICE_NAME`)
- `/workspace/node.socket` — socket path **inside** container (mounted from `configs/cardano/` → `/workspace/`)
- `--testnet-magic 1` — Network Magic (1 = Preprod, 2 = Preview). If `CARDANO_NETWORK='mainnet'`, uses `--mainnet`.

### 2) Volume mounts for Hydra container

```text
Host (local machine)                          →  Hydra Container
────────────────────────────────────────────────────────────────
NEST_HYDRA_NODE_FOLDER   (/home/user/hydra)   →  /data
NEST_CARDANO_NODE_FOLDER (/home/user/cardano) →  /cardano-node
```

Hydra Node accesses cardano-node socket via `/cardano-node/node.socket`.

Requirements to ensure:

- `NEST_CARDANO_NODE_FOLDER` points to directory containing `node.socket` on host machine
- `node.socket` file must have `777` permissions

---

## B6. Start MySQL

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

---

## B7. Storage Directory Permissions

```bash
# Logs directory
mkdir -p logs
chmod -R 755 logs

# Hydra data directory (persistence and keys)
mkdir -p /home/user/hydra-hexcore/hydra/preprod
chmod -R 755 /home/user/hydra-hexcore/hydra/preprod

# cardano-node directory (contains config and node.socket)
chmod -R 777 /path/to/cardano-node/
chmod 777 /path/to/cardano-node/node.socket

# Add user to docker group
sudo usermod -aG docker $USER
```

---

## B8. Run the Project

```bash
pnpm build
pnpm start:prod
```

- **API:** `http://localhost:3010`
- **Swagger:** `http://localhost:3010/api-docs`

---

## B9. Create Admin Account & Register Provider

After the server is running and database is synced, run the following command to create admin and register provider with Hydra Hub:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --logo-url=https://example.com/logo.png \
  --provider-url=https://example.com \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

**Parameter Explanation:**

| Parameter            | Required | Description                                                          |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `--username=`        | ✅       | Login username for admin account                                     |
| `--password=`        | ✅       | Admin password — minimum **8 characters**, use strong password       |
| `--ip=`              | ✅       | Server's public IPv4 address (e.g., `1.2.3.4`)                       |
| `--provider-name=`   | ✅       | Provider's display name on Hydra Hub                                 |
| `--logo-url=`        | ❌       | Provider's logo image URL                                            |
| `--provider-url=`    | ❌       | Provider/company website URL                                         |
| `--connection-type=` | ✅       | Connection mode: `blockfrost` or `cardano_node`                      |
| `--network=`         | ✅       | Cardano network: `mainnet`, `preprod`, or `preview`                  |
| `--hexcore-url=`     | ✅       | Provider's public API domain (e.g., `https://api.example.com`)       |
| `--email=`           | ✅       | Email to receive **HUB API Key** — Hub will send key to this address |

When run successfully, the seeder will:

1. Delete all old users and create a new admin account in the database
2. Automatically login and get **Access Token**
3. Send information to **Hydra Hub** to register provider
4. Hub team approves → **HUB API Key** will be sent to `--email=`

> **About HUB API Key:** This key is used to authenticate requests from Hub to your server. After receiving it, update `.env` with the `HUB_API_KEY` variable.

Example output when successful:

```text
Starting create account admin seeder...
  ✓ Admin account created with username: admin
Access token: eyJhbGciOi...
ID: 1
Code: PRV-XXXX
Name: My Provider
Logo Url: https://example.com/logo.png
Url: https://example.com
Is Verified: false
IP: 1.2.3.4
Connection Type: cardano_node
Network: preprod
Domain: https://api.example.com
Access Token: eyJhbGciOi...
Webhook Key: whk_XXXX...
Email: contact@example.com
Process finished successfully.
```

> **Note:** The seeder will **delete all old users** before creating a new admin. Ensure `HYDRA_HUB_API_BASE_URL` is correctly configured in `.env`.

### B9.1. Update Provider Information

If you need to change provider information (name, URL, logo, ...), run the seeder command again with new parameters. **Keep the same `--ip=`** so the system recognizes this as an update to the existing provider, not a new registration:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_new_password \
  --ip=1.2.3.4 \
  --provider-name="My Updated Provider" \
  --logo-url=https://example.com/new-logo.png \
  --provider-url=https://example.com \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

> **Note:**
>
> - If `--ip=` is changed to a different IP than currently registered, the system will treat it as a **new provider**.
> - After updating, you still need to wait for Hub Team **re-approval**. If approved, the HUB API Key and related configurations may be updated and sent again via email.

---

## Quick Steps Summary (Cardano Node)

```bash
# 1. Install
pnpm install

# 2. Run Cardano Node (if not already running)
cd configs/cardano && docker compose up -d && cd ../..
# Wait for sync: docker exec cardano-node cardano-cli query tip --socket-path /workspace/node.socket --testnet-magic 1

# 3. Set node.socket permissions
chmod 777 /path/to/cardano/node.socket
chmod -R 777 /path/to/cardano/

# 4. Configure .env
cp .env.example .env
# Edit: CARDANO_CONNECTION_MODE=cardano-node + NEST_CARDANO_NODE_* variables

# 5. Start database
cd configs/mysql-databases && docker compose up -d && cd ../..

# 6. Set directory permissions
mkdir -p logs && chmod -R 755 logs

# 7. Run server
pnpm build
pnpm start:prod

# 8. Create admin & register provider (open another terminal)
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://your-domain.com \
  --email=contact@example.com
```

---

## Common Errors (Cardano Node)

| Error                                                    | Cause                                      | Solution                                                        |
| -------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `connect ENOENT .../node.socket`                         | Cardano Node not running or no permissions | Check container is running + `chmod 777 node.socket`            |
| `cardano-cli: Network.Socket.connect: permission denied` | `node.socket` doesn't have 777 permissions | `chmod 777 /path/to/node.socket`                                |
| `Failed to query protocol parameters`                    | Cardano Node not synced yet                | Wait for sync to complete, check `docker logs cardano-node`     |
| `OCI runtime exec failed: container_name not found`      | Container name is incorrect                | Check `NEST_CARDANO_NODE_SERVICE_NAME` matches `container_name` |
| `No such file or directory: /cardano-node/node.socket`   | `NEST_CARDANO_NODE_FOLDER` has wrong path  | Check absolute path and that `node.socket` file exists          |
| `ECONNREFUSED 127.0.0.1:5672` (RabbitMQ)                 | RabbitMQ not running or wrong URI          | Check RabbitMQ service and `RABBITMQ_URI` in `.env`             |
