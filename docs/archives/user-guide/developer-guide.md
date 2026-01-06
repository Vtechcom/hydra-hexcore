# 🧩 Hexcore — Developer Guide

## 1. Giới thiệu

### 1.1 Mục tiêu tài liệu

Tài liệu này cung cấp hướng dẫn toàn diện cho **developers** muốn:
- Hiểu kiến trúc hệ thống **Hexcore**
- Phát triển và mở rộng các module hiện có
- Tích hợp với các service bên thứ ba
- Deploy và vận hành hệ thống trong môi trường production

### 1.2 Đối tượng người đọc

- **Backend Developers**: Làm việc với NestJS, TypeScript, Docker
- **Blockchain Developers**: Có kinh nghiệm với Cardano, Hydra Layer-2
- **DevOps Engineers**: Triển khai và vận hành infrastructure
- **Full-stack Developers**: Làm việc cả frontend (Nuxt) và backend

### 1.3 Tổng quan về Hexcore System

**Hexcore** là hệ thống quản lý và điều phối **Hydra Node clusters** trên Cardano blockchain. Hệ thống bao gồm:

- **Backend (hydra-hexcore)**: NestJS service quản lý Hydra nodes, Docker containers, và xử lý business logic
- **Frontend (hexcore-ui)**: Nuxt 3 web application cung cấp giao diện quản trị trực quan
- **Infrastructure**: Cardano-node, Ogmios, Redis, MySQL/SQLite, Docker Engine

**Tech Stack chính:**
- Backend: NestJS, TypeScript, Dockerode, TypeORM, Socket.IO
- Frontend: Nuxt 3, Vue 3, TailwindCSS, UnoCSS, Pinia
- Blockchain: Cardano Node, Ogmios, Hydra SDK
- Database: MySQL/SQLite, Redis
- Container: Docker, Docker Compose  

---

## 2. Kiến trúc hệ thống

### 2.1 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEXCORE SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     HEXCORE UI (Nuxt 3)                   │ │
│  │  - Dashboard, Monitoring, Management Interface            │ │
│  │  - WebSocket Real-time Updates                            │ │
│  │  - Pinia State Management                                 │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │ HTTP/REST + WebSocket                 │
│  ┌─────────────────────▼─────────────────────────────────────┐ │
│  │               HEXCORE BACKEND (NestJS)                    │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Hydra Main   │  │ Hydra        │  │ Auth Module     │ │ │
│  │  │ Module       │  │ Consumer     │  │                 │ │ │
│  │  │ - Node Mgmt  │  │ Module       │  │ - JWT Auth      │ │ │
│  │  │ - Party Mgmt │  │ - Consumer   │  │ - Role Guard    │ │ │
│  │  │ - Head Ops   │  │   Management │  │ - Socket Auth   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Shell Module │  │ Proxy Module │  │ Utils & Common  │ │ │
│  │  │ - CLI Exec   │  │ - WS Proxy   │  │ - Cardano CLI   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  └────────────┬───────────────────────┬────────────────────┘ │
│               │                       │                        │
│  ┌────────────▼──────┐   ┌───────────▼────────┐              │
│  │  MySQL/SQLite     │   │  Redis Cache       │              │
│  │  - Entities       │   │  - Session         │              │
│  │  - TypeORM        │   │  - Node States     │              │
│  └───────────────────┘   └────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼──────┐  ┌───────▼────────┐
│ Cardano Node   │  │   Ogmios    │  │ Docker Engine  │
│ - Blockchain   │  │ - JSON API  │  │ - Containers   │
│ - Socket IPC   │  │ - WebSocket │  │ - Hydra Nodes  │
└────────────────┘  └─────────────┘  └────────────────┘
```

### 2.2 Cấu trúc thư mục `hydra-hexcore/`

```
hydra-hexcore/
├── src/
│   ├── main.ts                    # Entry point của ứng dụng NestJS
│   ├── app.module.ts              # Root module, khai báo toàn bộ imports
│   ├── app.controller.ts          # Root controller (health check, info)
│   ├── app.service.ts             # Root service
│   │
│   ├── auth/                      # 🔐 Module xác thực & phân quyền
│   │   ├── admin-auth.guard.ts    # Guard cho admin routes
│   │   ├── jwt.helper.ts          # JWT utilities
│   │   ├── role.guard.ts          # Role-based access control
│   │   └── socket.guard.ts        # WebSocket authentication
│   │
│   ├── hydra-main/                # 🚀 Module quản lý Accounts & Nodes
│   │   ├── dto/                   # Data Transfer Objects
│   │   ├── entities/              # TypeORM entities
│   │   │   ├── Account.entity.ts
│   │   │   ├── HydraNode.entity.ts
│   │   │   └── User.entity.ts
│   │   ├── utils/                 # Helper functions
│   │   ├── hydra-main.controller.ts    # REST API endpoints
│   │   ├── hydra-main.gateway.ts       # WebSocket gateway
│   │   ├── hydra-main.service.ts       # Account & Node management
│   │   ├── hydra-admin.service.ts      # Admin authentication
│   │   ├── ogmios-client.service.ts    # Ogmios integration
│   │   ├── ogmios.controller.ts        # Ogmios API wrapper
│   │   └── hydra-main.module.ts
│   │
│   ├── hydra-heads/               # 🎯 Module quản lý Hydra Heads
│   │   ├── dto/                   # Data Transfer Objects
│   │   │   ├── create-hydra-heads.dto.ts
│   │   │   ├── active-hydra-heads.dto.ts
│   │   │   └── clear-head-data.dto.ts
│   │   ├── entities/              # TypeORM entities
│   │   │   └── HydraHead.entity.ts
│   │   ├── interfaces/            # TypeScript interfaces
│   │   │   └── hydra-head-keys.type.ts
│   │   ├── contants/              # Constants
│   │   ├── hydra-heads.controller.ts   # REST API endpoints
│   │   ├── hydra-heads.service.ts      # Head lifecycle management
│   │   └── hydra-heads.module.ts
│   │
│   ├── docker/                    # 🐳 Module quản lý Docker
│   │   ├── docker.service.ts      # Docker operations
│   │   └── docker.module.ts
│   │
│   ├── shell/                     # 🐚 Module thực thi shell commands
│   │   ├── shell.service.ts       # Execute bash scripts
│   │   └── shell.module.ts
│   │
│   ├── proxy/                     # 🔀 Module WebSocket proxy
│   │   └── ws-proxy.gateway.ts    # Proxy WS connections
│   │
│   ├── event/                     # 📡 Event emitter system
│   │   └── emit.event.ts
│   │
│   ├── config/                    # ⚙️ Configuration files
│   │   ├── configuration.ts       # Env variables mapping
│   │   └── swagger.config.ts      # Swagger/OpenAPI setup
│   │
│   ├── common/                    # 🔧 Common utilities
│   │   ├── exceptions/            # Custom exceptions
│   │   ├── interceptors/          # Response interceptors
│   │   │   ├── base-response.interceptor.ts
│   │   │   ├── bigint.interceptor.ts
│   │   │   └── serializer.interceptor.ts
│   │   ├── interfaces/            # Shared interfaces
│   │   └── resolvers/
│   │
│   ├── utils/                     # 🛠️ Utility functions
│   │   ├── bigint.utils.ts        # BigInt serialization
│   │   ├── cardano-cli.util.ts    # Cardano CLI wrapper
│   │   ├── cardano-core.ts        # Cardano cryptography utils
│   │   ├── generator.util.ts      # ID/Key generators
│   │   └── infinity-pagination.ts
│   │
│   ├── constants/                 # 📌 Constants & enums
│   ├── decorators/                # 🎨 Custom decorators
│   ├── dto/                       # Global DTOs
│   ├── enums/                     # Global enums
│   ├── interfaces/                # Global interfaces
│   ├── middlewares/               # Express middlewares
│   └── migrations/                # TypeORM database migrations
│
├── configs/                       # 🐳 Docker configs
│   ├── docker-compose.yml         # Cardano + Ogmios stack
│   ├── cardano/                   # Cardano node configs
│   └── ogmios/                    # Ogmios configs
│
├── database/                      # 💾 Database files
│   ├── database.sqlite            # SQLite DB (dev)
│   └── *.sql                      # SQL dumps
│
├── hydra/                         # 🔷 Hydra node data
│   ├── preprod/                   # Preprod network data
│   └── party-*/                   # Party-specific folders
│
├── docs/                          # 📚 Documentation
│   └── user-guide/
│       ├── admin-operator-guide.md
│       └── developer-guide.md
│
├── test/                          # 🧪 E2E tests
├── package.json
├── tsconfig.json
├── nest-cli.json
├── docker-compose.yml             # Main Hexcore service
├── Dockerfile
└── .env.example
```

### 2.3 Cấu trúc thư mục `hexcore-ui/`

```
hexcore-ui/
├── pages/                         # 📄 Nuxt pages (auto-routing)
│   ├── index.vue                  # Landing/redirect page
│   ├── login.vue                  # Authentication page
│   ├── dashboard.vue              # Main dashboard
│   ├── hydra-nodes.vue            # Hydra nodes management
│   ├── hydra-heads.vue            # Hydra heads management
│   ├── wallet-accounts.vue        # Wallet management
│   ├── consumers.vue              # Consumer management
│   ├── settings.vue               # Settings page
│   └── test.vue                   # Testing/debug page
│
├── components/                    # 🧩 Vue components
│   ├── base/                      # Base UI components
│   ├── consumer/                  # Consumer-specific components
│   ├── layouts/                   # Layout components
│   └── shared/                    # Shared components
│
├── layouts/                       # 🎨 Nuxt layouts
│   └── default.vue                # Default layout
│
├── stores/                        # 🗄️ Pinia state management
│   ├── auth.store.ts              # Authentication state
│   ├── account.ts                 # Account/wallet state
│   ├── hydra-node.store.ts        # Hydra nodes state
│   ├── hydra-monitoring.store.ts  # Monitoring WebSocket state
│   ├── head-stats.store.ts        # Head statistics
│   └── main.ts                    # Main store setup
│
├── composables/                   # 🪝 Vue composables
│   └── usePopupState.ts           # Popup state management
│
├── interfaces/                    # 📝 TypeScript interfaces
│   ├── wallet-account.type.ts
│   ├── api/                       # API response types
│   ├── cardano/                   # Cardano types
│   └── hydra/                     # Hydra types
│
├── lib/                           # 📚 External libraries wrapper
├── utils/                         # 🔧 Utility functions
├── plugins/                       # 🔌 Nuxt plugins
├── middleware/                    # 🚧 Route middlewares
├── server/                        # 🖥️ Server-side code
├── public/                        # 📁 Static assets
├── assets/                        # 🎨 Styles & icons
│   ├── scss/
│   └── icons/
│
├── configs/                       # ⚙️ Config files
├── constants/                     # 📌 Constants
│   └── chain.ts                   # Blockchain constants
│
├── __tests__/                     # 🧪 Vitest tests
├── __mocks__/                     # 🎭 Test mocks
│
├── nuxt.config.ts                 # Nuxt configuration
├── uno.config.ts                  # UnoCSS configuration
├── tsconfig.json
├── package.json
├── vitest.config.ts
└── .env.example
```

### 2.4 Luồng hoạt động hệ thống

#### **2.4.1 Luồng khởi tạo Hydra Node**

```
User (UI) → Backend → Docker API → Hydra Container
   │           │            │              │
   │ [POST]    │            │              │
   │ /nodes    │            │              │
   ├──────────>│            │              │
   │           │ 1. Validate input         │
   │           │ 2. Create DB records      │
   │           │ 3. Generate keys/certs    │
   │           │ 4. Setup persistence dir  │
   │           │            │              │
   │           ├───────────>│              │
   │           │ createContainer()         │
   │           │            ├─────────────>│
   │           │            │ Start node   │
   │           │<───────────┤              │
   │<──────────┤ Success    │              │
   │           │            │              │
```

#### **2.4.2 Luồng giám sát WebSocket**

```
UI ←──────────→ Backend ←──────────→ Hydra Node
   (Socket.IO)           (WebSocket)
      
1. UI connects to backend WebSocket gateway
2. Backend proxies connection to target Hydra node
3. Real-time events streamed: HeadOpened, TxValid, etc.
4. UI updates dashboard in real-time
```

#### **2.4.3 Luồng giao dịch (Transaction)**

```
User → UI → Backend → Ogmios → Cardano Node
                  ↓
            Hydra Node → Head Protocol
                  ↓
            Update DB & Cache
```

### 2.5 Mối quan hệ giữa các module

```typescript
AppModule
├── ConfigModule (Global)
├── CacheModule (Redis - Global)
├── TypeOrmModule (MySQL/SQLite)
├── ScheduleModule
│
├── HydraMainModule
│   ├── HydraMainController
│   ├── HydraMainGateway (WebSocket)
│   ├── HydraMainService
│   ├── HydraAdminService
│   ├── OgmiosClientService
│   └── OgmiosController
│
├── HydraHeadsModule
│   ├── HydraHeadController
│   └── HydraHeadService
│
├── DockerModule
│   └── DockerService
│
└── ShellModule
    └── ShellService
```

**Dependencies flow:**
- `HydraMainService` → `OgmiosClientService` (query blockchain)
- `HydraHeadService` → `DockerService` (manage containers)
- `HydraHeadService` → `OgmiosClientService` (query UTxO)
- All controllers → Auth Guards (authentication/authorization)

### 2.6 Database & Cache Layer

#### **Database Schema (TypeORM Entities)**

**Account** - Quản lý ví Cardano
```typescript
{
  id: number
  name: string
  address: string (Cardano address)
  mnemonic: string (encrypted)
  createdAt: Date
  updatedAt: Date
}
```

**HydraHead** - Quản lý Hydra Heads
```typescript
{
  id: number
  description: string
  status: string (configured, active, inactive)
  contestationPeriod: string
  depositPeriod: string
  persistenceRotateAfter: string
  protocolParameters: object
  nodes: number (số lượng nodes)
  hydraNodes: HydraNode[] (relation)
  createdAt: Date
  updatedAt: Date
}
```

**HydraNode** - Quản lý Hydra Node containers
```typescript
{
  id: number
  description: string
  port: number (unique)
  skey: string (Hydra signing key)
  vkey: string (Hydra verification key)
  cardanoVKey: string (Cardano verification key)
  cardanoSKey: string (Cardano signing key)
  cardanoAccount: Account (relation)
  hydraHead: HydraHead (relation)
  createdAt: string
}
```

**User** - Quản lý admin users
```typescript
{
  id: number
  username: string
  password: string
  role: string
  createdAt: Date
  updatedAt: Date
}
```

**Consumer** - Quản lý API consumers
```typescript
{
#### **Redis Cache Structure**

```typescript
// Cached data structure
{
  activeNodes: ContainerNode[]  // TTL: 60s
  // ContainerNode = {
  //   hydraNodeId: string
  //   hydraHeadId: string
  //   container: Docker.ContainerInfo
  //   isActive: boolean
  // }
}
```

### 2.7 Blockchain Layer (Cardano / Hydra)

#### **Cardano Node**
- **Vai trò**: Đồng bộ Cardano blockchain, cung cấp socket IPC
- **Config**: `/configs/cardano/config.json`, `topology.json`
- **Socket path**: `/workspace/node.socket` (mounted volume)
- **Network**: Preprod testnet (network-id: 1)
- **Image**: `ghcr.io/intersectmbo/cardano-node:10.1.4`

#### **Ogmios**
- **Vai trò**: JSON-RPC API wrapper cho Cardano node
- **Port**: 1337 (default)
- **Features sử dụng**:
  - Query UTxO
  - Submit transactions
  - Query protocol parameters
  - Evaluate transactions

#### **Hydra Node**
- **Image**: `ghcr.io/cardano-scaling/hydra-node:0.22.2`
- **API**: REST (port 4001) + WebSocket (port 5001)
- **Persistence**: Mounted volumes per head
- **Network**: Custom bridge network `hydra-network`
- **Key Features**:
  - Multi-party state channels
  - Fast finality
  - Low transaction fees (configurable to 0)

### 2.8 Frontend Layer (UI)

#### **State Management (Pinia)**

```typescript
// auth.store.ts
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// hydra-node.store.ts  
interface HydraNodeState {
  nodes: HydraNode[]
  selectedNode: HydraNode | null
  isLoading: boolean
}

// hydra-monitoring.store.ts
interface MonitoringState {
  wsConnection: WebSocket | null
  events: HydraEvent[]
  stats: HeadStats
}
```

#### **API Layer**

```typescript
// utils/api.ts
const api = axios.create({
  baseURL: config.public.baseUrl,
  headers: {
    Authorization: `Bearer ${token}`
  }
})

// Các endpoint chính:
// GET    /api/hydra/nodes
// POST   /api/hydra/nodes
// PUT    /api/hydra/nodes/:id
// DELETE /api/hydra/nodes/:id
// POST   /api/hydra/activate-party
// POST   /api/hydra/deactivate-party
// WS     /ws/monitoring
```

### 2.9 Tóm tắt công nghệ sử dụng

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | NestJS | REST API, WebSocket, Dependency Injection |
| **Language** | TypeScript | Type safety, modern JS features |
| **Database** | MySQL/SQLite | Persistent data storage |
| **ORM** | TypeORM | Entity mapping, migrations |
| **Cache** | Redis (Keyv) | Session, node states caching |
| **Container** | Dockerode | Docker API client |
| **Blockchain** | Cardano Node | L1 blockchain sync |
| **API Gateway** | Ogmios | Cardano query/submit API |
| **L2 Scaling** | Hydra Node | Off-chain transaction processing |
| **Authentication** | JWT + Passport | Token-based auth |
| **Documentation** | Swagger/OpenAPI | API documentation |
| **Task Scheduling** | @nestjs/schedule | Cron jobs |
| **Frontend Framework** | Nuxt 3 | SSR/SPA Vue framework |
| **UI Library** | UnoCSS + Element Plus | Utility-first CSS + components |
| **State Management** | Pinia | Vue state management |
| **Build Tool** | Vite | Fast HMR, optimized builds |
| **Testing** | Vitest | Unit & integration tests |

---

## 3. Chi tiết các Module

### 3.1 Module `auth/`

Module xác thực và phân quyền, cung cấp guards và helpers để bảo mật các routes và WebSocket connections.

#### **Files:**

**`admin-auth.guard.ts`** - Guard cho admin routes
```typescript
@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
  // Kiểm tra JWT token và role admin
  // Sử dụng: @UseGuards(AdminAuthGuard)
}
```

**`consumer-auth.guard.ts`** - Guard cho consumer API routes
```typescript
@Injectable()
export class ConsumerAuthGuard {
  // Xác thực consumer thông qua API key
  // Sử dụng: @UseGuards(ConsumerAuthGuard)
}
```

**`socket.guard.ts`** - Guard cho WebSocket connections
```typescript
@Injectable()
export class SocketGuard implements CanActivate {
  // Xác thực WebSocket handshake
  // Validate token từ query params hoặc headers
}
```

**`role.guard.ts`** - Role-based access control
```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  // Kiểm tra user role (admin, operator, consumer)
  // Sử dụng với @Roles() decorator
}
```

**`jwt.helper.ts`** - JWT utilities
```typescript
// Functions:
// - generateToken(payload): Tạo JWT token
// - verifyToken(token): Verify và decode token
// - extractTokenFromHeader(request): Lấy token từ header
```

#### **Usage Example:**

```typescript
@Controller('admin')
@UseGuards(AdminAuthGuard, RoleGuard)
@Roles('admin')
export class AdminController {
  @Get('nodes')
  getAllNodes() {
    // Chỉ admin mới truy cập được
  }
}
```

### 3.2 Module `hydra-main/`

Module core của hệ thống, quản lý Account, Node info và Ogmios integration.

#### **Services:**

**`HydraMainService`** - Service chính quản lý Accounts và Hydra nodes
```typescript
class HydraMainService {
  // Account Management
  async createAccount(dto: CreateAccountDto): Promise<Account>
  async getListAccount(): Promise<Account[]>
  
  // Node Management
  async getListHydraNode(options: { pagination: IPaginationOptions }): Promise<HydraDto[]>
  async getHydraNodeById(id: number): Promise<HydraNode>
  async getHydraNodeDetail(id: number): Promise<HydraNode>
  
  // Cardano Node Operations
  async getCardanoNodeInfo(): Promise<any>
  async testOgmiosConnection(): Promise<any>
  
  // UTxO Operations
  async getAddressUtxo(address: string): Promise<AddressUtxoDto>
  
  // Container Management
  async getActiveNodeContainers(): Promise<ContainerNode[]>
  async getContainerIfExists(containerName: string): Promise<Docker.Container | null>
  async createContainer(...): Promise<Docker.Container>
}
```

**Key Features:**
- **Account Management**: Tạo và quản lý Cardano accounts với mnemonic
- **Node Listing**: Lấy danh sách Hydra nodes với pagination
- **Cardano Node Info**: Kiểm tra trạng thái Cardano node
- **Ogmios Integration**: Kết nối và test Ogmios service
- **UTxO Queries**: Query UTxO của addresses thông qua Ogmios
- **Container Monitoring**: Theo dõi active Docker containers

**`HydraAdminService`** - Admin authentication
```typescript
class HydraAdminService {
  async login(dto: AdminLoginDto): Promise<{ accessToken: string }>
  async auth(id: number): Promise<User>
}
```

**`OgmiosClientService`** - Ogmios integration service
```typescript
class OgmiosClientService {
  async queryUtxo(address: string): Promise<UTxO[]>
  async submitTx(cbor: string): Promise<TxHash>
  async queryProtocolParameters(): Promise<ProtocolParameters>
  async evaluateTx(cbor: string): Promise<ExUnits>
}
```

#### **Controllers:**

**`HydraMainController`** - REST API endpoints
```typescript
@Controller('hydra-main')
export class HydraMainController {
  // Authentication
  @Post('login')
  login(@Body() dto: AdminLoginDto)
  
  @Get('auth')
  @UseGuards(AdminAuthGuard)
  auth(@Req() req)
  
  // Account Management
  @Post('create-account')
  @UseGuards(AdminAuthGuard)
  createAccount(@Body() dto: CreateAccountDto)
  
  @Get('list-account')
  @UseGuards(AdminAuthGuard)
  getListAccount()
  
  // Node Management
  @Get('hydra-nodes')
  getListNode(@Query() query: QueryHydraDto)
  
  @Get('hydra-node/:id')
  getNodeDetail(@Param('id') id: string)
  
  // System Info
  @Get('node-info')
  getCardanoNodeInfo()
  
  @Get('ogmios')
  getAccountInfo()
  
  // UTxO Operations
  @Get('utxo/:address')
  getListUtxo(@Param('address') address: string)
  
  @Get('active-nodes')
  getActiveNodes()
}
```

**`HydraMainGateway`** - WebSocket gateway
```typescript
@WebSocketGateway({
  namespace: '/ws/monitoring',
  cors: { origin: '*' }
})
export class HydraMainGateway {
  @SubscribeMessage('monitor-node')
  handleMonitorNode(client: Socket, payload: { nodeId: string }) {
    // Proxy WebSocket connection to Hydra node
    // Stream events back to client
  }
  
  @SubscribeMessage('send-command')
  handleSendCommand(client: Socket, payload: HydraCommand) {
    // Forward command to Hydra node
    // Return response
  }
}
```

### 3.3 Module `hydra-heads/`

Module quản lý Hydra Heads - tạo, kích hoạt, và quản lý lifecycle của Hydra heads.

#### **Services:**

**`HydraHeadService`** - Service chính quản lý Hydra Heads
```typescript
class HydraHeadService {
  // Head Management
  async create(dto: CreateHydraHeadsDto): Promise<HydraHead>
  async list(): Promise<HydraHead[]>
  async delete(id: number): Promise<void>
  
  // Head Operations
  async activeHydraHead(dto: ActiveHydraHeadsDto): Promise<HydraHead>
  async deactiveHydraHead(dto: ActiveHydraHeadsDto): Promise<HydraHead>
  async clearHeadData(dto: ClearHeadDataDto): Promise<void>
  
  // Node Management
  async createHydraNode(head: HydraHead, account: Account, keys: HydraHeadKeys): Promise<HydraNode>
  async getActiveNodeContainers(): Promise<ContainerNode[]>
  async countActiveNodes(): Promise<number>
  
  // Utilities
  async getAddressUtxo(address: string): Promise<AddressUtxoDto>
  async genValidPort(): Promise<number>
  async checkHydraNodePort(port: number): Promise<boolean>
  async isPortAvailable(port: number): Promise<boolean>
}
```

**Key Features:**
- **Head Creation**: Tạo Hydra Head với nhiều nodes, generate keys (Hydra + Cardano)
- **Docker Container Management**: Tạo và quản lý Docker containers cho từng node trong head
- **Network Configuration**: Setup Hydra network với custom bridge network
- **Key Management**: Quản lý Hydra verification/signing keys và Cardano keys cho mỗi node
- **Persistence Management**: Quản lý persistence directories cho mỗi head
- **Protocol Parameters**: Generate và configure protocol-parameters.json cho mỗi head
- **UTxO Validation**: Kiểm tra và validate UTxO của các nodes trước khi activate
- **Port Management**: Tự động phân bổ và kiểm tra ports cho nodes

#### **Controllers:**

**`HydraHeadController`** - REST API endpoints
```typescript
@Controller('hydra-heads')
export class HydraHeadController {
  // Head Management
  @Post('create')
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateHydraHeadsDto)
  
  @Get('list')
  @UseGuards(AdminAuthGuard)
  list()
  
  @Delete('delete/:id')
  @UseGuards(AdminAuthGuard)
  delete(@Param('id') id: number)
  
  // Head Operations
  @Post('active')
  @UseGuards(AdminAuthGuard)
  active(@Body() dto: ActiveHydraHeadsDto)
  
  @Post('deactive')
  @UseGuards(AdminAuthGuard)
  deactive(@Body() dto: ActiveHydraHeadsDto)
  
  @Post('clear-head-data')
  @UseGuards(AdminAuthGuard)
  clearHeadData(@Body() dto: ClearHeadDataDto)
}
```

#### **DTOs:**

**`CreateHydraHeadsDto`** - DTO để tạo Hydra Head mới
```typescript
class CreateHydraHeadsDto {
  description?: string;
  contestationPeriod?: number;  // Default: 60 seconds
  depositPeriod?: number;       // Default: 120 seconds
  persistenceRotateAfter?: number;
  protocolParameters?: object;  // Custom protocol parameters
  hydraHeadKeys: HydraHeadKeys[]; // Array of keys for each node in the head
}

interface HydraHeadKeys {
  hydraVKey: string;    // Hydra verification key
  hydraSKey: string;    // Hydra signing key
  cardanoVKey: string;  // Cardano verification key
  cardanoSKey: string;  // Cardano signing key
}
```

**`ActiveHydraHeadsDto`** - DTO để activate/deactivate Head
```typescript
class ActiveHydraHeadsDto {
  id: number; // Head ID
}
```

#### **Entities:**

**`HydraHead.entity.ts`**
```typescript
@Entity('hydra_heads')
export class HydraHead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'configured' })
  status: string; // configured, active, inactive

  @Column({ nullable: true })
  contestationPeriod: string;

  @Column({ nullable: true })
  depositPeriod: string;
  
  @Column({ nullable: true })
  persistenceRotateAfter: string;

  @Column({ type: 'json', nullable: true })
  protocolParameters: object;

  @Column({ default: 0 })
  nodes: number;

  @OneToMany(() => HydraNode, node => node.head)
  hydraNodes: HydraNode[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### **Entities:**

**`Account.entity.ts`**
```typescript
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  address: string;

  @Column({ type: 'text' })
  mnemonic: string; // Encrypted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**`HydraNode.entity.ts`**
```typescript
@Entity()
export class HydraNode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: 'hydra-node' })
  description: string;

  @Column({ unique: true })
  port: number;

  @Column()
  skey: string; // Hydra signing key

  @Column()
  vkey: string; // Hydra verification key

  @Column()
  cardanoVKey: string; // Cardano verification key

  @Column()
  cardanoSKey: string; // Cardano signing key

  @ManyToOne(() => Account, account => account.id)
  cardanoAccount: Account;

  @ManyToOne(() => HydraHead, hydraHead => hydraHead.hydraNodes)
  hydraHead: HydraHead;

  @Column({ default: new Date().toISOString() })
  createdAt: string;
}
```

### 3.4 Module `docker/`

Module quản lý Docker operations.

#### **Services:**

**`DockerService`** - Docker container management
```typescript
class DockerService {
  async ensureHydraNetwork(): Promise<void>
  async handleDockerContainerExist(containerName: string): Promise<void>
  async removeContainer(containerId: string): Promise<void>
}
```

**Key Features:**
- **Network Management**: Tạo và quản lý custom Docker bridge network
- **Container Lifecycle**: Xử lý tồn tại container, remove containers
- **Error Handling**: Xử lý gracefully Docker errors

### 3.5 Module `shell/`

Module thực thi shell commands.

#### **Services:**

**`ShellService`** - Execute shell commands
```typescript
class ShellService {
  async executeCommand(command: string, options?: object): Promise<string>
}
```

**Key Features:**
- **Command Execution**: Thực thi shell commands
- **Error Handling**: Capture và xử lý errors từ shell commands

---

## 4. Workflow Chi Tiết

### 4.1 Tạo Hydra Head Mới

**Flow:**
1. Client gọi `POST /hydra-heads/create` với `CreateHydraHeadsDto`
2. `HydraHeadService.create()`:
   - Tạo HydraHead entity trong database
   - Tạo thư mục head directory: `/data/head-{headId}/`
   - Với mỗi node trong `hydraHeadKeys`:
     - Tạo HydraNode entity
     - Generate và lưu key files (Hydra + Cardano keys)
     - Assign port cho node
   - Commit transaction
3. Return HydraHead object với danh sách nodes

**Key Files Created:**
```
/data/head-{headId}/
  ├── {nodeName}.sk          # Hydra signing key
  ├── {nodeName}.vk          # Hydra verification key
  ├── {nodeName}.cardano.sk  # Cardano signing key
  └── {nodeName}.cardano.vk  # Cardano verification key
```

### 4.2 Activate Hydra Head

**Flow:**
1. Client gọi `POST /hydra-heads/active` với `ActiveHydraHeadsDto`
2. `HydraHeadService.activeHydraHead()`:
   - Load HydraHead và nodes từ database
   - Validate UTxO của các Cardano accounts (enterprise addresses)
   - Generate `protocol-parameters.json` từ Cardano node
   - Ensure Docker network exists
   - Với mỗi node:
     - Generate Docker container config với:
       - Peer connections
       - Volume mounts (keys, persistence)
       - Port mappings
       - Environment variables
     - Create và start container
   - Update head status thành 'active'
3. Return activated HydraHead

**Docker Container Configuration:**
```yaml
Image: ghcr.io/cardano-scaling/hydra-node:0.22.2
Networks:
  - hydra-network
Volumes:
  - {headDir}:/data/head-{headId}
  - {persistenceDir}:/data/persistence
  - cardano-node-socket:/workspace
Ports:
  - {nodePort}:4001  # API port
  - {nodePort+1000}:5001  # Peer port
Command:
  - --node-id {nodeId}
  - --api-host 0.0.0.0
  - --host 0.0.0.0
  - --port 5001
  - --peer {peerNode}:{peerPort}
  - --hydra-signing-key /data/head-{headId}/{nodeName}.sk
  - --cardano-signing-key /data/head-{headId}/{nodeName}.cardano.sk
  - --ledger-protocol-parameters /data/head-{headId}/protocol-parameters.json
  - ...
```

### 4.3 Deactivate Hydra Head

**Flow:**
1. Client gọi `POST /hydra-heads/deactive` với `ActiveHydraHeadsDto`
2. `HydraHeadService.deactiveHydraHead()`:
   - Load HydraHead và nodes
   - Với mỗi node:
     - Tìm Docker container
     - Stop và remove container
   - Update head status thành 'inactive'
   - Clear cache
3. Return deactivated HydraHead

### 4.4 Query UTxO

**Flow:**
1. Client gọi `GET /hydra-main/utxo/:address`
2. `HydraMainService.getAddressUtxo()`:
   - Gọi `OgmiosClientService.queryUtxo()`
   - Convert Ogmios format sang internal format
   - Return UTxO data

---

## 5. Configuration & Environment

### 5.1 Environment Variables

```bash
# Hydra Configuration
NEST_HYDRA_NODE_IMAGE=ghcr.io/cardano-scaling/hydra-node:0.22.2
NEST_HYDRA_NODE_FOLDER=/path/to/hydra/data
NEST_HYDRA_BIN_DIR_PATH=/path/to/hydra/bin
NEST_HYDRA_NODE_SCRIPT_TX_ID=<script-tx-id>
NEST_HYDRA_NODE_NETWORK_ID=1  # 1=preprod, 764824073=mainnet

# Cardano Node Configuration
NEST_CARDANO_NODE_SERVICE_NAME=cardano-node
NEST_CARDANO_NODE_IMAGE=ghcr.io/intersectmbo/cardano-node:10.1.4
NEST_CARDANO_NODE_FOLDER=/path/to/cardano/node
NEST_CARDANO_NODE_SOCKET_PATH=/path/to/cardano/node/node.socket

# Docker Configuration
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock  # Linux/Mac
# NEST_DOCKER_SOCKET_PATH=//./pipe/docker_engine  # Windows
NEST_DOCKER_ENABLE_NETWORK_HOST=false

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=hydra_hexcore

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Ogmios Configuration
OGMIOS_HOST=localhost
OGMIOS_PORT=1337

# Account Settings
ACCOUNT_MIN_LOVELACE=50000000  # 50 ADA minimum

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### 5.2 Hydra Configuration Module

File: `src/config/hydra.config.ts`

```typescript
export interface HydraConfigInterface {
  hydraNodeImage: string;
  hydraNodeFolder: string;
  hydraBinDirPath: string;
  hydraNodeScriptTxId: string;
  hydraNodeNetworkId: string;
  cardanoNodeServiceName: string;
  cardanoNodeImage: string;
  cardanoNodeFolder: string;
  cardanoNodeSocketPath: string;
  enableNetworkHost: boolean;
  dockerSock: string;
  accountMinLovelace: number;
}
```

---

## 6. API Reference

### 6.1 Authentication

#### Login
```http
POST /hydra-main/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
{
  "accessToken": "eyJhbGc..."
}

  @Column()
  name: string;

  @Column({ unique: true })
  address: string;

  @Column({ type: 'text' })
  mnemonic: string; // Encrypted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3.6 Module `utils/`

Module chứa các utility functions được dùng chung.

**`cardano-cli.util.ts`** - Wrapper cho Cardano CLI
```typescript
import { CardanoCliJs } from 'cardanocli-js';

export class CardanoCliUtil {
  private cli: CardanoCliJs;
  
  constructor(network: 'testnet' | 'mainnet') {
    this.cli = new CardanoCliJs({
      network,
      shelleyGenesisPath: '/path/to/genesis.json'
    });
  }
  
  async queryUtxo(address: string): Promise<UTxO[]>
  async buildTx(params: TxParams): Promise<string>
  async signTx(txBody: string, skey: string): Promise<string>
  async submitTx(signedTx: string): Promise<TxHash>
}
```

**`cardano-core.ts`** - Cardano cryptography utilities
```typescript
import * as bip39 from 'bip39';
import { Bip32PrivateKey } from '@emurgo/cardano-serialization-lib-nodejs';

export function generateMnemonic(): string {
  return bip39.generateMnemonic(256); // 24 words
}

export function getSigningKeyFromMnemonic(
  mnemonic: string,
  accountIndex: number = 0
): string {
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const rootKey = Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'),
    Buffer.from('')
  );
  
  // Derive: m/1852'/1815'/0'/0/0
  const accountKey = rootKey
    .derive(harden(1852))
    .derive(harden(1815))
    .derive(harden(accountIndex));
    
  return accountKey.to_bech32();
}

export function getBaseAddressFromMnemonic(
  mnemonic: string,
  network: NetworkInfo
): string {
  // Generate base address from mnemonic
  // ...implementation
}

export class PaymentVerificationKey {
  static fromBech32(bech32: string): PaymentVerificationKey
  toBech32(): string
  hash(): string
}
```

**`bigint.utils.ts`** - BigInt serialization
```typescript
export function convertBigIntToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntToString(obj[key]);
    }
    return result;
  }
  return obj;
}
```

**`generator.util.ts`** - ID/Key generators
```typescript
import { randomBytes } from 'crypto';

export function generateConsumerKey(): string {
  return randomBytes(32).toString('hex');
}

export function generateApiKey(): string {
  return `hx_${randomBytes(24).toString('base64url')}`;
}
```

### 3.7 Module `common/`, `config/`, `decorators/`, `constants/`

#### **`common/interceptors/`**

**`base-response.interceptor.ts`** - Chuẩn hóa response format
```typescript
@Injectable()
export class BaseResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data,
        timestamp: new Date().toISOString()
      }))
    );
  }
}
```

**`bigint.interceptor.ts`** - Convert BigInt to string
```typescript
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => convertBigIntToString(data))
    );
  }
}
```

#### **`config/configuration.ts`**

```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3010,
  hydra: {
    binDirPath: process.env.NEST_HYDRA_BIN_DIR_PATH,
    nodeImage: process.env.NEST_HYDRA_NODE_IMAGE,
    nodeFolder: process.env.NEST_HYDRA_NODE_FOLDER,
  },
  cardano: {
    nodeServiceName: process.env.NEST_CARDANO_NODE_SERVICE_NAME,
    nodeImage: process.env.NEST_CARDANO_NODE_IMAGE,
    nodeFolder: process.env.NEST_CARDANO_NODE_FOLDER,
    nodeSocketPath: process.env.NEST_CARDANO_NODE_SOCKER_PATH,
  },
  docker: {
    socketPath: process.env.NEST_DOCKER_SOCKET_PATH,
    enableNetworkHost: process.env.NEST_DOCKER_ENABLE_NETWORK_HOST === 'true',
  },
  database: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
  },
});
```

#### **`decorators/`**

Custom decorators cho authentication và validation.

```typescript
// @Roles() decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage:
@Roles('admin', 'operator')
@UseGuards(RoleGuard)
export class AdminController {}
```

### 3.8 Module `event/`

**`emit.event.ts`** - Event emitter cho internal events

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

export class HexcoreEventEmitter {
  constructor(private eventEmitter: EventEmitter2) {}
  
  emitNodeCreated(node: HydraNode) {
    this.eventEmitter.emit('node.created', node);
  }
  
  emitNodeActivated(nodeId: string) {
    this.eventEmitter.emit('node.activated', { nodeId });
  }
  
  emitHeadOpened(headId: string) {
    this.eventEmitter.emit('head.opened', { headId });
  }
}

// Listener example:
@OnEvent('node.created')
handleNodeCreated(node: HydraNode) {
  // Send notification, update cache, etc.
}
```

### 3.9 Module `middlewares/`

Express middlewares cho logging, error handling, etc.

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  }
}
```

### 3.10 Tóm tắt cấu trúc module theo NestJS pattern

```
Module Architecture:
├── Module (business logic container)
│   ├── Controller (HTTP/WS endpoints)
│   ├── Service (business logic)
│   ├── Gateway (WebSocket handlers)
│   ├── Entities (database models)
│   ├── DTOs (data transfer objects)
│   └── Utils (module-specific utilities)
│
├── Guards (authentication/authorization)
├── Interceptors (transform requests/responses)
├── Pipes (validate & transform input)
├── Filters (handle exceptions)
└── Decorators (metadata & utilities)
```

**Best Practices:**
- ✅ Mỗi module độc lập, tự quản lý dependencies
- ✅ Service chứa business logic, controller chỉ handle HTTP
- ✅ Sử dụng DTOs cho validation input
- ✅ Entities là single source of truth cho database schema
- ✅ Guards và interceptors tái sử dụng được
- ✅ Config centralized trong ConfigModule

---

## 4. Quy trình phát triển & triển khai

### 4.1 Yêu cầu môi trường

#### **Development Machine Requirements:**

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | 20.x LTS | Dùng nvm để quản lý versions |
| **pnpm** | 9.x | Package manager (recommend) |
| **Docker** | 24.x+ | Docker Desktop hoặc Docker Engine |
| **Docker Compose** | 2.x+ | Bundled với Docker Desktop |
| **MySQL** | 8.0+ | Hoặc SQLite cho dev |
| **Redis** | 7.x+ | Optional nhưng recommended |
| **Git** | 2.x+ | Version control |

#### **Blockchain Infrastructure:**

| Service | Version | Purpose |
|---------|---------|---------|
| **Cardano Node** | 10.1.4+ | L1 blockchain node |
| **Ogmios** | 6.x+ | Query/submit API |
| **Hydra Node** | 0.20.0+ | L2 scaling node |

#### **OS Support:**
- ✅ **macOS**: Intel & Apple Silicon (M1/M2/M3)
- ✅ **Linux**: Ubuntu 22.04+, Debian 12+
- ⚠️ **Windows**: WSL2 recommended (native có thể gặp issues với Docker socket)

### 4.2 Cấu hình `.env`

#### **Backend (hydra-hexcore/.env):**

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3010
NODE_ENV=development

# ============================================
# HYDRA CONFIGURATION
# ============================================
# Path tới thư mục chứa hydra binary (hydra-node, hydra-tools)
NEST_HYDRA_BIN_DIR_PATH=/path/to/hydra/bin

# Docker image cho Hydra Node
NEST_HYDRA_NODE_IMAGE=ghcr.io/cardano-scaling/hydra-node:0.20.0

# Transaction ID của Hydra scripts (script UTxO references)
NEST_HYDRA_NODE_SCRIPT_TX_ID=557b6a6eaf6177407757cb82980ebc5b759b150ccfd329e1d8f81bbd16fecb01

# Network ID (1 = preprod, 0 = testnet, 764824073 = mainnet)
NEST_HYDRA_NODE_NETWORK_ID=1

# Thư mục chứa data của Hydra nodes
NEST_HYDRA_NODE_FOLDER=/path/to/hydra/preprod

# ============================================
# CARDANO NODE CONFIGURATION
# ============================================
NEST_CARDANO_NODE_SERVICE_NAME=cardano-node
NEST_CARDANO_NODE_IMAGE=ghcr.io/intersectmbo/cardano-node:10.1.4
NEST_CARDANO_NODE_FOLDER=/path/to/cardano-node
NEST_CARDANO_NODE_SOCKER_PATH=/path/to/cardano-node/node.socket

# ============================================
# OGMIOS CONFIGURATION
# ============================================
NEST_OGMIOS_HOST=localhost
NEST_OGMIOS_PORT=1337

# ============================================
# DOCKER CONFIGURATION
# ============================================
# Docker socket path
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock
# Windows: \\.\pipe\docker_engine

# Enable host network mode (Linux only)
NEST_DOCKER_ENABLE_NETWORK_HOST=false

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=hexcore
DB_SYNCHRONIZE=true  # Set false in production

# SQLite alternative (dev only):
# DB_TYPE=sqlite
# DB_DATABASE=./database/hexcore.sqlite

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ============================================
# PROXY CONFIGURATION (optional)
# ============================================
NEST_PROXY_MATCH_PATTERN=^([a-z0-9-]+)\.hydranode\.io\.vn$
NEST_PROXY_DOMAIN=hydranode.io.vn

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

#### **Frontend (hexcore-ui/.env):**

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=4001

# ============================================
# API CONFIGURATION
# ============================================
# Backend API base URL
BASE_API_URL=http://localhost:3010

# ============================================
# PUBLIC CONFIGURATION
# ============================================
# Public base URL (for client-side)
NUXT_PUBLIC_BASE_URL=http://localhost:4001

# Hydra node proxy URL pattern
# <port> sẽ được replace với actual port number
NUXT_PUBLIC_HYDRA_NODE_PROXY_PATTERN=hydranode-<port>.hexcore.io.vn

# Enable SSL cho Hydra node proxy
NUXT_PUBLIC_HYDRA_NODE_PROXY_SSL=false

# ============================================
# APP CONFIGURATION
# ============================================
APP_VERSION=1.0.1
```

### 4.3 Cấu trúc thư mục `configs/`

```
configs/
├── docker-compose.yml          # Main compose file cho Cardano + Ogmios
│
├── cardano/                    # Cardano node configs
│   ├── docker-compose.yml      # Standalone Cardano node
│   ├── config.json             # Node config (network params)
│   ├── topology.json           # Network topology
│   ├── byron-genesis.json      # Byron era genesis
│   ├── shelley-genesis.json    # Shelley era genesis
│   ├── alonzo-genesis.json     # Alonzo era genesis
│   └── conway-genesis.json     # Conway era genesis
│
└── ogmios/                     # Ogmios configs
    └── docker-compose.yml      # Standalone Ogmios service
```

**Chức năng:**
- `configs/docker-compose.yml`: Deploy cả Cardano-node + Ogmios cùng lúc
- `configs/cardano/`: Config riêng cho Cardano node (có thể dùng độc lập)
- `configs/ogmios/`: Config riêng cho Ogmios (depend on Cardano socket)

### 4.4 Thiết lập Cardano-node

#### **Option 1: Sử dụng Docker (Recommended)**

```bash
cd configs/cardano

# Pull image
docker pull ghcr.io/intersectmbo/cardano-node:10.1.4

# Start Cardano node
docker-compose up -d

# Check logs
docker logs -f cardano-node

# Verify node is syncing
docker exec cardano-node cardano-cli query tip --testnet-magic 1
```

**Expected output:**
```json
{
  "block": 12345678,
  "epoch": 123,
  "era": "Conway",
  "hash": "abc123...",
  "slot": 67891234,
  "slotInEpoch": 12345,
  "slotsToEpochEnd": 54321,
  "syncProgress": "100.00"
}
```

#### **Option 2: Binary Installation**

```bash
# Download từ IOG releases
wget https://github.com/IntersectMBO/cardano-node/releases/download/10.1.4/cardano-node-10.1.4-linux.tar.gz

# Extract
tar -xzf cardano-node-10.1.4-linux.tar.gz

# Move to bin
sudo mv cardano-node cardano-cli /usr/local/bin/

# Download config files
wget https://book.world.dev.cardano.org/environments/preprod/config.json
wget https://book.world.dev.cardano.org/environments/preprod/topology.json
wget https://book.world.dev.cardano.org/environments/preprod/byron-genesis.json
wget https://book.world.dev.cardano.org/environments/preprod/shelley-genesis.json
wget https://book.world.dev.cardano.org/environments/preprod/alonzo-genesis.json
wget https://book.world.dev.cardano.org/environments/preprod/conway-genesis.json

# Run node
cardano-node run \
  --topology topology.json \
  --database-path db \
  --socket-path node.socket \
  --host-addr 0.0.0.0 \
  --port 3001 \
  --config config.json
```

**⚠️ Lưu ý:**
- Sync đầy đủ preprod có thể mất **2-4 giờ**
- Mainnet có thể mất **1-2 ngày**
- Cần ít nhất **50GB disk space** cho preprod, **150GB+** cho mainnet

### 4.5 Thiết lập Ogmios

```bash
cd configs/ogmios

# Ensure Cardano node is running và socket path chính xác
ls -la ../cardano/node.socket

# Start Ogmios
docker-compose up -d

# Check logs
docker logs -f ogmios

# Test connection
curl http://localhost:1337/health
```

**Expected response:**
```json
{
  "networkSynchronization": 1.0,
  "currentEpoch": 123,
  "slotInEpoch": 12345,
  "metrics": {
    "activeConnections": 0,
    "totalConnections": 0,
    "sessionDurations": {}
  }
}
```

**Test WebSocket connection:**
```bash
wscat -c ws://localhost:1337

# Send query
{"jsonrpc":"2.0","method":"queryNetwork/tip","id":0}

# Expected response
{"jsonrpc":"2.0","result":{"slot":67891234,"hash":"abc123..."},"id":0}
```

### 4.6 Chạy độc lập từng dịch vụ

#### **Cardano Node (standalone):**
```bash
cd cardano-node
docker-compose up -d
```

#### **Ogmios (standalone):**
```bash
cd ogmios
# Cần mount socket từ Cardano node
docker run -d \
  --name ogmios \
  -p 1337:1337 \
  -v /path/to/cardano-node:/cardano-node \
  cardanosolutions/ogmios:latest \
  --node-socket /cardano-node/node.socket \
  --node-config /config/preprod/config.json \
  --host 0.0.0.0
```

#### **Hexcore Backend:**
```bash
cd hydra-hexcore

# Install dependencies
pnpm install

# Run development mode
pnpm start:dev

# Or build & run production
pnpm build
pnpm start:prod
```

#### **Hexcore UI:**
```bash
cd hexcore-ui

# Install dependencies
pnpm install

# Run development mode
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### 4.7 Chạy đồng bộ bằng `configs/docker-compose.yml`

```bash
cd hydra-hexcore/configs

# Start toàn bộ stack (Cardano + Ogmios)
docker-compose up -d

# Check tất cả services
docker-compose ps

# Xem logs
docker-compose logs -f

# Stop tất cả
docker-compose down
```

**`docker-compose.yml` example:**
```yaml
version: "3.9"

services:
  cardano-node:
    image: ghcr.io/intersectmbo/cardano-node:10.2.1
    container_name: cardano-node
    environment:
      - CARDANO_NODE_SOCKET_PATH=/workspace/node.socket
    volumes:
      - ./database:/db
      - ./:/workspace
      - node-ipc:/workspace
    ports:
      - "8091:8091"
    command: >
      run
      --config /workspace/config.json
      --topology /workspace/topology.json
      --socket-path /workspace/node.socket
      --database-path /db
      --port 8091
      --host-addr 0.0.0.0
    restart: always

  ogmios:
    image: cardanosolutions/ogmios:latest
    container_name: ogmios
    restart: on-failure
    depends_on:
      - cardano-node
    ports:
      - "1337:1337"
    volumes:
      - ./cardano-node:/cardano-node
      - node-ipc:/cardano-node
    command:
      - "--node-socket"
      - "/cardano-node/node.socket"
      - "--node-config"
      - "/config/preprod/cardano-node/config.json"
      - "--host"
      - "0.0.0.0"

volumes:
  db:
    driver: local
  node-ipc:
    driver: local
```

### 4.8 Cấu hình socket & biến môi trường

#### **Socket IPC giữa Cardano Node và Ogmios:**

```bash
# Kiểm tra socket tồn tại
ls -la /path/to/cardano-node/node.socket

# Kiểm tra permissions
# Socket phải readable bởi user chạy Ogmios
chmod 666 /path/to/cardano-node/node.socket

# Nếu dùng Docker volumes:
docker volume inspect node-ipc
```

#### **Docker Socket cho Hexcore:**

```bash
# macOS/Linux
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock

# Windows (WSL2)
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock

# Windows (native - not recommended)
NEST_DOCKER_SOCKET_PATH=//./pipe/docker_engine
```

**⚠️ Security Note:**
- Mounting Docker socket cho phép container control Docker daemon
- Chỉ làm này trong môi trường tin cậy
- Production nên dùng Docker API qua TCP với TLS

### 4.9 Kiểm tra hoạt động node & Ogmios

```bash
# Test Cardano node
cardano-cli query tip --testnet-magic 1 \
  --socket-path /path/to/node.socket

# Test Ogmios health
curl http://localhost:1337/health

# Test Ogmios query
curl -X POST http://localhost:1337 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"queryNetwork/tip","id":0}'

# Test Hexcore backend
curl http://localhost:3010/api/hydra/nodes

# Test Hexcore UI
open http://localhost:4001
```

### 4.10 Tích hợp với Hydra Node

#### **Pull Hydra Node image:**
```bash
docker pull ghcr.io/cardano-scaling/hydra-node:0.20.0
```

#### **Generate Hydra keys:**
```bash
# Hydra verification & signing keys
docker run --rm \
  -v $(pwd)/hydra:/data \
  ghcr.io/cardano-scaling/hydra-node:0.20.0 \
  gen-hydra-key --output-file /data/party1

# Kết quả:
# party1.vk  - verification key (public)
# party1.sk  - signing key (private)
```

#### **Test manual Hydra node:**
```bash
docker run -d \
  --name hydra-node-test \
  -p 4001:4001 \
  -v $(pwd)/hydra:/data \
  -v /path/to/cardano-node:/cardano-node \
  ghcr.io/cardano-scaling/hydra-node:0.20.0 \
    --node-id party1 \
    --api-host 0.0.0.0 \
    --api-port 4001 \
    --hydra-signing-key /data/party1.sk \
    --hydra-verification-key /data/party1.vk \
    --cardano-signing-key /data/cardano.sk \
    --cardano-verification-key /data/cardano.vk \
    --ledger-protocol-parameters /data/protocol-parameters.json \
    --testnet-magic 1 \
    --node-socket /cardano-node/node.socket \
    --persistence-dir /data/persistence

# Test WebSocket
wscat -c ws://localhost:4001?history=no

# Expected greeting
{"tag":"Greetings","headStatus":"Idle",...}
```

### 4.11 Build & Run

#### **Development:**
```bash
# Backend
cd hydra-hexcore
pnpm install
pnpm start:dev  # Hot reload enabled

# Frontend  
cd hexcore-ui
pnpm install
pnpm dev  # Vite HMR
```

#### **Production Build:**
```bash
# Backend
cd hydra-hexcore
pnpm install --prod
pnpm build
pnpm start:prod

# Frontend
cd hexcore-ui
pnpm install
pnpm build  # Output: .output/

# Serve với node
node .output/server/index.mjs

# Hoặc deploy static files
# (nếu dùng nuxt generate)
pnpm generate  # Output: .output/public/
```

#### **Docker Build:**

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3010
CMD ["node", "dist/main"]
```

```bash
docker build -t hexcore-backend .
docker run -d -p 3010:3010 --env-file .env hexcore-backend
```

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 4001
CMD ["node", ".output/server/index.mjs"]
```

### 4.12 Kiểm thử & Debug

#### **Backend Testing:**
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov

# Debug mode
pnpm start:debug
# Attach debugger trên port 9229
```

#### **Frontend Testing:**
```bash
# Unit tests
pnpm test

# Component tests
pnpm test:unit

# Coverage
pnpm test --coverage
```

#### **Debug Tips:**

**Backend:**
```typescript
// Enable verbose logging
// main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

// VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["start:debug"],
  "port": 9229,
  "skipFiles": ["<node_internals>/**"]
}
```

**Frontend:**
```javascript
// Enable Vue devtools
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  vite: {
    server: {
      sourcemap: true
    }
  }
})
```

**Docker Debug:**
```bash
# Check container logs
docker logs -f hexcore-backend

# Exec vào container
docker exec -it hexcore-backend sh

# Check environment
docker exec hexcore-backend env

# Check network
docker network inspect bridge
```

### 4.13 Database Migration

#### **TypeORM CLI:**

```bash
# Generate migration từ entity changes
pnpm typeorm migration:generate ./src/migrations/AddConsumerTable

# Run migrations
pnpm typeorm migration:run

# Revert last migration
pnpm typeorm migration:revert

# Show migrations
pnpm typeorm migration:show
```

#### **Migration Example:**
```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsumerTable1234567890 implements MigrationInterface {
    name = 'AddConsumerTable1234567890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`consumers\` (
                \`id\` varchar(36) NOT NULL,
                \`address\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`status\` enum('active', 'inactive') DEFAULT 'active',
                \`apiKey\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_address\` (\`address\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_address\` ON \`consumers\``);
        await queryRunner.query(`DROP TABLE \`consumers\``);
    }
}
```

**⚠️ Production Best Practices:**
- ❌ Không enable `synchronize: true` trong production
- ✅ Luôn dùng migrations cho schema changes
- ✅ Test migrations trên staging trước
- ✅ Backup database trước khi migrate
- ✅ Có rollback plan

### 4.14 CI/CD Pipeline gợi ý

#### **GitHub Actions Example:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: cd hydra-hexcore && pnpm install
        
      - name: Run tests
        run: cd hydra-hexcore && pnpm test
        
      - name: Run E2E tests
        run: cd hydra-hexcore && pnpm test:e2e

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: cd hexcore-ui && pnpm install
        
      - name: Run tests
        run: cd hexcore-ui && pnpm test

  build-and-deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t hexcore-backend:latest ./hydra-hexcore
          docker build -t hexcore-ui:latest ./hexcore-ui
          
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push hexcore-backend:latest
          docker push hexcore-ui:latest
          
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/hexcore
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

### 4.15 Kiến trúc triển khai thực tế (Deployment Model)

```
┌─────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                        │
│                 (Nginx / Cloudflare)                    │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
    ┌────────▼────────┐    ┌────────▼────────┐
    │  Hexcore UI     │    │  Hexcore API    │
    │  (Port 4001)    │    │  (Port 3010)    │
    │  - Nuxt SSR     │    │  - NestJS       │
    │  - Static       │    │  - WebSocket    │
    └─────────────────┘    └────────┬────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐     ┌────────▼────────┐  ┌───────▼──────┐
       │  MySQL      │     │  Redis          │  │  Docker      │
       │  (Port 3306)│     │  (Port 6379)    │  │  Engine      │
       └─────────────┘     └─────────────────┘  └───────┬──────┘
                                                         │
                           ┌─────────────────────────────┼──────────┐
                           │                             │          │
                    ┌──────▼──────┐            ┌────────▼────────┐ │
                    │ Cardano Node│            │  Hydra Nodes    │ │
                    │ (Port 8091) │            │  (Dynamic ports)│ │
                    │ - Socket    │◄───────────┤  - Containers   │ │
                    └──────┬──────┘            └─────────────────┘ │
                           │                                        │
                    ┌──────▼──────┐                                │
                    │   Ogmios    │                                │
                    │ (Port 1337) │◄───────────────────────────────┘
                    └─────────────┘
```

**Components:**
1. **Load Balancer**: Nginx hoặc cloud LB (ALB, GCP LB)
2. **Hexcore UI**: Nuxt app (có thể SSR hoặc static)
3. **Hexcore API**: NestJS backend
4. **Database**: MySQL cluster với replication
5. **Redis**: Cluster mode cho HA
6. **Docker Engine**: Host Hydra node containers
7. **Cardano Node**: Full node sync
8. **Ogmios**: Query/submit gateway

### 4.16 Mẹo vận hành nhanh (Admin Tips)

#### **Quick Commands:**

```bash
# Restart toàn bộ stack
docker-compose restart

# Chỉ restart backend
docker-compose restart hexcore-backend

# Xem logs realtime
docker-compose logs -f --tail=100

# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Backup database
docker exec mysql mysqldump -u root -p hexcore > backup.sql

# Restore database
docker exec -i mysql mysql -u root -p hexcore < backup.sql

# Export Redis data
docker exec redis redis-cli --rdb /data/dump.rdb

# Monitor resources
docker stats
```

#### **Health Checks:**

```bash
# Check all services
curl http://localhost:3010/health  # Backend
curl http://localhost:4001/        # Frontend
curl http://localhost:1337/health  # Ogmios
docker exec cardano-node cardano-cli query tip --testnet-magic 1

# Check Hydra nodes
docker ps | grep hydra-node

# Check logs for errors
docker-compose logs | grep -i error
```

#### **Troubleshooting Common Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Backend can't connect to Docker | Socket permission | `sudo chmod 666 /var/run/docker.sock` |
| Ogmios timeout | Cardano node not synced | Wait for sync or check socket path |
| Hydra node won't start | Port conflict | Check port availability với `lsof -i :PORT` |
| Database connection failed | Wrong credentials | Verify `.env` DB_* variables |
| Redis connection failed | Redis not running | `docker-compose up -d redis` |
| Out of disk space | Docker images/volumes | `docker system prune -a --volumes` |

---

## 5. Mở rộng & Tích hợp

### 5.1 Thêm module mới (ví dụ: `hydra-analytics/`)

#### **Bước 1: Generate module với NestJS CLI**

```bash
cd hydra-hexcore/src

# Generate module, controller, service
nest g module hydra-analytics
nest g controller hydra-analytics
nest g service hydra-analytics

# Generate entity
nest g class hydra-analytics/entities/analytics-event.entity

# Generate DTO
nest g class hydra-analytics/dto/create-analytics-event.dto
```

#### **Bước 2: Implement entity**

```typescript
// src/hydra-analytics/entities/analytics-event.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { HydraNode } from '../../hydra-main/entities/HydraNode.entity';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => HydraNode)
  node: HydraNode;

  @Column()
  eventType: string; // HeadOpened, TxValid, SnapshotConfirmed, etc.

  @Column('json')
  eventData: any;

  @Column({ type: 'bigint' })
  timestamp: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### **Bước 3: Implement service**

```typescript
// src/hydra-analytics/hydra-analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class HydraAnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  // Lắng nghe Hydra events
  @OnEvent('hydra.event')
  async handleHydraEvent(payload: any) {
    const event = this.analyticsRepo.create({
      node: payload.nodeId,
      eventType: payload.tag,
      eventData: payload,
      timestamp: payload.timestamp || Date.now(),
    });
    await this.analyticsRepo.save(event);
  }

  async getNodeAnalytics(nodeId: string, startDate: Date, endDate: Date) {
    return this.analyticsRepo.find({
      where: {
        node: { id: nodeId },
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getEventTypeDistribution(nodeId: string) {
    return this.analyticsRepo
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.nodeId = :nodeId', { nodeId })
      .groupBy('event.eventType')
      .getRawMany();
  }

  async getTransactionStats(nodeId: string) {
    // Calculate TPS, latency, etc.
    const events = await this.analyticsRepo.find({
      where: { node: { id: nodeId }, eventType: 'TxValid' },
      order: { timestamp: 'ASC' },
    });

    // Calculate metrics
    const tps = this.calculateTPS(events);
    const avgLatency = this.calculateAvgLatency(events);

    return { tps, avgLatency, totalTx: events.length };
  }

  private calculateTPS(events: AnalyticsEvent[]): number {
    if (events.length < 2) return 0;
    const duration = (events[events.length - 1].timestamp - events[0].timestamp) / 1000;
    return events.length / duration;
  }

  private calculateAvgLatency(events: AnalyticsEvent[]): number {
    // Implementation depends on event structure
    return 0;
  }
}
```

#### **Bước 4: Implement controller**

```typescript
// src/hydra-analytics/hydra-analytics.controller.ts
import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { HydraAnalyticsService } from './hydra-analytics.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('api/analytics')
@UseGuards(AdminAuthGuard)
export class HydraAnalyticsController {
  constructor(private readonly analyticsService: HydraAnalyticsService) {}

  @Get('nodes/:nodeId/events')
  async getNodeEvents(
    @Param('nodeId') nodeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getNodeAnalytics(
      nodeId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('nodes/:nodeId/distribution')
  async getEventDistribution(@Param('nodeId') nodeId: string) {
    return this.analyticsService.getEventTypeDistribution(nodeId);
  }

  @Get('nodes/:nodeId/stats')
  async getTransactionStats(@Param('nodeId') nodeId: string) {
    return this.analyticsService.getTransactionStats(nodeId);
  }
}
```

#### **Bước 5: Update module**

```typescript
// src/hydra-analytics/hydra-analytics.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraAnalyticsController } from './hydra-analytics.controller';
import { HydraAnalyticsService } from './hydra-analytics.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [HydraAnalyticsController],
  providers: [HydraAnalyticsService],
  exports: [HydraAnalyticsService],
})
export class HydraAnalyticsModule {}
```

#### **Bước 6: Import vào AppModule**

```typescript
// src/app.module.ts
import { HydraAnalyticsModule } from './hydra-analytics/hydra-analytics.module';

@Module({
  imports: [
    // ...existing imports
    HydraAnalyticsModule,
  ],
  // ...
})
export class AppModule {}
```

#### **Bước 7: Run migration**

```bash
pnpm typeorm migration:generate ./src/migrations/CreateAnalyticsTable
pnpm typeorm migration:run
```

### 5.2 Hook sự kiện nội bộ Hydra (HeadOpened, SnapshotConfirmed, v.v.)

#### **Event Emitter Setup:**

```typescript
// src/hydra-main/hydra-main.gateway.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway()
export class HydraMainGateway {
  constructor(private eventEmitter: EventEmitter2) {}

  @SubscribeMessage('monitor-node')
  handleMonitorNode(client: Socket, payload: { nodeUrl: string }) {
    const ws = new WebSocket(payload.nodeUrl);

    ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      
      // Emit event nội bộ
      this.eventEmitter.emit('hydra.event', {
        nodeId: payload.nodeId,
        ...event,
      });

      // Specific events
      if (event.tag === 'HeadIsOpen') {
        this.eventEmitter.emit('hydra.head.opened', event);
      } else if (event.tag === 'SnapshotConfirmed') {
        this.eventEmitter.emit('hydra.snapshot.confirmed', event);
      } else if (event.tag === 'TxValid') {
        this.eventEmitter.emit('hydra.tx.valid', event);
      }

      // Forward to client
      client.emit('node-message', event);
    });
  }
}
```

#### **Event Listeners:**

```typescript
// src/hydra-analytics/listeners/hydra-event.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class HydraEventListener {
  @OnEvent('hydra.head.opened')
  handleHeadOpened(payload: any) {
    console.log('Head opened:', payload);
    // Send notification
    // Update dashboard
    // Trigger webhooks
  }

  @OnEvent('hydra.snapshot.confirmed')
  handleSnapshotConfirmed(payload: any) {
    console.log('Snapshot confirmed:', payload);
    // Update metrics
  }

  @OnEvent('hydra.tx.valid')
  handleTxValid(payload: any) {
    console.log('Transaction valid:', payload);
    // Update transaction counter
  }

  @OnEvent('hydra.head.closed')
  handleHeadClosed(payload: any) {
    console.log('Head closed:', payload);
    // Cleanup resources
  }
}
```

#### **Register Listener:**

```typescript
// src/hydra-analytics/hydra-analytics.module.ts
import { HydraEventListener } from './listeners/hydra-event.listener';

@Module({
  // ...
  providers: [HydraAnalyticsService, HydraEventListener],
})
export class HydraAnalyticsModule {}
```

### 5.3 Tích hợp Prometheus & Grafana

#### **Bước 1: Install Prometheus client**

```bash
cd hydra-hexcore
pnpm add @willsoto/nestjs-prometheus prom-client
```

#### **Bước 2: Setup Prometheus module**

```typescript
// src/app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
    // ...
  ],
})
export class AppModule {}
```

#### **Bước 3: Tạo custom metrics**

```typescript
// src/hydra-main/metrics/hydra.metrics.ts
import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class HydraMetrics {
  constructor(
    @InjectMetric('hydra_nodes_total')
    public nodesCounter: Counter<string>,

    @InjectMetric('hydra_active_nodes')
    public activeNodesGauge: Gauge<string>,

    @InjectMetric('hydra_tx_duration_seconds')
    public txDurationHistogram: Histogram<string>,

    @InjectMetric('hydra_events_total')
    public eventsCounter: Counter<string>,
  ) {}

  incrementNodes() {
    this.nodesCounter.inc();
  }

  setActiveNodes(count: number) {
    this.activeNodesGauge.set(count);
  }

  recordTxDuration(duration: number) {
    this.txDurationHistogram.observe(duration);
  }

  incrementEvent(eventType: string) {
    this.eventsCounter.inc({ event_type: eventType });
  }
}
```

#### **Bước 4: Register metrics**

```typescript
// src/hydra-main/hydra-main.module.ts
import { makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  providers: [
    makeCounterProvider({
      name: 'hydra_nodes_total',
      help: 'Total number of Hydra nodes created',
    }),
    makeGaugeProvider({
      name: 'hydra_active_nodes',
      help: 'Number of currently active Hydra nodes',
    }),
    makeHistogramProvider({
      name: 'hydra_tx_duration_seconds',
      help: 'Transaction processing duration in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'hydra_events_total',
      help: 'Total number of Hydra events',
      labelNames: ['event_type'],
    }),
    HydraMetrics,
    // ...
  ],
})
export class HydraMainModule {}
```

#### **Bước 5: Use metrics trong service**

```typescript
// src/hydra-main/hydra-main.service.ts
import { HydraMetrics } from './metrics/hydra.metrics';

@Injectable()
export class HydraMainService {
  constructor(private metrics: HydraMetrics) {}

  async createNode(dto: CreateHydraNodeDto) {
    const node = await this.nodeRepo.save(dto);
    this.metrics.incrementNodes();
    return node;
  }

  async activateParty(dto: ReqActivePartyDto) {
    const start = Date.now();
    // ...activate logic
    const duration = (Date.now() - start) / 1000;
    this.metrics.recordTxDuration(duration);
    this.metrics.setActiveNodes(await this.getActiveNodeCount());
  }

  @OnEvent('hydra.event')
  handleHydraEvent(event: any) {
    this.metrics.incrementEvent(event.tag);
  }
}
```

#### **Bước 6: Setup Prometheus server**

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'hexcore-backend'
    static_configs:
      - targets: ['hexcore-backend:3010']
    metrics_path: '/metrics'
```

#### **Bước 7: Import Grafana dashboard**

```json
{
  "dashboard": {
    "title": "Hexcore Hydra Monitoring",
    "panels": [
      {
        "title": "Active Nodes",
        "targets": [
          {
            "expr": "hydra_active_nodes"
          }
        ]
      },
      {
        "title": "Total Events",
        "targets": [
          {
            "expr": "rate(hydra_events_total[5m])"
          }
        ]
      },
      {
        "title": "Transaction Duration (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(hydra_tx_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### 5.4 Tích hợp hệ thống giám sát (Fluentd, Loki, ELK)

#### **Option 1: Loki + Promtail (Recommended)**

```yaml
# docker-compose.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

```yaml
# loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /tmp/loki/index
  filesystem:
    directory: /tmp/loki/chunks
```

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
```

#### **Option 2: ELK Stack**

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

#### **NestJS Logger Integration:**

```typescript
// src/common/logger/winston.config.ts
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/hexcore-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    fileRotateTransport,
  ],
};
```

```typescript
// src/main.ts
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  // ...
}
```

### 5.5 Tích hợp Wallet Service bên thứ ba (Ledger, Nami, Eternl)

#### **Frontend Integration:**

```typescript
// hexcore-ui/composables/useWallet.ts
import { ref, computed } from 'vue';

export const useWallet = () => {
  const walletApi = ref<any>(null);
  const connectedWallet = ref<string | null>(null);
  const address = ref<string | null>(null);

  const availableWallets = computed(() => {
    if (typeof window === 'undefined') return [];
    return Object.keys(window.cardano || {});
  });

  async function connectWallet(walletName: string) {
    try {
      if (!window.cardano?.[walletName]) {
        throw new Error(`Wallet ${walletName} not found`);
      }

      walletApi.value = await window.cardano[walletName].enable();
      connectedWallet.value = walletName;

      // Get address
      const networkId = await walletApi.value.getNetworkId();
      const changeAddress = await walletApi.value.getChangeAddress();
      address.value = changeAddress;

      return { success: true, address: changeAddress };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { success: false, error };
    }
  }

  async function getBalance() {
    if (!walletApi.value) return null;
    const balance = await walletApi.value.getBalance();
    return balance;
  }

  async function getUtxos() {
    if (!walletApi.value) return [];
    const utxos = await walletApi.value.getUtxos();
    return utxos;
  }

  async function signTx(txHex: string) {
    if (!walletApi.value) throw new Error('No wallet connected');
    const witnessSet = await walletApi.value.signTx(txHex, true);
    return witnessSet;
  }

  async function submitTx(txHex: string) {
    if (!walletApi.value) throw new Error('No wallet connected');
    const txHash = await walletApi.value.submitTx(txHex);
    return txHash;
  }

  function disconnectWallet() {
    walletApi.value = null;
    connectedWallet.value = null;
    address.value = null;
  }

  return {
    availableWallets,
    connectedWallet,
    address,
    connectWallet,
    getBalance,
    getUtxos,
    signTx,
    submitTx,
    disconnectWallet,
  };
};
```

#### **Usage trong component:**

```vue
<!-- hexcore-ui/components/WalletConnect.vue -->
<template>
  <div class="wallet-connect">
    <button
      v-if="!connectedWallet"
      v-for="wallet in availableWallets"
      :key="wallet"
      @click="handleConnect(wallet)"
    >
      Connect {{ wallet }}
    </button>

    <div v-else>
      <p>Connected: {{ connectedWallet }}</p>
      <p>Address: {{ address }}</p>
      <button @click="disconnectWallet">Disconnect</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { availableWallets, connectedWallet, address, connectWallet, disconnectWallet } = useWallet();

async function handleConnect(walletName: string) {
  const result = await connectWallet(walletName);
  if (result.success) {
    ElMessage.success(`Connected to ${walletName}`);
  } else {
    ElMessage.error('Failed to connect wallet');
  }
}
</script>
```

### 5.6 Tích hợp API Hydra SDK

```typescript
// src/hydra-main/services/hydra-sdk.service.ts
import { Injectable } from '@nestjs/common';
import { HydraClient, HydraWallet } from '@hydra-sdk/core';
import { CardanoWasm } from '@hydra-sdk/cardano-wasm';

@Injectable()
export class HydraSdkService {
  private clients: Map<string, HydraClient> = new Map();

  async createClient(nodeUrl: string): Promise<HydraClient> {
    const client = new HydraClient({ url: nodeUrl });
    await client.connect();
    this.clients.set(nodeUrl, client);
    return client;
  }

  async initHead(nodeUrl: string) {
    const client = this.clients.get(nodeUrl);
    if (!client) throw new Error('Client not initialized');
    return client.init();
  }

  async commitFunds(nodeUrl: string, utxo: string) {
    const client = this.clients.get(nodeUrl);
    if (!client) throw new Error('Client not initialized');
    return client.commit({ utxo });
  }

  async submitTransaction(nodeUrl: string, tx: string) {
    const client = this.clients.get(nodeUrl);
    if (!client) throw new Error('Client not initialized');
    return client.newTx({ transaction: tx });
  }

  async closeHead(nodeUrl: string) {
    const client = this.clients.get(nodeUrl);
    if (!client) throw new Error('Client not initialized');
    return client.close();
  }

  async fanout(nodeUrl: string) {
    const client = this.clients.get(nodeUrl);
    if (!client) throw new Error('Client not initialized');
    return client.fanout();
  }

  disconnect(nodeUrl: string) {
    const client = this.clients.get(nodeUrl);
    if (client) {
      client.disconnect();
      this.clients.delete(nodeUrl);
    }
  }
}
```

### 5.7 Mở rộng Hexcore UI (plugin / theme / graph view)

#### **Thêm Cytoscape.js cho graph visualization:**

```bash
cd hexcore-ui
pnpm add cytoscape @types/cytoscape
```

```vue
<!-- hexcore-ui/components/shared/HydraNetworkGraph.vue -->
<template>
  <div ref="graphContainer" class="hydra-graph"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import cytoscape from 'cytoscape';

interface Props {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ source: string; target: string }>;
}

const props = defineProps<Props>();
const graphContainer = ref<HTMLElement | null>(null);
let cy: cytoscape.Core | null = null;

onMounted(() => {
  if (!graphContainer.value) return;

  cy = cytoscape({
    container: graphContainer.value,
    elements: [
      ...props.nodes.map(node => ({
        data: { id: node.id, label: node.label },
        classes: node.type,
      })),
      ...props.edges.map(edge => ({
        data: { source: edge.source, target: edge.target },
      })),
    ],
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#0ea5e9',
          label: 'data(label)',
          'text-valign': 'center',
          color: '#fff',
          'font-size': '12px',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#94a3b8',
          'target-arrow-color': '#94a3b8',
          'target-arrow-shape': 'triangle',
        },
      },
    ],
    layout: {
      name: 'circle',
    },
  });
});

watch(() => [props.nodes, props.edges], () => {
  if (!cy) return;
  cy.elements().remove();
  cy.add([
    ...props.nodes.map(node => ({
      data: { id: node.id, label: node.label },
      classes: node.type,
    })),
    ...props.edges.map(edge => ({
      data: { source: edge.source, target: edge.target },
    })),
  ]);
  cy.layout({ name: 'circle' }).run();
});
</script>

<style scoped>
.hydra-graph {
  width: 100%;
  height: 600px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
```

---

## 6. Hướng dẫn đóng góp (Contributing)

### 6.1 Quy tắc commit message (Conventional Commits)

Hexcore sử dụng **Conventional Commits** spec để tự động generate changelog và semantic versioning.

#### **Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### **Types:**
- `feat`: Tính năng mới
- `fix`: Sửa bug
- `docs`: Thay đổi documentation
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Refactor code (không thêm feature, không fix bug)
- `perf`: Cải thiện performance
- `test`: Thêm hoặc sửa tests
- `build`: Thay đổi build system hoặc dependencies
- `ci`: Thay đổi CI configuration
- `chore`: Các thay đổi khác (tooling, gitignore, etc.)

#### **Examples:**

```bash
# Feature mới
feat(hydra-main): add support for multi-head management

# Bug fix
fix(auth): resolve JWT token expiration issue

# Breaking change
feat(api)!: change REST API response format

BREAKING CHANGE: Response format đổi từ {data, status} thành {result, meta}

# With scope and body
refactor(hydra-consumer): extract consumer key generation to utility

Extract generateConsumerKey() to utils/generator.util.ts để tái sử dụng
trong nhiều modules.

Closes #123
```

### 6.2 Cấu trúc nhánh Git (branch naming)

#### **Main Branches:**
- `main` - Production-ready code
- `develop` - Development branch

#### **Supporting Branches:**

**Feature branches:**
```
feature/<feature-name>
feature/add-grafana-integration
feature/wallet-connect-ui
```

**Bug fix branches:**
```
fix/<bug-name>
fix/docker-socket-permission
fix/ogmios-connection-timeout
```

**Hotfix branches:**
```
hotfix/<version>
hotfix/1.0.1
```

**Release branches:**
```
release/<version>
release/1.1.0
```

#### **Workflow:**

```bash
# Tạo feature branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/add-analytics-module

# Làm việc, commit theo Conventional Commits
git add .
git commit -m "feat(analytics): add analytics module with event tracking"

# Push và tạo PR
git push origin feature/add-analytics-module
```

### 6.3 Review & Pull Request flow

#### **PR Template:**

```markdown
## Description
[Mô tả ngắn gọn về thay đổi]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- [Chi tiết thay đổi 1]
- [Chi tiết thay đổi 2]

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing done

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Tests added/updated

## Related Issues
Closes #[issue number]

## Screenshots (if applicable)
[Attach screenshots]
```

#### **Review Process:**

1. **Author**: Tạo PR với description đầy đủ
2. **CI**: Automated tests chạy
3. **Reviewers**: Ít nhất 1 approval từ maintainer
4. **Author**: Address review comments
5. **Maintainer**: Merge khi approved + CI green

### 6.4 Lint & test trước khi merge

#### **Pre-commit hooks với Husky:**

```bash
# Install husky
pnpm add -D husky lint-staged

# Setup husky
npx husky install
npx husky add .husky/pre-commit "pnpm lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.vue": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### **CI checks:**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm build
```

### 6.5 Code style & ESLint rules

#### **ESLint config:**

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
```

#### **Prettier config:**

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "avoid"
}
```

---

## 7. Phụ lục

### 7.1 Sơ đồ hệ thống tổng thể

```
                    ┌───────────────────────────────────────────┐
                    │           HEXCORE ECOSYSTEM               │
                    └───────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────▼─────────┐          ┌────────▼────────┐          ┌────────▼────────┐
│  HEXCORE UI     │◄────────►│  HEXCORE API    │◄────────►│  INFRASTRUCTURE │
│  (Frontend)     │   HTTP   │  (Backend)      │   IPC    │                 │
│                 │   WS     │                 │   Socket │                 │
│  - Nuxt 3       │          │  - NestJS       │          │  - Docker       │
│  - Vue 3        │          │  - TypeORM      │          │  - Cardano Node │
│  - Pinia        │          │  - Socket.IO    │          │  - Ogmios       │
│  - UnoCSS       │          │  - Dockerode    │          │  - Hydra Nodes  │
└─────────────────┘          └─────────────────┘          └─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
            ┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼───────┐
            │  MySQL/SQLite│  │  Redis Cache │  │  Monitoring  │
            │              │  │              │  │              │
            │  - Entities  │  │  - Sessions  │  │  - Prometheus│
            │  - Relations │  │  - Node State│  │  - Grafana   │
            └──────────────┘  └──────────────┘  │  - Loki      │
                                                └──────────────┘
```

### 7.2 Danh mục service & port

| Service | Default Port | Protocol | Purpose |
|---------|-------------|----------|---------|
| **Hexcore Backend** | 3010 | HTTP/WS | REST API & WebSocket gateway |
| **Hexcore UI** | 4001 | HTTP | Frontend web application |
| **MySQL** | 3306 | TCP | Database |
| **Redis** | 6379 | TCP | Cache & session store |
| **Cardano Node** | 8091 | TCP | P2P blockchain sync |
| **Cardano Socket** | N/A | Unix Socket | IPC with Ogmios |
| **Ogmios** | 1337 | HTTP/WS | Cardano query/submit API |
| **Hydra Nodes** | 4001-4999 | HTTP/WS | Dynamic per node |
| **Prometheus** | 9090 | HTTP | Metrics collection |
| **Grafana** | 3000 | HTTP | Metrics visualization |
| **Loki** | 3100 | HTTP | Log aggregation |

### 7.3 Cấu hình Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/hexcore

# Upstream backends
upstream hexcore_backend {
    server localhost:3010;
}

upstream hexcore_ui {
    server localhost:4001;
}

# Main UI
server {
    listen 80;
    server_name hexcore.io.vn;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hexcore.io.vn;

    ssl_certificate /etc/letsencrypt/live/hexcore.io.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hexcore.io.vn/privkey.pem;

    # UI
    location / {
        proxy_pass http://hexcore_ui;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://hexcore_backend;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://hexcore_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}

# Dynamic Hydra node proxies
server {
    listen 443 ssl http2;
    server_name ~^hydranode-(?<port>\d+)\.hexcore\.io\.vn$;

    ssl_certificate /etc/letsencrypt/live/hexcore.io.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hexcore.io.vn/privkey.pem;

    location / {
        proxy_pass http://localhost:$port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### 7.4 Tài liệu tham khảo (Hydra, Ogmios, Cardano-node)

#### **Hydra Documentation:**
- 📖 Official Docs: https://hydra.family/head-protocol/
- 📦 GitHub: https://github.com/cardano-scaling/hydra
- 🔧 Hydra SDK: https://github.com/cardano-scaling/hydra-sdk
- 📘 Tutorial: https://hydra.family/head-protocol/docs/tutorial

#### **Ogmios Documentation:**
- 📖 Official Docs: https://ogmios.dev/
- 📦 GitHub: https://github.com/CardanoSolutions/ogmios
- 🔧 Client Libraries: https://ogmios.dev/getting-started/clients/

#### **Cardano Node Documentation:**
- 📖 Official Docs: https://docs.cardano.org/
- 📦 GitHub: https://github.com/IntersectMBO/cardano-node
- 🔧 Cardano CLI: https://github.com/IntersectMBO/cardano-cli
- 📘 Developer Portal: https://developers.cardano.org/

#### **Additional Resources:**
- 🎓 Cardano Developer Docs: https://developers.cardano.org/docs/get-started/
- 🛠️ Cardano Serialization Lib: https://github.com/Emurgo/cardano-serialization-lib
- 🌐 Cardano Testnet Faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/
- 📊 Cardano Explorer (Preprod): https://preprod.cardanoscan.io/

### 7.5 Liên hệ & Maintainers

#### **Project Maintainers:**
- **Aniadev** - Lead Developer
  - Email: [contact info]
  - GitHub: [@aniadev]

#### **Contributing:**
- 🐛 Report bugs: [GitHub Issues](https://github.com/your-org/hexcore/issues)
- 💡 Feature requests: [GitHub Discussions](https://github.com/your-org/hexcore/discussions)
- 📖 Documentation: [Wiki](https://github.com/your-org/hexcore/wiki)

#### **Community:**
- 💬 Discord: [Join our server]
- 🐦 Twitter: [@hexcore_hydra]
- 📧 Email: support@hexcore.io.vn

#### **License:**
- 📄 License: UNLICENSED (Private project)
- © 2025 Hexcore Team

---

**🎉 Chúc bạn phát triển vui vẻ với Hexcore!**

Nếu có câu hỏi hoặc cần hỗ trợ, đừng ngần ngại liên hệ team hoặc tạo issue trên GitHub nhé! 🚀
