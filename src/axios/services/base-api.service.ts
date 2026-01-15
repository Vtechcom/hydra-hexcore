import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiErrorResponse } from '../types/api-response.type';

/**
 * Base API Service
 * Cung cấp các method chung cho tất cả API services
 */
@Injectable()
export abstract class BaseApiService {
    protected readonly logger: Logger;

    constructor(
        protected readonly httpService: HttpService,
        serviceName: string,
    ) {
        this.logger = new Logger(serviceName);
    }

    /**
     * GET request
     */
    protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>('GET', url, undefined, config);
    }

    /**
     * POST request
     */
    protected async post<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        return this.request<T>('POST', url, data, config);
    }

    /**
     * PUT request
     */
    protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>('PUT', url, data, config);
    }

    /**
     * PATCH request
     */
    protected async patch<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        return this.request<T>('PATCH', url, data, config);
    }

    /**
     * DELETE request
     */
    protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>('DELETE', url, undefined, config);
    }

    /**
     * Generic request method
     */
    protected async request<T = any>(
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        try {
            this.logger.debug(`${method} ${url}`);

            let request: Observable<AxiosResponse<T>>;

            switch (method) {
                case 'GET':
                    request = this.httpService.get<T>(url, config);
                    break;
                case 'POST':
                    request = this.httpService.post<T>(url, data, config);
                    break;
                case 'PUT':
                    request = this.httpService.put<T>(url, data, config);
                    break;
                case 'PATCH':
                    request = this.httpService.patch<T>(url, data, config);
                    break;
                case 'DELETE':
                    request = this.httpService.delete<T>(url, config);
                    break;
            }

            const response = await firstValueFrom(request);
            return response.data;
        } catch (error: any) {
            console.error('[Axios Error]:', error.response?.data);
            this.handleError(error, method, url);
            throw error; // Re-throw sau khi handle
        }
    }

    /**
     * Handle errors từ axios requests
     */
    protected handleError(error: any, method: string, url: string): void {
        this.logger.error(`[${method}] ${url} - Error: ${error?.message || 'Unknown error'}`);

        if (error?.response) {
            // API trả về lỗi
            const status = error.response.status || HttpStatus.BAD_GATEWAY;
            const errorData: ApiErrorResponse = {
                message:
                    error.response.data?.message ||
                    error.response.data?.detail ||
                    'External API error',
                statusCode: status,
                error: error.response.data?.error || 'External API Error',
                details: error.response.data,
            };

            throw new HttpException(errorData, status);
        } else if (error?.request) {
            // Request được gửi nhưng không nhận được response
            throw new HttpException(
                {
                    message: 'External API is not responding',
                    statusCode: HttpStatus.BAD_GATEWAY,
                    error: 'Bad Gateway',
                },
                HttpStatus.BAD_GATEWAY,
            );
        } else {
            // Lỗi khi setup request
            throw new HttpException(
                {
                    message: error?.message || 'Failed to call external API',
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Internal Server Error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
