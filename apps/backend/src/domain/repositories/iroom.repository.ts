import { Room } from '../entities/room.entity';

export interface IRoomRepository {
	save(room: Room): Promise<Room>;
	findByRoomCode(roomCode: string): Promise<Room | null>;
	findByUserId(userId: string): Promise<Room[]>;
	findPublicRooms(limit?: number, offset?: number): Promise<Room[]>;
	roomCodeExists(roomCode: string): Promise<boolean>;
	delete(roomId: string): Promise<void>;
}
