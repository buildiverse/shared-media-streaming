export class Room {
	constructor(
		public readonly id: string,
		public readonly roomCode: string, // 8-character unique alphanumeric code
		public readonly name: string,
		public readonly description: string,
		public readonly createdBy: string,
		public readonly isPrivate: boolean,
		public readonly maxUsers: number,
		public readonly createdAt: Date = new Date(),
		public readonly updatedAt: Date = new Date(),
		public readonly participants: string[] = [],
		public readonly mediaQueue: string[] = [],
	) {}

	// Business logic methods
	addParticipant(userId: string): Room {
		if (this.participants.length >= this.maxUsers) {
			throw new Error('Room is at maximum capacity');
		}

		if (this.participants.includes(userId)) {
			throw new Error('User is already in the room');
		}

		return new Room(
			this.id,
			this.roomCode,
			this.name,
			this.description,
			this.createdBy,
			this.isPrivate,
			this.maxUsers,
			this.createdAt,
			new Date(),
			[...this.participants, userId],
			this.mediaQueue,
		);
	}

	removeParticipant(userId: string): Room {
		if (!this.participants.includes(userId)) {
			throw new Error('User is not in the room');
		}

		return new Room(
			this.id,
			this.roomCode,
			this.name,
			this.description,
			this.createdBy,
			this.isPrivate,
			this.maxUsers,
			this.createdAt,
			new Date(),
			this.participants.filter((id) => id !== userId),
			this.mediaQueue,
		);
	}

	addMediaToQueue(mediaId: string): Room {
		if (this.mediaQueue.includes(mediaId)) {
			throw new Error('Media is already in the queue');
		}

		return new Room(
			this.id,
			this.roomCode,
			this.name,
			this.description,
			this.createdBy,
			this.isPrivate,
			this.maxUsers,
			this.createdAt,
			new Date(),
			this.participants,
			[...this.mediaQueue, mediaId],
		);
	}

	removeMediaFromQueue(mediaId: string): Room {
		if (!this.mediaQueue.includes(mediaId)) {
			throw new Error('Media is not in the queue');
		}

		return new Room(
			this.id,
			this.roomCode,
			this.name,
			this.description,
			this.createdBy,
			this.isPrivate,
			this.maxUsers,
			this.createdAt,
			new Date(),
			this.participants,
			this.mediaQueue.filter((id) => id !== mediaId),
		);
	}

	updateRoom(
		updates: Partial<Pick<Room, 'name' | 'description' | 'maxUsers' | 'isPrivate'>>,
	): Room {
		return new Room(
			this.id,
			this.roomCode,
			updates.name || this.name,
			updates.description || this.description,
			this.createdBy,
			updates.isPrivate !== undefined ? updates.isPrivate : this.isPrivate,
			updates.maxUsers || this.maxUsers,
			this.createdAt,
			new Date(),
			this.participants,
			this.mediaQueue,
		);
	}

	// Validation methods
	static validateName(name: string): boolean {
		return name.length >= 3 && name.length <= 50;
	}

	static validateDescription(description: string): boolean {
		return description.length <= 500;
	}

	static validateMaxUsers(maxUsers: number): boolean {
		return maxUsers >= 2 && maxUsers <= 100;
	}

	static validateRoomCode(roomCode: string): boolean {
		return /^[A-Z0-9]{8}$/.test(roomCode);
	}

	// Getters
	get participantCount(): number {
		return this.participants.length;
	}

	get isFull(): boolean {
		return this.participants.length >= this.maxUsers;
	}

	get canJoin(): boolean {
		return !this.isFull;
	}

	get isHost(userId: string): boolean {
		return this.createdBy === userId;
	}

	get isParticipant(userId: string): boolean {
		return this.participants.includes(userId);
	}

	get isPublic(): boolean {
		return !this.isPrivate;
	}

	get canJoinWithCode(): boolean {
		return this.isPrivate;
	}
}
