# Test Configuration Summary

## ✅ Cấu hình hiện tại

### 1. **Vitest cho Unit Tests**
- **Config**: [`vitest.config.ts`](vitest.config.ts)
- **Pattern**: `tests/**/*.test.ts`, `tests/**/*.spec.ts` (exclude `*.e2e-spec.ts`)
- **Scripts**:
  - `pnpm test` - chạy unit tests
  - `pnpm test:unit` - chạy unit tests (không watch)
  - `pnpm test:watch` - chạy unit tests với watch mode
  - `pnpm test:cov` - chạy unit tests với coverage

### 2. **Jest cho E2E Tests**
- **Config**: [`jest-e2e.config.js`](jest-e2e.config.js)
- **Pattern**: `**/tests/**/*.e2e-spec.ts`
- **Environment**: Load từ [`.env.test`](../.env.test)
- **Scripts**:
  - `pnpm test:e2e` - chạy tất cả e2e tests
  - `pnpm test:e2e:watch` - chạy e2e tests với watch mode
  - `pnpm test:e2e <file>` - chạy e2e test cụ thể
  
### 3. **Test Database Management**
- **Docker Compose**: [`docker-compose.test.yml`](../docker-compose.test.yml)
- **Scripts**:
  - `pnpm test:db:start` - start MySQL test database
  - `pnpm test:db:stop` - stop MySQL test database
  - `pnpm test:db:logs` - xem logs của test database

## ✅ E2E Test với SQLite In-Memory

### Test hoạt động: [`app.e2e-spec.ts`](tests/app.e2e-spec.ts)

```typescript
// ✅ Override DataSource với SQLite in-memory
.overrideProvider(DataSource)
.useValue(new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [__dirname + '/../src/**/*.entity.ts'],
    synchronize: true,
}))

// ✅ Mock external services
.overrideProvider(OgmiosClientService).useClass(MockOgmiosService)
.overrideProvider(HydraMainService).useValue({
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    // ... other methods
})
```

## ✅ Test Database Strategy

### Simple E2E Tests (SQLite in-memory)
- Cho các test đơn giản không cần complex schema
- Ví dụ: [`app.e2e-spec.ts`](tests/app.e2e-spec.ts) - health check
- Không cần start database
- Fast & isolated

### Complex E2E Tests (MySQL test database)
- Cho tests cần full schema với ENUM, relationships, etc.
- Ví dụ: [`account.e2e-spec.ts`](tests/__test__/account.e2e-spec.ts)
- Cần start MySQL test database trước
- Realistic testing environment

## 📋 Hướng dẫn chạy tests

### Unit Tests (Vitest)
```bash
# Chạy tất cả unit tests
pnpm test

# Chạy với watch mode
pnpm test:watch

# Chạy với coverage
pnpm test:cov
```

### E2E Tests (Jest)

**Bước 1: Start test database** (chỉ cần làm 1 lần)
```bash
pnpm test:db:start
```

**Bước 2: Chạy tests**
```bash
# Chạy tất cả e2e tests
pnpm test:e2e

# Chạy một file cụ thể
pnpm test:e2e tests/app.e2e-spec.ts
pnpm test:e2e tests/__test__/account.e2e-spec.ts

# Chạy với watch mode
pnpm test:e2e:watch
```

**Bước 3: Stop test database** (khi xong)
```bash
pnpm test:db:stop
```

### Test Database Configuration

File [`.env.test`](../.env.test) chứa cấu hình cho test database:
```env
NODE_ENV=test

# Test Database Configuration
DB_HOST=localhost
DB_PORT=3328
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_test_db
DB_SYNCHRONIZE=true
```

Test database sử dụng **tmpfs** (RAM disk) để tăng tốc độ test. Data sẽ bị mất khi container restart.

## 🔧 Troubleshooting

### Lỗi: Cannot connect to test database
```
Error: connect ETIMEDOUT
```
**Giải pháp:**
1. Start test database: `pnpm test:db:start`
2. Check container running: `docker ps | grep hexcore-test-db`
3. Check logs: `pnpm test:db:logs`

### Lỗi: Docker Desktop is paused
```
Docker Desktop is manually paused. Unpause it through the Whale menu
```
**Giải pháp:**
- Unpause Docker Desktop từ menu
- Hoặc restart Docker Desktop

### Test chạy chậm
**Giải pháp:**
- Test database sử dụng tmpfs (RAM) nên đã được tối ưu
- Nếu vẫn chậm, kiểm tra Docker memory allocation

## 📝 Khuyến nghị

1. ✅ **Vitest cho unit tests** - Fast, modern, ESM support
2. ✅ **Jest cho e2e tests** - Mature, good integration with NestJS
3. ✅ **SQLite in-memory** - Cho simple e2e tests (như health check)
4. ✅ **MySQL test container** - Cho complex e2e tests (như account management)

## 🎯 Next Steps

1. Setup MySQL test container với docker-compose
2. Update [`account.e2e-spec.ts`](tests/__test__/account.e2e-spec.ts) để dùng MySQL test DB
3. Tạo script để start/stop test infrastructure
4. Add to CI/CD pipeline
