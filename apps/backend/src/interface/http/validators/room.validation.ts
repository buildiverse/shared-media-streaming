import { z } from 'zod';

export const createRoomSchema = z.object({
	isPrivate: z.boolean().default(false),
});

export const getPublicRoomsSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
});

export const getRoomByCodeSchema = z.object({
	roomCode: z
		.string()
		.length(8)
		.regex(/^[A-Z0-9]+$/),
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type GetPublicRoomsRequest = z.infer<typeof getPublicRoomsSchema>;
export type GetRoomByCodeRequest = z.infer<typeof getRoomByCodeSchema>;
