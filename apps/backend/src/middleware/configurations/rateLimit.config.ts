import rateLimit from 'express-rate-limit';

export const rateLimiterConfig = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // limit each IP to 1000 requests per windowMs
	message: {
		error: 'Too many requests from this IP, please try again later.',
		retryAfter: '15 minutes',
	},
	standardHeaders: false,
	legacyHeaders: false,
});
