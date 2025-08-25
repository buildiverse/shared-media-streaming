import { Socket } from 'socket.io';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IRoomService } from '../../../domain/services/iroom.service';
import { RoomSocketController } from '../controllers/room.socket.controller';

export function createRoomSocketRoutes(
	roomService: IRoomService,
	loggingService: ILoggingService,
): (socket: Socket) => void {
	const roomSocketController = new RoomSocketController(roomService, loggingService);

	return (socket: Socket) => {
		// Room Management Events
		socket.on('room:join', async (roomCode: string) => {
			await roomSocketController.handleJoinRoom(socket, roomCode);
		});

		socket.on('room:leave', async () => {
			await roomSocketController.handleLeaveRoom(socket);
		});

		// Chat Events
		socket.on('room:sendMessage', async (message: string) => {
			await roomSocketController.handleSendMessage(socket, message);
		});

		// Disconnect handling
		socket.on('disconnect', async () => {
			await roomSocketController.handleDisconnect(socket);
		});
	};
}
