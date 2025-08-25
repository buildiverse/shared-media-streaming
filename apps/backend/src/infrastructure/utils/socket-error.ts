export default class SocketError extends Error {
	public readonly event: string;
	public readonly code: string;
	public readonly isOperational: boolean;

	constructor(message: string, event: string, code: string = 'SOCKET_ERROR') {
		super(message);

		this.event = event;
		this.code = code;
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}

	// Common socket error types
	static validationError(event: string, details?: string): SocketError {
		return new SocketError(
			`Validation failed for event '${event}'${details ? `: ${details}` : ''}`,
			event,
			'VALIDATION_ERROR',
		);
	}

	static rateLimitError(event: string): SocketError {
		return new SocketError(`Rate limit exceeded for event '${event}'`, event, 'RATE_LIMIT_ERROR');
	}

	static authenticationError(event: string): SocketError {
		return new SocketError(
			`Authentication required for event '${event}'`,
			event,
			'AUTHENTICATION_ERROR',
		);
	}

	static permissionError(event: string): SocketError {
		return new SocketError(
			`Insufficient permissions for event '${event}'`,
			event,
			'PERMISSION_ERROR',
		);
	}

	static notFoundError(event: string, resource: string): SocketError {
		return new SocketError(`${resource} not found for event '${event}'`, event, 'NOT_FOUND_ERROR');
	}
}
