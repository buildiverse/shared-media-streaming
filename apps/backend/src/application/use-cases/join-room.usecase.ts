import { ILoggingService } from '../../domain/services/ilogging.service';

export interface JoinRoomInput {
	roomCode: string; // 8-character alphanumeric code
	userId: string;
}

export interface JoinRoomResult {
	success: boolean;
	roomCode: string;
	error?: string;
}

export class JoinRoomUseCase {
	constructor(private loggingService: ILoggingService) {}

	async execute(input: JoinRoomInput): Promise<JoinRoomResult> {
		const { roomCode, userId } = input;

		try {
			// TODO: Find room by code from repository to validate it exists
			// const room = await this.roomRepository.findByRoomCode(roomCode);

			// For now, just validate the room code format
			if (!roomCode || roomCode.length !== 8 || !/^[A-Z0-9]+$/.test(roomCode)) {
				return {
					success: false,
					roomCode: '',
					error: 'Invalid room code format.',
				};
			}

			this.loggingService.info('Room join validation successful', {
				userId,
				roomCode,
			});

			return {
				success: true,
				roomCode,
			};
		} catch (error) {
			this.loggingService.error('Failed to validate room join', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				roomCode: '',
				error: 'Failed to validate room join. Please try again.',
			};
		}
	}
}
