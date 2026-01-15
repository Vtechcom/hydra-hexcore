import { Module, Global, OnModuleInit } from '@nestjs/common';
import { HttpService, HttpModule } from '@nestjs/axios';
import { AxiosConfigService } from './config/axios.config';
import { RequestInterceptor } from './interceptors/request.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';

/**
 * Axios Module
 * Module chung cho tất cả external API calls
 */
@Global()
@Module({
    imports: [
        HttpModule.registerAsync({
            useClass: AxiosConfigService,
        }),
    ],
    providers: [AxiosConfigService, RequestInterceptor, ResponseInterceptor],
    exports: [HttpModule],
})
export class AxiosModule implements OnModuleInit {
    constructor(
        private readonly httpService: HttpService,
        private readonly requestInterceptor: RequestInterceptor,
        private readonly responseInterceptor: ResponseInterceptor,
    ) {}

    onModuleInit() {
        const axiosInstance = this.httpService.axiosRef;

        axiosInstance.interceptors.request.use(
            this.requestInterceptor.onFulfilled.bind(this.requestInterceptor),
            this.requestInterceptor.onRejected.bind(this.requestInterceptor),
        );

        axiosInstance.interceptors.response.use(
            this.responseInterceptor.onFulfilled.bind(this.responseInterceptor),
            this.responseInterceptor.onRejected.bind(this.responseInterceptor),
        );
    }
}
