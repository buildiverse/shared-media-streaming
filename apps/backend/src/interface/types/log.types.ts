export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	FATAL = 'fatal',
}

export type Log = {
	level: LogLevel;
	message: string;
	details?: any;
	userId?: string;
	roomId?: string;
	ip?: string;
	userAgent?: string;
	requestId?: string;
	stacktrace?: string;
};
