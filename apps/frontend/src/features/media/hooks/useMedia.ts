// useMedia Hook

import { useEffect, useState } from 'react';
import { ApiService } from '../../../services/api';
import { Media } from '../../../types';

export const useMedia = () => {
	const [media, setMedia] = useState<Media[]>([]);
	const [isLoading, setIsLoading] = useState(false);
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
		setIsLoading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', title);
			if (description) {
				formData.append('description', description);
			}

			const response = await apiService.post<Media>('/api/v1/media/upload', formData);

			// Add new media to the list
			setMedia((prev) => [response, ...prev]);

			return response;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || 'Failed to upload media';
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
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

	// Initial fetch
	useEffect(() => {
		fetchMedia();
	}, []);

	return {
		media,
		isLoading,
		error,
		fetchMedia,
		fetchUserMedia,
		uploadMedia,
		deleteMedia,
		getMediaById,
		clearError,
	};
};
