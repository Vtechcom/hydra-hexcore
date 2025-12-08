# Hydra Hexcore - Project Overview

**Generated:** December 8, 2025  
**Version:** 0.0.1  
**Project Type:** Backend API (NestJS)  
**Focus:** Cardano Hydra L2 Node Management Platform

---

## 📋 Executive Summary

Hydra Hexcore is a comprehensive backend service built with NestJS for managing and orchestrating Hydra Head nodes on the Cardano blockchain. The platform provides RESTful APIs and WebSocket gateways for creating, configuring, and managing multi-party Hydra nodes with full Docker containerization support.

**Core Value Proposition:**
- Simplifies Hydra node deployment and management
- Enables multi-party Hydra Head operations
- Provides Cardano blockchain integration via Ogmios
- Manages wallet accounts and cryptographic keys securely
- Offers real-time node monitoring and control

---

## 🏗️ Architecture Overview

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Framework** | NestJS | 10.x | Backend framework |
| **Language** | TypeScript | 5.1+ | Type-safe development |
| **Database** | MySQL | 8.0+ | Primary data store |
| **Database (Alt)** | SQLite | 5.1+ | Alternative lightweight DB |
| **Cache** | Redis | Latest | Performance optimization |
| **ORM** | TypeORM | 0.3.20 | Database abstraction |
| **Container** | Docker/Dockerode | 4.0+ | Node containerization |
| **WebSocket** | Socket.IO | 4.8+ | Real-time communication |
| **Blockchain SDK** | @hydra-sdk/core | 1.1.0 | Hydra protocol integration |
| **Cardano SDK** | @emurgo/cardano-serialization-lib | 13.2.0 | Cardano primitives |
| **Ogmios Client** | @cardano-ogmios/client | 6.13.0 | Cardano node query |
| **Authentication** | Passport JWT | 4.0+ | Token-based auth |
| **Logging** | Winston | 3.18+ | Structured logging |
| **Validation** | class-validator | 0.14+ | DTO validation |

### Architecture Pattern

**Layered Architecture with Domain-Driven Design**

```
┌─────────────────────────────────────────┐
│          API Layer (Controllers)         │
│  - REST Endpoints                        │
│  - WebSocket Gateways                    │
│  - Request Validation                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Business Logic (Services)         │
│  - HydraMainService                      │
│  - HydraAdminService                     │
│  - OgmiosClientService                   │
│  - ShellService                          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Data Access Layer (TypeORM)        │
│  - Entity Models                         │
│  - Repositories                          │
│  - Migrations                            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        External Integrations            │
│  - Docker Engine API                     │
│  - Cardano Node (via Ogmios)            │
│  - Hydra Node Containers                │
│  - Redis Cache                           │
└─────────────────────────────────────────┘
```

---

## 🎯 Core Modules

### 1. HydraMainModule
**Purpose:** Core Hydra node and party management

**Key Components:**
- `HydraMainService` - Node lifecycle management, Docker orchestration
- `HydraAdminService` - Administrative operations, user management
- `OgmiosClientService` - Cardano blockchain queries via Ogmios
- `HydraMainController` - REST API endpoints
- `HydraMainGateway` - WebSocket real-time updates

**Entities:**
- `HydraNode` - Hydra node configuration and state
- `Account` - Cardano wallet accounts for nodes
- `HydraParty` - Multi-party Hydra Head configuration
- `User` - Admin users with role-based access

**Key Features:**
- Create and configure Hydra nodes
- Manage Cardano wallet accounts
- Create multi-party Hydra Heads
- Start/stop/monitor node containers
- Query blockchain state via Ogmios
- Real-time Hydra event processing via WebSocket
- Transaction monitoring and Head state tracking

### 2. ShellModule
**Purpose:** Shell command execution utilities

**Key Components:**
- `ShellService` - Execute system commands safely

**Use Cases:**
- Hydra node CLI operations
- Docker container management
- System health checks

### 3. AuthModule
**Purpose:** Authentication and authorization

**Components:**
- JWT-based authentication
- Role-based access control (RBAC)
- Admin, User roles
- Socket authentication for WebSockets

**Guards:**
- `AdminAuthGuard` - Admin-only routes
- `RoleGuard` - Role-based access
- `SocketGuard` - WebSocket authentication

---

## 📊 Data Model

### Core Entities

#### HydraNode
```typescript
- id: number (PK)
- description: string
- port: number (unique)
- skey: string (encrypted signing key)
- vkey: string (verification key)
- cardanoAccount: Account (FK)
- party: HydraParty (FK)
- createdAt: string
```

#### Account
```typescript
- id: number (PK)
- baseAddress: string (unique)
- pointerAddress: string (unique)
- mnemonic: string (encrypted)
- createdAt: string
```

#### HydraParty
```typescript
- id: number (PK)
- description: string
- nodes: number (party size)
- status: ACTIVE | INACTIVE
- createdAt: string
- hydraNodes: HydraNode[] (1:many)
```

#### User
```typescript
- id: number (PK)
- username: string
- password: string (hashed)
- role: Role (ADMIN | USER)
```

### Relationships
- **HydraNode** → **Account**: Many-to-One (each node uses one account)
- **HydraNode** → **HydraParty**: Many-to-One (multiple nodes form a party)
- **HydraParty** → **HydraNode**: One-to-Many (one party contains multiple nodes)

---

## 🔌 API Endpoints

### Hydra Management (`/hydra-main`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Authenticate admin user | No |
| GET | `/auth` | Verify authentication | Yes |
| GET | `/node-info` | Get Cardano node information | Yes |
| POST | `/create-account` | Create Cardano wallet account | Yes |
| GET | `/list-account` | List all accounts | Yes |
| POST | `/create-node` | Create new Hydra node | Yes |
| GET | `/hydra-nodes` | List all Hydra nodes | Yes |
| GET | `/hydra-node/:id` | Get specific node details | Yes |
| POST | `/create-party` | Create multi-party Hydra Head | Yes |
| GET | `/list-party` | List all parties | Yes |
| POST | `/active-party` | Activate Hydra party (start nodes) | Yes |
| POST | `/deactive-party` | Deactivate party (stop nodes) | Yes |
| POST | `/clear-party-data` | Clear party data | Yes |
| GET | `/utxo/:address` | Query UTXOs for address | Yes |
| GET | `/active-nodes` | Get active node containers | Yes |

### Ogmios Integration (`/ogmios`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/test` | Test Ogmios connection |
| GET | `/protocol-parameters` | Get protocol parameters |
| GET | `/protocol-parameters-simple` | Get simplified protocol params |
| GET | `/health` | Ogmios health check |
| GET | `/query-tip` | Query blockchain tip |
| GET | `/addresses/utxo` | Query multiple addresses UTXOs |
| GET | `/address/:address/utxo` | Query specific address UTXOs |
| GET | `/tx/:txHash/utxo` | Query transaction UTXOs |
| GET | `/txs` | Get transaction history |

### Health & Monitoring (`/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root |
| GET | `/health` | Service health check |
| GET | `/test-logger` | Test logging system |

---

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Token expiration: 1 day
- Password hashing with bcryptjs
- Role-based access control (Admin, User)

### Data Protection
- Encrypted storage of private keys (skey)
- Encrypted mnemonic phrases
- Class-transformer @Exclude for sensitive fields
- Environment-based configuration

### API Security
- Guard-protected routes
- Admin-only endpoints
- Input validation with class-validator
- CORS configuration

---

## 🐳 Docker Integration

### Container Management
- **Technology:** Dockerode library
- **Capabilities:**
  - Start/stop Hydra node containers
  - Monitor container health
  - Network configuration
  - Volume management

### Container Architecture
```
┌──────────────────────────────────────┐
│   Hydra Hexcore Backend (NestJS)     │
│   - Port: 3010                       │
└────────────┬─────────────────────────┘
             │
    ┌────────▼────────┐
    │ Docker Engine   │
    └────────┬────────┘
             │
     ┌───────┴───────┬───────────┬──────────┐
     │               │           │          │
┌────▼────┐   ┌─────▼─────┐ ┌──▼───┐  ┌───▼────┐
│ Hydra   │   │  Hydra    │ │Cardano│ │Ogmios  │
│ Node 1  │   │  Node 2   │ │ Node  │ │Service │
│Container│   │ Container │ │       │ │        │
└─────────┘   └───────────┘ └───────┘ └────────┘
```

---

## 📝 Configuration

### Environment Variables

**Server:**
- `PORT` - API server port (default: 3010)
- `NODE_ENV` - Environment (development/production)

**Database:**
- `DB_HOST`, `DB_PORT` - Database connection
- `DB_USERNAME`, `DB_PASSWORD` - Credentials
- `DB_DATABASE` - Database name
- `DB_SYNCHRONIZE` - Auto-sync schema (dev only)

**Redis:**
- `REDIS_URL` - Redis connection string
- `REDIS_PASSWORD` - Redis password

**Hydra:**
- `NEST_HYDRA_BIN_DIR_PATH` - Hydra binaries path
- `NEST_HYDRA_NODE_IMAGE` - Hydra Docker image
- `NEST_HYDRA_NODE_FOLDER` - Hydra node data folder

**Cardano:**
- `NEST_CARDANO_NODE_SERVICE_NAME` - Cardano node service
- `NEST_CARDANO_NODE_IMAGE` - Cardano Docker image
- `NEST_CARDANO_NODE_FOLDER` - Cardano node data
- `NEST_CARDANO_NODE_SOCKET_PATH` - Node socket path

**Docker:**
- `NEST_DOCKER_SOCKET_PATH` - Docker socket (/var/run/docker.sock)
- `NEST_DOCKER_ENABLE_NETWORK_HOST` - Enable host networking

---

## 🧪 Testing

### Test Framework
- **Jest** - Unit and integration testing
- **Supertest** - HTTP endpoint testing

### Test Structure
```
test/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

### Coverage Targets
- Controllers: API endpoint testing
- Services: Business logic testing
- Guards: Authentication/authorization testing

---

## 🚀 Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# Run tests
pnpm run test

# Build for production
pnpm run build
```

### Docker Deployment
```bash
# Build image
docker build -t hydra-hexcore .

# Run with docker-compose
docker-compose up -d
```

---

## 📚 Related Documentation

- `README.md` - Installation and setup guide
- `docs/SRS.md` - Software Requirements Specification
- `docs/archives/user-guide/` - User documentation (archived)
  - `developer-guide.md` - Developer documentation
  - `admin-operator-guide.md` - Admin operations
  - `user-functional-guide.md` - Functional guide
  - `project-installation-guide.md` - Installation guide

---

## 🔄 Integration Points

### Cardano Blockchain
- **Ogmios:** Query protocol for Cardano node
- **Cardano Serialization Library:** Transaction building
- **Wallet Management:** HD wallet generation (BIP39)

### Hydra Protocol
- **Hydra SDK:** Core Hydra operations
- **Transaction SDK:** Hydra transaction building
- **Cardano WASM:** Low-level Cardano operations

### External Services
- **PostgreSQL/MySQL:** Persistent data storage
- **Redis:** Caching and session management
- **Docker Engine:** Container orchestration
- **WebSocket:** Real-time client communication

---

## 📊 System Capabilities

### Scalability
- Support for multiple concurrent Hydra nodes
- Horizontal scaling with containerization
- Redis caching for performance
- Connection pooling for database

### Monitoring
- Structured logging with Winston
- Daily log rotation
- Container health monitoring
- Real-time WebSocket events

### High Availability
- Stateless API design
- Container restart policies
- Database connection resilience
- Error handling and recovery

---

## 🎯 Key Design Patterns

1. **Dependency Injection** - NestJS IoC container
2. **Repository Pattern** - TypeORM repositories
3. **Factory Pattern** - Dynamic module configuration
4. **Observer Pattern** - WebSocket event broadcasting
5. **Middleware Pattern** - Request/response interceptors
6. **Guard Pattern** - Authentication/authorization
7. **DTO Pattern** - Data validation and transformation

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Maintainer:** Hydra Hexcore Development Team
