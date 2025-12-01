import { Injectable, LoggerService } from '@nestjs/common';
import { appendFile, mkdir, access, constants } from 'node:fs/promises';
import { join } from 'node:path';

export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    VERBOSE = 'VERBOSE',
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    file?: string;
    line?: number;
    context?: string;
    stack?: string;
}

@Injectable()
export class FileLoggerService implements LoggerService {
    private logDir: string;
    private currentDate: string = '';
    private currentLogFile: string = '';

    constructor() {
        // Set log directory - can be configured via env
        this.logDir = process.env.LOG_DIR || join(process.cwd(), 'logs');
        this.initializeLogDir();
    }

    private async initializeLogDir(): Promise<void> {
        try {
            await access(this.logDir, constants.F_OK);
        } catch {
            // Directory doesn't exist, create it
            await mkdir(this.logDir, { recursive: true });
        }
        this.updateLogFile();
    }

    private updateLogFile(): void {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        if (today !== this.currentDate) {
            this.currentDate = today;
            this.currentLogFile = join(this.logDir, `${this.currentDate}.log`);
        }
    }

    private getCallerInfo(): { file?: string; line?: number } {
        const stack = new Error().stack;
        if (!stack) return {};

        // Parse stack trace to get caller info
        const stackLines = stack.split('\n');
        
        // Find the first stack line that is not from file-logger.service.ts
        // Skip: Error, getCallerInfo, formatLogEntry, writeLog, and the log method itself
        for (let i = 4; i < stackLines.length; i++) {
            const line = stackLines[i];
            if (!line) continue;
            
            // Match pattern like: at ClassName.methodName (/path/to/file.ts:123:45)
            // or: at /path/to/file.ts:123:45
            const match = line.match(/\((.+):(\d+):(\d+)\)/) || line.match(/at (.+):(\d+):(\d+)/);
            if (match) {
                const filePath = match[1];
                // Skip if it's from file-logger.service.ts
                if (filePath.includes('file-logger.service.ts')) {
                    continue;
                }
                
                const lineNumber = parseInt(match[2], 10);
                // Extract just filename from path
                const fileName = filePath.split(/[/\\]/).pop() || filePath;
                return { file: fileName, line: lineNumber };
            }
        }
        
        return {};
    }

    private formatLogEntry(level: LogLevel, message: string, context?: string, error?: Error): string {
        this.updateLogFile();
        const timestamp = new Date().toISOString();
        const callerInfo = this.getCallerInfo();
        
        const logEntry: LogEntry = {
            timestamp,
            level,
            message,
            file: callerInfo.file,
            line: callerInfo.line,
            context,
        };

        if (error && error.stack) {
            logEntry.stack = error.stack;
        }

        // Format: [TIMESTAMP] [LEVEL] [FILE:LINE] [CONTEXT] MESSAGE
        let logLine = `[${logEntry.timestamp}] [${logEntry.level}]`;
        
        if (logEntry.file) {
            logLine += ` [${logEntry.file}`;
            if (logEntry.line) {
                logLine += `:${logEntry.line}`;
            }
            logLine += ']';
        }
        
        if (logEntry.context) {
            logLine += ` [${logEntry.context}]`;
        }
        
        logLine += ` ${logEntry.message}`;
        
        if (logEntry.stack) {
            logLine += `\n${logEntry.stack}`;
        }
        
        return logLine + '\n';
    }

    private async writeLog(level: LogLevel, message: string, context?: string, error?: Error): Promise<void> {
        try {
            const logLine = this.formatLogEntry(level, message, context, error);
            await appendFile(this.currentLogFile, logLine, 'utf-8');
        } catch (err) {
            // Fallback to console if file write fails
            console.error('Failed to write log to file:', err);
            console.log(this.formatLogEntry(level, message, context, error));
        }
    }

    log(message: string, context?: string): void {
        this.writeLog(LogLevel.INFO, message, context);
    }

    error(message: string, trace?: string, context?: string): void {
        const error = trace ? new Error(trace) : undefined;
        this.writeLog(LogLevel.ERROR, message, context, error);
    }

    warn(message: string, context?: string): void {
        this.writeLog(LogLevel.WARN, message, context);
    }

    debug(message: string, context?: string): void {
        this.writeLog(LogLevel.DEBUG, message, context);
    }

    verbose(message: string, context?: string): void {
        this.writeLog(LogLevel.VERBOSE, message, context);
    }

    /**
     * Log with custom level and error object
     */
    logError(message: string, error: Error, context?: string): void {
        this.writeLog(LogLevel.ERROR, message, context, error);
    }

    /**
     * Log with file and line information explicitly
     */
    logWithLocation(message: string, file: string, line: number, level: LogLevel = LogLevel.INFO, context?: string): void {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] [${level}] [${file}:${line}]${context ? ` [${context}]` : ''} ${message}\n`;
        
        this.updateLogFile();
        appendFile(this.currentLogFile, logLine, 'utf-8').catch(err => {
            console.error('Failed to write log to file:', err);
            console.log(logLine);
        });
    }
}
