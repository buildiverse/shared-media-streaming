import { Room } from '../entities/room.entity';

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

export interface JoinRoomInput {
	roomCode: string;
	userId: string;
	socketId: string;
}

export interface JoinRoomResult {
	success: boolean;
	room: Room | null;
	error?: string;
}

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

export interface LeaveRoomInput {
	roomCode: string;
	userId: string;
}

export interface LeaveRoomResult {
	success: boolean;
	error?: string;
}

export interface GetRoomByCodeInput {
	roomCode: string;
}

export interface GetRoomByCodeResult {
	success: boolean;
	room: Room | null;
	error?: string;
}

export interface IRoomService {
	// Room Management
	createRoom(input: CreateRoomInput): Promise<CreateRoomResult>;
	joinRoom(input: JoinRoomInput): Promise<JoinRoomResult>;
	leaveRoom(input: LeaveRoomInput): Promise<LeaveRoomResult>;

	// Room Queries
	getPublicRooms(input?: GetPublicRoomsInput): Promise<GetPublicRoomsResult>;
	getRoomByCode(input: GetRoomByCodeInput): Promise<GetRoomByCodeResult>;

	// Room Operations
	addMediaToRoom(
		roomCode: string,
		mediaId: string,
		userId: string,
	): Promise<{ success: boolean; error?: string }>;
	removeMediaFromRoom(
		roomCode: string,
		mediaId: string,
		userId: string,
	): Promise<{ success: boolean; error?: string }>;

	// Room Validation
	isUserInRoom(roomCode: string, userId: string): Promise<boolean>;
	isUserHost(roomCode: string, userId: string): Promise<boolean>;
}
