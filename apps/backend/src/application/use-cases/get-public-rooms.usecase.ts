import { Room } from '../../domain/entities/room.entity';
import { IRoomRepository } from '../../domain/repositories/iroom.repository';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface GetPublicRoomsInput {
	limit: number;
	offset: number;
}

export interface GetPublicRoomsResult {
	success: boolean;
	rooms?: Room[];
	total?: number;
	error?: string;
}

export class GetPublicRoomsUseCase {
	constructor(
		private roomRepository: IRoomRepository,
		private loggingService: ILoggingService,
	) {}

	async execute(input: GetPublicRoomsInput): Promise<GetPublicRoomsResult> {
		const { limit, offset } = input;

		try {
			// Get public rooms from repository
			const rooms = await this.roomRepository.findPublicRooms(limit, offset);

			this.loggingService.info('Public rooms fetched successfully', {
				limit,
				offset,
				count: rooms.length,
			});

			return {
				success: true,
				rooms,
				total: rooms.length, // TODO: Add count method to repository for proper pagination
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

			this.loggingService.error('Failed to fetch public rooms', {
				error: errorMessage,
				input,
			});

			return {
				success: false,
				error: 'Failed to fetch public rooms. Please try again.',
			};
		}
	}
}
