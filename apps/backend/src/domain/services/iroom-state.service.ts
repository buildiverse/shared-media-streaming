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

export interface MediaQueueItem {
	id: string;
	mediaId: string;
	title: string;
	url: string;
	thumbnails: string[];
	mimeType: string;
	duration: number;
	addedBy: string;
	addedAt: Date;
	position: number; // Position in queue
}

export interface PlaybackState {
	isPlaying: boolean;
	currentMediaId: string | null;
	currentTimestamp: number; // Current playback time in seconds
	lastUpdated: Date;
	updatedBy: string;
}

export interface RoomState {
	roomCode: string;
	users: Map<string, RoomUser>; // socketId -> user
	messages: RoomMessage[];
	mediaQueue: MediaQueueItem[];
	playbackState: PlaybackState;
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

	// Media queue management
	addToQueue(
		roomCode: string,
		media: Omit<MediaQueueItem, 'id' | 'addedAt' | 'position'>,
		position?: 'top' | 'end',
	): MediaQueueItem | null;
	removeFromQueue(roomCode: string, queueItemId: string): boolean;
	reorderQueue(roomCode: string, queueItemId: string, newPosition: number): boolean;
	getMediaQueue(roomCode: string): MediaQueueItem[];
	clearQueue(roomCode: string): boolean;

	// Playback control
	updatePlaybackState(
		roomCode: string,
		playbackState: Partial<PlaybackState>,
		userId: string,
	): PlaybackState | null;
	getPlaybackState(roomCode: string): PlaybackState | null;
}
