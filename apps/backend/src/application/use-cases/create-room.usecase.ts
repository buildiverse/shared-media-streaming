import { Room } from '../../domain/entities/room.entity';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface CreateRoomInput {
	name: string;
	description: string;
	createdBy: string;
	isPrivate: boolean;
	maxUsers: number;
}

export interface CreateRoomResult {
	success: boolean;
	room: Room;
	error?: string;
}

export class CreateRoomUseCase {
	constructor(private loggingService: ILoggingService) {}

	async execute(input: CreateRoomInput): Promise<CreateRoomResult> {
		const { name, description, createdBy, isPrivate, maxUsers } = input;

		try {
			// Validate input
			if (!Room.validateName(name)) {
				return {
					success: false,
					room: null as any,
					error: 'Invalid room name. Must be between 3 and 50 characters.',
				};
			}

			if (!Room.validateDescription(description)) {
				return {
					success: false,
					room: null as any,
					error: 'Invalid room description. Must be 500 characters or less.',
				};
			}

			if (!Room.validateMaxUsers(maxUsers)) {
				return {
					success: false,
					room: null as any,
					error: 'Invalid max users. Must be between 2 and 100.',
				};
			}

			// Generate unique room ID and room code
			const roomId = this.generateRoomId();
			const roomCode = this.generateRoomCode();

			// Create room entity
			const room = new Room(
				roomId,
				roomCode,
				name,
				description,
				createdBy,
				isPrivate,
				maxUsers,
				new Date(),
				new Date(),
				[createdBy], // Creator is automatically added as first participant
				[], // Empty media queue initially
			);

			// TODO: Save room to repository
			// await this.roomRepository.save(room);

			this.loggingService.info('Room created successfully', {
				roomId: room.id,
				roomCode: room.roomCode,
				roomName: room.name,
				createdBy,
				isPrivate,
				maxUsers,
			});

			return {
				success: true,
				room,
			};
		} catch (error) {
			this.loggingService.error('Failed to create room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				room: null as any,
				error: 'Failed to create room. Please try again.',
			};
		}
	}

	private generateRoomId(): string {
		// Generate a unique room ID (in production, this would use a proper ID generator)
		return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateRoomCode(): string {
		// Generate a unique 8-character alphanumeric room code
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}
}
