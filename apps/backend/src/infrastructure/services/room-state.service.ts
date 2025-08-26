import { v4 as uuidv4 } from 'uuid';
import {
	IRoomStateService,
	RoomMessage,
	RoomState,
	RoomUser,
} from '../../domain/services/iroom-state.service';

export class RoomStateService implements IRoomStateService {
	private rooms: Map<string, RoomState> = new Map();

	createRoom(roomCode: string, hostUser: Omit<RoomUser, 'isHost' | 'joinedAt'>): RoomState {
		const roomState: RoomState = {
			roomCode,
			users: new Map(),
			messages: [],
			createdAt: new Date(),
		};

		// Add host user
		const host: RoomUser = {
			...hostUser,
			isHost: true,
			joinedAt: new Date(),
		};

		roomState.users.set(host.socketId, host);
		this.rooms.set(roomCode, roomState);

		return roomState;
	}

	destroyRoom(roomCode: string): void {
		this.rooms.delete(roomCode);
	}

	roomExists(roomCode: string): boolean {
		return this.rooms.has(roomCode);
	}

	addUser(roomCode: string, user: Omit<RoomUser, 'isHost' | 'joinedAt'>): RoomUser | null {
		const room = this.rooms.get(roomCode);
		if (!room) return null;

		const newUser: RoomUser = {
			...user,
			isHost: false,
			joinedAt: new Date(),
		};

		room.users.set(newUser.socketId, newUser);
		return newUser;
	}

	removeUser(roomCode: string, socketId: string): RoomUser | null {
		const room = this.rooms.get(roomCode);
		if (!room) return null;

		const user = room.users.get(socketId);
		if (!user) return null;

		room.users.delete(socketId);

		// If room is empty, destroy it
		if (room.users.size === 0) {
			this.destroyRoom(roomCode);
			// Note: Room destruction event will be emitted by the controller
		}

		return user;
	}

	getRoomUsers(roomCode: string): RoomUser[] {
		const room = this.rooms.get(roomCode);
		if (!room) return [];

		return Array.from(room.users.values());
	}

	getUserCount(roomCode: string): number {
		const room = this.rooms.get(roomCode);
		return room ? room.users.size : 0;
	}

	addMessage(roomCode: string, message: Omit<RoomMessage, 'id' | 'timestamp'>): RoomMessage | null {
		const room = this.rooms.get(roomCode);
		if (!room) return null;

		const newMessage: RoomMessage = {
			...message,
			id: uuidv4(),
			timestamp: new Date(),
		};

		room.messages.push(newMessage);

		// Keep only last 100 messages to prevent memory bloat
		if (room.messages.length > 100) {
			room.messages = room.messages.slice(-100);
		}

		return newMessage;
	}

	getRoomMessages(roomCode: string, limit: number = 50): RoomMessage[] {
		const room = this.rooms.get(roomCode);
		if (!room) return [];

		return room.messages.slice(-limit);
	}

	getRoomState(roomCode: string): RoomState | null {
		return this.rooms.get(roomCode) || null;
	}

	getAllRooms(): string[] {
		return Array.from(this.rooms.keys());
	}
}
