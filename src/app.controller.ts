import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App Service')
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);

    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @ApiOperation({ summary: 'Get health check info' })
    @Get('health')
    healthCheck(): string {
        return this.appService.healthCheck();
    }

    @ApiOperation({ summary: 'Test Winston logger - test all log levels' })
    @Get('test-logger')
    testLogger(): { message: string; logFile: string } {
        // Test all log levels
        this.logger.log('This is an INFO log message from test endpoint');
        this.logger.warn('This is a WARN log message from test endpoint');
        this.logger.debug('This is a DEBUG log message from test endpoint');
        this.logger.verbose('This is a VERBOSE log message from test endpoint');

        // Test error logging
        try {
            throw new Error('Test error for logging');
        } catch (error) {
            this.logger.error('This is an ERROR log message from test endpoint', error.stack);
        }

        const today = new Date().toISOString().split('T')[0];
        const logFile = `logs/${today}.log`;

        return {
            message: 'Winston logger test completed! Check the log file for results.',
            logFile,
        };
    }
}
