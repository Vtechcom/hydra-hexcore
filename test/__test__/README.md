# E2E Test Suite Documentation

## Test Structure

Tests are organized by feature/domain for better maintainability:

### 1. **auth.e2e-spec.ts** - Authentication & Authorization
- **11 test cases**
- Admin login and authentication
- Token validation (invalid, expired, malformed)
- Admin authorization with JWT tokens

**Key Endpoints:**
- `POST /hydra-main/login` - Admin login
- `GET /hydra-main/auth` - Admin authentication check

---

### 2. **account.e2e-spec.ts** - Account Management
- **12 test cases**
- Account creation with mnemonic validation
- Account listing
- BIP39 mnemonic support (128-bit and 256-bit)
- Address generation validation

**Key Endpoints:**
- `POST /hydra-main/create-account` - Create Cardano account
- `GET /hydra-main/list-account` - List all accounts

**Dependencies:**
- Requires admin authentication
- Uses BIP39 for mnemonic generation

---

### 3. **cardano.e2e-spec.ts** - Cardano Integration
- **8 test cases**
- Cardano node info retrieval
- UTXO queries by address
- Address format validation (mainnet/testnet)
- Query consistency testing

**Key Endpoints:**
- `GET /hydra-main/node-info` - Get Cardano node information
- `GET /hydra-main/utxo/:address` - Get UTXOs for address

**Important Notes:**
- Endpoints are public (no authentication required)
- Depends on Cardano node availability
- Tests handle both success and node-unavailable scenarios
- Supports both mainnet and testnet address formats

---

### 4. **hydra-container.e2e-spec.ts** - Container Management
- **6 test cases**
- Active Docker container listing from cache
- Cache consistency and updates
- Performance testing with cache
- Large dataset handling

**Key Endpoints:**
- `GET /hydra-main/active-nodes` - List active Hydra node containers

**Important Notes:**
- Public endpoint (no authentication)
- Reads from Redis cache (not directly from Docker)
- Cache is updated by background cron job
- Tests verify cache read performance

---

### 5. **hydra-heads.e2e-spec.ts** - Hydra Head Management
- **31 test cases**
- Hydra head creation and activation
- Node limit validation (max 20 active nodes)
- Head data cleanup
- Head deletion with Docker cleanup
- File system operation mocking for tests

**Key Endpoints:**
- `POST /hydra-heads/create` - Create new hydra head
- `POST /hydra-heads/active` - Activate hydra head
- `POST /hydra-heads/deactive` - Deactivate hydra head
- `GET /hydra-heads/list` - List all hydra heads
- `POST /hydra-heads/clear-head-data` - Clear head persistence data
- `DELETE /hydra-heads/delete/:id` - Delete hydra head

**Important Notes:**
- Uses mocked file system operations (`writeFileSync`, `chmodSync`, `mkdir`, `access`)
- Tests validate max active nodes limit enforcement
- Includes cache-based active node counting
- Admin authentication required for all endpoints

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
npx jest --config test/jest-e2e.json test/__test__/cardano.e2e-spec.ts
npx jest --config test/jest-e2e.json test/__test__/hydra-container.e2e-spec.ts
npx jest --config test/jest-e2e.json test/__test__/hydra-heads.e2e-spec.ts
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
- `insertAdminAccount()` - Insert admin directly to database
- `insertAccount()` - Insert Cardano account
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
- Docker container management for Hydra heads

Tests are designed to handle Docker unavailability gracefully:
- Mock file system operations to avoid actual disk I/O
- Use mocked `writeFile` service method in Hydra heads tests
- Accept both success and error status codes where Docker is involved

**Mocking Strategy:**
- File system operations (`node:fs` and `node:fs/promises`) are mocked globally in hydra-heads tests
- Service methods like `writeFile` and `checkUtxoAccount` are mocked per test
- Mock setup in `beforeAll` and cleanup in `afterEach` hooks

---

## External Dependencies

### Cardano Node
- `GET /hydra-main/node-info`
- `GET /hydra-main/utxo/:address`

Tests handle node unavailability and return appropriate status codes.

### Redis Cache
- `GET /hydra-main/active-nodes`

Tests read from cache which is populated by background cron job.

---

## Test Coverage Summary

| Suite | Test Cases | Coverage |
|-------|-----------|----------|
| Authentication | 11 | Admin login, JWT tokens, authorization |
| Account Management | 12 | Account CRUD, mnemonic validation |
| Cardano Integration | 8 | Node info, UTXOs, address validation |
| Container Management | 6 | Cache-based active node listing |
| Hydra Heads | 31 | Head CRUD, activation, node limits |
| **Total** | **68** | **Comprehensive API coverage** |

**Notes:**
- All test suites use proper mocking for external dependencies
- Tests are designed to run independently and can be executed in any order
- File system operations are mocked in hydra-heads tests to avoid disk I/O

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
