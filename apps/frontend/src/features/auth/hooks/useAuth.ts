import { useCallback, useEffect, useState } from 'react';
import { CONFIG } from '../../../config';
import { getStorageItem, removeStorageItem, setStorageItem } from '../../../utils';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../../types';
import { AuthService } from '../services/auth.service';

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const authService = new AuthService();

	// Check if user is already logged in on mount
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
				if (token) {
					// Validate token and get current user
					const isValid = await authService.validateToken();
					if (isValid) {
						const currentUser = await authService.getCurrentUser();
						setUser(currentUser);
						setIsAuthenticated(true);
					} else {
						// Token is invalid, clear storage
						removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
						removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
						removeStorageItem(CONFIG.STORAGE.USER_KEY);
					}
				}
			} catch (error) {
				console.error('Auth check failed:', error);
				// Clear any invalid tokens
				removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
				removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
				removeStorageItem(CONFIG.STORAGE.USER_KEY);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuthStatus();
	}, []);

	const login = useCallback(async (credentials: LoginCredentials) => {
		try {
			setIsLoading(true);
			setError(null);

			const response: AuthResponse = await authService.login(credentials);

			// Store tokens and user data
			setStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY, response.accessToken);
			setStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY, response.refreshToken);
			setStorageItem(CONFIG.STORAGE.USER_KEY, JSON.stringify(response.user));

			setUser(response.user);
			setIsAuthenticated(true);

			return response;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Login failed';
			setError(errorMessage);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const register = useCallback(async (credentials: RegisterCredentials) => {
		try {
			setIsLoading(true);
			setError(null);

			const response: AuthResponse = await authService.register(credentials);

			// Store tokens and user data
			setStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY, response.accessToken);
			setStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY, response.refreshToken);
			setStorageItem(CONFIG.STORAGE.USER_KEY, JSON.stringify(response.user));

			setUser(response.user);
			setIsAuthenticated(true);

			return response;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Registration failed';
			setError(errorMessage);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await authService.logout();
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			// Always clear local storage and state
			removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
			removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
			removeStorageItem(CONFIG.STORAGE.USER_KEY);

			setUser(null);
			setIsAuthenticated(false);
			setError(null);
		}
	}, []);

	const refreshToken = useCallback(async () => {
		try {
			const response: AuthResponse = await authService.refreshToken();

			// Update stored tokens
			setStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY, response.accessToken);
			setStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY, response.refreshToken);

			return response.accessToken;
		} catch (error) {
			// If refresh fails, logout user
			await logout();
			throw error;
		}
	}, [logout]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		user,
		isLoading,
		error,
		isAuthenticated,
		login,
		register,
		logout,
		refreshToken,
		clearError,
	};
};
