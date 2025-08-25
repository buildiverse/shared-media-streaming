import { Socket } from 'socket.io';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IRoomService } from '../../../domain/services/iroom.service';

export class RoomSocketController {
	constructor(
		private readonly roomService: IRoomService,
		private readonly loggingService: ILoggingService,
	) {}

	async handleJoinRoom(socket: Socket, roomCode: string): Promise<void> {
		try {
			const userId = socket.data.user?.userId;
			const username = socket.data.user?.username;

			if (!userId || !username) {
				socket.emit('error', { message: 'Authentication required' });
				return;
			}

			this.loggingService.info('Socket: User attempting to join room', {
				userId,
				username,
				roomCode,
				socketId: socket.id,
			});

			// Join the socket room
			socket.join(roomCode);

			// Get room information
			const roomResult = await this.roomService.getRoomByCode({ roomCode });

			if (!roomResult.success || !roomResult.room) {
				socket.emit('error', { message: 'Room not found' });
				socket.leave(roomCode);
				return;
			}

			const room = roomResult.room;

			// Check if room is full
			if (room.isFull) {
				socket.emit('error', { message: 'Room is at maximum capacity' });
				socket.leave(roomCode);
				return;
			}

			// Add user to room participants (this will be handled by the room service)
			const joinResult = await this.roomService.joinRoom({
				roomCode,
				userId,
				socketId: socket.id,
			});

			if (!joinResult.success) {
				socket.emit('error', { message: joinResult.error || 'Failed to join room' });
				socket.leave(roomCode);
				return;
			}

			// Store room info in socket data
			socket.data.currentRoom = {
				roomCode,
				roomId: room.id,
				userId,
				username,
			};

			// Emit success to the joining user
			socket.emit('room:joined', {
				success: true,
				room: {
					id: room.id,
					roomCode: room.roomCode,
					name: room.name,
					description: room.description,
					isPrivate: room.isPrivate,
					maxUsers: room.maxUsers,
					participantCount: room.participantCount,
				},
			});

			// Notify other users in the room
			socket.to(roomCode).emit('room:userJoined', {
				userId,
				username,
				participantCount: room.participantCount + 1,
			});

			this.loggingService.info('Socket: User successfully joined room', {
				userId,
				username,
				roomCode,
				roomId: room.id,
				socketId: socket.id,
			});
		} catch (error) {
			this.loggingService.error('Socket: Error joining room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				roomCode,
				socketId: socket.id,
				userId: socket.data.user?.userId,
			});

			socket.emit('error', { message: 'Failed to join room' });
			socket.leave(roomCode);
		}
	}

	async handleLeaveRoom(socket: Socket): Promise<void> {
		try {
			const roomData = socket.data.currentRoom;
			if (!roomData) {
				socket.emit('error', { message: 'Not currently in a room' });
				return;
			}

			const { roomCode, userId, username } = roomData;

			this.loggingService.info('Socket: User leaving room', {
				userId,
				username,
				roomCode,
				socketId: socket.id,
			});

			// Leave the socket room
			socket.leave(roomCode);

			// Remove user from room participants
			const leaveResult = await this.roomService.leaveRoom({
				roomCode,
				userId,
			});

			if (leaveResult.success) {
				// Get updated room info
				const roomResult = await this.roomService.getRoomByCode({ roomCode });
				if (roomResult.success && roomResult.room) {
					// Notify other users in the room
					socket.to(roomCode).emit('room:userLeft', {
						userId,
						username,
						participantCount: roomResult.room.participantCount,
					});
				}
			}

			// Clear room data from socket
			delete socket.data.currentRoom;

			// Emit success to the leaving user
			socket.emit('room:left', {
				success: true,
				message: 'Successfully left the room',
			});

			this.loggingService.info('Socket: User successfully left room', {
				userId,
				username,
				roomCode,
				socketId: socket.id,
			});
		} catch (error) {
			this.loggingService.error('Socket: Error leaving room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
				userId: socket.data.user?.userId,
			});

			socket.emit('error', { message: 'Failed to leave room' });
		}
	}

	async handleSendMessage(socket: Socket, message: string): Promise<void> {
		try {
			const roomData = socket.data.currentRoom;
			if (!roomData) {
				socket.emit('error', { message: 'Not currently in a room' });
				return;
			}

			const { roomCode, userId, username } = roomData;

			if (!message || typeof message !== 'string' || message.trim().length === 0) {
				socket.emit('error', { message: 'Message cannot be empty' });
				return;
			}

			const trimmedMessage = message.trim();

			this.loggingService.info('Socket: User sending message', {
				userId,
				username,
				roomCode,
				message: trimmedMessage,
				socketId: socket.id,
			});

			// Broadcast message to all users in the room (including sender)
			socket.to(roomData.roomCode).emit('room:message', {
				userId,
				username,
				message: trimmedMessage,
				timestamp: new Date().toISOString(),
				type: 'text',
			});

			// Confirm message sent to sender
			socket.emit('room:messageSent', {
				success: true,
				message: trimmedMessage,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			this.loggingService.error('Socket: Error sending message', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
				userId: socket.data.user?.userId,
			});

			socket.emit('error', { message: 'Failed to send message' });
		}
	}

	async handleDisconnect(socket: Socket): Promise<void> {
		try {
			const roomData = socket.data.currentRoom;
			if (roomData) {
				// User was in a room, handle cleanup
				await this.handleLeaveRoom(socket);
			}

			this.loggingService.info('Socket: User disconnected', {
				userId: socket.data.user?.userId,
				username: socket.data.user?.username,
				socketId: socket.id,
			});
		} catch (error) {
			this.loggingService.error('Socket: Error handling disconnect', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
				userId: socket.data.user?.userId,
			});
		}
	}
}
