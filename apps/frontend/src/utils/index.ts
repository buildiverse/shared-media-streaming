// Utility functions

import { CONFIG } from '../config';

// Validation utilities
export const validateUsername = (username: string): boolean => {
	return (
		username.length >= CONFIG.VALIDATION.USERNAME_MIN_LENGTH &&
		username.length <= CONFIG.VALIDATION.USERNAME_MAX_LENGTH
	);
};

export const validateEmail = (email: string): boolean => {
	return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
};

export const validatePassword = (password: string): boolean => {
	return password.length >= CONFIG.VALIDATION.PASSWORD_MIN_LENGTH;
};

// Formatting utilities
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string): string => {
	return new Date(dateString).toLocaleDateString();
};

// Storage utilities
export const getStorageItem = (key: string): string | null => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

export const setStorageItem = (key: string, value: string): void => {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Handle storage errors silently
	}
};

export const removeStorageItem = (key: string): void => {
	try {
		localStorage.removeItem(key);
	} catch {
		// Handle storage errors silently
	}
};

// API utilities
export const buildApiUrl = (endpoint: string): string => {
	return `${CONFIG.API.BASE_URL}${endpoint}`;
};

export const getAuthHeaders = (): Record<string, string> => {
	const token = getStorageItem(CONFIG.STORAGE.AUTH_TOKEN_KEY);
	return token ? { Authorization: `Bearer ${token}` } : {};
};

// Error handling
export const handleApiError = (error: any): string => {
	if (error.response?.data?.message) {
		return error.response.data.message;
	}
	if (error.message) {
		return error.message;
	}
	return 'An unexpected error occurred';
};
