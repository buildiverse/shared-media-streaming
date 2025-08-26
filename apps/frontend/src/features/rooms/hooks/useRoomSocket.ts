import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../auth/hooks/useAuth';

export interface RoomUser {
	id: string;
	username: string;
	isHost: boolean;
}

export interface RoomMessage {
	id: string;
	userId: string;
	username: string;
	content: string;
	timestamp: string | Date; // Can be string (from Socket.IO) or Date (local)
}

interface UseRoomSocketReturn {
	isConnected: boolean;
	users: RoomUser[];
	messages: RoomMessage[];
	error: string | null;
	connect: () => void;
	disconnect: () => void;
	sendMessage: (content: string) => void;
	leaveRoom: () => void;
}

export const useRoomSocket = (roomCode: string): UseRoomSocketReturn => {
	const { user, token, refreshToken } = useAuth();
	const [isConnected, setIsConnected] = useState(false);
	const [users, setUsers] = useState<RoomUser[]>([]);
	const [messages, setMessages] = useState<RoomMessage[]>([]);
	const [error, setError] = useState<string | null>(null);
	const socketRef = useRef<Socket | null>(null);

	// Connect to socket
	const connect = useCallback(async () => {
		if (!roomCode) {
			console.log('useRoomSocket connect: missing roomCode');
			return;
		}

		// Try to get a fresh token
		let currentToken = token;
		if (!currentToken) {
			console.log('useRoomSocket connect: no token, attempting refresh...');
			try {
				currentToken = await refreshToken();
			} catch (error) {
				console.error('useRoomSocket connect: token refresh failed:', error);
				setError('Authentication failed - please login again');
				return;
			}
		}

		if (!currentToken) {
			console.log('useRoomSocket connect: still no token after refresh');
			setError('Authentication failed - please login again');
			return;
		}

		try {
			const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
			console.log('useRoomSocket connect: starting connection to', backendUrl);

			// Create socket connection
			const socket = io(backendUrl, {
				auth: {
					// Send Bearer token to match HTTP convention; middleware strips it if present
					token: `Bearer ${currentToken}`,
				},
				transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
				timeout: 20000, // 20 second timeout
			});

			socketRef.current = socket;

			// Connection events
			socket.on('connect', () => {
				console.log('Socket connected');
				setIsConnected(true);
				setError(null);
			});

			socket.on('disconnect', () => {
				console.log('Socket disconnected');
				setIsConnected(false);
			});

			socket.on('connect_error', (error) => {
				console.error('Socket connection error:', error);
				setError(`Failed to connect to room: ${error.message}`);
				setIsConnected(false);
			});

			// Handle connection timeout
			socket.on('connect_timeout', () => {
				console.error('Socket connection timeout');
				setError('Connection timeout - server may be down');
				setIsConnected(false);
			});

			// Room events
			socket.on('room:join:success', (data: any) => {
				console.log('Room join success:', data);
				setUsers(data.users || []);
				setMessages(data.messages || []);
				setError(null);
			});

			socket.on('room:join:error', (data: any) => {
				console.error('Room join error:', data);
				setError(data.error || 'Failed to join room');
			});

			socket.on('room:users:updated', (data: any) => {
				console.log('Users updated:', data);
				setUsers(data.users || []);
			});

			socket.on('room:user:joined', (data: any) => {
				console.log('User joined:', data);
				// Users list will be updated via room:users:updated
			});

			socket.on('room:user:left', (data: any) => {
				console.log('User left:', data);
				// Users list will be updated via room:users:updated
			});

			socket.on('room:message:received', (message: RoomMessage) => {
				console.log('Message received:', message);
				setMessages((prev) => [...prev, message]);
			});

			// Remove local append on sender; rely on server broadcasting the same event to all
			// socket.on('room:message:sent', (message: RoomMessage) => {
			// 	console.log('Message sent:', message);
			// 	setMessages((prev) => [...prev, message]);
			// });

			socket.on('room:message:error', (data: any) => {
				console.error('Message error:', data);
				setError(data.error || 'Failed to send message');
			});

			socket.on('room:leave:success', (data: any) => {
				console.log('Room leave success:', data);
				setIsConnected(false);
				setUsers([]);
				setMessages([]);
			});

			socket.on('room:destroyed', (data: any) => {
				console.log('Room destroyed:', data);
				setError('Room has been destroyed');
				setIsConnected(false);
				setUsers([]);
				setMessages([]);
			});

			// Join the room
			socket.emit('room:join', {
				roomCode,
				userId: user?.id,
			});
		} catch (error) {
			console.error('Failed to connect to socket:', error);
			setError('Failed to connect to room');
		}
	}, [token, roomCode, user?.id]);

	// Disconnect from socket
	const disconnect = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}
		setIsConnected(false);
		setUsers([]);
		setMessages([]);
		setError(null);
	}, []);

	// Send a message
	const sendMessage = useCallback(
		(content: string) => {
			if (!socketRef.current || !isConnected) {
				setError('Not connected to room');
				return;
			}

			socketRef.current.emit('room:message', { content });
		},
		[isConnected],
	);

	// Leave the room
	const leaveRoom = useCallback(() => {
		if (!socketRef.current || !isConnected) {
			return;
		}

		socketRef.current.emit('room:leave', { roomCode });
	}, [roomCode, isConnected]);

	// Connect on mount
	useEffect(() => {
		console.log('useRoomSocket useEffect:', { roomCode, user: !!user });
		connect().catch(console.error);

		// Cleanup on unmount
		return () => {
			disconnect();
		};
	}, [roomCode, user, token, connect, disconnect]);

	return {
		isConnected,
		users,
		messages,
		error,
		connect,
		disconnect,
		sendMessage,
		leaveRoom,
	};
};
