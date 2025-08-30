export interface ILoggingService {
	debug(message: string, details?: any, context?: any): Promise<void>;
	info(message: string, details?: any, context?: any): Promise<void>;
	warn(message: string, details?: any, context?: any): Promise<void>;
	error(message: string, details?: any, context?: any): Promise<void>;
	fatal(message: string, details?: any, context?: any): Promise<void>;
}
