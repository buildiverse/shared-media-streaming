export interface RoomUser {
	id: string;
	username: string;
	socketId: string;
	isHost: boolean;
	joinedAt: Date;
}

export interface RoomMessage {
	id: string;
	userId: string;
	username: string;
	content: string;
	timestamp: Date;
}

export interface RoomState {
	roomCode: string;
	users: Map<string, RoomUser>; // socketId -> user
	messages: RoomMessage[];
	createdAt: Date;
}

export interface IRoomStateService {
	// Room management
	createRoom(roomCode: string, hostUser: Omit<RoomUser, 'isHost' | 'joinedAt'>): RoomState;
	destroyRoom(roomCode: string): void;
	roomExists(roomCode: string): boolean;

	// User management
	addUser(roomCode: string, user: Omit<RoomUser, 'isHost' | 'joinedAt'>): RoomUser | null;
	removeUser(roomCode: string, socketId: string): RoomUser | null;
	getRoomUsers(roomCode: string): RoomUser[];
	getUserCount(roomCode: string): number;

	// Message management
	addMessage(roomCode: string, message: Omit<RoomMessage, 'id' | 'timestamp'>): RoomMessage | null;
	getRoomMessages(roomCode: string, limit?: number): RoomMessage[];

	// Room state
	getRoomState(roomCode: string): RoomState | null;
	getAllRooms(): string[];
}
