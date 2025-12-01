import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileLoggerService, LogLevel } from './utils/file-logger.service';

@ApiTags('App Service')
@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly fileLogger: FileLoggerService,
    ) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @ApiOperation({ summary: 'Get health check info' })
    @Get('health')
    healthCheck(): string {
        return this.appService.healthCheck();
    }

    @ApiOperation({ summary: 'Test file logger - test all log levels' })
    @Get('test-logger')
    testLogger(): { message: string; logFile: string } {
        // Test all log levels
        this.fileLogger.log('This is an INFO log message from test endpoint', 'AppController');
        this.fileLogger.warn('This is a WARN log message from test endpoint', 'AppController');
        this.fileLogger.debug('This is a DEBUG log message from test endpoint', 'AppController');
        this.fileLogger.verbose('This is a VERBOSE log message from test endpoint', 'AppController');

        // Test error logging
        try {
            throw new Error('Test error for logging');
        } catch (error) {
            this.fileLogger.error('This is an ERROR log message from test endpoint', error.stack, 'AppController');
            this.fileLogger.logError('Test error with Error object', error as Error, 'AppController');
        }

        // Test log with explicit location
        this.fileLogger.logWithLocation(
            'Test log with explicit file and line',
            'app.controller.ts',
            50,
            LogLevel.INFO,
            'AppController',
        );

        const today = new Date().toISOString().split('T')[0];
        const logFile = `logs/${today}.log`;

        return {
            message: 'Logger test completed! Check the log file for results.',
            logFile,
        };
    }
}
