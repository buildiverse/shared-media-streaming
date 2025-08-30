import { useCallback, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { PublicRoom, RoomService } from '../services/room.service';

export const useRooms = () => {
	const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { user } = useAuth();
	const roomService = new RoomService();

	const createRoom = useCallback(
		async (
			isPrivate: boolean,
		): Promise<{ success: boolean; roomCode?: string; error?: string }> => {
			if (!user) {
				return { success: false, error: 'User not authenticated' };
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await roomService.createRoom({ isPrivate });

				if (response.success && response.room) {
					return {
						success: true,
						roomCode: response.room.roomCode,
					};
				} else {
					return {
						success: false,
						error: response.error || 'Failed to create room',
					};
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
				setError(errorMessage);
				return { success: false, error: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[user],
	);

	const fetchPublicRooms = useCallback(async (limit: number = 20, offset: number = 0) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await roomService.getPublicRooms(limit, offset);

			if (response.success && response.rooms) {
				setPublicRooms(response.rooms);
			} else {
				setError(response.error || 'Failed to fetch public rooms');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch public rooms';
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		publicRooms,
		isLoading,
		error,
		createRoom,
		fetchPublicRooms,
		clearError,
	};
};
