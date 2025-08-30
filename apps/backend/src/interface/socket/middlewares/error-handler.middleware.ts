import { Socket } from 'socket.io';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import SocketError from '../../../infrastructure/utils/socket-error';

export const createSocketErrorHandler = (loggingService: ILoggingService) => {
	return (socket: Socket, error: Error | SocketError) => {
		let socketError: SocketError;

		// Convert regular errors to SocketError if needed
		if (error instanceof SocketError) {
			socketError = error;
		} else {
			socketError = new SocketError(
				error.message || 'An unexpected error occurred',
				'unknown',
				'UNKNOWN_ERROR',
			);
		}

		// Log the error
		loggingService.error('Socket error occurred', {
			socketId: socket.id,
			event: socketError.event,
			code: socketError.code,
			message: socketError.message,
			stack: socketError.stack,
			requestId: (socket.request as any)?.requestId,
		});

		// Emit error to client
		socket.emit('error', {
			code: socketError.code,
			message: socketError.message,
			event: socketError.event,
			timestamp: new Date().toISOString(),
		});

		// For critical errors, disconnect the socket
		if (socketError.code === 'AUTHENTICATION_ERROR' || socketError.code === 'PERMISSION_ERROR') {
			loggingService.warn('Disconnecting socket due to critical error', {
				socketId: socket.id,
				code: socketError.code,
				requestId: (socket.request as any)?.requestId,
			});
			socket.disconnect(true);
		}
	};
};

// Helper function to create and emit validation errors
export const emitValidationError = (socket: Socket, event: string, errors: any[]) => {
	const socketError = SocketError.validationError(event, errors.map((e) => e.message).join(', '));

	socket.emit('error', {
		code: socketError.code,
		message: socketError.message,
		event: socketError.event,
		details: errors,
		timestamp: new Date().toISOString(),
	});
};

// Helper function to create and emit rate limit errors
export const emitRateLimitError = (socket: Socket, event: string, retryAfter: number) => {
	const socketError = SocketError.rateLimitError(event);

	socket.emit('error', {
		code: socketError.code,
		message: socketError.message,
		event: socketError.event,
		retryAfter,
		timestamp: new Date().toISOString(),
	});
};
