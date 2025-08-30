declare module 'socket.io-ratelimiter' {
	import { Socket } from 'socket.io';

	interface RateLimiterOptions {
		points: number;
		duration: number;
		errorMessage?: string;
		errorHandler?: (error: Error, socket: Socket) => void;
		keyGenerator?: (socket: Socket) => string;
		skipSuccessfulRequests?: boolean;
		skipFailedRequests?: boolean;
		handler?: (socket: Socket) => void;
	}

	function rateLimiter(
		options: RateLimiterOptions,
	): (socket: Socket, next: (err?: Error) => void) => void;

	export = rateLimiter;
}
