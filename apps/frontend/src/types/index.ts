// Global types for the application

export interface User {
	id: string;
	username: string;
	email: string;
	createdAt: string;
	lastActiveAt: string;
}

export interface Media {
	id: string;
	title: string;
	description?: string;
	filename: string;
	mimeType: string;
	size: number;
	url: string;
	uploadedBy: string;
	uploadedAt: string;
	duration?: number;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface RegisterCredentials {
	username: string;
	email: string;
	password: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: User; // Required for login/register responses
}

export interface RefreshTokenResponse {
	accessToken: string;
	refreshToken: string;
	user?: User; // Optional - backend may or may not include user data
}

// For responses that definitely don't include user data
export interface TokenOnlyResponse {
	accessToken: string;
	refreshToken: string;
}

// Backend API endpoints
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: '/api/v1/auth/login',
		REGISTER: '/api/v1/auth/register',
		LOGOUT: '/api/v1/auth/logout',
		REFRESH: '/api/v1/auth/refresh-token',
	},
	MEDIA: {
		UPLOAD: '/api/v1/media/upload',
		GET_ALL: '/api/v1/media',
		GET_BY_ID: '/api/v1/media/:id',
		DELETE: '/api/v1/media/:id',
		GET_USER_MEDIA: '/api/v1/media/user/:userId',
	},
	USERS: {
		GET_PROFILE: '/api/v1/users/profile',
		UPDATE_PROFILE: '/api/v1/users/profile',
	},
} as const;
