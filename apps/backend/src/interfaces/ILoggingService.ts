import { Log } from '../types/log.types';

export interface ILoggingService {
	/**
	 * Log a message to the database
	 */
	log(entry: Log): Promise<void>;

	/**
	 * Convenience methods for different log levels
	 */
	debug(message: string, details?: any, context?: Partial<Log>): Promise<void>;
	info(message: string, details?: any, context?: Partial<Log>): Promise<void>;
	warn(message: string, details?: any, context?: Partial<Log>): Promise<void>;
	error(message: string, details?: any, context?: Partial<Log>): Promise<void>;
	fatal(message: string, details?: any, context?: Partial<Log>): Promise<void>;
}
