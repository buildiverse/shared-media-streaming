import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONFIG } from '../../../config';
import { getStorageItem, removeStorageItem, setStorageItem } from '../../../utils';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../../types';
import { AuthService } from '../services/auth.service';

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Create authService once, not on every render
	const authService = useMemo(() => new AuthService(), []);

	// Check if user is already logged in on mount
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
				const storedUser = getStorageItem(CONFIG.STORAGE.USER_KEY);

				if (token && storedUser) {
					try {
						const user = JSON.parse(storedUser);
						setUser(user);
						setIsAuthenticated(true);
					} catch (parseError) {
						console.error('Failed to parse stored user:', parseError);
						// Clear invalid data
						removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
						removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
						removeStorageItem(CONFIG.STORAGE.USER_KEY);
					}
				}
			} catch (error) {
				console.error('Auth check failed:', error);
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

			// Set state
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

			// Don't navigate here - let the component handle navigation
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

	// Get current token from storage
	const token = useMemo(() => {
		return getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
	}, []);

	return {
		user,
		token,
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
