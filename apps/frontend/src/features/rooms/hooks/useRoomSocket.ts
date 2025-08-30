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
	isJoined: boolean;
	users: RoomUser[];
	messages: RoomMessage[];
	mediaQueue: any[];
	error: string | null;
	connect: () => void;
	disconnect: () => void;
	sendMessage: (content: string) => void;
	leaveRoom: () => void;
	// Media queue methods
	addToQueue: (media: any, position: 'top' | 'end') => void;
	removeFromQueue: (queueItemId: string) => void;
	reorderQueue: (queueItemId: string, newPosition: number) => void;
	clearQueue: () => void;
	// Media sync methods
	mediaPlay: (roomCode: string, currentTime: number) => void;
	mediaPause: (roomCode: string, currentTime: number) => void;
	mediaSeek: (roomCode: string, currentTime: number) => void;
}

export const useRoomSocket = (roomCode: string): UseRoomSocketReturn => {
	const { user, token, refreshToken } = useAuth();
	const [isConnected, setIsConnected] = useState(false);
	const [isJoined, setIsJoined] = useState(false);
	const [users, setUsers] = useState<RoomUser[]>([]);
	const [messages, setMessages] = useState<RoomMessage[]>([]);
	const [mediaQueue, setMediaQueue] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const tokenCheckIntervalRef = useRef<number | null>(null);

	// Check token expiration and refresh if needed
	const checkAndRefreshToken = useCallback(async () => {
		if (!token) return;

		try {
			const tokenPayload = JSON.parse(atob(token.split('.')[1]));
			const timeUntilExpiry = tokenPayload.exp * 1000 - Date.now();

			// Refresh if token expires in less than 2 minutes
			if (timeUntilExpiry < 2 * 60 * 1000) {
				console.log('Token expiring soon, refreshing...');
				try {
					await refreshToken();
				} catch (error) {
					console.error('Proactive token refresh failed:', error);
					// If refresh fails, we'll handle it on the next connection attempt
				}
			}
		} catch (error) {
			console.error('Failed to check token expiration:', error);
		}
	}, [token, refreshToken]);

	// Set up token expiration check interval
	useEffect(() => {
		if (isConnected && token) {
			// Check every minute
			tokenCheckIntervalRef.current = setInterval(checkAndRefreshToken, 60 * 1000);
		}

		return () => {
			if (tokenCheckIntervalRef.current) {
				clearInterval(tokenCheckIntervalRef.current);
				tokenCheckIntervalRef.current = null;
			}
		};
	}, [isConnected, token, checkAndRefreshToken]);

	// Connect to socket
	const connect = useCallback(async () => {
		// Prevent multiple simultaneous connections
		if (socketRef.current) {
			console.log('useRoomSocket connect: socket already exists');
			return;
		}

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

		// Check if token is expired and refresh if needed
		if (currentToken) {
			try {
				const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
				const isExpired = tokenPayload.exp * 1000 < Date.now();

				if (isExpired) {
					console.log('useRoomSocket connect: token expired, refreshing...');
					try {
						currentToken = await refreshToken();
					} catch (error) {
						console.error('useRoomSocket connect: token refresh failed:', error);
						setError('Authentication failed - please login again');
						return;
					}
				}
			} catch (parseError) {
				console.error('useRoomSocket connect: failed to parse token:', parseError);
				setError('Invalid token format');
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

				// Join the room only after the socket is connected
				socket.emit('room:join', {
					roomCode,
					userId: user?.id,
				});
			});

			socket.on('disconnect', () => {
				console.log('Socket disconnected');
				setIsConnected(false);
				setIsJoined(false);
			});

			socket.on('connect_error', async (error) => {
				console.error('Socket connection error:', error);

				// If it's an auth error, try to refresh the token
				if (
					error.message.includes('jwt expired') ||
					error.message.includes('Invalid or expired token')
				) {
					console.log('Auth error detected, attempting token refresh...');
					try {
						const newToken = await refreshToken();
						if (newToken) {
							console.log('Token refreshed, reconnecting...');
							// Disconnect current socket and reconnect with new token
							socket.disconnect();
							socketRef.current = null;
							// Small delay to prevent rapid reconnection
							setTimeout(() => {
								connect().catch(console.error);
							}, 1000);
							return;
						}
					} catch (refreshError) {
						console.error('Token refresh failed during connection error:', refreshError);
						setError('Authentication failed - please login again');
						setIsConnected(false);
						return;
					}
				}

				if (error.message.includes('Connection limit exceeded')) {
					setError('Too many connection attempts. Please wait a moment and try again.');
				} else {
					setError(`Failed to connect to room: ${error.message}`);
				}
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
				setMediaQueue(data.mediaQueue || []);
				setIsJoined(true);
				setError(null);
			});

			socket.on('room:join:error', (data: any) => {
				console.error('Room join error:', data);
				setIsJoined(false);
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

			socket.on('room:message:error', (data: any) => {
				console.error('Message error:', data);
				setError(data.error || 'Failed to send message');
			});

			socket.on('room:leave:success', (data: any) => {
				console.log('Room leave success:', data);
				setIsConnected(false);
				setIsJoined(false);
				setUsers([]);
				setMessages([]);
				setMediaQueue([]);
			});

			socket.on('room:destroyed', (data: any) => {
				console.log('Room destroyed:', data);
				setError('Room has been destroyed');
				setIsConnected(false);
				setIsJoined(false);
				setUsers([]);
				setMessages([]);
				setMediaQueue([]);
			});

			// Media queue events
			socket.on('queue-updated', (data: any) => {
				console.log('Queue updated:', data);
				setMediaQueue(data.queue || []);
			});

			// Media sync events
			socket.on('media-play', (data: any) => {
				console.log('Media play event received:', data);
				// Dispatch custom event for the RoomPage component
				window.dispatchEvent(new CustomEvent('media-play', { detail: data }));
			});

			socket.on('media-pause', (data: any) => {
				console.log('Media pause event received:', data);
				// Dispatch custom event for the RoomPage component
				window.dispatchEvent(new CustomEvent('media-pause', { detail: data }));
			});

			socket.on('media-seek', (data: any) => {
				console.log('Media seek event received:', data);
				// Dispatch custom event for the RoomPage component
				window.dispatchEvent(new CustomEvent('media-seek', { detail: data }));
			});
		} catch (error) {
			console.error('Failed to connect to socket:', error);
			setError('Failed to connect to room');
		}
	}, [token, roomCode, user?.id, refreshToken]);

	// Disconnect from socket
	const disconnect = useCallback(() => {
		if (socketRef.current) {
			console.log('useRoomSocket disconnect: disconnecting socket');
			socketRef.current.disconnect();
			socketRef.current = null;
		}

		// Clear token check interval
		if (tokenCheckIntervalRef.current) {
			clearInterval(tokenCheckIntervalRef.current);
			tokenCheckIntervalRef.current = null;
		}

		setIsConnected(false);
		setIsJoined(false);
		setUsers([]);
		setMessages([]);
		setMediaQueue([]);
		setError(null);
	}, []);

	// Send a message
	const sendMessage = useCallback(
		(content: string) => {
			if (!socketRef.current || !isConnected || !isJoined) {
				setError('Not in a room');
				return;
			}

			socketRef.current.emit('room:message', { content });
		},
		[isConnected, isJoined],
	);

	// Leave the room
	const leaveRoom = useCallback(() => {
		if (!socketRef.current || !isConnected) {
			return;
		}

		socketRef.current.emit('room:leave', { roomCode });
	}, [roomCode, isConnected]);

	// Media queue methods
	const addToQueue = useCallback(
		(media: any, position: 'top' | 'end') => {
			if (!socketRef.current || !isConnected || !isJoined) {
				setError('Not in a room');
				return;
			}

			socketRef.current.emit('add-to-queue', {
				roomCode,
				media,
				position,
			});
		},
		[roomCode, isConnected, isJoined],
	);

	const removeFromQueue = useCallback(
		(queueItemId: string) => {
			if (!socketRef.current || !isConnected || !isJoined) {
				setError('Not in a room');
				return;
			}

			socketRef.current.emit('remove-from-queue', {
				roomCode,
				queueItemId,
			});
		},
		[roomCode, isConnected, isJoined],
	);

	const reorderQueue = useCallback(
		(queueItemId: string, newPosition: number) => {
			if (!socketRef.current || !isConnected || !isJoined) {
				setError('Not in a room');
				return;
			}

			socketRef.current.emit('reorder-queue', {
				roomCode,
				queueItemId,
				newPosition,
			});
		},
		[roomCode, isConnected, isJoined],
	);

	const clearQueue = useCallback(() => {
		if (!socketRef.current || !isConnected || !isJoined) {
			setError('Not in a room');
			return;
		}

		socketRef.current.emit('clear-queue', {
			roomCode,
		});
	}, [roomCode, isConnected, isJoined]);

	// Media sync methods
	const mediaPlay = useCallback(
		(roomCode: string, currentTime: number) => {
			console.log('mediaPlay called:', { roomCode, currentTime, isConnected, isJoined });
			if (!socketRef.current || !isConnected || !isJoined) {
				console.log('mediaPlay: conditions not met, returning early');
				setError('Not in a room');
				return;
			}

			console.log('mediaPlay: emitting socket event');
			socketRef.current.emit('media-play', { roomCode, currentTime });
		},
		[isConnected, isJoined],
	);

	const mediaPause = useCallback(
		(roomCode: string, currentTime: number) => {
			console.log('mediaPause called:', { roomCode, currentTime, isConnected, isJoined });
			if (!socketRef.current || !isConnected || !isJoined) {
				console.log('mediaPause: conditions not met, returning early');
				setError('Not in a room');
				return;
			}

			console.log('mediaPause: emitting socket event');
			socketRef.current.emit('media-pause', { roomCode, currentTime });
		},
		[isConnected, isJoined],
	);

	const mediaSeek = useCallback(
		(roomCode: string, currentTime: number) => {
			console.log('mediaSeek called:', { roomCode, currentTime, isConnected, isJoined });
			if (!socketRef.current || !isConnected || !isJoined) {
				console.log('mediaSeek: conditions not met, returning early');
				setError('Not in a room');
				return;
			}

			console.log('mediaSeek: emitting socket event');
			socketRef.current.emit('media-seek', { roomCode, currentTime });
		},
		[isConnected, isJoined],
	);

	// Connect on mount
	useEffect(() => {
		console.log('useRoomSocket useEffect:', { roomCode, user: !!user });

		// Only connect if no socket exists
		if (!socketRef.current) {
			connect().catch(console.error);
		}

		// Cleanup on unmount
		return () => {
			// Always disconnect and clear ref on unmount
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}

			// Clear token check interval
			if (tokenCheckIntervalRef.current) {
				clearInterval(tokenCheckIntervalRef.current);
				tokenCheckIntervalRef.current = null;
			}

			setIsConnected(false);
			setIsJoined(false);
		};
	}, [roomCode, user]);

	// Handle token refresh separately
	useEffect(() => {
		if (socketRef.current && token) {
			console.log('Token updated, reconnecting...');
			disconnect();
			// Small delay to prevent rapid reconnection
			setTimeout(() => {
				connect().catch(console.error);
			}, 1000);
		}
	}, [token]);

	return {
		isConnected,
		isJoined,
		users,
		messages,
		mediaQueue,
		error,
		connect,
		disconnect,
		sendMessage,
		leaveRoom,
		addToQueue,
		removeFromQueue,
		reorderQueue,
		clearQueue,
		mediaPlay,
		mediaPause,
		mediaSeek,
	};
};
