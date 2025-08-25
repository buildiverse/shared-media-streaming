import rateLimiter from 'socket.io-ratelimiter';
import { ILoggingService } from '../../../../domain/services/ilogging.service';
import SocketError from '../../../../infrastructure/utils/socket-error';

export interface SocketRateLimitConfig {
	points: number;
	duration: number;
	maxConnectionsPerIP: number;
	connectionWindowMs: number;
}

export const createSocketRateLimitConfig = (
	loggingService: ILoggingService,
	config?: Partial<SocketRateLimitConfig>,
) => {
	const defaultConfig: SocketRateLimitConfig = {
		points: 100, // Number of points
		duration: 60, // Per 60 seconds
		maxConnectionsPerIP: 5, // Max connections per IP
		connectionWindowMs: 60000, // 1 minute window
	};

	const finalConfig = { ...defaultConfig, ...config };

	return rateLimiter({
		// Rate limit configuration
		points: finalConfig.points,
		duration: finalConfig.duration,

		// Error message
		errorMessage: 'Rate limit exceeded',

		// Custom error handler
		errorHandler: (error: Error, socket: any) => {
			loggingService.warn('Socket rate limit exceeded', {
				socketId: socket.id,
				ip: socket.handshake.address,
				error: error.message,
				requestId: (socket.request as any)?.requestId,
			});

			// Emit rate limit error to client
			socket.emit('error', {
				code: 'RATE_LIMIT_ERROR',
				message: 'Too many requests, please try again later',
				retryAfter: finalConfig.duration,
				event: 'rate_limit',
			});
		},

		// Custom key generator (by IP address)
		keyGenerator: (socket: any) => {
			return socket.handshake.address || 'unknown';
		},

		// Skip successful requests
		skipSuccessfulRequests: false,

		// Skip failed requests
		skipFailedRequests: false,

		// Custom handler for rate limit exceeded
		handler: (socket: any) => {
			const socketError = SocketError.rateLimitError('rate_limit');

			socket.emit('error', {
				code: socketError.code,
				message: socketError.message,
				event: socketError.event,
				retryAfter: finalConfig.duration,
			});
		},
	});
};
