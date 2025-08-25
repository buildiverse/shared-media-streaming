import { Socket } from 'socket.io';
import { JoinRoomUseCase } from '../../../application/use-cases/join-room.usecase';
import { ILoggingService } from '../../../domain/services/ilogging.service';

export class MediaSyncController {
	constructor(
		private loggingService: ILoggingService,
		private joinRoomUseCase: JoinRoomUseCase,
	) {}

	async handleJoinRoom(socket: Socket, roomId: string): Promise<void> {
		try {
			// Execute use case
			const result = await this.joinRoomUseCase.execute({
				roomId,
				userId: (socket as any).user?.userId || 'unknown',
				socketId: socket.id,
			});

			if (result.success) {
				socket.join(roomId);
				this.loggingService.info('Client joined media room', {
					socketId: socket.id,
					roomId,
					participantCount: result.participantCount,
					requestId: (socket.request as any).requestId,
				});
			}
		} catch (error) {
			this.loggingService.error('Failed to join room', error, {
				socketId: socket.id,
				roomId,
				requestId: (socket.request as any).requestId,
			});
			// Emit error to client
			socket.emit('error', {
				code: 'JOIN_ROOM_ERROR',
				message: 'Failed to join room',
				event: 'join-room',
			});
		}
	}

	handleLeaveRoom(socket: Socket, roomId: string): void {
		socket.leave(roomId);
		this.loggingService.info('Client left media room', {
			socketId: socket.id,
			roomId,
			requestId: (socket.request as any).requestId,
		});
	}

	handleMediaPlay(socket: Socket, data: { roomId: string; currentTime: number }): void {
		socket.to(data.roomId).emit('media-play', {
			...data,
			socketId: socket.id,
			timestamp: new Date(),
		});

		this.loggingService.info('Media play event broadcasted', {
			socketId: socket.id,
			roomId: data.roomId,
			currentTime: data.currentTime,
			requestId: (socket.request as any).requestId,
		});
	}

	handleMediaPause(socket: Socket, data: { roomId: string; currentTime: number }): void {
		socket.to(data.roomId).emit('media-pause', {
			...data,
			socketId: socket.id,
			timestamp: new Date(),
		});

		this.loggingService.info('Media pause event broadcasted', {
			socketId: socket.id,
			roomId: data.roomId,
			currentTime: data.currentTime,
			requestId: (socket.request as any).requestId,
		});
	}

	handleMediaSeek(socket: Socket, data: { roomId: string; currentTime: number }): void {
		socket.to(data.roomId).emit('media-seek', {
			...data,
			socketId: socket.id,
			timestamp: new Date(),
		});

		this.loggingService.info('Media seek event broadcasted', {
			socketId: socket.id,
			roomId: data.roomId,
			currentTime: data.currentTime,
			requestId: (socket.request as any).requestId,
		});
	}
}
