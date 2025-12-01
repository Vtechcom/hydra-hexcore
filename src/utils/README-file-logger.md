# File Logger Service

Service ghi log ra file với tên file theo ngày.

## Tính năng

- ✅ Ghi log ra file với tên theo ngày (YYYY-MM-DD.log)
- ✅ Tự động tạo thư mục logs nếu chưa có
- ✅ Tự động lấy thông tin file và line number từ stack trace
- ✅ Hỗ trợ các log level: ERROR, WARN, INFO, DEBUG, VERBOSE
- ✅ Format log: `[TIMESTAMP] [LEVEL] [FILE:LINE] [CONTEXT] MESSAGE`
- ✅ Tự động chuyển file log mới mỗi ngày

## Cấu hình

Thêm vào `.env` (tùy chọn):
```env
LOG_DIR=./logs  # Thư mục lưu log, mặc định: ./logs
```

## Cách sử dụng

### 1. Inject vào service

```typescript
import { Injectable } from '@nestjs/common';
import { FileLoggerService } from '../utils/file-logger.service';

@Injectable()
export class YourService {
    constructor(private readonly fileLogger: FileLoggerService) {}
}
```

### 2. Sử dụng các method logging

```typescript
// Log thông thường
this.fileLogger.log('Thông tin log', 'ContextName');
this.fileLogger.warn('Cảnh báo', 'ContextName');
this.fileLogger.debug('Debug message', 'ContextName');
this.fileLogger.verbose('Verbose message', 'ContextName');

// Log lỗi
this.fileLogger.error('Lỗi xảy ra', error.stack, 'ContextName');

// Hoặc log với Error object
try {
    // code
} catch (error) {
    this.fileLogger.logError('Failed to process', error, 'ContextName');
}

// Log với file và line cụ thể
import { LogLevel } from '../utils/file-logger.service';
this.fileLogger.logWithLocation(
    'Custom message',
    'file.ts',
    42,
    LogLevel.INFO,
    'ContextName'
);
```

## Format log

Log được ghi với format:
```
[TIMESTAMP] [LEVEL] [FILE:LINE] [CONTEXT] MESSAGE
```

Ví dụ:
```
[2025-12-01T10:30:45.123Z] [INFO] [hydra-main.service.ts:846] [HydraMainService] Container created successfully
[2025-12-01T10:30:46.456Z] [ERROR] [hydra-main.service.ts:920] [HydraMainService] Failed to start container: Error message
```

## File log

- Thư mục: `./logs/` (hoặc theo LOG_DIR)
- Tên file: `YYYY-MM-DD.log` (ví dụ: `2025-12-01.log`)
- Tự động tạo file mới mỗi ngày

## Log Levels

- `ERROR`: Lỗi nghiêm trọng
- `WARN`: Cảnh báo
- `INFO`: Thông tin thông thường
- `DEBUG`: Thông tin debug
- `VERBOSE`: Thông tin chi tiết
