import { ILoggingService } from '../../../../domain/services/ilogging.service';
import { RateLimitConfig, RateLimiterMiddleware } from '../rate-limiter.middleware';

export interface SocketRateLimitConfig extends RateLimitConfig {}

export const createSocketRateLimitConfig = (
	loggingService: ILoggingService,
	config?: Partial<SocketRateLimitConfig>,
) => {
	const rateLimiter = new RateLimiterMiddleware(loggingService, config);
	return rateLimiter.middleware();
};
