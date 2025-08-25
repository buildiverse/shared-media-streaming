import { ILoggingService } from '../../domain/services/ilogging.service';
import { Log, LogLevel } from '../../interface/types/log.types';

export class LoggingService implements ILoggingService {
	async log(entry: Log): Promise<void> {
		// For now, just console.log. Later can be extended to write to database/file
		const requestId = entry.requestId ? `[${entry.requestId}]` : '';
		const timestamp = new Date().toISOString();
		console.log(
			`[${timestamp}] [${entry.level.toUpperCase()}] ${requestId} ${entry.message}`,
			entry.details || '',
		);
	}

	async debug(message: string, details?: any, context?: any): Promise<void> {
		await this.log({
			level: LogLevel.DEBUG,
			message,
			details,
			...context,
		});
	}

	async info(message: string, details?: any, context?: any): Promise<void> {
		await this.log({
			level: LogLevel.INFO,
			message,
			details,
			...context,
		});
	}

	async warn(message: string, details?: any, context?: any): Promise<void> {
		await this.log({
			level: LogLevel.WARN,
			message,
			details,
			...context,
		});
	}

	async error(message: string, details?: any, context?: any): Promise<void> {
		await this.log({
			level: LogLevel.ERROR,
			message,
			details,
			...context,
		});
	}

	async fatal(message: string, details?: any, context?: any): Promise<void> {
		await this.log({
			level: LogLevel.FATAL,
			message,
			details,
			...context,
		});
	}
}
