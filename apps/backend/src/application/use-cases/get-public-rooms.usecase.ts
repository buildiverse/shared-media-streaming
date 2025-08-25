import { Room } from '../../domain/entities/room.entity';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface GetPublicRoomsInput {
	limit?: number;
	offset?: number;
}

export interface GetPublicRoomsResult {
	success: boolean;
	rooms: Room[];
	totalCount: number;
	error?: string;
}

export class GetPublicRoomsUseCase {
	constructor(private loggingService: ILoggingService) {}

	async execute(input: GetPublicRoomsInput = {}): Promise<GetPublicRoomsResult> {
		const { limit = 20, offset = 0 } = input;

		try {
			// TODO: Fetch public rooms from repository
			// const rooms = await this.roomRepository.findPublicRooms({ limit, offset });
			// const totalCount = await this.roomRepository.countPublicRooms();

			// For now, return mock data
			const mockRooms: Room[] = [
				new Room(
					'room_1',
					'ABC12345',
					'Sample Public Room 1',
					'A fun room for everyone',
					'user123',
					false, // public
					10,
					new Date(),
					new Date(),
					['user123', 'user456'],
					[],
				),
				new Room(
					'room_2',
					'DEF67890',
					'Sample Public Room 2',
					'Another great room',
					'user789',
					false, // public
					15,
					new Date(),
					new Date(),
					['user789'],
					[],
				),
			];

			this.loggingService.info('Public rooms fetched successfully', {
				count: mockRooms.length,
				limit,
				offset,
			});

			return {
				success: true,
				rooms: mockRooms,
				totalCount: mockRooms.length,
			};
		} catch (error) {
			this.loggingService.error('Failed to fetch public rooms', {
				error: error instanceof Error ? error.message : 'Unknown error',
				input,
			});

			return {
				success: false,
				rooms: [],
				totalCount: 0,
				error: 'Failed to fetch public rooms. Please try again.',
			};
		}
	}
}
