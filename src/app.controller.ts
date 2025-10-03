import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('App Service')
@Controller()
export class AppController {
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
}
