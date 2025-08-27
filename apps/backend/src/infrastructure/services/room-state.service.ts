import { v4 as uuidv4 } from 'uuid';
import {
	IRoomStateService,
	MediaQueueItem,
	PlaybackState,
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
			mediaQueue: [],
			playbackState: {
				isPlaying: false,
				currentMediaId: null,
				currentTimestamp: 0,
				lastUpdated: new Date(),
				updatedBy: hostUser.id,
			},
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

	// Media queue management
	addToQueue(
		roomCode: string,
		media: Omit<MediaQueueItem, 'id' | 'addedAt' | 'position'>,
		position: 'top' | 'end' = 'end',
	): MediaQueueItem | null {
		const room = this.rooms.get(roomCode);
		if (!room) return null;

		const queueItem: MediaQueueItem = {
			...media,
			id: uuidv4(),
			addedAt: new Date(),
			position: position === 'top' ? 0 : room.mediaQueue.length,
		};

		if (position === 'top') {
			// Shift all existing items down
			room.mediaQueue.forEach((item) => item.position++);
			room.mediaQueue.unshift(queueItem);
		} else {
			room.mediaQueue.push(queueItem);
		}

		return queueItem;
	}

	removeFromQueue(roomCode: string, queueItemId: string): boolean {
		const room = this.rooms.get(roomCode);
		if (!room) return false;

		const index = room.mediaQueue.findIndex((item) => item.id === queueItemId);
		if (index === -1) return false;

		room.mediaQueue.splice(index, 1);

		// Reorder positions
		room.mediaQueue.forEach((item, idx) => {
			item.position = idx;
		});

		return true;
	}

	reorderQueue(roomCode: string, queueItemId: string, newPosition: number): boolean {
		const room = this.rooms.get(roomCode);
		if (!room) return false;

		const currentIndex = room.mediaQueue.findIndex((item) => item.id === queueItemId);
		if (currentIndex === -1 || newPosition < 0 || newPosition >= room.mediaQueue.length)
			return false;

		const item = room.mediaQueue.splice(currentIndex, 1)[0];
		room.mediaQueue.splice(newPosition, 0, item);

		// Reorder positions
		room.mediaQueue.forEach((item, idx) => {
			item.position = idx;
		});

		return true;
	}

	getMediaQueue(roomCode: string): MediaQueueItem[] {
		const room = this.rooms.get(roomCode);
		return room ? room.mediaQueue : [];
	}

	clearQueue(roomCode: string): boolean {
		const room = this.rooms.get(roomCode);
		if (!room) return false;

		room.mediaQueue = [];
		return true;
	}

	// Playback control
	updatePlaybackState(
		roomCode: string,
		playbackState: Partial<PlaybackState>,
		userId: string,
	): PlaybackState | null {
		const room = this.rooms.get(roomCode);
		if (!room) return null;

		room.playbackState = {
			...room.playbackState,
			...playbackState,
			lastUpdated: new Date(),
			updatedBy: userId,
		};

		return room.playbackState;
	}

	getPlaybackState(roomCode: string): PlaybackState | null {
		const room = this.rooms.get(roomCode);
		return room ? room.playbackState : null;
	}
}
