import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../providers/ToastProvider';
import { useUserFlow } from './userFlow';

export interface RoomCreationOptions {
	roomName?: string;
	isPrivate?: boolean;
	maxParticipants?: number;
}

export interface JoinRoomOptions {
	roomCode: string;
	password?: string;
}

export const useRoomManagement = () => {
	const [isCreating, setIsCreating] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const navigate = useNavigate();
	const toast = useToast();
	const { handleCreateRoom, handleJoinRoom, isAuthenticated } = useUserFlow();

	/**
	 * Create a new room
	 * @param options - Room creation options
	 */
	const createRoom = async () => {
		if (!isAuthenticated) {
			handleCreateRoom();
			return;
		}

		setIsCreating(true);
		try {
			// Generate a random room code
			const roomCode = generateRoomCode();

			// In a real implementation, this would call the backend API
			// For now, we'll simulate the room creation
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast.success('Room created successfully!');

			// Navigate to the new room
			navigate(`/room/${roomCode}`);
		} catch (error) {
			toast.error('Failed to create room. Please try again.');
			throw error;
		} finally {
			setIsCreating(false);
		}
	};

	/**
	 * Join an existing room
	 * @param options - Join room options
	 */
	const joinRoom = async (options: JoinRoomOptions) => {
		if (!isAuthenticated) {
			handleJoinRoom(options.roomCode);
			return;
		}

		setIsJoining(true);
		try {
			// In a real implementation, this would call the backend API
			// to validate the room code and password
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast.success('Joining room...');

			// Navigate to the room
			navigate(`/room/${options.roomCode}`);
		} catch (error) {
			toast.error('Failed to join room. Please check the room code.');
			throw error;
		} finally {
			setIsJoining(false);
		}
	};

	/**
	 * Generate a random room code
	 */
	const generateRoomCode = (): string => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < 6; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	/**
	 * Validate room code format
	 */
	const validateRoomCode = (roomCode: string): boolean => {
		return /^[A-Z0-9]{6}$/.test(roomCode);
	};

	/**
	 * Get room URL for sharing
	 */
	const getRoomUrl = (roomCode: string): string => {
		return `${window.location.origin}/room/${roomCode}`;
	};

	/**
	 * Copy room URL to clipboard
	 */
	const copyRoomUrl = async (roomCode: string): Promise<void> => {
		try {
			const url = getRoomUrl(roomCode);
			await navigator.clipboard.writeText(url);
			toast.success('Room URL copied to clipboard!');
		} catch (error) {
			toast.error('Failed to copy room URL');
		}
	};

	return {
		createRoom,
		joinRoom,
		generateRoomCode,
		validateRoomCode,
		getRoomUrl,
		copyRoomUrl,
		isCreating,
		isJoining,
		isAuthenticated,
	};
};
