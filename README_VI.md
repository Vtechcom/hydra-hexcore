🌐 **Language / 言語 / Ngôn ngữ:** [English](README.md) | [日本語](README_JP.md) | Tiếng Việt

# Hydra HexCore

Hydra HexCore là một backend service được xây dựng với NestJS để quản lý và tương tác với Hydra Head - một giải pháp layer 2 scaling cho blockchain Cardano. Ứng dụng cung cấp APIs để quản lý Hydra nodes, xử lý transactions, và quản lý multi-party operations trên Cardano.

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

- **Node.js** >= 20.x
- **pnpm** (`npm install -g pnpm`)
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- Một trong hai:
    - Tài khoản **Blockfrost** (dễ — chỉ cần API key), HOẶC
    - **Cardano Node** đang chạy (nâng cao — cần sync full node)

## 🛠️ Cài đặt & Thiết lập (Nhanh)

Dự án hỗ trợ **2 chế độ kết nối** vào mạng Cardano:

|             | Chế độ Blockfrost                | Chế độ Cardano Node                            |
| ----------- | -------------------------------- | ---------------------------------------------- |
| **Độ khó**  | ⭐ Dễ — chỉ cần API key          | ⭐⭐⭐ Khó — phải tự chạy full node            |
| **Yêu cầu** | Tài khoản Blockfrost             | `cardano-node` đang chạy                       |
| **Ưu điểm** | Nhanh, không cần sync blockchain | Không phụ thuộc bên thứ 3, có thể chạy offline |

> 📖 **Hướng dẫn chi tiết đầy đủ:** [docs/SETUP_GUIDE_VI.md](docs/SETUP_GUIDE_VI.md)

### 1. Clone & cài đặt

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Các biến môi trường chính cần cấu hình:

```env
# Chế độ kết nối: "blockfrost" hoặc "cardano-node"
CARDANO_CONNECTION_MODE=blockfrost

# Blockfrost (nếu dùng chế độ blockfrost)
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0

# Mạng Cardano
CARDANO_NETWORK='testnet'

# Hydra Node
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='<script-tx-ids-tương-ứng-version-và-network>'
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

# RabbitMQ (tùy chọn, bật sau khi provider được duyệt)
RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue

# Server
PORT=3010
MAX_ACTIVE_NODES=20
LOG_DIR=logs
```

> Xem giải thích đầy đủ từng biến, Hydra Script TX IDs theo version/network, và bảng tương thích phiên bản tại [docs/SETUP_GUIDE_VI.md](docs/SETUP_GUIDE_VI.md).

### 3. Khởi chạy MySQL

```bash
cd configs/mysql-databases && docker compose up -d && cd ../..
```

### 4. Thiết lập thư mục & phân quyền

```bash
mkdir -p logs && chmod -R 755 logs
mkdir -p /path/to/hydra/preprod && chmod -R 755 /path/to/hydra/preprod
sudo usermod -aG docker $USER
```

> **Chỉ với chế độ Cardano Node:** cần chạy thêm `chmod 777 /path/to/cardano-node/node.socket`

### 5. Build & chạy

```bash
# Production
pnpm build
pnpm start:prod

# Hoặc development mode
pnpm run start:dev
```

Server khởi chạy tại: **API** `http://localhost:3010` | **Swagger** `http://localhost:3010/api-docs`

### 6. Tạo tài khoản admin & đăng ký provider

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

Sau khi được Hub team phê duyệt, bạn sẽ nhận **HUB API Key** qua email — cập nhật `HUB_API_KEY` trong `.env`.

> Xem chi tiết tham số, hướng dẫn cập nhật provider, cấu hình riêng cho Cardano Node, và xử lý lỗi tại [docs/SETUP_GUIDE_VI.md](docs/SETUP_GUIDE_VI.md).

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
