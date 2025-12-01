/**
 * Example usage of FileLoggerService
 * 
 * This file demonstrates how to use the FileLoggerService in your services
 */

import { Injectable } from '@nestjs/common';
import { FileLoggerService, LogLevel } from './file-logger.service';

@Injectable()
export class ExampleService {
    constructor(private readonly fileLogger: FileLoggerService) {}

    exampleUsage() {
        // Basic logging
        this.fileLogger.log('This is an info log message', 'ExampleService');
        this.fileLogger.warn('This is a warning message', 'ExampleService');
        this.fileLogger.debug('This is a debug message', 'ExampleService');
        this.fileLogger.verbose('This is a verbose message', 'ExampleService');

        // Error logging
        try {
            // Some code that might throw
            throw new Error('Something went wrong');
        } catch (error) {
            this.fileLogger.error('An error occurred', error.stack, 'ExampleService');
            // Or use logError method
            this.fileLogger.logError('Failed to process request', error as Error, 'ExampleService');
        }

        // Log with explicit file and line
        this.fileLogger.logWithLocation(
            'Custom log message with explicit location',
            'example.service.ts',
            42,
            LogLevel.INFO,
            'ExampleService'
        );
    }
}

/**
 * Usage in a service:
 * 
 * 1. Inject FileLoggerService in constructor:
 *    constructor(private readonly fileLogger: FileLoggerService) {}
 * 
 * 2. Use it anywhere in your service:
 *    this.fileLogger.log('Message', 'Context');
 *    this.fileLogger.error('Error message', error.stack, 'Context');
 * 
 * 3. Logs will be written to: logs/YYYY-MM-DD.log
 *    Example: logs/2025-12-01.log
 * 
 * 4. Log format:
 *    [TIMESTAMP] [LEVEL] [FILE:LINE] [CONTEXT] MESSAGE
 *    Example: [2025-12-01T10:30:45.123Z] [INFO] [service.ts:42] [ServiceName] Message
 */
