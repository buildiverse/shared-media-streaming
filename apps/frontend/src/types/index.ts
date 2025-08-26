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
	user: User;
}

// Backend API endpoints
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: '/api/auth/login',
		REGISTER: '/api/auth/register',
		LOGOUT: '/api/auth/logout',
		REFRESH: '/api/auth/refresh',
	},
	MEDIA: {
		UPLOAD: '/api/media/upload',
		GET_ALL: '/api/media',
		GET_BY_ID: '/api/media/:id',
		DELETE: '/api/media/:id',
		GET_USER_MEDIA: '/api/media/user/:userId',
	},
	USERS: {
		GET_PROFILE: '/api/users/profile',
		UPDATE_PROFILE: '/api/users/profile',
	},
} as const;
