import { z } from 'zod';

// Username validation: 3-30 chars, alphanumeric + underscore/hyphen
export const usernameSchema = z
	.string()
	.min(3, 'Username must be at least 3 characters')
	.max(30, 'Username must be less than 30 characters')
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		'Username can only contain letters, numbers, underscores, and hyphens',
	);

// Email validation
export const emailSchema = z.string().email('Invalid email format').max(254, 'Email too long');

// Password validation: 8+ chars, at least one uppercase, lowercase, number
export const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
		'Password must contain at least one uppercase letter, one lowercase letter, and one number',
	);

// Avatar URL validation
export const avatarUrlSchema = z.string().url('Invalid avatar URL').optional();

// User creation schema
export const createUserSchema = z.object({
	body: z.object({
		username: usernameSchema,
		email: emailSchema,
		password: passwordSchema,
		avatarUrl: avatarUrlSchema,
	}),
});

// User update schema (partial)
export const updateUserSchema = z.object({
	body: z.object({
		username: usernameSchema.optional(),
		email: emailSchema.optional(),
		avatarUrl: avatarUrlSchema,
	}),
	params: z.object({
		id: z.string().min(1, 'User ID is required'),
	}),
});

// User profile schema
export const userProfileSchema = z.object({
	params: z.object({
		id: z.string().min(1, 'User ID is required'),
	}),
});

// Check username schema
export const checkUsernameSchema = z.object({
	params: z.object({
		username: usernameSchema,
	}),
});

// Check email schema
export const checkEmailSchema = z.object({
	params: z.object({
		email: emailSchema,
	}),
});

// Export types
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type UserProfileParams = z.infer<typeof userProfileSchema>['params'];
export type CheckUsernameParams = z.infer<typeof checkUsernameSchema>['params'];
export type CheckEmailParams = z.infer<typeof checkEmailSchema>['params'];
