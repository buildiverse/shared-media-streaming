import { z } from 'zod';

// Join room event
export const joinRoomSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	mediaId: z.string().min(1, 'Media ID is required').optional(),
});

// Leave room event
export const leaveRoomSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
});

// Media play event
export const mediaPlaySchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	currentTime: z.number().min(0, 'Current time must be positive'),
});

// Media pause event
export const mediaPauseSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	currentTime: z.number().min(0, 'Current time must be positive'),
});

// Media seek event
export const mediaSeekSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	currentTime: z.number().min(0, 'Current time must be positive'),
});

// Export types
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type MediaPlayInput = z.infer<typeof mediaPlaySchema>;
export type MediaPauseInput = z.infer<typeof mediaPauseSchema>;
export type MediaSeekInput = z.infer<typeof mediaSeekSchema>;
