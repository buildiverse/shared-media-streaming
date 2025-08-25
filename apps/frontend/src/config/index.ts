// Global configuration constants

export const CONFIG = {
	API: {
		BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
		TIMEOUT: 10000,
	},
	APP: {
		NAME: 'Shared Media Streaming',
		VERSION: '1.0.0',
	},
	STORAGE: {
		AUTH_TOKEN_KEY: 'auth_token',
		REFRESH_TOKEN_KEY: 'refresh_token',
		USER_KEY: 'user',
	},
	VALIDATION: {
		USERNAME_MIN_LENGTH: 3,
		USERNAME_MAX_LENGTH: 20,
		PASSWORD_MIN_LENGTH: 8,
		EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	},
	MEDIA: {
		MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
		ALLOWED_MIME_TYPES: [
			'video/mp4',
			'video/webm',
			'video/ogg',
			'audio/mpeg',
			'audio/wav',
			'audio/ogg',
		],
	},
} as const;
