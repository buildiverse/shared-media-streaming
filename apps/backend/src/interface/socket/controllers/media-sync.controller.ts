import { Socket } from 'socket.io';
import { ILoggingService } from '../../../domain/services/ilogging.service';

export class MediaSyncController {
	constructor(private loggingService: ILoggingService) {}

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
}
