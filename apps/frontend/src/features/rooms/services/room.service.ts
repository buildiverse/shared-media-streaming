import { ApiService } from '../../../services/api';

export interface CreateRoomRequest {
	isPrivate: boolean;
}

export interface CreateRoomResponse {
	success: boolean;
	room?: {
		id: string;
		roomCode: string;
		isPrivate: boolean;
		createdBy: string;
		createdAt: string;
		updatedAt: string;
	};
	error?: string;
}

export interface PublicRoom {
	id: string;
	roomCode: string;
	isPrivate: boolean;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetPublicRoomsResponse {
	success: boolean;
	rooms?: PublicRoom[];
	pagination?: {
		limit: number;
		offset: number;
		total: number;
	};
	error?: string;
}

export class RoomService {
	private apiService: ApiService;

	constructor() {
		this.apiService = new ApiService();
	}

	async createRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
		try {
			const response = await this.apiService.post<CreateRoomResponse>('/api/v1/rooms/create', data);
			return response;
		} catch (error) {
			throw new Error('Failed to create room. Please try again.');
		}
	}

	async getPublicRooms(limit: number = 20, offset: number = 0): Promise<GetPublicRoomsResponse> {
		try {
			const response = await this.apiService.get<GetPublicRoomsResponse>(
				`/api/v1/rooms/public?limit=${limit}&offset=${offset}`,
			);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch public rooms. Please try again.');
		}
	}
}
