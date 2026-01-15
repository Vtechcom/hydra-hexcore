import { HttpService } from '@nestjs/axios';
import { BaseApiService } from 'src/axios';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';

/**
 * BlockFrost API Service
 * Cung cấp các method gọi đến BlockFrost API
 */
@Injectable()
export class BlockFrostApiService extends BaseApiService implements OnModuleInit {
    private readonly baseURL: string;
    private readonly apiKey: string;

    constructor(
        httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        super(httpService, BlockFrostApiService.name);
        this.baseURL = this.configService.get<string>('BLOCKFROST_API_BASE_URL');
        this.apiKey = this.configService.get<string>('BLOCKFROST_PROJECT_ID');
    }

    onModuleInit() {
        if (!this.baseURL || !this.apiKey) {
            this.logger.error('BlockFrost API configuration is missing.');
        } else {
            this.logger.log('BlockFrost API Service initialized.');
        }
    }

    private buildUrl(endpoint: string): string {
        return `${this.baseURL}${endpoint}`;
    }

    private buildConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['project_id'] = this.apiKey;
        }

        return {
            ...config,
            headers: {
                ...headers,
                ...config?.headers,
            },
        };
    }

    /**
     * Example method to get account info from BlockFrost API
     */
    async getProtocolParameters(config?: AxiosRequestConfig): Promise<any> {
        const url = this.buildUrl(`/epochs/latest/parameters`);
        const requestConfig = this.buildConfig(config);
        return await this.get<any>(url, requestConfig);
    }
}
