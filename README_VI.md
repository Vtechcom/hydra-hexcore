# Hydra HexCore

Hydra HexCore là một backend service được xây dựng với NestJS để quản lý và tương tác với Hydra Head - một giải pháp layer 2 scaling cho blockchain Cardano. Ứng dụng cung cấp APIs để quản lý Hydra nodes, xử lý transactions, và quản lý multi-party gaming trên Cardano.

## 🚀 Tính năng chính

- **Hydra Node Management**: Tạo và quản lý các Hydra nodes
- **Multi-Party Support**: Hỗ trợ tạo và quản lý các bên tham gia (parties) trong Hydra Head
- **Transaction Processing**: Xử lý và submit transactions trên Hydra layer
- **Docker Integration**: Quản lý Cardano và Hydra containers
- **Database Management**: Lưu trữ dữ liệu với MySQL/SQLite
- **Caching**: Redis caching cho performance optimization
- **Authentication**: JWT-based authentication system

## 🏗️ Kiến trúc

Ứng dụng được chia thành các modules chính:

- **HydraMainModule**: Core Hydra management functionality
- **ShellModule**: Shell command execution utilities
- **AuthModule**: Authentication và authorization

## 📋 Yêu cầu hệ thống

- Node.js 20+
- Docker & Docker Compose
- MySQL 8.0+ hoặc SQLite
- Redis (optional, for caching)
- Cardano Node
- Hydra Node binaries

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd hydra-hexcore
```

### 2. Cài đặt dependencies

```bash
# Sử dụng pnpm (recommended)
pnpm install

# Hoặc npm
npm install
```

### 3. Cấu hình environment

Tạo file `.env` và cấu hình các biến môi trường:

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

### 4. Chạy với Docker Compose

```bash
docker-compose up -d
```

### 5. Chạy development mode

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

#### Tạo Account
```http
POST /hydra/account
Content-Type: application/json

{
  "mnemonic": "your 24-word mnemonic phrase"
}
```

#### Tạo Party
```http
POST /hydra/party
Content-Type: application/json

{
  "name": "party-name",
  "accountId": "account-id"
}
```

#### Tạo Hydra Node
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

## 📁 Cấu trúc dự án

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

## 🔧 Scripts NPM

```bash
# Development
pnpm run start:dev          # Chạy development server với watch mode
pnpm run start:debug        # Chạy debug mode

# Build & Production
pnpm run build              # Build ứng dụng
pnpm run start:prod         # Chạy production build

# Code Quality
pnpm run lint               # Lint code với ESLint
pnpm run format             # Format code với Prettier

# Database
pnpm run typeorm            # TypeORM CLI commands
```

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t hydra-hexcore .

# Run với Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f hydra-hexcore

# Stop services
docker-compose down
```

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation với class-validator
- Rate limiting (cần cấu hình thêm)
- CORS configuration

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

UNLICENSED - Private project

## 📞 Hỗ trợ

Để được hỗ trợ hoặc báo cáo bug, vui lòng tạo issue trên GitHub repository.

---

**Lưu ý**: Đây là một ứng dụng quản lý Hydra Head trên Cardano blockchain. Cần có kiến thức về Cardano và Hydra để sử dụng hiệu quả.
