import helmet from 'helmet';

export const helmetConfig = helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", 'data:', 'https:'],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
		},
	},
	// Only enable HSTS in production to avoid development issues
	hsts:
		process.env.NODE_ENV === 'production'
			? {
					maxAge: 31536000,
					includeSubDomains: true,
					preload: true,
				}
			: false,
});
