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

// Media queue events
export const addToQueueSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	media: z.object({
		id: z.string().min(1, 'Media ID is required'),
		title: z.string().min(1, 'Title is required'),
		url: z.string().url('Valid URL is required'),
		thumbnails: z.array(z.string()),
		mimeType: z.string().min(1, 'MIME type is required'),
		duration: z.number().min(0, 'Duration must be positive'),
	}),
	position: z.enum(['top', 'end']).default('end'),
});

export const removeFromQueueSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	queueItemId: z.string().min(1, 'Queue item ID is required'),
});

export const reorderQueueSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
	queueItemId: z.string().min(1, 'Queue item ID is required'),
	newPosition: z.number().min(0, 'Position must be positive'),
});

export const clearQueueSchema = z.object({
	roomCode: z
		.string()
		.length(8, 'Room code must be 8 characters')
		.regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
});

// Export types
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type MediaPlayInput = z.infer<typeof mediaPlaySchema>;
export type MediaPauseInput = z.infer<typeof mediaPauseSchema>;
export type MediaSeekInput = z.infer<typeof mediaSeekSchema>;
export type AddToQueueInput = z.infer<typeof addToQueueSchema>;
export type RemoveFromQueueInput = z.infer<typeof removeFromQueueSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type ClearQueueInput = z.infer<typeof clearQueueSchema>;
