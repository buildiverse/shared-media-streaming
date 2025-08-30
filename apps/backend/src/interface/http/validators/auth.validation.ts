import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
	body: z.object({
		username: z.string().min(1, 'Username is required'),
		password: z.string().min(1, 'Password is required'),
	}),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
	body: z.object({
		refreshToken: z.string().min(1, 'Refresh token is required'),
	}),
});

// Logout schema (optional body for future extensibility)
export const logoutSchema = z.object({
	body: z
		.object({
			refreshToken: z.string().optional(),
			allDevices: z.boolean().optional(),
		})
		.optional(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type LogoutInput = z.infer<typeof logoutSchema>['body'];
