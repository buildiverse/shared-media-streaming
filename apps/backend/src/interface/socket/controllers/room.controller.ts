import { JoinRoomUseCase } from '../../../application/use-cases/join-room.usecase';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IRoomStateService } from '../../../domain/services/iroom-state.service';
import { AuthenticatedSocket } from '../middlewares/auth.middleware';
import { joinRoomSchema, leaveRoomSchema } from '../validators/room.validation';

export class SocketRoomController {
	constructor(
		private joinRoomUseCase: JoinRoomUseCase,
		private roomStateService: IRoomStateService,
		private loggingService: ILoggingService,
	) {}

	async handleJoinRoom(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			// Validate input
			const validation = joinRoomSchema.safeParse(data);
			if (!validation.success) {
				this.loggingService.warn('Invalid join room request', {
					errors: validation.error.issues,
					socketId: socket.id,
					data,
				});

				socket.emit('room:join:error', {
					error: 'Invalid room data',
					details: validation.error.issues,
				});
				return;
			}

			const { roomCode, userId } = validation.data;

			// Validate room join using use case
			const joinResult = await this.joinRoomUseCase.execute({ roomCode, userId });
			if (!joinResult.success) {
				this.loggingService.warn('Room join validation failed', {
					roomCode,
					userId,
					socketId: socket.id,
					error: joinResult.error,
				});

				socket.emit('room:join:error', {
					error: joinResult.error || 'Failed to join room',
					roomCode,
				});
				return;
			}

			// Check if room state exists, create if not
			if (!this.roomStateService.roomExists(roomCode)) {
				// Create room state with first user as host
				this.roomStateService.createRoom(roomCode, {
					id: userId,
					username: socket.user?.username || 'Unknown',
					socketId: socket.id,
				});
			}

			// Add user to room state
			const roomUser = this.roomStateService.addUser(roomCode, {
				id: userId,
				username: socket.user?.username || 'Unknown',
				socketId: socket.id,
			});

			if (!roomUser) {
				socket.emit('room:join:error', {
					error: 'Failed to join room',
					roomCode,
				});
				return;
			}

			// Join the socket room
			socket.join(roomCode);

			// Store user info in socket data
			(socket as any).roomCode = roomCode;
			(socket as any).userId = userId;

			this.loggingService.info('User joined room via socket', {
				roomCode,
				userId,
				socketId: socket.id,
			});

			// Get current room state
			const users = this.roomStateService.getRoomUsers(roomCode);
			const messages = this.roomStateService.getRoomMessages(roomCode);

			// Notify client of successful join
			socket.emit('room:join:success', {
				roomCode,
				users: users.map((u) => ({
					id: u.id,
					username: u.username,
					isHost: u.isHost,
				})),
				messages: messages.map((m) => ({
					id: m.id,
					userId: m.userId,
					username: m.username,
					content: m.content,
					timestamp: m.timestamp,
				})),
			});

			// Notify other users in the room
			socket.to(roomCode).emit('room:user:joined', {
				userId,
				username: roomUser.username,
				roomCode,
			});

			// Send updated user list to all users in room (including the joiner)
			socket.broadcast.to(roomCode).emit('room:users:updated', {
				users: users.map((u) => ({
					id: u.id,
					username: u.username,
					isHost: u.isHost,
				})),
			});
			// Also emit to the joiner to ensure they get the update
			socket.emit('room:users:updated', {
				users: users.map((u) => ({
					id: u.id,
					username: u.username,
					isHost: u.isHost,
				})),
			});
		} catch (error) {
			this.loggingService.error('Failed to join room via socket', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
				data,
			});

			socket.emit('room:join:error', {
				error: 'Failed to join room. Please try again.',
			});
		}
	}

	async handleLeaveRoom(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			// Validate input
			const validation = leaveRoomSchema.safeParse(data);
			if (!validation.success) {
				this.loggingService.warn('Invalid leave room request', {
					errors: validation.error.issues,
					socketId: socket.id,
					data,
				});

				socket.emit('room:leave:error', {
					error: 'Invalid room data',
					details: validation.error.issues,
				});
				return;
			}

			const { roomCode, userId } = validation.data;
			const currentRoomCode = (socket as any).roomCode;

			// Check if user is actually in the room
			if (currentRoomCode !== roomCode) {
				this.loggingService.warn('User attempted to leave room they are not in', {
					roomCode,
					userId,
					currentRoomCode,
					socketId: socket.id,
				});

				socket.emit('room:leave:error', {
					error: 'You are not in this room',
					roomCode,
				});
				return;
			}

			// Remove user from room state
			const removedUser = this.roomStateService.removeUser(roomCode, socket.id);
			if (removedUser) {
				// Check if room was destroyed (became empty)
				const roomExists = this.roomStateService.roomExists(roomCode);

				if (!roomExists) {
					// Room was destroyed, notify all users
					socket.broadcast.to(roomCode).emit('room:destroyed', {
						roomCode,
						message: 'Room has been destroyed due to no participants',
					});
				} else {
					// Room still exists, notify other users
					socket.to(roomCode).emit('room:user:left', {
						userId,
						username: removedUser.username,
						roomCode,
					});

					// Send updated user list to remaining users
					const remainingUsers = this.roomStateService.getRoomUsers(roomCode);
					socket.broadcast.to(roomCode).emit('room:users:updated', {
						users: remainingUsers.map((u) => ({
							id: u.id,
							username: u.username,
							isHost: u.isHost,
						})),
					});
				}

				// Leave the socket room
				socket.leave(roomCode);

				// Clear socket data
				delete (socket as any).roomCode;
				delete (socket as any).userId;

				this.loggingService.info('User left room via socket', {
					roomCode,
					userId,
					username: removedUser.username,
					socketId: socket.id,
				});

				// Notify client of successful leave
				socket.emit('room:leave:success', {
					roomCode,
				});
			}
		} catch (error) {
			this.loggingService.error('Failed to leave room via socket', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
				data,
			});

			socket.emit('room:leave:error', {
				error: 'Failed to leave room. Please try again.',
			});
		}
	}

	async handleChatMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			const { content } = data;
			const roomCode = (socket as any).roomCode;
			const userId = (socket as any).userId;

			if (!roomCode || !userId) {
				socket.emit('room:message:error', {
					error: 'Not in a room',
				});
				return;
			}

			if (!content || typeof content !== 'string' || content.trim().length === 0) {
				socket.emit('room:message:error', {
					error: 'Invalid message content',
				});
				return;
			}

			// Get user info from room state
			const roomState = this.roomStateService.getRoomState(roomCode);
			if (!roomState) {
				socket.emit('room:message:error', {
					error: 'Room not found',
				});
				return;
			}

			const user = roomState.users.get(socket.id);
			if (!user) {
				socket.emit('room:message:error', {
					error: 'User not found in room',
				});
				return;
			}

			// Add message to room state
			const message = this.roomStateService.addMessage(roomCode, {
				userId: user.id,
				username: user.username,
				content: content.trim(),
			});

			if (message) {
				const payload = {
					id: message.id,
					userId: message.userId,
					username: message.username,
					content: message.content,
					timestamp: message.timestamp,
				};
				// Broadcast to others in room
				socket.to(roomCode).emit('room:message:received', payload);
				// Emit to sender as well for consistent UX
				socket.emit('room:message:received', payload);
			}
		} catch (error) {
			this.loggingService.error('Failed to handle chat message', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
				data,
			});

			socket.emit('room:message:error', {
				error: 'Failed to send message. Please try again.',
			});
		}
	}
}
