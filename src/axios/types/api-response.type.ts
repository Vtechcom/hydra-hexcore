/**
 * Generic API response type
 */
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    statusCode?: number;
    success?: boolean;
}

/**
 * API error response type
 */
export interface ApiErrorResponse {
    message: string;
    statusCode: number;
    error: string;
    details?: any;
}
