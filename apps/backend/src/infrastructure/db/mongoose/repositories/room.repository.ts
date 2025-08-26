import { Room } from '../../../../domain/entities/room.entity';
import { IRoomRepository } from '../../../../domain/repositories/iroom.repository';
import { IRoomDocument, RoomModel } from '../models/room.model';

export class RoomRepository implements IRoomRepository {
	async save(room: Room): Promise<Room> {
		const roomData = {
			roomCode: room.roomCode,
			isPrivate: room.isPrivate,
			createdBy: room.createdBy,
		};

		if (room.id) {
			// Update existing room
			const updatedRoom = await RoomModel.findByIdAndUpdate(room.id, roomData, {
				new: true,
				runValidators: true,
			});
			if (!updatedRoom) {
				throw new Error('Room not found');
			}
			return this.mapToEntity(updatedRoom);
		} else {
			// Create new room
			const newRoom = new RoomModel(roomData);
			const savedRoom = await newRoom.save();
			return this.mapToEntity(savedRoom);
		}
	}

	async findByRoomCode(roomCode: string): Promise<Room | null> {
		const room = await RoomModel.findOne({ roomCode: roomCode.toUpperCase() });
		return room ? this.mapToEntity(room) : null;
	}

	async findByUserId(userId: string): Promise<Room[]> {
		const rooms = await RoomModel.find({ createdBy: userId });
		return rooms.map((room) => this.mapToEntity(room));
	}

	async findPublicRooms(limit: number = 20, offset: number = 0): Promise<Room[]> {
		const rooms = await RoomModel.find({ isPrivate: false })
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(offset);
		return rooms.map((room) => this.mapToEntity(room));
	}

	async roomCodeExists(roomCode: string): Promise<boolean> {
		const count = await RoomModel.countDocuments({ roomCode: roomCode.toUpperCase() });
		return count > 0;
	}

	async delete(roomId: string): Promise<void> {
		await RoomModel.findByIdAndDelete(roomId);
	}

	private mapToEntity(document: IRoomDocument): Room {
		return new Room(
			document.id,
			document.roomCode,
			document.isPrivate,
			document.createdBy,
			document.createdAt,
			document.updatedAt,
		);
	}
}
