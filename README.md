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

- Node.js 20+
- Docker & Docker Compose
- MySQL 8.0+ or SQLite
- Redis (optional, for caching)
- Cardano Node
- Hydra Node binaries

## 🛠️ Installation

### 1. Clone repository

```bash
git clone <repository-url>
cd hydra-hexcore
```

### 2. Install dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or npm
npm install
```

### 3. Environment configuration

Create a `.env` file and configure environment variables:

```env
# Server Configuration
PORT=3010
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=hexcore
DB_SYNCHRONIZE=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# RabbitMQ Configuration
RABBITMQ_ENABLED=true
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=hexcore.queue
RABBITMQ_PREFETCH_COUNT=1
RABBITMQ_NO_ACK=false
RABBITMQ_QUEUE_DURABLE=true

# Hydra Configuration
NEST_HYDRA_BIN_DIR_PATH=/path/to/hydra/bin
NEST_HYDRA_NODE_IMAGE=ghcr.io/cardano-scaling/hydra-node:0.19.0
NEST_HYDRA_NODE_FOLDER=/path/to/hydra/preprod

# Cardano Configuration
NEST_CARDANO_NODE_SERVICE_NAME=cardano-node
NEST_CARDANO_NODE_IMAGE=ghcr.io/intersectmbo/cardano-node:10.1.4
NEST_CARDANO_NODE_FOLDER=/path/to/cardano-node
NEST_CARDANO_NODE_SOCKER_PATH=/path/to/cardano-node/node.socket

# Docker Configuration
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock
NEST_DOCKER_ENABLE_NETWORK_HOST=true
```

### RabbitMQ connection from ConfigService

```ts
const rabbit = this.configService.get('rabbitmq');

// rabbit = {
//   enabled,
//   uri,
//   queue,
//   prefetchCount,
//   noAck,
//   queueDurable
// }
```

### 4. Run with Docker Compose

```bash
docker-compose up -d
```

### 5. Run development mode

```bash
# Development
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production
pnpm run start:prod
```

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
