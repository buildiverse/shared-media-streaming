import { Room } from '../../domain/entities/room.entity';
import { IRoomRepository } from '../../domain/repositories/iroom.repository';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface CreateRoomInput {
	isPrivate: boolean;
	createdBy: string;
}

export interface CreateRoomResult {
	success: boolean;
	room?: Room;
	error?: string;
}

export class CreateRoomUseCase {
	constructor(
		private roomRepository: IRoomRepository,
		private loggingService: ILoggingService,
	) {}

	async execute(input: CreateRoomInput): Promise<CreateRoomResult> {
		const { isPrivate, createdBy } = input;

		try {
			// Generate a unique 8-character room code
			const roomCode = await this.generateUniqueRoomCode();

			// Create room entity
			const roomData = Room.create(roomCode, isPrivate, createdBy);
			const room = new Room(
				'', // ID will be set by repository
				roomData.roomCode,
				roomData.isPrivate,
				roomData.createdBy,
				new Date(),
				new Date(),
			);

			// Save to repository
			const savedRoom = await this.roomRepository.save(room);

			this.loggingService.info('Room created successfully', {
				roomId: savedRoom.id,
				roomCode: savedRoom.roomCode,
				createdBy,
				isPrivate,
			});

			return {
				success: true,
				room: savedRoom,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

			this.loggingService.error('Failed to create room', {
				error: errorMessage,
				input,
			});

			return {
				success: false,
				error: 'Failed to create room. Please try again.',
			};
		}
	}

	private async generateUniqueRoomCode(): Promise<string> {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let attempts = 0;
		const maxAttempts = 100;

		while (attempts < maxAttempts) {
			// Generate random 8-character code
			let code = '';
			for (let i = 0; i < 8; i++) {
				code += chars.charAt(Math.floor(Math.random() * chars.length));
			}

			// Check if code already exists
			const exists = await this.roomRepository.roomCodeExists(code);
			if (!exists) {
				return code;
			}

			attempts++;
		}

		throw new Error('Unable to generate unique room code after maximum attempts');
	}
}
