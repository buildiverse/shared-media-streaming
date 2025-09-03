import { apiService } from './api';

export interface ApiResponse<T = any> {
	success: boolean;
	message?: string;
	data?: T;
	errors?: any[];
}

export interface UsernameCheckResponse {
	success: boolean;
	username: string;
	exists: boolean;
}

export interface EmailCheckResponse {
	success: boolean;
	email: string;
	exists: boolean;
}

export class ApiService {
	// Check if username is available
	static async checkUsernameAvailability(username: string): Promise<UsernameCheckResponse> {
		try {
			const response = await apiService.get(
				`/api/v1/users/check-username/${encodeURIComponent(username)}`,
			);
			return response;
		} catch (error: any) {
			console.error('Error checking username availability:', error);
			throw new Error(error.response?.data?.message || 'Failed to check username availability');
		}
	}

	// Check if email is available
	static async checkEmailAvailability(email: string): Promise<EmailCheckResponse> {
		try {
			const response = await apiService.get(
				`/api/v1/users/check-email/${encodeURIComponent(email)}`,
			);
			return response;
		} catch (error: any) {
			console.error('Error checking email availability:', error);
			throw new Error(error.response?.data?.message || 'Failed to check email availability');
		}
	}

	// Register user
	static async register(userData: {
		username: string;
		email: string;
		password: string;
	}): Promise<ApiResponse> {
		try {
			const response = await apiService.post('/api/v1/users/signup', userData);
			return response;
		} catch (error: any) {
			console.error('Error registering user:', error);
			throw new Error(error.response?.data?.message || 'Registration failed');
		}
	}

	// Login user
	static async login(credentials: { username: string; password: string }): Promise<ApiResponse> {
		try {
			const response = await apiService.post('/api/v1/auth/login', credentials);
			return response;
		} catch (error: any) {
			console.error('Error logging in:', error);
			throw new Error(error.response?.data?.message || 'Login failed');
		}
	}
}
