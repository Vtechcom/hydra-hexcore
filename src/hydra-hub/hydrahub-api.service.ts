import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { BaseApiService } from '../axios';
import { OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { HydraNode } from 'src/hydra-main/entities/HydraNode.entity';

@Injectable()
export class HydraHubApiService extends BaseApiService implements OnModuleInit {
    private readonly baseURL: string;
    private readonly apiKey: string;

    constructor(
        httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        super(httpService, HydraHubApiService.name);
        this.baseURL = this.configService.get<string>('HYDRA_HUB_API_BASE_URL');
        this.apiKey = this.configService.get<string>('HUB_API_KEY');
    }

    onModuleInit() {
        this.logger.log('HydraHub API Service initialized.');
    }

    private buildUrl(endpoint: string): string {
        return `${this.baseURL}${endpoint}`;
    }

    private buildConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-webhook-api-key': this.apiKey,
        };

        return {
            ...config,
            headers: {
                ...headers,
                ...config?.headers,
            },
        };
    }

    async syncHydraHeadStatus(
        body: { headId: number; status: string; nodes?: HydraNode[] },
        config?: AxiosRequestConfig,
    ) {
        const url = this.buildUrl(`/hydra-heads/webhook/async-head-status`);
        const requestConfig = this.buildConfig(config);
        return this.post<any>(url, body, requestConfig);
    }

    async sendAccessTokenToHub(body: { accessToken: string }, config?: AxiosRequestConfig) {
        const url = this.buildUrl('/infrastruction-providers/webhook/access-token');
        const requestConfig = this.buildConfig(config);
        return this.patch<any>(url, body, requestConfig);
    }
}
