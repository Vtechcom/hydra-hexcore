import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

/**
 * Response interceptor cho axios
 * Xử lý response và errors
 */
@Injectable()
export class ResponseInterceptor {
    private readonly logger = new Logger(ResponseInterceptor.name);

    onFulfilled(response: AxiosResponse): AxiosResponse {
        // Log response (có thể disable trong production)
        if (process.env.NODE_ENV === 'development') {
            this.logger.debug(
                `[Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
            );
        }

        return response;
    }

    onRejected(error: AxiosError): Promise<AxiosError> {
        if (error.response) {
            // Server responded with error status
            this.logger.error(
                `[Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}: ${error.response.statusText}`,
            );
        } else if (error.request) {
            // Request was made but no response received
            this.logger.error(`[Request Error] No response received from ${error.config?.url}`);
        } else {
            // Error setting up request
            this.logger.error(`[Request Setup Error] ${error.message}`);
        }

        return Promise.reject(error);
    }
}
