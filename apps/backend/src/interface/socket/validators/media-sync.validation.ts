import { z } from 'zod';

// Join room event
export const joinRoomSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	mediaId: z.string().min(1, 'Media ID is required').optional(),
});

// Leave room event
export const leaveRoomSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
});

// Media play event
export const mediaPlaySchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	currentTime: z.number().min(0, 'Current time must be positive'),
});

// Media pause event
export const mediaPauseSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	currentTime: z.number().min(0, 'Current time must be positive'),
});

// Media seek event
export const mediaSeekSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	currentTime: z.number().min(0, 'Current time must be positive'),
});

// Export types
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type MediaPlayInput = z.infer<typeof mediaPlaySchema>;
export type MediaPauseInput = z.infer<typeof mediaPauseSchema>;
export type MediaSeekInput = z.infer<typeof mediaSeekSchema>;
