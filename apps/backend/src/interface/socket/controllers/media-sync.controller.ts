import { Socket } from 'socket.io';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IRoomStateService } from '../../../domain/services/iroom-state.service';
import { AuthenticatedSocket } from '../middlewares/auth.middleware';

export class MediaSyncController {
	constructor(
		private loggingService: ILoggingService,
		private roomStateService: IRoomStateService,
	) {}

	handleJoinRoom(socket: Socket, roomCode: string): void {
		// Room joining is now handled by SocketRoomController
		// This method just joins the socket to the room for media sync
		socket.join(roomCode);

		this.loggingService.info('Client joined media room for sync', {
			socketId: socket.id,
			roomCode,
			requestId: (socket.request as any).requestId,
		});
	}

	handleLeaveRoom(socket: Socket, roomCode: string): void {
		socket.leave(roomCode);
		this.loggingService.info('Client left media room', {
			socketId: socket.id,
			roomCode,
			requestId: (socket.request as any).requestId,
		});
	}

	handleMediaPlay(socket: Socket, data: { roomCode: string; currentTime: number }): void {
		socket.to(data.roomCode).emit('media-play', {
			...data,
			socketId: socket.id,
			timestamp: new Date(),
		});

		this.loggingService.info('Media play event broadcasted', {
			socketId: socket.id,
			roomCode: data.roomCode,
			currentTime: data.currentTime,
			requestId: (socket.request as any).requestId,
		});
	}

	handleMediaPause(socket: Socket, data: { roomCode: string; currentTime: number }): void {
		socket.to(data.roomCode).emit('media-pause', {
			...data,
			socketId: socket.id,
			timestamp: new Date(),
		});

		this.loggingService.info('Media pause event broadcasted', {
			socketId: socket.id,
			roomCode: data.roomCode,
			currentTime: data.currentTime,
			requestId: (socket.request as any).requestId,
		});
	}

	handleMediaSeek(socket: Socket, data: { roomCode: string; currentTime: number }): void {
		socket.to(data.roomCode).emit('media-seek', {
			...data,
			socketId: socket.id,
			timestamp: new Date(),
		});

		this.loggingService.info('Media seek event broadcasted', {
			socketId: socket.id,
			roomCode: data.roomCode,
			currentTime: data.currentTime,
			requestId: (socket.request as any).requestId,
		});
	}

	// Media queue methods
	handleAddToQueue(
		socket: AuthenticatedSocket,
		data: { roomCode: string; media: any; position: 'top' | 'end' },
	): void {
		console.log('handleAddToQueue called with:', { data, socketId: socket.id, user: socket.user });
		console.log('Socket rooms:', socket.rooms);
		console.log('Socket in room?', socket.in(data.roomCode));
		if (!socket.user) return;

		const queueItem = this.roomStateService.addToQueue(
			data.roomCode,
			{
				...data.media,
				addedBy: socket.user.userId,
			},
			data.position,
		);

		if (queueItem) {
			// Send updated queue to sender
			socket.emit('queue-updated', {
				queue: this.roomStateService.getMediaQueue(data.roomCode),
				addedItem: queueItem,
				addedBy: socket.user.username,
			});
			// Broadcast updated queue to other users in the room
			socket.to(data.roomCode).emit('queue-updated', {
				queue: this.roomStateService.getMediaQueue(data.roomCode),
				addedItem: queueItem,
				addedBy: socket.user.username,
			});

			this.loggingService.info('Media added to queue', {
				socketId: socket.id,
				roomCode: data.roomCode,
				mediaId: data.media.mediaId || data.media.id,
				position: data.position,
				requestId: (socket.request as any).requestId,
			});
		}
	}

	handleRemoveFromQueue(
		socket: AuthenticatedSocket,
		data: { roomCode: string; queueItemId: string },
	): void {
		if (!socket.user) return;

		const success = this.roomStateService.removeFromQueue(data.roomCode, data.queueItemId);

		if (success) {
			// Send updated queue to sender
			socket.emit('queue-updated', {
				queue: this.roomStateService.getMediaQueue(data.roomCode),
				removedItemId: data.queueItemId,
				removedBy: socket.user.username,
			});
			// Broadcast updated queue to other users in the room
			socket.to(data.roomCode).emit('queue-updated', {
				queue: this.roomStateService.getMediaQueue(data.roomCode),
				removedItemId: data.queueItemId,
				removedBy: socket.user.username,
			});

			this.loggingService.info('Media removed from queue', {
				socketId: socket.id,
				roomCode: data.roomCode,
				queueItemId: data.queueItemId,
				requestId: (socket.request as any).requestId,
			});
		}
	}

	handleReorderQueue(
		socket: AuthenticatedSocket,
		data: { roomCode: string; queueItemId: string; newPosition: number },
	): void {
		if (!socket.user) return;

		const success = this.roomStateService.reorderQueue(
			data.roomCode,
			data.queueItemId,
			data.newPosition,
		);

		if (success) {
			// Send updated queue to sender
			socket.emit('queue-updated', {
				queue: this.roomStateService.getMediaQueue(data.roomCode),
				reorderedItemId: data.queueItemId,
				newPosition: data.newPosition,
				reorderedBy: socket.user.username,
			});
			// Broadcast updated queue to other users in the room
			socket.to(data.roomCode).emit('queue-updated', {
				queue: this.roomStateService.getMediaQueue(data.roomCode),
				reorderedItemId: data.queueItemId,
				newPosition: data.newPosition,
				reorderedBy: socket.user.username,
			});

			this.loggingService.info('Queue reordered', {
				socketId: socket.id,
				roomCode: data.roomCode,
				queueItemId: data.queueItemId,
				newPosition: data.newPosition,
				requestId: (socket.request as any).requestId,
			});
		}
	}

	handleClearQueue(socket: AuthenticatedSocket, data: { roomCode: string }): void {
		if (!socket.user) return;

		const success = this.roomStateService.clearQueue(data.roomCode);

		if (success) {
			// Send updated queue to sender
			socket.emit('queue-updated', {
				queue: [],
				clearedBy: socket.user.username,
			});
			// Broadcast updated queue to other users in the room
			socket.to(data.roomCode).emit('queue-updated', {
				queue: [],
				clearedBy: socket.user.username,
			});

			this.loggingService.info('Queue cleared', {
				socketId: socket.id,
				roomCode: data.roomCode,
				requestId: (socket.request as any).requestId,
			});
		}
	}
}
