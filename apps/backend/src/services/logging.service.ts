import Log from '../models/log.model';
import { LogLevel, Log as LogType } from '../types/log.types';
import { ILoggingService } from '../interfaces';

export class LoggingService implements ILoggingService {
	constructor() {}

	/**
	 * Log a message to the database
	 */
	async log(entry: LogType): Promise<void> {
		try {
			const log = new Log({
				...entry,
				timestamp: new Date(),
			});

			await log.save();

			// Also log to console in development
			if (process.env.NODE_ENV === 'development') {
				const timestamp = new Date().toISOString();
				const level = entry.level.toUpperCase().padEnd(5);
				console.log(`${timestamp} ${level} ${entry.message}`, entry);
			}
		} catch (error) {
			// Fallback to console if database logging fails
			console.error('Failed to log to database:', error);
			console.log(`[${entry.level.toUpperCase()}] Failed to save log:`, entry);
		}
	}

	/**
	 * Convenience methods for different log levels
	 */
	async debug(message: string, details?: any, context?: Partial<LogType>): Promise<void> {
		await this.log({
			level: LogLevel.DEBUG,
			message,
			details,
			...context,
		});
	}

	async info(message: string, details?: any, context?: Partial<LogType>): Promise<void> {
		await this.log({
			level: LogLevel.INFO,
			message,
			details,
			...context,
		});
	}

	async warn(message: string, details?: any, context?: Partial<LogType>): Promise<void> {
		await this.log({
			level: LogLevel.WARN,
			message,
			details,
			...context,
		});
	}

	async error(message: string, details?: any, context?: Partial<LogType>): Promise<void> {
		await this.log({
			level: LogLevel.ERROR,
			message,
			details,
			...context,
		});
	}

	async fatal(message: string, details?: any, context?: Partial<LogType>): Promise<void> {
		await this.log({
			level: LogLevel.FATAL,
			message,
			details,
			...context,
		});
	}
}
