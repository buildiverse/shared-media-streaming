import { Socket } from 'socket.io';
import { ILoggingService } from '../../../domain/services/ilogging.service';

export interface RateLimitConfig {
	points: number;
	duration: number;
	maxConnectionsPerIP: number;
	connectionWindowMs: number;
}

export interface RateLimitStore {
	[key: string]: {
		points: number;
		resetTime: number;
		connections: number;
		lastConnectionTime: number;
	};
}

export class RateLimiterMiddleware {
	private store: RateLimitStore = {};
	private config: RateLimitConfig;

	constructor(
		private loggingService: ILoggingService,
		config: Partial<RateLimitConfig> = {},
	) {
		this.config = {
			points: 100,
			duration: 60,
			maxConnectionsPerIP: 5,
			connectionWindowMs: 60000,
			...config,
		};

		// Clean up expired entries every minute
		setInterval(() => this.cleanup(), 60000);
	}

	middleware() {
		return (socket: Socket, next: (err?: Error) => void) => {
			try {
				const ip = socket.handshake.address || 'unknown';
				const now = Date.now();

				// Get or create rate limit entry for this IP
				if (!this.store[ip]) {
					this.store[ip] = {
						points: this.config.points,
						resetTime: now + this.config.duration * 1000,
						connections: 0,
						lastConnectionTime: now,
					};
				}

				const entry = this.store[ip];

				// Check if we need to reset points
				if (now > entry.resetTime) {
					entry.points = this.config.points;
					entry.resetTime = now + this.config.duration * 1000;
				}

				// Check connection limit
				if (entry.connections >= this.config.maxConnectionsPerIP) {
					const timeSinceLastConnection = now - entry.lastConnectionTime;
					if (timeSinceLastConnection < this.config.connectionWindowMs) {
						this.loggingService.warn('Connection limit exceeded for IP', {
							ip,
							connections: entry.connections,
							limit: this.config.maxConnectionsPerIP,
						});

						socket.emit('error', {
							code: 'CONNECTION_LIMIT_ERROR',
							message: 'Too many connections from this IP',
							retryAfter: Math.ceil(
								(this.config.connectionWindowMs - timeSinceLastConnection) / 1000,
							),
						});

						return next(new Error('Connection limit exceeded'));
					}
					// Reset connection count if window has passed
					entry.connections = 0;
				}

				// Check rate limit
				if (entry.points <= 0) {
					this.loggingService.warn('Rate limit exceeded for IP', {
						ip,
						resetTime: new Date(entry.resetTime).toISOString(),
					});

					socket.emit('error', {
						code: 'RATE_LIMIT_ERROR',
						message: 'Rate limit exceeded',
						retryAfter: Math.ceil((entry.resetTime - now) / 1000),
					});

					return next(new Error('Rate limit exceeded'));
				}

				// Allow connection
				entry.points--;
				entry.connections++;
				entry.lastConnectionTime = now;

				this.loggingService.debug('Rate limit check passed for IP', {
					ip,
					remainingPoints: entry.points,
					connections: entry.connections,
				});

				next();
			} catch (error) {
				this.loggingService.error('Error in rate limiter middleware', {
					error: error instanceof Error ? error.message : 'Unknown error',
					ip: socket.handshake.address,
				});
				next(error instanceof Error ? error : new Error('Unknown error in rate limiter'));
			}
		};
	}

	private cleanup(): void {
		const now = Date.now();
		const keysToDelete: string[] = [];

		for (const [key, entry] of Object.entries(this.store)) {
			if (now > entry.resetTime + 60000) {
				// Keep for 1 minute after reset
				keysToDelete.push(key);
			}
		}

		keysToDelete.forEach((key) => delete this.store[key]);

		if (keysToDelete.length > 0) {
			this.loggingService.debug('Cleaned up expired rate limit entries', {
				count: keysToDelete.length,
			});
		}
	}

	getStats(): { totalIPs: number; store: RateLimitStore } {
		return {
			totalIPs: Object.keys(this.store).length,
			store: { ...this.store },
		};
	}
}
