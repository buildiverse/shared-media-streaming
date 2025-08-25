import { CreateRoomUseCase } from '../../application/use-cases/create-room.usecase';
import { GetPublicRoomsUseCase } from '../../application/use-cases/get-public-rooms.usecase';
import { JoinRoomUseCase } from '../../application/use-cases/join-room.usecase';
import { Room } from '../../domain/entities/room.entity';
import { ILoggingService } from '../../domain/services/ilogging.service';
import {
	CreateRoomInput,
	CreateRoomResult,
	GetPublicRoomsInput,
	GetPublicRoomsResult,
	GetRoomByCodeInput,
	GetRoomByCodeResult,
	IRoomService,
	JoinRoomInput,
	JoinRoomResult,
	LeaveRoomInput,
	LeaveRoomResult,
} from '../../domain/services/iroom.service';

export class RoomService implements IRoomService {
	constructor(
		private readonly createRoomUseCase: CreateRoomUseCase,
		private readonly joinRoomUseCase: JoinRoomUseCase,
		private readonly getPublicRoomsUseCase: GetPublicRoomsUseCase,
		private readonly loggingService: ILoggingService,
	) {}

	async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
		try {
			this.loggingService.info('RoomService: Creating room', { input });

			const result = await this.createRoomUseCase.execute(input);

			if (result.success) {
				this.loggingService.info('RoomService: Room created successfully', {
					roomId: result.room.id,
					roomCode: result.room.roomCode,
					createdBy: input.createdBy,
				});
			} else {
				this.loggingService.warn('RoomService: Failed to create room', {
					error: result.error,
					input,
				});
			}

			return result;
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error creating room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				room: null as any,
				error: 'An unexpected error occurred while creating the room.',
			};
		}
	}

	async joinRoom(input: JoinRoomInput): Promise<JoinRoomResult> {
		try {
			this.loggingService.info('RoomService: User joining room', { input });

			const result = await this.joinRoomUseCase.execute(input);

			if (result.success) {
				this.loggingService.info('RoomService: User joined room successfully', {
					userId: input.userId,
					roomCode: input.roomCode,
					roomId: result.room?.id,
				});
			} else {
				this.loggingService.warn('RoomService: Failed to join room', {
					error: result.error,
					input,
				});
			}

			return result;
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error joining room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				room: null,
				error: 'An unexpected error occurred while joining the room.',
			};
		}
	}

	async leaveRoom(input: LeaveRoomInput): Promise<LeaveRoomResult> {
		try {
			this.loggingService.info('RoomService: User leaving room', { input });

			// TODO: Implement leave room logic
			// For now, return success
			// In a real implementation, you'd:
			// 1. Find the room by code
			// 2. Remove the user from participants
			// 3. Update the room
			// 4. Handle cleanup if room becomes empty

			this.loggingService.info('RoomService: User left room successfully', {
				userId: input.userId,
				roomCode: input.roomCode,
			});

			return { success: true };
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error leaving room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				error: 'An unexpected error occurred while leaving the room.',
			};
		}
	}

	async getPublicRooms(input?: GetPublicRoomsInput): Promise<GetPublicRoomsResult> {
		try {
			this.loggingService.info('RoomService: Fetching public rooms', { input });

			const result = await this.getPublicRoomsUseCase.execute(input || {});

			if (result.success) {
				this.loggingService.info('RoomService: Public rooms fetched successfully', {
					count: result.rooms.length,
					totalCount: result.totalCount,
				});
			} else {
				this.loggingService.warn('RoomService: Failed to fetch public rooms', {
					error: result.error,
					input,
				});
			}

			return result;
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error fetching public rooms', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				rooms: [],
				totalCount: 0,
				error: 'An unexpected error occurred while fetching public rooms.',
			};
		}
	}

	async getRoomByCode(input: GetRoomByCodeInput): Promise<GetRoomByCodeResult> {
		try {
			this.loggingService.info('RoomService: Fetching room by code', { input });

			// TODO: Implement get room by code logic
			// For now, return mock data
			const mockRoom = new Room(
				'room_1',
				input.roomCode,
				'Sample Room',
				'A sample room for testing',
				'host123',
				false, // public
				10,
				new Date(),
				new Date(),
				['host123'],
				[],
			);

			this.loggingService.info('RoomService: Room fetched successfully', {
				roomCode: input.roomCode,
				roomId: mockRoom.id,
			});

			return {
				success: true,
				room: mockRoom,
			};
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error fetching room by code', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				room: null,
				error: 'An unexpected error occurred while fetching the room.',
			};
		}
	}

	async addMediaToRoom(
		roomCode: string,
		mediaId: string,
		userId: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			this.loggingService.info('RoomService: Adding media to room', {
				roomCode,
				mediaId,
				userId,
			});

			// TODO: Implement add media to room logic
			// 1. Find room by code
			// 2. Verify user is in room
			// 3. Add media to room's media queue
			// 4. Update room

			this.loggingService.info('RoomService: Media added to room successfully', {
				roomCode,
				mediaId,
				userId,
			});

			return { success: true };
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error adding media to room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				roomCode,
				mediaId,
				userId,
			});

			return {
				success: false,
				error: 'An unexpected error occurred while adding media to the room.',
			};
		}
	}

	async removeMediaFromRoom(
		roomCode: string,
		mediaId: string,
		userId: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			this.loggingService.info('RoomService: Removing media from room', {
				roomCode,
				mediaId,
				userId,
			});

			// TODO: Implement remove media from room logic
			// 1. Find room by code
			// 2. Verify user is in room (or is host)
			// 3. Remove media from room's media queue
			// 4. Update room

			this.loggingService.info('RoomService: Media removed from room successfully', {
				roomCode,
				mediaId,
				userId,
			});

			return { success: true };
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error removing media from room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				roomCode,
				mediaId,
				userId,
			});

			return {
				success: false,
				error: 'An unexpected error occurred while removing media from the room.',
			};
		}
	}

	async isUserInRoom(roomCode: string, userId: string): Promise<boolean> {
		try {
			this.loggingService.debug('RoomService: Checking if user is in room', {
				roomCode,
				userId,
			});

			// TODO: Implement user in room check
			// For now, return false
			return false;
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error checking if user is in room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				roomCode,
				userId,
			});

			return false;
		}
	}

	async isUserHost(roomCode: string, userId: string): Promise<boolean> {
		try {
			this.loggingService.debug('RoomService: Checking if user is host', {
				roomCode,
				userId,
			});

			// TODO: Implement user host check
			// For now, return false
			return false;
		} catch (error) {
			this.loggingService.error('RoomService: Unexpected error checking if user is host', {
				error: error instanceof Error ? error.message : 'Unknown error',
				roomCode,
				userId,
			});

			return false;
		}
	}
}
