import { Socket } from 'socket.io';
import { SocketRoomController } from '../controllers/room.controller';
import { emitValidationError } from '../middlewares/error-handler.middleware';
import { joinRoomSchema, leaveRoomSchema } from '../validators/room.validation';

export const createSocketRoomRoutes = (roomController: SocketRoomController) => {
	return (socket: Socket) => {
		// Room management events
		socket.on('room:join', async (data: any) => {
			const validation = joinRoomSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'room:join', validation.error.issues);
				return;
			}
			await roomController.handleJoinRoom(socket, validation.data);
		});

		socket.on('room:leave', async (data: any) => {
			const validation = leaveRoomSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'room:leave', validation.error.issues);
				return;
			}
			await roomController.handleLeaveRoom(socket, validation.data);
		});

		// Chat events
		socket.on('room:message', async (data: any) => {
			await roomController.handleChatMessage(socket, data);
		});

		// Handle socket disconnection
		socket.on('disconnect', async () => {
			const roomCode = (socket as any).roomCode;
			const userId = (socket as any).userId;

			if (roomCode && userId) {
				// User disconnected, treat as leaving room
				await roomController.handleLeaveRoom(socket, {
					roomCode,
					userId,
				});
			}
		});
	};
};
