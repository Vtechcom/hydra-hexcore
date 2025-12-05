# E2E Test Suite Documentation

## Test Structure

Tests are organized by feature/domain for better maintainability:

### 1. **auth.e2e-spec.ts** - Authentication & Authorization
- **29 test cases**
- Admin login and authentication
- Consumer login and authentication
- Token validation (invalid, expired, malformed)
- Cross-role access protection
- Integration tests

**Key Endpoints:**
- `POST /hydra-main/login` - Admin login
- `GET /hydra-main/auth` - Admin authentication check
- `POST /hydra-consumer/consumer/login` - Consumer login
- `GET /hydra-consumer/consumer/authorization` - Consumer auth check

---

### 2. **account.e2e-spec.ts** - Account Management
- **21 test cases**
- Account creation with mnemonic validation
- Account listing with pagination
- BIP39 mnemonic support (128-bit and 256-bit)
- Duplicate account prevention
- Address generation validation

**Key Endpoints:**
- `POST /hydra-main/create-account` - Create Cardano account
- `GET /hydra-main/list-account` - List all accounts

**Dependencies:**
- Requires admin authentication
- Uses BIP39 for mnemonic generation

---

### 3. **node.e2e-spec.ts** - Hydra Node CRUD
- **31 test cases**
- Node creation (with Docker dependency handling)
- Node listing with pagination
- Node detail retrieval
- Integration tests

**Key Endpoints:**
- `POST /hydra-main/create-node` - Create Hydra node
- `GET /hydra-main/hydra-nodes` - List nodes (paginated)
- `GET /hydra-main/hydra-node/:id` - Get node details

**Important Notes:**
- Node creation requires Docker for key generation
- Tests use `insertHydraNode()` helper to bypass Docker in most cases
- Only one test actually calls create-node API (accepts 201 or 500)
- Pagination limited to max 50 results

---

### 4. **cardano.e2e-spec.ts** - Cardano Integration
- **17 test cases**
- Cardano node info retrieval
- UTXO queries by address
- Address format validation (mainnet/testnet)
- Concurrent query handling

**Key Endpoints:**
- `GET /hydra-main/node-info` - Get Cardano node information
- `GET /hydra-main/utxo/:address` - Get UTXOs for address

**Important Notes:**
- Endpoints are public (no authentication required)
- Depends on Cardano node availability
- Tests handle both success and node-unavailable scenarios
- Supports both mainnet and testnet address formats

---

### 5. **hydra-container.e2e-spec.ts** - Container Management
- **13 test cases**
- Active Docker container listing
- Container state vs database node comparison
- Docker daemon availability handling
- Performance testing

**Key Endpoints:**
- `GET /hydra-main/active-nodes` - List active Hydra node containers

**Important Notes:**
- Public endpoint (no authentication)
- Depends on Docker daemon availability
- Active containers are independent of database nodes
- Tests handle Docker unavailability gracefully

---

## Running Tests

### Run all tests:
```bash
npx jest --config test/jest-e2e.json
```

### Run specific test suite:
```bash
npx jest --config test/jest-e2e.json test/__test__/auth.e2e-spec.ts
npx jest --config test/jest-e2e.json test/__test__/account.e2e-spec.ts
npx jest --config test/jest-e2e.json test/__test__/node.e2e-spec.ts
npx jest --config test/jest-e2e.json test/__test__/cardano.e2e-spec.ts
npx jest --config test/jest-e2e.json test/__test__/hydra-container.e2e-spec.ts
```

### Run with coverage:
```bash
npx jest --config test/jest-e2e.json --coverage
```

---

## Test Database

Tests use a separate test database to avoid affecting production:

- **Production DB**: Port 3327
- **Test DB**: Port 3328, database name: `hexcore_test_db`

Configuration is overridden in `test/setup.ts`.

---

## Helper Functions

Located in `test/helper.ts`:

- `generateAdminTest()` - Generate test admin credentials
- `generateConsumerTest()` - Generate test consumer credentials
- `insertAdminAccount()` - Insert admin directly to database
- `insertConsumerAccount()` - Insert consumer directly to database
- `insertAccount()` - Insert Cardano account
- `insertHydraNode()` - Insert Hydra node (bypasses Docker)
- `clearDatabase()` - Clear all tables with FK handling

---

## Test Isolation

Each test suite creates its own admin user with unique username to avoid conflicts:

```typescript
const adminDto = {
    username: `admin_${suite_name}_test_${Date.now()}`,
    password: 'admin_password_test',
};
```

This ensures tests can run in parallel or in any order.

---

## Docker Dependencies

Some features require Docker:
- Hydra key generation (`POST /hydra-main/create-node`)
- Active container listing (`GET /hydra-main/active-nodes`)

Tests are designed to handle Docker unavailability gracefully:
- Accept both success and error status codes
- Use database helpers to bypass Docker when testing data layer
- Clearly document which tests require Docker

---

## External Dependencies

### Cardano Node
- `GET /hydra-main/node-info`
- `GET /hydra-main/utxo/:address`

Tests handle node unavailability and return appropriate status codes.

### Docker Daemon
- `POST /hydra-main/create-node` (for key generation)
- `GET /hydra-main/active-nodes`

Tests gracefully handle when Docker is not running.

---

## Test Coverage Summary

| Suite | Test Cases | Coverage |
|-------|-----------|----------|
| Authentication | 29 | Login, tokens, roles, cross-access |
| Account Management | 21 | CRUD, validation, pagination |
| Hydra Nodes | 31 | CRUD, pagination, integration |
| Cardano Integration | 17 | Node info, UTXOs, addresses |
| Container Management | 13 | Active nodes, Docker handling |
| **Total** | **111** | **Comprehensive API coverage** |

---

## CI/CD Considerations

When running in CI environment:

1. Ensure test database is available (MySQL on port 3328)
2. Docker might not be available - tests handle this
3. Cardano node might not be running - tests handle this
4. Use `--forceExit` flag to prevent hanging
5. Consider timeout settings (currently 30s per test)

Example CI command:
```bash
npx jest --config test/jest-e2e.json --forceExit --maxWorkers=1
```
