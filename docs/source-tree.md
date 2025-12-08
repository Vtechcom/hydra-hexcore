# Hydra Hexcore - Source Code Structure

**Generated:** December 8, 2025  
**Project:** Hydra Hexcore Backend  
**Root:** `/src`

---

## 📁 Directory Structure

```
src/
├── app.module.ts              # Root application module
├── app.controller.ts          # Root controller (health checks)
├── app.service.ts             # Root service
├── main.ts                    # Application entry point
│
├── auth/                      # Authentication & Authorization
│   ├── admin-auth.guard.ts    # Admin-only route guard
│   ├── consumer-auth.guard.ts.bk  # Consumer auth (backup)
│   ├── game-auth.guard.ts     # Game-specific auth guard
│   ├── jwt.helper.ts          # JWT utility functions
│   ├── role.guard.ts          # Role-based access control
│   └── socket.guard.ts        # WebSocket authentication
│
├── common/                    # Shared utilities and interceptors
│   └── interceptors/          
│       ├── base-response.interceptor.ts  # Standardize API responses
│       ├── bigint.interceptor.ts         # Handle BigInt serialization
│       └── serializer.interceptor.ts     # Class serialization
│
├── config/                    # Configuration files
│   ├── configuration.ts       # App configuration loader
│   ├── winston.config.ts      # Winston logger configuration
│   └── README-winston.md      # Logger documentation
│
├── constants/                 # Application constants
│   └── index.ts              # JWT secrets, constants
│
├── decorators/               # Custom decorators
│   └── [custom decorators]   # NestJS custom decorators
│
├── dto/                      # Data Transfer Objects
│   └── [shared DTOs]         # Request/response DTOs
│
├── enums/                    # Enumerations
│   └── role.enum.ts          # User role definitions
│
├── event/                    # Event handling
│   └── [event handlers]      # Application events
│
├── hydra-main/               # ⭐ Core Hydra Management Module
│   ├── dto/                  # Module-specific DTOs
│   │   ├── create-account.dto.ts
│   │   ├── create-node.dto.ts
│   │   ├── create-party.dto.ts
│   │   └── login.dto.ts
│   │
│   ├── entities/             # TypeORM Database Entities
│   │   ├── Account.entity.ts      # Cardano wallet accounts
│   │   ├── HydraNode.entity.ts    # Hydra node configuration
│   │   ├── HydraParty.entity.ts   # Multi-party Hydra Head
│   │   └── User.entity.ts         # Admin users
│   │
│   ├── utils/                # Utility functions
│   │   └── [hydra utilities] # Hydra-specific helpers
│   │
│   ├── hydra-main.module.ts       # Module definition
│   ├── hydra-main.controller.ts   # REST API endpoints
│   ├── hydra-main.service.ts      # Core business logic
│   ├── hydra-admin.service.ts     # Admin operations
│   ├── hydra-main.gateway.ts      # WebSocket gateway
│   ├── ogmios-client.service.ts   # Ogmios integration
│   └── ogmios.controller.ts       # Ogmios API endpoints
│
├── interfaces/               # TypeScript interfaces
│   └── [shared interfaces]   # Common type definitions
│
├── middlewares/              # HTTP middlewares
│   ├── auth/
│   │   └── auth.middleware.ts     # Authentication middleware
│   └── proxy/
│       └── proxy.middleware.ts    # Proxy middleware
│
├── migrations/               # Database migrations
│   └── [migration files]     # TypeORM migrations
│
├── proxy/                    # Proxy functionality
│   └── [proxy logic]         # HTTP proxy utilities
│
├── shell/                    # Shell Command Execution
│   ├── shell.module.ts       # Shell module
│   └── shell.service.ts      # Execute system commands
│
└── utils/                    # General utilities
    └── [utility functions]   # Helper functions
```

---

## 🎯 Module Breakdown

### 1. Core Application (`/`)
**Files:** `app.module.ts`, `main.ts`, `app.controller.ts`, `app.service.ts`

**Purpose:** Application bootstrap and root configuration

**Key Responsibilities:**
- Load environment configuration
- Initialize database connection (TypeORM)
- Setup Redis caching
- Configure Winston logging
- Register all feature modules
- Setup middleware pipeline

**Entry Point Flow:**
```
main.ts
  → Bootstrap NestJS application
  → Load app.module.ts
    → ConfigModule (environment)
    → TypeORM (database)
    → CacheModule (Redis)
    → WinstonModule (logging)
    → Feature modules (Hydra, Shell, Consumer)
```

---

### 2. HydraMainModule ⭐ (Core Feature)
**Location:** `/hydra-main/`

**Purpose:** Complete Hydra node and party management system

#### Components:

**Controllers:**
- `hydra-main.controller.ts` - Primary API endpoints (28 routes)
- `ogmios.controller.ts` - Cardano blockchain query endpoints (9 routes)

**Services:**
- `hydra-main.service.ts` - Core Hydra operations
  - Node lifecycle management
  - Docker container orchestration
  - Party management
  - WebSocket event broadcasting
  
- `hydra-admin.service.ts` - Administrative functions
  - User authentication
  - Account management
  - Access control
  
- `ogmios-client.service.ts` - Cardano integration
  - Blockchain queries
  - UTxO lookups
  - Protocol parameters
  - Transaction submission

**Gateways:**
- `hydra-main.gateway.ts` - WebSocket real-time updates
  - Node status changes
  - Transaction events
  - Head state updates

**Data Layer:**
```
entities/
├── HydraNode.entity.ts      # Hydra node configuration
│   ├── Fields: id, port, skey, vkey, description
│   ├── Relations: ManyToOne → Account, ManyToOne → HydraParty
│   └── Purpose: Store node configuration and keys
│
├── Account.entity.ts        # Cardano wallet accounts
│   ├── Fields: id, baseAddress, pointerAddress, mnemonic
│   ├── Relations: OneToMany → HydraNode
│   └── Purpose: Manage Cardano wallet accounts for nodes
│
├── HydraParty.entity.ts     # Multi-party Hydra Head
│   ├── Fields: id, description, nodes, status
│   ├── Relations: OneToMany → HydraNode
│   └── Purpose: Group multiple nodes into Hydra Head
│
└── User.entity.ts           # Admin users
    ├── Fields: id, username, password, role
    ├── Relations: None
    └── Purpose: Authentication and authorization
```

**DTOs (Data Transfer Objects):**
- `create-account.dto.ts` - Validate account creation
- `create-node.dto.ts` - Validate node configuration
- `create-party.dto.ts` - Validate party setup
- `login.dto.ts` - Validate login credentials

---

### 3. ShellModule
**Location:** `/shell/`

**Purpose:** Safe execution of shell commands

**Components:**
- `shell.service.ts` - Command execution wrapper

**Use Cases:**
- Hydra CLI commands
- Docker container management
- System diagnostics
- File operations

**Security:**
- Input sanitization
- Command whitelisting
- Error handling
- Async execution

---

### 4. Auth System
**Location:** `/auth/`

**Purpose:** Authentication and authorization infrastructure

**Guards:**
```
admin-auth.guard.ts       # Protect admin-only routes
role.guard.ts             # Role-based access control (RBAC)
socket.guard.ts           # WebSocket connection auth
game-auth.guard.ts        # Game-specific authentication
```

**Strategy:**
- JWT token-based authentication
- Passport.js integration
- Role hierarchy: ADMIN > USER
- Token expiration: 1 day

**Flow:**
```
Request → AdminAuthGuard
           ↓
    Extract JWT token
           ↓
    Verify token signature
           ↓
    Check user role
           ↓
    Allow/Deny access
```

---

### 5. Common Utilities
**Location:** `/common/`

**Interceptors:**

**1. BaseResponseInterceptor**
- Standardizes all API responses
- Format: `{ success: boolean, data: any, message: string }`
- Consistent error handling

**2. BigIntInterceptor**
- Handles BigInt serialization to JSON
- Converts BigInt to string
- Prevents JSON.stringify errors

**3. SerializerInterceptor**
- Uses class-transformer
- Excludes sensitive fields (@Exclude decorator)
- Example: Hides `skey`, `mnemonic`, `password`

---

### 6. Configuration
**Location:** `/config/`

**Files:**
- `configuration.ts` - Loads all environment variables
  - Database config
  - Redis config
  - Hydra settings
  - Cardano settings
  - Docker configuration

- `winston.config.ts` - Logging configuration
  - Console logging (development)
  - File logging (production)
  - Daily log rotation
  - Error log separation

**Configuration Structure:**
```typescript
{
  server: { port, env },
  database: { host, port, username, password, database },
  redis: { url, password },
  hydra: { binPath, image, nodeFolder },
  cardano: { service, image, folder, socketPath },
  docker: { socketPath, networkHost }
}
```

---

### 7. Middlewares
**Location:** `/middlewares/`

**Auth Middleware:**
- Request authentication
- JWT validation
- User context injection

**Proxy Middleware:**
- HTTP proxy functionality
- Request forwarding
- Load balancing support

---

### 8. Database Migrations
**Location:** `/migrations/`

**Purpose:** Version-controlled database schema changes

**TypeORM Migrations:**
- Create tables
- Alter schemas
- Seed data
- Rollback support

**Running Migrations:**
```bash
npm run typeorm migration:run
npm run typeorm migration:revert
```

---

## 🔍 Key File Deep Dives

### main.ts (Entry Point)
```typescript
Purpose: Bootstrap NestJS application
- Load environment variables
- Create NestJS application
- Enable CORS
- Setup global pipes (validation)
- Setup global interceptors
- Configure Swagger documentation
- Start HTTP server
```

### app.module.ts (Root Module)
```typescript
Purpose: Wire all modules together
Imports:
  - WinstonModule (logging)
  - ConfigModule (environment)
  - ScheduleModule (cron jobs)
  - CacheModule (Redis)
  - TypeORM (database)
  - HydraMainModule
  - ShellModule
```

### hydra-main.service.ts (Core Logic)
```typescript
Key Methods:
  - createHydraNode(): Create new Hydra node
  - startParty(): Launch Hydra Head with Docker
  - stopParty(): Gracefully shutdown party
  - getActiveNodes(): List running containers
  - broadcastEvent(): WebSocket updates
  - executeHydraCommand(): Run Hydra CLI
```

### ogmios-client.service.ts (Blockchain)
```typescript
Key Methods:
  - queryUtxo(address): Get UTxOs for address
  - getProtocolParameters(): Network protocol params
  - submitTransaction(tx): Submit to Cardano
  - getTip(): Current blockchain tip
  - getHealth(): Ogmios service health
```

---

## 📊 Code Organization Principles

### 1. Module Isolation
- Each feature in its own module
- Clear boundaries and responsibilities
- Minimal cross-module dependencies

### 2. Layered Architecture
```
Controllers   → Handle HTTP/WS requests
Services      → Business logic
Entities      → Data models
DTOs          → Input/output validation
```

### 3. Dependency Injection
- All services injectable
- Testable components
- Loose coupling

### 4. Type Safety
- TypeScript throughout
- Strong typing for all DTOs
- Interface-driven design

---

## 🧩 Integration Patterns

### Docker Integration Pattern
```
ShellService → Execute docker commands
             ↓
HydraMainService → Manage containers
                 ↓
Dockerode API → Docker Engine
```

### Blockchain Query Pattern
```
Controller → OgmiosClientService → Ogmios → Cardano Node
```

### Event Broadcasting Pattern
```
HydraMainService → HydraMainGateway → WebSocket → Clients
```

---

## 📝 Naming Conventions

### Files
- Modules: `*.module.ts`
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Entities: `*.entity.ts`
- DTOs: `*.dto.ts`
- Guards: `*.guard.ts`
- Interceptors: `*.interceptor.ts`

### Classes
- PascalCase for classes
- Descriptive names: `HydraMainService`, `AdminAuthGuard`
- Suffix indicates type: `XxxController`, `XxxService`

### Methods
- camelCase for methods
- Verb-first: `createNode()`, `getUtxo()`, `startParty()`
- Async methods return Promises

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025
