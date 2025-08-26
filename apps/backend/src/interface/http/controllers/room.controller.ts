import { Request, Response } from 'express';
import { CreateRoomUseCase } from '../../../application/use-cases/create-room.usecase';
import { GetPublicRoomsUseCase } from '../../../application/use-cases/get-public-rooms.usecase';
import { Room } from '../../../domain/entities/room.entity';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import {
	createRoomSchema,
	getPublicRoomsSchema,
	getRoomByCodeSchema,
} from '../validators/room.validation';

export class RoomController {
	constructor(
		private createRoomUseCase: CreateRoomUseCase,
		private getPublicRoomsUseCase: GetPublicRoomsUseCase,
		private loggingService: ILoggingService,
	) {}

	async createRoom(req: Request, res: Response): Promise<void> {
		try {
			// Validate request body
			const validation = createRoomSchema.safeParse(req.body);
			if (!validation.success) {
				this.loggingService.warn('Invalid room creation request', {
					errors: validation.error.issues,
					body: req.body,
					userId: req.user?.userId,
				});

				res.status(400).json({
					success: false,
					error: 'Invalid request data',
					details: validation.error.issues,
				});
				return;
			}

			const { isPrivate } = validation.data;
			const userId = req.user?.userId;

			if (!userId) {
				res.status(401).json({
					success: false,
					error: 'User not authenticated',
				});
				return;
			}

			// Execute use case
			const result = await this.createRoomUseCase.execute({
				isPrivate,
				createdBy: userId,
			});

			if (result.success && result.room) {
				this.loggingService.info('Room created via HTTP', {
					roomId: result.room.id,
					roomCode: result.room.roomCode,
					userId,
					isPrivate,
				});

				res.status(201).json({
					success: true,
					room: result.room.toJSON(),
				});
			} else {
				res.status(500).json({
					success: false,
					error: result.error || 'Failed to create room',
				});
			}
		} catch (error) {
			this.loggingService.error('Unexpected error in createRoom', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: req.user?.userId,
			});

			res.status(500).json({
				success: false,
				error: 'Internal server error',
			});
		}
	}

	async getPublicRooms(req: Request, res: Response): Promise<void> {
		try {
			// Validate query parameters
			const validation = getPublicRoomsSchema.safeParse(req.query);
			if (!validation.success) {
				this.loggingService.warn('Invalid get public rooms request', {
					errors: validation.error.issues,
					query: req.query,
				});

				res.status(400).json({
					success: false,
					error: 'Invalid query parameters',
					details: validation.error.issues,
				});
				return;
			}

			const { limit, offset } = validation.data;

			// Execute use case
			const result = await this.getPublicRoomsUseCase.execute({ limit, offset });

			if (result.success && result.rooms) {
				res.status(200).json({
					success: true,
					rooms: result.rooms.map((room: Room) => room.toJSON()),
					pagination: {
						limit,
						offset,
						total: result.total,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: result.error || 'Failed to fetch public rooms',
				});
			}
		} catch (error) {
			this.loggingService.error('Unexpected error in getPublicRooms', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			res.status(500).json({
				success: false,
				error: 'Internal server error',
			});
		}
	}

	async getRoomByCode(req: Request, res: Response): Promise<void> {
		try {
			// Validate path parameters
			const validation = getRoomByCodeSchema.safeParse(req.params);
			if (!validation.success) {
				this.loggingService.error('Invalid get room by code request', {
					errors: validation.error.issues,
					params: req.params,
				});

				res.status(400).json({
					success: false,
					error: 'Invalid room code',
					details: validation.error.issues,
				});
				return;
			}

			// TODO: Implement get room by code use case
			// const { roomCode } = validation.data; // Will be used when implementing
			res.status(501).json({
				success: false,
				error: 'Not implemented yet',
			});
		} catch (error) {
			this.loggingService.error('Unexpected error in getRoomByCode', {
				error: error instanceof Error ? error.message : 'Unknown error',
				roomCode: req.params.roomCode,
			});

			res.status(500).json({
				success: false,
				error: 'Internal server error',
			});
		}
	}
}
