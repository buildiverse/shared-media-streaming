import { z } from 'zod';

// Chat message event
export const chatMessageSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
	mediaId: z.string().min(1, 'Media ID is required').optional(),
	replyTo: z.string().min(1, 'Reply message ID is required').optional(),
});

// Typing start event
export const typingStartSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	mediaId: z.string().min(1, 'Media ID is required').optional(),
});

// Typing stop event
export const typingStopSchema = z.object({
	roomId: z.string().min(1, 'Room ID is required'),
	mediaId: z.string().min(1, 'Media ID is required').optional(),
});

// Export types
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type TypingStartInput = z.infer<typeof typingStartSchema>;
export type TypingStopInput = z.infer<typeof typingStopSchema>;
