// API service using Axios

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CONFIG, CONFIG as STORAGE_CONFIG } from '../config';
import { getAuthHeaders, removeStorageItem, setStorageItem } from '../utils';

class ApiService {
	private api: AxiosInstance;

	constructor() {
		this.api = axios.create({
			baseURL: CONFIG.API.BASE_URL,
			timeout: CONFIG.API.TIMEOUT,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.setupInterceptors();
	}

	private setupInterceptors(): void {
		// Request interceptor to add auth token
		this.api.interceptors.request.use(
			(config) => {
				const headers = getAuthHeaders();
				if (headers.Authorization) {
					config.headers.Authorization = headers.Authorization;
				}
				return config;
			},
			(error) => {
				return Promise.reject(error);
			},
		);

		// Response interceptor to handle token refresh
		this.api.interceptors.response.use(
			(response: AxiosResponse) => {
				return response;
			},
			async (error) => {
				const originalRequest = error.config;

				if (error.response?.status === 401 && !originalRequest._retry) {
					originalRequest._retry = true;
					console.log('ApiService: 401 error, attempting token refresh...');

					try {
						const refreshToken = localStorage.getItem(STORAGE_CONFIG.STORAGE.REFRESH_TOKEN_KEY);
						if (refreshToken) {
							const response = await this.api.post('/api/v1/auth/refresh-token', { refreshToken });
							const { accessToken } = response.data;

							setStorageItem(STORAGE_CONFIG.STORAGE.AUTH_TOKEN_KEY, accessToken);
							originalRequest.headers.Authorization = `Bearer ${accessToken}`;

							return this.api(originalRequest);
						} else {
							console.log('ApiService: No refresh token, clearing storage');
							// No refresh token, clear storage but don't redirect
							removeStorageItem(STORAGE_CONFIG.STORAGE.AUTH_TOKEN_KEY);
							removeStorageItem(STORAGE_CONFIG.STORAGE.REFRESH_TOKEN_KEY);
							removeStorageItem(STORAGE_CONFIG.STORAGE.USER_KEY);
						}
					} catch (refreshError) {
						console.error('ApiService: Token refresh failed:', refreshError);
						// Refresh failed, clear storage but don't redirect
						removeStorageItem(STORAGE_CONFIG.STORAGE.AUTH_TOKEN_KEY);
						removeStorageItem(STORAGE_CONFIG.STORAGE.REFRESH_TOKEN_KEY);
						removeStorageItem(STORAGE_CONFIG.STORAGE.USER_KEY);
					}
				}

				return Promise.reject(error);
			},
		);
	}

	// Generic request methods
	async get<T>(url: string, config = {}): Promise<T> {
		const response = await this.api.get<T>(url, config);
		return response.data;
	}

	async post<T>(url: string, data = {}, config = {}): Promise<T> {
		const response = await this.api.post<T>(url, data, config);
		return response.data;
	}

	async put<T>(url: string, data = {}, config = {}): Promise<T> {
		const response = await this.api.put<T>(url, data, config);
		return response.data;
	}

	async delete<T>(url: string, config = {}): Promise<T> {
		const response = await this.api.delete<T>(url, config);
		return response.data;
	}

	// File upload method
	async uploadFile<T>(
		url: string,
		file: File,
		onProgress?: (progress: number) => void,
	): Promise<T> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await this.api.post<T>(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			onUploadProgress: (progressEvent) => {
				if (onProgress && progressEvent.total) {
					const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(progress);
				}
			},
		});

		return response.data;
	}
}

export { ApiService };
export const apiService = new ApiService();
export default apiService;
