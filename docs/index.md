# Hydra Hexcore - Project Documentation Index

**Generated:** December 8, 2025  
**Project:** Hydra Hexcore Backend API  
**Version:** 0.0.1  
**Documentation Type:** Brownfield Project Analysis (Deep Scan)

---

## 📚 Documentation Suite

This is the comprehensive documentation for the Hydra Hexcore backend system - a NestJS-based platform for managing Cardano Hydra Layer 2 nodes and multi-party Hydra Heads.

### 📖 Available Documents

| Document | Description | Link |
|----------|-------------|------|
| **Project Overview** | High-level architecture, tech stack, core modules, and system capabilities | [project-overview.md](./project-overview.md) |
| **Source Tree** | Detailed source code structure, file organization, and module breakdown | [source-tree.md](./source-tree.md) |
| **SRS** | Software Requirements Specification (Vietnamese) | [SRS.md](./SRS.md) |
| **User Guides** | End-user and operator documentation (archived) | [archives/user-guide/](./archives/user-guide/) |
| **File Trees** | Visual project structure (archived) | [archives/filetree/](./archives/filetree/) |

---

## 🎯 Quick Start

### For New Developers
1. Read **[Project Overview](./project-overview.md)** first - Get familiar with architecture and tech stack
2. Review **[Source Tree](./source-tree.md)** - Understand code organization
3. Check **[SRS](./SRS.md)** - Understand functional requirements
4. Follow **[Installation Guide](./archives/user-guide/project-installation-guide.md)**

### For Product/Planning Teams
1. Read **[SRS](./SRS.md)** - Complete requirements specification
2. Review **[Project Overview](./project-overview.md)** - System capabilities
3. Check **[Architecture section](#architecture-summary)**

### For Operations/DevOps
1. Read **[Admin Operator Guide](./archives/user-guide/admin-operator-guide.md)**
2. Review **[Project Overview - Deployment](./project-overview.md#-docker-integration)**
3. Check **[Configuration](./project-overview.md#-configuration)**

---

## 🏗️ Architecture Summary

### System Type
**Backend API Service** with:
- REST API endpoints
- WebSocket real-time communication
- Docker container orchestration
- Blockchain integration (Cardano/Hydra)

### Core Technologies
- **Framework:** NestJS 10.x + TypeScript 5.1+
- **Database:** MySQL 8.0+ / SQLite
- **Cache:** Redis
- **Container:** Docker + Dockerode
- **Blockchain:** Cardano (via Ogmios) + Hydra Protocol
- **Authentication:** JWT (Passport)
- **Logging:** Winston with daily rotation

### Architecture Pattern
**Layered Architecture with Domain-Driven Design**
```
API Layer (Controllers/Gateways)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (TypeORM)
    ↓
External Integrations (Docker, Ogmios, Hydra)
```

---

## 🎯 Core Features

### 1. Hydra Node Management
- Create and configure Hydra nodes
- Start/stop nodes via Docker containers
- Monitor node status in real-time
- Manage node lifecycle

### 2. Wallet Account Management
- Generate Cardano HD wallets (BIP39)
- Store encrypted mnemonics and keys
- Manage multiple accounts per node
- Query account UTxOs

### 3. Multi-Party Hydra Head
- Create parties with multiple nodes
- Configure party parameters
- Activate/deactivate parties
- Monitor head state

### 4. Cardano Blockchain Integration
- Query blockchain via Ogmios
- Get protocol parameters
- Query UTxOs for addresses
- Submit transactions
- Monitor blockchain tip

### 5. Real-Time Communication
- WebSocket gateway for live updates
- Node status events
- Transaction monitoring
- Head state tracking

### 6. Admin & Security
- JWT-based authentication
- Role-based access control (RBAC)
- Admin and User roles
- Encrypted sensitive data

---

## 📊 Data Models

### Core Entities

**HydraNode**
- Stores Hydra node configuration
- Contains cryptographic keys (encrypted)
- Links to Cardano account and party
- Tracks creation and status

**Account**
- Cardano wallet account (HD wallet)
- Base and pointer addresses
- Encrypted mnemonic storage
- Used by Hydra nodes for on-chain operations

**HydraParty**
- Multi-party Hydra Head configuration
- Groups multiple nodes
- Tracks party status (ACTIVE/INACTIVE)
- Manages party lifecycle

**User**
- Admin user accounts
- Role-based access (ADMIN/USER)
- Hashed passwords
- JWT authentication

---

## 🔌 API Reference

### Primary Endpoints

**Authentication:**
- `POST /hydra-main/login` - Admin authentication
- `GET /hydra-main/auth` - Verify token

**Account Management:**
- `POST /hydra-main/create-account` - Create Cardano account
- `GET /hydra-main/list-account` - List all accounts

**Node Management:**
- `POST /hydra-main/create-node` - Create Hydra node
- `GET /hydra-main/hydra-nodes` - List all nodes
- `GET /hydra-main/hydra-node/:id` - Get node details
- `GET /hydra-main/active-nodes` - Get active containers

**Party Management:**
- `POST /hydra-main/create-party` - Create multi-party head
- `GET /hydra-main/list-party` - List parties
- `POST /hydra-main/active-party` - Start party
- `POST /hydra-main/deactive-party` - Stop party

**Blockchain Queries (Ogmios):**
- `GET /ogmios/protocol-parameters` - Get protocol params
- `GET /ogmios/query-tip` - Blockchain tip
- `GET /ogmios/address/:address/utxo` - Query UTxOs
- `GET /ogmios/health` - Ogmios health check

---

## 🔐 Security Considerations

### Authentication
✅ JWT token-based  
✅ 1-day token expiration  
✅ Password hashing (bcryptjs)  
✅ Role-based access control  

### Data Protection
✅ Encrypted private keys  
✅ Encrypted mnemonic phrases  
✅ Sensitive field exclusion (class-transformer)  
✅ Environment-based secrets  

### API Security
✅ Guard-protected routes  
✅ Input validation (class-validator)  
✅ Admin-only endpoints  
✅ CORS configuration  

---

## 🐳 Docker Architecture

### Container Strategy
```
Hydra Hexcore Backend (Host)
    ↓ (manages via Dockerode)
Docker Engine
    ↓
├── Hydra Node Containers (dynamic, per node)
├── Cardano Node Container (shared)
└── Ogmios Service Container (shared)
```

### Container Management
- Dynamic container creation per Hydra node
- Container lifecycle management (start/stop/monitor)
- Network configuration
- Volume management for persistent data

---

## 📝 Configuration Guide

### Required Environment Variables

**Critical:**
- `PORT` - API port (default: 3010)
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` - Database
- `REDIS_URL` - Redis cache
- `NEST_HYDRA_BIN_DIR_PATH` - Hydra binaries
- `NEST_CARDANO_NODE_SOCKET_PATH` - Cardano node socket
- `NEST_DOCKER_SOCKET_PATH` - Docker socket

Full configuration reference: [Project Overview - Configuration](./project-overview.md#-configuration)

---

## 🧪 Testing & Quality

### Test Framework
- **Jest** for unit and integration tests
- **Supertest** for HTTP endpoint testing
- Test files: `*.spec.ts` and `*.test.ts`

### Code Quality
- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** strict mode
- **Class-validator** for runtime validation

---

## 📚 Additional Resources

### User Documentation (Archived)
- [Developer Guide](./archives/user-guide/developer-guide.md) - Development workflows
- [Admin Operator Guide](./archives/user-guide/admin-operator-guide.md) - Operations manual
- [User Functional Guide](./archives/user-guide/user-functional-guide.md) - Feature usage
- [Installation Guide](./archives/user-guide/project-installation-guide.md) - Setup instructions

### External References
- [Cardano Documentation](https://docs.cardano.org/)
- [Hydra Protocol Docs](https://hydra.family/)
- [Ogmios Documentation](https://ogmios.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)

---

## 🔄 Next Steps for Planning

### For BMad Method Workflow

This documentation provides the foundation for:

**✅ Completed:**
- ✅ Project structure analysis
- ✅ Technology stack documentation
- ✅ Architecture patterns identified
- ✅ Data models documented
- ✅ Integration points mapped

**➡️ Next Recommended Steps:**

1. **Create PRD (Product Requirements Document)**
   - Agent: PM
   - Use this documentation as brownfield context
   - Define new features and improvements
   - Document enhancement requirements

2. **Create Architecture Document**
   - Agent: Architect
   - Design solution architecture for new features
   - Document integration patterns
   - Define technical decisions (ADRs)

3. **Create Epics & Stories**
   - Agent: PM
   - Break down PRD into implementable units
   - Sequence stories logically
   - Prepare for sprint planning

4. **Implementation Readiness**
   - Agent: Architect
   - Validate PRD + Architecture + Epics
   - Gate check before development
   - Ensure readiness for implementation

---

## 📞 Support & Contact

For questions about this documentation or the Hydra Hexcore project:
- Check existing documentation in `/docs`
- Review user guides in `/docs/user-guide`
- Consult README.md for setup issues

---

## 📄 Document Metadata

| Property | Value |
|----------|-------|
| **Generated By** | BMad Method - document-project workflow |
| **Scan Type** | Deep Scan (critical directories) |
| **Scan Level** | Backend module analysis |
| **Generated Date** | December 8, 2025 |
| **Project Type** | Backend API (NestJS) |
| **Documentation Version** | 1.0 |
| **Workflow Status** | ✅ Complete |

---

## 🎯 Using This Documentation

### For AI Agents (BMad Method)
This documentation provides complete brownfield context for:
- **Analyst Agent:** Understanding existing system
- **PM Agent:** Writing PRD with system awareness
- **Architect Agent:** Designing solutions that integrate with existing architecture
- **Developer Agent:** Understanding codebase before implementing changes

### For Human Developers
- Start with [Project Overview](./project-overview.md) for high-level understanding
- Use [Source Tree](./source-tree.md) as code navigation guide
- Reference [SRS](./SRS.md) for functional requirements
- Follow [User Guides](./user-guide/) for operational procedures

---

**🎉 Documentation Complete!**

This comprehensive documentation suite provides complete context for planning and development work on the Hydra Hexcore platform.

**Workflow Status:** ✅ document-project completed  
**Next Step:** Load PM agent and run `*prd` workflow to define new features/improvements

---

*Generated by BMad Method - Analyst Agent (Mary)*  
*Deep scan completed on December 8, 2025*
