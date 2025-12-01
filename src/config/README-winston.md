# Winston Logger Configuration

Dự án sử dụng Winston logger được bind vào Logger mặc định của NestJS.

## Cấu hình

- **File config**: `src/config/winston.config.ts`
- **Log directory**: `./logs/` (có thể cấu hình qua `LOG_DIR` env variable)

## Log Files

- `YYYY-MM-DD.log` - Tất cả logs (giữ 14 ngày)
- `YYYY-MM-DD-error.log` - Chỉ error logs (giữ 30 ngày)

## Cách sử dụng

Sử dụng Logger mặc định của NestJS trong service/controller:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class YourService {
    private readonly logger = new Logger(YourService.name);

    someMethod() {
        this.logger.log('Info message');
        this.logger.warn('Warning message');
        this.logger.debug('Debug message');
        this.logger.verbose('Verbose message');
        this.logger.error('Error message', error.stack);
    }
}
```

## Log Format

- **Console**: `YYYY-MM-DD HH:mm:ss [Context] level: message`
- **File**: `YYYY-MM-DD HH:mm:ss.SSS [LEVEL] [Context] message`

## Test Logger

Gọi endpoint: `GET /test-logger` để test tất cả log levels.
