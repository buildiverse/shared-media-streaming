export class Room {
	constructor(
		public readonly id: string,
		public readonly roomCode: string,
		public readonly isPrivate: boolean,
		public readonly createdBy: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(
		roomCode: string,
		isPrivate: boolean,
		createdBy: string,
	): Pick<Room, 'roomCode' | 'isPrivate' | 'createdBy'> {
		return {
			roomCode,
			isPrivate,
			createdBy,
		};
	}

	toJSON() {
		return {
			id: this.id,
			roomCode: this.roomCode,
			isPrivate: this.isPrivate,
			createdBy: this.createdBy,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
