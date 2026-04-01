🌐 **Language / 言語 / Ngôn ngữ:** English | [日本語](README_JP.md) | [Tiếng Việt](README_VI.md)

# Hydra HexCore

Hydra HexCore is a backend service built with NestJS for managing and interacting with Hydra Head - a layer 2 scaling solution for the Cardano blockchain. The application provides APIs for managing Hydra nodes, processing transactions, and managing multi-party operations on Cardano.

## 🚀 Key Features

- **Hydra Node Management**: Create and manage Hydra nodes
- **Multi-Party Support**: Support for creating and managing participating parties in Hydra Head
- **Transaction Processing**: Process and submit transactions on the Hydra layer
- **Docker Integration**: Manage Cardano and Hydra containers
- **Database Management**: Data storage with MySQL/SQLite
- **Caching**: Redis caching for performance optimization
- **Authentication**: JWT-based authentication system

## 🏗️ Architecture

The application is divided into main modules:

- **HydraMainModule**: Core Hydra management functionality
- **ShellModule**: Shell command execution utilities
- **AuthModule**: Authentication and authorization

## 📋 System Requirements

- **Node.js** >= 20.x
- **pnpm** (`npm install -g pnpm`)
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- One of:
    - A **Blockfrost** account (easy mode — just an API key), OR
    - A running **Cardano Node** (advanced — requires full node sync)

## 🛠️ Installation & Setup (Quick Start)

The project supports **2 connection modes** to the Cardano network:

|                | Blockfrost Mode             | Cardano Node Mode                          |
| -------------- | --------------------------- | ------------------------------------------ |
| **Difficulty** | ⭐ Easy — only need API key | ⭐⭐⭐ Hard — must run full node           |
| **Requires**   | Blockfrost account          | Running `cardano-node`                     |
| **Pros**       | Fast, no blockchain sync    | No third-party dependency, can run offline |

> 📖 **Full detailed guide:** [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

### 1. Clone & install

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Key environment variables to configure:

```env
# Connection mode: "blockfrost" or "cardano-node"
CARDANO_CONNECTION_MODE=blockfrost

# Blockfrost (if using blockfrost mode)
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0

# Cardano Network
CARDANO_NETWORK='testnet'

# Hydra Node
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='<script-tx-ids-for-your-version-and-network>'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'

# Database
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

# RabbitMQ (optional, enabled after provider approval)
RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue

# Server
PORT=3010
MAX_ACTIVE_NODES=20
LOG_DIR=logs
```

> See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for full explanation of each variable, Hydra Script TX IDs per version/network, and version compatibility tables.

### 3. Start MySQL

```bash
cd configs/mysql-databases && docker compose up -d && cd ../..
```

### 4. Set up directories & permissions

```bash
mkdir -p logs && chmod -R 755 logs
mkdir -p /path/to/hydra/preprod && chmod -R 755 /path/to/hydra/preprod
sudo usermod -aG docker $USER
```

> **Cardano Node mode only:** also run `chmod 777 /path/to/cardano-node/node.socket`

### 5. Build & run

```bash
# Production
pnpm build
pnpm start:prod

# Or development mode
pnpm run start:dev
```

Server starts at: **API** `http://localhost:3010` | **Swagger** `http://localhost:3010/api-docs`

### 6. Create admin account & register provider

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

After approval by the Hub team, you will receive a **HUB API Key** via email — update `HUB_API_KEY` in `.env`.

> See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for full parameter reference, provider update instructions, Cardano Node specific setup, and troubleshooting.

## 📚 API Documentation

### Hydra Management APIs

#### Create Account

```http
POST /hydra/account
Content-Type: application/json

{
  "mnemonic": "your 24-word mnemonic phrase"
}
```

#### Create Party

```http
POST /hydra/party
Content-Type: application/json

{
  "name": "party-name",
  "accountId": "account-id"
}
```

#### Create Hydra Node

```http
POST /hydra/node
Content-Type: application/json

{
  "partyId": "party-id",
  "nodeConfig": { ... }
}
```

#### Commit to Hydra

```http
POST /hydra/commit
Content-Type: application/json

{
  "partyId": "party-id",
  "amount": 1000000
}
```

#### Submit Transaction

```http
POST /hydra/submit-tx
Content-Type: application/json

{
  "partyId": "party-id",
  "transaction": "signed-transaction-cbor"
}
```

### Admin APIs

#### Admin Login

```http
POST /hydra/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

## 📁 Project Structure

```
src/
├── auth/                   # Authentication & authorization
├── common/                 # Common utilities
│   ├── exceptions/         # Custom exceptions
│   └── interceptors/       # Response interceptors
├── config/                 # Configuration files
├── constants/              # Application constants
├── decorators/             # Custom decorators
├── enums/                  # Enums definitions
├── event/                  # Event emitters
├── hydra-main/             # Core Hydra functionality
├── interfaces/             # TypeScript interfaces
├── middlewares/            # Custom middlewares
├── migrations/             # Database migrations
├── proxy/                  # Proxy services
├── shell/                  # Shell command utilities
└── utils/                  # Utility functions
```

## 🔧 NPM Scripts

```bash
# Development
pnpm run start:dev          # Run development server with watch mode
pnpm run start:debug        # Run debug mode

# Build & Production
pnpm run build              # Build application
pnpm run start:prod         # Run production build

# Code Quality
pnpm run lint               # Lint code with ESLint
pnpm run format             # Format code with Prettier

# Database
pnpm run typeorm            # TypeORM CLI commands
```

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t hydra-hexcore .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f hydra-hexcore

# Stop services
docker-compose down
```

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation with class-validator
- Rate limiting (requires additional configuration)
- CORS configuration

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📄 License

UNLICENSED - Private project

## 📞 Support

For support or bug reports, please create an issue on the GitHub repository.

---

**Note**: This is a Hydra Head management application on the Cardano blockchain. Knowledge of Cardano and Hydra is required for effective use.
