import { Request, Response } from 'express';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IRoomService } from '../../../domain/services/iroom.service';

export class RoomController {
	constructor(
		private readonly roomService: IRoomService,
		private readonly loggingService: ILoggingService,
	) {}

	async createRoom(req: Request, res: Response): Promise<void> {
		try {
			const { name, description, isPrivate, maxUsers } = req.body;
			const userId = req.user?.userId; // From auth middleware

			if (!userId) {
				res.status(401).json({ error: 'Unauthorized' });
				return;
			}

			if (!name || typeof name !== 'string') {
				res.status(400).json({ error: 'Room name is required and must be a string' });
				return;
			}

			const result = await this.roomService.createRoom({
				name,
				description: description || '',
				createdBy: userId,
				isPrivate: Boolean(isPrivate),
				maxUsers: maxUsers || 10,
			});

			if (result.success) {
				res.status(201).json({
					success: true,
					room: {
						id: result.room.id,
						roomCode: result.room.roomCode,
						name: result.room.name,
						description: result.room.description,
						isPrivate: result.room.isPrivate,
						maxUsers: result.room.maxUsers,
						createdAt: result.room.createdAt,
					},
				});
			} else {
				res.status(400).json({
					success: false,
					error: result.error,
				});
			}
		} catch (error) {
			this.loggingService.error('RoomController: Error creating room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestBody: req.body,
			});

			res.status(500).json({
				success: false,
				error: 'Internal server error',
			});
		}
	}

	async getPublicRooms(req: Request, res: Response): Promise<void> {
		try {
			const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
			const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

			const result = await this.roomService.getPublicRooms({
				limit,
				offset,
			});

			if (result.success) {
				res.status(200).json({
					success: true,
					rooms: result.rooms.map((room) => ({
						id: room.id,
						roomCode: room.roomCode,
						name: room.name,
						description: room.description,
						participantCount: room.participantCount,
						maxUsers: room.maxUsers,
						createdAt: room.createdAt,
					})),
					totalCount: result.totalCount,
				});
			} else {
				res.status(400).json({
					success: false,
					error: result.error,
				});
			}
		} catch (error) {
			this.loggingService.error('RoomController: Error fetching public rooms', {
				error: error instanceof Error ? error.message : 'Unknown error',
				query: req.query,
			});

			res.status(500).json({
				success: false,
				error: 'Internal server error',
			});
		}
	}

	async getRoomByCode(req: Request, res: Response): Promise<void> {
		try {
			const { roomCode } = req.params;
			const userId = req.user?.userId; // From auth middleware

			if (!userId) {
				res.status(401).json({ error: 'Unauthorized' });
				return;
			}

			if (!roomCode || typeof roomCode !== 'string') {
				res.status(400).json({ error: 'Room code is required' });
				return;
			}

			const result = await this.roomService.getRoomByCode({
				roomCode,
			});

			if (result.success && result.room) {
				// Check if user is in the room
				const isUserInRoom = await this.roomService.isUserInRoom(roomCode, userId);
				const isUserHost = await this.roomService.isUserHost(roomCode, userId);

				res.status(200).json({
					success: true,
					room: {
						id: result.room.id,
						roomCode: result.room.roomCode,
						name: result.room.name,
						description: result.room.description,
						isPrivate: result.room.isPrivate,
						maxUsers: result.room.maxUsers,
						participantCount: result.room.participantCount,
						createdAt: result.room.createdAt,
					},
					userInfo: {
						isInRoom: isUserInRoom,
						isHost: isUserHost,
					},
				});
			} else {
				res.status(404).json({
					success: false,
					error: result.error || 'Room not found',
				});
			}
		} catch (error) {
			this.loggingService.error('RoomController: Error fetching room by code', {
				error: error instanceof Error ? error.message : 'Unknown error',
				params: req.params,
			});

			res.status(500).json({
				success: false,
				error: 'Internal server error',
			});
		}
	}
}
