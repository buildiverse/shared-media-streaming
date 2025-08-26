import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONFIG } from '../../../config';
import {
	AuthResponse,
	LoginCredentials,
	RefreshTokenResponse,
	RegisterCredentials,
	User,
} from '../../../types';
import { getStorageItem, removeStorageItem, setStorageItem } from '../../../utils';
import { AuthService } from '../services/auth.service';

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Create authService once, not on every render
	const authService = useMemo(() => new AuthService(), []);

	// Define refreshToken first so it can be used in useEffect
	const refreshToken = useCallback(async () => {
		try {
			console.log('Attempting to refresh token...');
			const response: RefreshTokenResponse = await authService.refreshToken();

			console.log('Refresh response received:', {
				hasAccessToken: !!response.accessToken,
				hasRefreshToken: !!response.refreshToken,
				hasUser: !!response.user,
				responseKeys: Object.keys(response),
			});

			// Update stored tokens
			setStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY, response.accessToken);
			setStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY, response.refreshToken);

			// If the backend returned user data, update it
			if (response.user) {
				setStorageItem(CONFIG.STORAGE.USER_KEY, JSON.stringify(response.user));
				setUser(response.user);
			}

			// Update authentication state
			setIsAuthenticated(true);
			console.log('Token refreshed successfully');
			return response.accessToken;
		} catch (error) {
			console.error('Token refresh failed:', error);
			// If refresh fails, clear auth state
			removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
			removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
			removeStorageItem(CONFIG.STORAGE.USER_KEY);
			setUser(null);
			setIsAuthenticated(false);
			throw error;
		}
	}, [authService]);

	// Check if user is already logged in on mount and set up token refresh
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
				const refreshTokenValue = getStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
				const storedUser = getStorageItem(CONFIG.STORAGE.USER_KEY);

				console.log('Auth check - stored data:', {
					hasToken: !!token,
					hasRefreshToken: !!refreshTokenValue,
					hasUser: !!storedUser,
					tokenLength: token?.length,
					userLength: storedUser?.length,
				});

				if (token && storedUser && refreshTokenValue) {
					try {
						// Check if token is expired
						console.log('Parsing token payload...');
						const tokenPayload = JSON.parse(atob(token.split('.')[1]));
						console.log('Token payload:', { exp: tokenPayload.exp, iat: tokenPayload.iat });

						const isExpired = tokenPayload.exp * 1000 < Date.now();
						console.log('Token expired:', isExpired, 'Current time:', Date.now());

						if (isExpired) {
							console.log('Token expired, attempting refresh...');
							try {
								const newToken = await refreshToken();
								if (newToken) {
									console.log('Parsing stored user data...');
									const user = JSON.parse(storedUser);
									setUser(user);
									setIsAuthenticated(true);
									console.log('Token refreshed and user authenticated');
								}
							} catch (refreshError) {
								console.error('Token refresh failed during auth check:', refreshError);
								// Clear invalid data
								removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
								removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
								removeStorageItem(CONFIG.STORAGE.USER_KEY);
								setUser(null);
								setIsAuthenticated(false);
							}
						} else {
							console.log('Parsing stored user data...');
							const user = JSON.parse(storedUser);
							setUser(user);
							setIsAuthenticated(true);
							console.log('Token still valid, user authenticated');
						}
					} catch (parseError) {
						console.error('Failed to parse stored user or token:', parseError);
						console.error('Token value:', token);
						console.error('User value:', storedUser);

						// Try to parse just the user data if token parsing fails
						try {
							const user = JSON.parse(storedUser);
							console.log('User data parsed successfully:', user);
							setUser(user);
							setIsAuthenticated(true);
						} catch (userParseError) {
							console.error('User data also failed to parse:', userParseError);
							// Clear invalid data
							removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
							removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
							removeStorageItem(CONFIG.STORAGE.USER_KEY);
						}
					}
				} else {
					console.log('No stored auth data found');
				}
			} catch (error) {
				console.error('Auth check failed:', error);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuthStatus();

		// Set up periodic token refresh (every 10 minutes)
		const refreshInterval = setInterval(
			async () => {
				try {
					const token = getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
					if (token) {
						try {
							const tokenPayload = JSON.parse(atob(token.split('.')[1]));
							const timeUntilExpiry = tokenPayload.exp * 1000 - Date.now();

							// Refresh if token expires in less than 5 minutes
							if (timeUntilExpiry < 5 * 60 * 1000) {
								console.log('Proactively refreshing token...');
								await refreshToken();
							}
						} catch (parseError) {
							console.error('Failed to parse token during periodic check:', parseError);
							console.error('Token value:', token);
							// Clear invalid token
							removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
						}
					}
				} catch (error) {
					console.error('Periodic token refresh failed:', error);
				}
			},
			10 * 60 * 1000,
		); // 10 minutes

		return () => clearInterval(refreshInterval);
	}, [refreshToken]); // Add refreshToken as dependency

	const login = useCallback(
		async (credentials: LoginCredentials) => {
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
		},
		[authService],
	);

	const register = useCallback(
		async (credentials: RegisterCredentials) => {
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
		},
		[authService],
	);

	const logout = useCallback(async () => {
		try {
			const result = await authService.logout();
			console.log(
				'Logout successful:',
				result.message,
				`${result.tokensRevoked} session(s) terminated`,
			);
		} catch (error) {
			console.error('Logout error:', error);
			// Even if the backend logout fails, we should still clear local state
			// This ensures the user is logged out locally even if there are server issues
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
	}, [authService]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Clear all auth data (useful for debugging corrupted data)
	const clearAuthData = useCallback(() => {
		console.log('Clearing all auth data...');
		removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
		removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
		removeStorageItem(CONFIG.STORAGE.USER_KEY);
		setUser(null);
		setIsAuthenticated(false);
		setError(null);
	}, []);

	// Get current token from storage
	const token = useMemo(() => {
		return getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
	}, [isAuthenticated]); // Re-compute when auth state changes

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
		clearAuthData,
	};
};
