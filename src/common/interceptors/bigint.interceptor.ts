import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { convertBigIntToString, transformForApiResponse } from '../utils/bigint.utils';

/**
 * Interceptor to automatically handle BigInt values in API responses
 * Converts BigInt to strings to prevent JSON serialization errors
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                if (data === null || data === undefined) {
                    return data;
                }

                // Check if the response contains BigInt values
                const hassBigInt = this.hasBigInt(data);

                if (hassBigInt) {
                    // Transform the data and provide metadata about BigInt fields
                    return transformForApiResponse(data);
                }

                return data;
            }),
        );
    }

    private hasBigInt(obj: any): boolean {
        if (obj === null || obj === undefined) {
            return false;
        }

        if (typeof obj === 'bigint') {
            return true;
        }

        if (Array.isArray(obj)) {
            return obj.some(item => this.hasBigInt(item));
        }

        if (typeof obj === 'object') {
            return Object.values(obj).some(value => this.hasBigInt(value));
        }

        return false;
    }
}

/**
 * Simple interceptor that just converts BigInt to strings without metadata
 */
@Injectable()
export class SimpleBigIntInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map(data => convertBigIntToString(data)));
    }
}
