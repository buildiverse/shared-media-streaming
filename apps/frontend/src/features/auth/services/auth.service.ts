import { ApiService } from '../../../services/api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../../../types';

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

	async logout(): Promise<void> {
		try {
			await this.apiService.post('/api/v1/auth/logout');
		} catch (error) {
			// Even if logout fails on backend, we should clear local storage
			console.warn('Logout request failed, but clearing local storage');
		}
	}

	async refreshToken(): Promise<AuthResponse> {
		try {
			const response = await this.apiService.post<AuthResponse>('/api/v1/auth/refresh-token');
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
