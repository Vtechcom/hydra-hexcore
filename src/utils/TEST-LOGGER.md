# Cách test File Logger Service

## Cách 1: Test qua API Endpoint (Khuyến nghị)

1. **Khởi động ứng dụng:**
```bash
npm run start:dev
# hoặc
pnpm start:dev
```

2. **Gọi API test endpoint:**
```bash
# Sử dụng curl
curl http://localhost:3000/test-logger

# Hoặc mở trình duyệt
http://localhost:3000/test-logger
```

3. **Kiểm tra file log:**
```bash
# Xem file log vừa tạo
cat logs/$(date +%Y-%m-%d).log

# Hoặc trên Windows
type logs\%date:~-4,4%-%date:~-7,2%-%date:~-10,2%.log
```

## Cách 2: Test trực tiếp trong code

Tạo một service test hoặc thêm vào service hiện có:

```typescript
import { Injectable } from '@nestjs/common';
import { FileLoggerService, LogLevel } from '../utils/file-logger.service';

@Injectable()
export class TestService {
    constructor(private readonly fileLogger: FileLoggerService) {}

    testLogger() {
        this.fileLogger.log('Test log message', 'TestService');
        this.fileLogger.warn('Test warning', 'TestService');
        this.fileLogger.error('Test error', 'stack trace', 'TestService');
    }
}
```

## Cách 3: Test bằng script Node.js

Tạo file `test-logger.js`:

```javascript
const { FileLoggerService } = require('./dist/utils/file-logger.service');

const logger = new FileLoggerService();

logger.log('Test log', 'TestScript');
logger.warn('Test warn', 'TestScript');
logger.error('Test error', 'stack', 'TestScript');

console.log('Check logs/ folder for log file');
```

Chạy:
```bash
npm run build
node test-logger.js
```

## Kết quả mong đợi

Sau khi test, bạn sẽ thấy file log trong thư mục `logs/` với tên:
- `YYYY-MM-DD.log` (ví dụ: `2025-12-01.log`)

Nội dung file log sẽ có dạng:
```
[2025-12-01T10:30:45.123Z] [INFO] [app.controller.ts:29] [AppController] This is an INFO log message from test endpoint
[2025-12-01T10:30:45.124Z] [WARN] [app.controller.ts:30] [AppController] This is a WARN log message from test endpoint
[2025-12-01T10:30:45.125Z] [DEBUG] [app.controller.ts:31] [AppController] This is a DEBUG log message from test endpoint
[2025-12-01T10:30:45.126Z] [VERBOSE] [app.controller.ts:32] [AppController] This is a VERBOSE log message from test endpoint
[2025-12-01T10:30:45.127Z] [ERROR] [app.controller.ts:38] [AppController] This is an ERROR log message from test endpoint
...
```

## Lưu ý

- Thư mục `logs/` sẽ được tạo tự động nếu chưa có
- File log mới sẽ được tạo mỗi ngày
- Logs cũ sẽ được giữ lại (không tự động xóa)
