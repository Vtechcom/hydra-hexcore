import { HttpModuleOptions, HttpModuleOptionsFactory } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Axios configuration factory
 * Cấu hình axios instance cho external API calls
 */
@Injectable()
export class AxiosConfigService implements HttpModuleOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createHttpOptions(): HttpModuleOptions {
        const baseURL = this.configService.get<string>('EXTERNAL_API_BASE_URL');
        const timeout = this.configService.get<number>('EXTERNAL_API_TIMEOUT', 30000);

        return {
            baseURL,
            timeout,
            maxRedirects: 5,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };
    }
}
