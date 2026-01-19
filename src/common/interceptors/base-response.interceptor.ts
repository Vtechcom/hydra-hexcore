import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
    HttpException,
    InternalServerErrorException,
} from '@nestjs/common';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class BaseResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map(data => {
                // Get the HTTP status code from the context
                const statusCode = res.statusCode;

                // Standardize the success response
                return {
                    data,
                    statusCode,
                    message: 'Request successful',
                    status: 'success',
                };
            }),
            catchError(err => {
                console.log('>>> / file: base-response.interceptor.ts:22 / err:', err);

                const problem: any = {
                    type: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
                    title: 'An error occurred',
                    status: res.statusCode >= 200 && res.statusCode < 300 ? 500 : res.statusCode,
                    detail: err.message || 'Internal Server Error',
                    instance: req.url,
                };

                if (err instanceof HttpException) {
                    problem.status = err.getStatus();
                    const response = err.getResponse();
                    if (typeof response === 'object') {
                        problem.title = (response as any).error || problem.title;
                        problem.detail = (response as any).message || problem.detail;
                    } else if (typeof response === 'string') {
                        problem.detail = response;
                    }
                } else if (err instanceof QueryFailedError) {
                    // Map DB errors to 400 Bad Request
                    problem.status = 400;
                    problem.title = 'Database constraint violation';
                    problem.detail = err.message;
                }

                throw new HttpException(problem, problem.status);
            }),
        );
    }
}
