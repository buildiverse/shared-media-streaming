import { Room } from '../../domain/entities/room.entity';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface JoinRoomInput {
	roomCode: string; // 8-character alphanumeric code
	userId: string;
	socketId: string;
}

export interface JoinRoomResult {
	success: boolean;
	room: any; // Will be Room entity
	error?: string;
}

export class JoinRoomUseCase {
	constructor(private loggingService: ILoggingService) {}

	async execute(input: JoinRoomInput): Promise<JoinRoomResult> {
		const { roomCode, userId, socketId } = input;

		try {
			// TODO: Find room by code from repository
			// const room = await this.roomRepository.findByRoomCode(roomCode);

			// For now, return mock data
			const mockRoom = new Room(
				'room_1',
				roomCode,
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

			if (!mockRoom) {
				return {
					success: false,
					room: null,
					error: 'Room not found with the provided code.',
				};
			}

			// Check if user is already in the room
			if (mockRoom.isParticipant(userId)) {
				return {
					success: false,
					room: null,
					error: 'You are already in this room.',
				};
			}

			// Check if room is full
			if (mockRoom.isFull) {
				return {
					success: false,
					room: null,
					error: 'Room is at maximum capacity.',
				};
			}

			// Add user to room
			const updatedRoom = mockRoom.addParticipant(userId);

			// TODO: Save updated room to repository
			// await this.roomRepository.save(updatedRoom);

			this.loggingService.info('User joined room by code', {
				userId,
				socketId,
				roomId: updatedRoom.id,
				roomCode: updatedRoom.roomCode,
				participantCount: updatedRoom.participantCount,
			});

			return {
				success: true,
				room: updatedRoom,
			};
		} catch (error) {
			this.loggingService.error('Failed to join room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				room: null,
				error: 'Failed to join room. Please try again.',
			};
		}
	}
}
