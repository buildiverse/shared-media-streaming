// useMedia Hook

import { useState } from 'react';
import { ApiService } from '../../../services/api';
import { Media } from '../../../types';

export const useMedia = () => {
	const [media, setMedia] = useState<Media[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const apiService = new ApiService();

	// Fetch all media
	const fetchMedia = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiService.get<Media[]>('/api/v1/media/my-media');
			setMedia(response);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch media');
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch user's media
	const fetchUserMedia = async (userId: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiService.get<Media[]>(`/api/v1/media/my-media`);
			setMedia(response);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch user media');
		} finally {
			setIsLoading(false);
		}
	};

	// Upload media
	const uploadMedia = async (file: File, title: string, description?: string) => {
		setUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('media', file);
			formData.append('title', title);
			if (description) {
				formData.append('description', description);
			}

			const response = await apiService.post<Media>('/api/v1/media/upload', formData);

			// Add new media to the list
			setMedia((prev) => [response, ...prev]);

			return response;
		} catch (err: any) {
			// Handle specific error cases
			if (err.response?.status === 401) {
				const errorMessage = 'Authentication expired. Please log in again.';
				setError(errorMessage);
				// Don't throw here - let the component handle the auth state
				return null;
			} else if (err.response?.status === 413) {
				const errorMessage = 'File too large. Please choose a smaller file.';
				setError(errorMessage);
			} else if (err.response?.status === 429) {
				const errorMessage = 'Too many requests. Please wait a moment and try again.';
				setError(errorMessage);
			} else {
				const errorMessage = err.response?.data?.message || 'Failed to upload media';
				setError(errorMessage);
			}

			// Don't throw for upload errors - just return null
			return null;
		} finally {
			setUploading(false);
		}
	};

	// Delete media
	const deleteMedia = async (mediaId: string) => {
		try {
			await apiService.delete(`/api/v1/media/${mediaId}`);

			// Remove media from the list
			setMedia((prev) => prev.filter((item) => item.id !== mediaId));
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || 'Failed to delete media';
			setError(errorMessage);
			throw new Error(errorMessage);
		}
	};

	// Get media by ID
	const getMediaById = async (mediaId: string): Promise<Media | null> => {
		try {
			const response = await apiService.get<Media>(`/api/v1/media/${mediaId}`);
			return response;
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch media');
			return null;
		}
	};

	// Clear error
	const clearError = () => {
		setError(null);
	};

	return {
		media,
		isLoading,
		uploading,
		error,
		fetchMedia,
		fetchUserMedia,
		uploadMedia,
		deleteMedia,
		getMediaById,
		clearError,
	};
};
