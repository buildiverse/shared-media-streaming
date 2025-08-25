// AuthProvider Context

import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { CONFIG } from '../../config';
import apiService from '../../services/api';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../../types';
import { getStorageItem, removeStorageItem, setStorageItem } from '../../utils';

// Action types
type AuthAction =
	| { type: 'AUTH_START' }
	| { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
	| { type: 'AUTH_FAILURE'; payload: string }
	| { type: 'AUTH_LOGOUT' }
	| { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case 'AUTH_START':
			return { ...state, isLoading: true, error: null };

		case 'AUTH_SUCCESS':
			return {
				...state,
				user: action.payload.user,
				isAuthenticated: true,
				isLoading: false,
				error: null,
			};

		case 'AUTH_FAILURE':
			return {
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: action.payload,
			};

		case 'AUTH_LOGOUT':
			return {
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: null,
			};

		case 'CLEAR_ERROR':
			return { ...state, error: null };

		default:
			return state;
	}
};

// Context interface
interface AuthContextType extends AuthState {
	login: (credentials: LoginCredentials) => Promise<void>;
	register: (credentials: RegisterCredentials) => Promise<void>;
	logout: () => void;
	clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	// Check for existing auth on mount
	useEffect(() => {
		const token = getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
		const userStr = getStorageItem(CONFIG.STORAGE.USER_KEY);

		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);
				dispatch({
					type: 'AUTH_SUCCESS',
					payload: { user, token, refreshToken: '' }, // We don't store refresh token in state
				});
			} catch (error) {
				// Invalid stored data, clear it
				removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
				removeStorageItem(CONFIG.STORAGE.USER_KEY);
			}
		}
	}, []);

	// Login function
	const login = async (credentials: LoginCredentials): Promise<void> => {
		dispatch({ type: 'AUTH_START' });

		try {
			const response = await apiService.post<{
				user: User;
				accessToken: string;
				refreshToken: string;
			}>('/api/auth/login', credentials);

			const { user, accessToken, refreshToken } = response;

			// Store tokens and user data
			setStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY, accessToken);
			setStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY, refreshToken);
			setStorageItem(CONFIG.STORAGE.USER_KEY, JSON.stringify(user));

			dispatch({
				type: 'AUTH_SUCCESS',
				payload: { user, token: accessToken, refreshToken },
			});
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || 'Login failed';
			dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
			throw error;
		}
	};

	// Register function
	const register = async (credentials: RegisterCredentials): Promise<void> => {
		dispatch({ type: 'AUTH_START' });

		try {
			const response = await apiService.post<{
				user: User;
				accessToken: string;
				refreshToken: string;
			}>('/api/auth/register', credentials);

			const { user, accessToken, refreshToken } = response;

			// Store tokens and user data
			setStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY, accessToken);
			setStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY, refreshToken);
			setStorageItem(CONFIG.STORAGE.USER_KEY, JSON.stringify(user));

			dispatch({
				type: 'AUTH_SUCCESS',
				payload: { user, token: accessToken, refreshToken },
			});
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || 'Registration failed';
			dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
			throw error;
		}
	};

	// Logout function
	const logout = (): void => {
		// Clear stored data
		removeStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
		removeStorageItem(CONFIG.STORAGE.REFRESH_TOKEN_KEY);
		removeStorageItem(CONFIG.STORAGE.USER_KEY);

		dispatch({ type: 'AUTH_LOGOUT' });
	};

	// Clear error function
	const clearError = (): void => {
		dispatch({ type: 'CLEAR_ERROR' });
	};

	const value: AuthContextType = {
		...state,
		login,
		register,
		logout,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
