import { CONFIG } from '../../../config';
import { ApiService } from '../../../services/api';
import {
	AuthResponse,
	LoginCredentials,
	RefreshTokenResponse,
	RegisterCredentials,
	User,
} from '../../../types';
import { getStorageItem } from '../../../utils';

export class AuthService {
	private apiService: ApiService;

	constructor() {
		this.apiService = new ApiService();
	}

	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		try {
			const response = await this.apiService.post<{ success: boolean; data: AuthResponse }>(
				'/api/v1/auth/login',
				credentials,
			);
			if (response.success && response.data) {
				return response.data;
			}
			throw new Error('Invalid response format');
		} catch (error) {
			throw new Error('Login failed. Please check your credentials.');
		}
	}

	async register(credentials: RegisterCredentials): Promise<AuthResponse> {
		try {
			// First create the user account
			const signupResponse = await this.apiService.post<{ success: boolean; user: User }>(
				'/api/v1/users/signup',
				credentials,
			);

			if (!signupResponse.success || !signupResponse.user) {
				throw new Error('Registration failed');
			}

			// Then automatically log them in to get tokens
			const loginResponse = await this.apiService.post<{ success: boolean; data: AuthResponse }>(
				'/api/v1/auth/login',
				{
					username: credentials.username,
					password: credentials.password,
				},
			);

			if (loginResponse.success && loginResponse.data) {
				return loginResponse.data;
			}

			throw new Error('Auto-login after registration failed');
		} catch (error) {
			throw new Error('Registration failed. Please try again.');
		}
	}

	async logout(): Promise<{ success: boolean; message: string; tokensRevoked: number }> {
		try {
			// The logout endpoint now requires authentication, so the access token
			// will be automatically added by the API service interceptor
			const response = await this.apiService.post<{
				success: boolean;
				message: string;
				data: { tokensRevoked: number };
			}>('/api/v1/auth/logout');

			return {
				success: response.success,
				message: response.message,
				tokensRevoked: response.data?.tokensRevoked || 0,
			};
		} catch (error) {
			// Even if logout fails on backend, we should clear local storage
			console.warn('Logout request failed, but clearing local storage');
			throw new Error('Logout failed on server');
		}
	}

	async refreshToken(): Promise<RefreshTokenResponse> {
		try {
			// Get the current refresh token from storage
			const currentRefreshToken = getStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);

			if (!currentRefreshToken) {
				throw new Error('No refresh token available');
			}

			const response = await this.apiService.post<RefreshTokenResponse>(
				'/api/v1/auth/refresh-token',
				{
					refreshToken: currentRefreshToken,
				},
			);
			return response;
		} catch (error) {
			throw new Error('Token refresh failed');
		}
	}

	async getCurrentUser(): Promise<User> {
		try {
			const response = await this.apiService.get<{ success: boolean; user: User }>(
				'/api/v1/users/profile',
			);
			if (response.success && response.user) {
				return response.user;
			}
			throw new Error('Invalid response format');
		} catch (error) {
			throw new Error('Failed to get current user');
		}
	}

	async validateToken(): Promise<boolean> {
		try {
			await this.apiService.get('/api/v1/users/profile');
			return true;
		} catch (error) {
			return false;
		}
	}
}
