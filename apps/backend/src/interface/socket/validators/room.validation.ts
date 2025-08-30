import { z } from 'zod';

export const joinRoomSchema = z.object({
	roomCode: z
		.string()
		.length(8)
		.regex(/^[A-Z0-9]+$/),
	userId: z.string().min(1),
});

export const leaveRoomSchema = z.object({
	roomCode: z
		.string()
		.length(8)
		.regex(/^[A-Z0-9]+$/),
	userId: z.string().min(1),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
