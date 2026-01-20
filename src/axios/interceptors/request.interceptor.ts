import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

/**
 * Request interceptor cho axios
 * Có thể thêm authentication headers, logging, etc.
 */
@Injectable()
export class RequestInterceptor {
    private readonly logger = new Logger(RequestInterceptor.name);

    onFulfilled(config: AxiosRequestConfig): AxiosRequestConfig {
        // Log request (có thể disable trong production)
        if (process.env.NODE_ENV === 'development') {
            this.logger.debug(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
        }

        const hasAuthorizationHeader = !!config.headers?.Authorization || !!config.headers?.authorization;

        if (!hasAuthorizationHeader) {
            config.headers = {
                ...(config.headers || {}),
            };
        }
        return config;
    }

    onRejected(error: any): Promise<any> {
        this.logger.error(`[Request Error] ${error.message}`);
        return Promise.reject(error);
    }
}
