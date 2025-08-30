import { Router } from 'express';
import { IAuthService } from '../../../domain/services/iauth.service';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const createRoomRoutes = (
	roomController: RoomController,
	authService: IAuthService,
	loggingService: ILoggingService,
) => {
	const router = Router();

	// Public routes (no auth required)
	router.get('/public', (req, res) => {
		loggingService.info('Public rooms endpoint accessed', {
			ip: req.ip,
			userAgent: req.get('User-Agent'),
		});
		roomController.getPublicRooms(req, res);
	});

	// Protected routes (auth required)
	router.use(authMiddleware(authService));

	router.post('/create', (req, res) => {
		loggingService.info('Room creation endpoint accessed', {
			ip: req.ip,
			userAgent: req.get('User-Agent'),
			userId: req.user?.userId,
		});
		roomController.createRoom(req, res);
	});

	router.get('/:roomCode', (req, res) => {
		loggingService.info('Room access endpoint accessed', {
			ip: req.ip,
			userAgent: req.get('User-Agent'),
			userId: req.user?.userId,
			roomCode: req.params.roomCode,
		});
		roomController.getRoomByCode(req, res);
	});

	loggingService.info('Room routes setup complete');
	return router;
};
