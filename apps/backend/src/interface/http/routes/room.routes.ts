import { Router } from 'express';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IRoomService } from '../../../domain/services/iroom.service';
import { RoomController } from '../controllers/room.controller';

export function createRoomRoutes(
	roomService: IRoomService,
	loggingService: ILoggingService,
): Router {
	const router = Router();
	const roomController = new RoomController(roomService, loggingService);

	// Room Management Routes
	router.post('/create', roomController.createRoom.bind(roomController));

	// Room Query Routes
	router.get('/public', roomController.getPublicRooms.bind(roomController));
	router.get('/:roomCode', roomController.getRoomByCode.bind(roomController));

	return router;
}
