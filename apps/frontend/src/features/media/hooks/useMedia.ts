// useMedia Hook

import { useState } from 'react';
import { useToast } from '../../../providers/ToastProvider';
import { ApiService } from '../../../services/api';
import { Media } from '../../../types';

export const useMedia = () => {
	const [media, setMedia] = useState<Media[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const toast = useToast();

	const apiService = new ApiService();

	// Fetch all media
	const fetchMedia = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiService.get<{ success: boolean; media: Media[]; pagination: any }>(
				'/api/v1/media/my-media',
			);
			setMedia(response.media); // Extract the media array from the response
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch media');
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch user's media
	const fetchUserMedia = async (_userId: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiService.get<{ success: boolean; media: Media[]; pagination: any }>(
				`/api/v1/media/my-media`,
			);
			setMedia(response.media); // Extract the media array from the response
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch user media');
		} finally {
			setIsLoading(false);
		}
	};

	// Upload media
	const uploadMedia = async (file: File, title: string) => {
		setUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('media', file);
			formData.append('title', title);

			const response = await apiService.post<Media>('/api/v1/media/upload', formData);

			// Add new media to the list
			setMedia((prev) => [response, ...prev]);

			// Show success toast
			toast.success('Media uploaded successfully!');

			return response;
		} catch (err: any) {
			// Handle specific error cases
			if (err.response?.status === 401) {
				const errorMessage = 'Authentication expired. Please log in again.';
				setError(errorMessage);
				toast.error(errorMessage);
				// Don't throw here - let the component handle the auth state
				return null;
			} else if (err.response?.status === 413) {
				// Treat 413 as storage capacity issue in our UX, prompt upgrade
				const errorMessage = 'Upload exceeds plan storage limits.';
				setError(errorMessage);
				toast.storageExceededWithCountdown(errorMessage, {
					action: {
						label: 'View Plans',
						onClick: () => {
							window.location.href = '/calculator';
						},
					},
					duration: 7000,
				});
			} else if (err.response?.status === 429) {
				const errorMessage = 'Too many requests. Please wait a moment and try again.';
				setError(errorMessage);
				toast.error(errorMessage);
			} else if (
				err.response?.status === 400 &&
				err.response?.data?.message?.includes('Storage limit exceeded')
			) {
				// Handle storage limit exceeded error
				const errorMessage = 'Upload exceeds plan storage limits.';
				setError(errorMessage);
				toast.storageExceededWithCountdown(errorMessage, {
					action: {
						label: 'View Plans',
						onClick: () => {
							window.location.href = '/calculator';
						},
					},
					duration: 7000,
				});
			} else {
				const errorMessage = err.response?.data?.message || 'Failed to upload media';
				setError(errorMessage);
				toast.error(errorMessage);
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
