import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

const logDir = process.env.LOG_DIR ? process.env.LOG_DIR : join(process.cwd(), 'logs');

export const winstonConfig: WinstonModuleOptions = {
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.label({ label: process.env.NODE_ENV || 'local' }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context, label, trace }) => {
                    return `[${timestamp}] ${label}.${level}: ${message}${trace ? `\n${trace}` : ''}`;
                }),
            ),
        }),
        // Daily rotate file transport - All logs
        new DailyRotateFile({
            dirname: logDir,
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            format: winston.format.combine(
                winston.format.label({ label: process.env.NODE_ENV || 'local' }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, context, label, trace, ...meta }) => {
                    const contextStr = context ? `[${context}]` : '';
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    const traceStr = trace ? `\n${trace}` : '';
                    return `[${timestamp}] ${label}.${level.toUpperCase()}] ${contextStr} ${message}${metaStr}${traceStr}`;
                }),
            ),
            maxSize: '20m',
            maxFiles: '14d', // Keep logs for 14 days
        }),
        // Daily rotate file transport - Error logs only
        new DailyRotateFile({
            dirname: logDir,
            filename: '%DATE%-error.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            format: winston.format.combine(
                winston.format.label({ label: process.env.NODE_ENV || 'local' }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, context, label, trace, ...meta }) => {
                    const contextStr = context ? `[${context}]` : '';
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    const traceStr = trace ? `\n${trace}` : '';
                    return `[${timestamp}] ${label}.${level.toUpperCase()}] ${contextStr} ${message}${metaStr}${traceStr}`;
                }),
            ),
            maxSize: '20m',
            maxFiles: '30d', // Keep error logs for 30 days
        }),
    ],
};
