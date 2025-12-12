# Quick Start: Testing Guide

## 🚀 Chạy Tests Nhanh

### Unit Tests (Vitest)
```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode
```

### E2E Tests (Jest)

#### Option 1: Simple tests (SQLite in-memory)
```bash
pnpm test:e2e tests/app.e2e-spec.ts
```
✅ Không cần setup gì, chạy ngay

#### Option 2: Full tests (MySQL)
```bash
# 1. Start test database (first time only)
pnpm test:db:start

# 2. Run tests
pnpm test:e2e

# 3. Stop database (when done)
pnpm test:db:stop
```

## 📁 File Cấu Hình

- [`.env.test`](.env.test) - Test environment variables
- [`jest-e2e.config.js`](jest-e2e.config.js) - Jest e2e configuration
- [`vitest.config.ts`](vitest.config.ts) - Vitest unit test configuration
- [`docker-compose.test.yml`](docker-compose.test.yml) - Test database

## 📝 Naming Convention

- `*.test.ts` - Unit tests (Vitest)
- `*.spec.ts` - Unit tests (Vitest)  
- `*.e2e-spec.ts` - E2E tests (Jest)

## 🔍 Chi tiết

Xem [tests/TEST-CONFIG.md](tests/TEST-CONFIG.md) để biết thêm chi tiết.
