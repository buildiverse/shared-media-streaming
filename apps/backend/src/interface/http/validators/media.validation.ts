import { z } from 'zod';

// Media upload schema (file validation handled by multer)
export const uploadMediaSchema = z.object({
	body: z.object({
		title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
		description: z.string().max(500, 'Description too long').optional(),
	}),
});

// Media update schema
export const updateMediaSchema = z.object({
	body: z.object({
		title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
		description: z.string().max(500, 'Description too long').optional(),
	}),
	params: z.object({
		id: z.string().min(1, 'Media ID is required'),
	}),
});

// Media by ID schema
export const mediaByIdSchema = z.object({
	params: z.object({
		id: z.string().min(1, 'Media ID is required'),
	}),
});

// Media search schema
export const mediaSearchSchema = z.object({
	query: z.object({
		q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
		type: z.enum(['video', 'audio', 'image', 'all']).optional(),
		limit: z.coerce.number().min(1).max(100).default(20),
		offset: z.coerce.number().min(0).default(0),
	}),
});

// Media by user schema
export const mediaByUserSchema = z.object({
	query: z.object({
		limit: z.coerce.number().min(1).max(100).default(20),
		offset: z.coerce.number().min(0).default(0),
		type: z.enum(['video', 'audio', 'image', 'all']).optional(),
	}),
});

// Export types
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>['body'];
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>['body'];
export type MediaByIdParams = z.infer<typeof mediaByIdSchema>['params'];
export type MediaSearchQuery = z.infer<typeof mediaSearchSchema>['query'];
export type MediaByUserQuery = z.infer<typeof mediaByUserSchema>['query'];
