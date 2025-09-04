import { z } from 'zod';

// Get storage stats schema (no body validation needed, just auth)
export const getStorageStatsSchema = z.object({
	body: z.object({}).optional(),
});

// Get pricing tiers schema
export const getPricingTiersSchema = z.object({
	query: z
		.object({
			currency: z.string().optional(),
		})
		.optional(),
});

// Create checkout session schema
export const createCheckoutSessionSchema = z.object({
	body: z.object({
		tierId: z.string().min(1, 'Tier ID is required'),
		currency: z
			.string()
			.min(3, 'Currency must be at least 3 characters')
			.max(3, 'Currency must be exactly 3 characters')
			.optional(),
		billingCycle: z.enum(['monthly', 'yearly']).optional(),
	}),
});

// Confirm checkout schema (used when webhooks are not available locally)
export const confirmCheckoutSchema = z.object({
	body: z.object({
		sessionId: z.string().min(1, 'Stripe session ID is required'),
	}),
});

// Stripe webhook schema (no body validation as it's raw)
export const stripeWebhookSchema = z.object({
	body: z.any(), // Raw body for webhook signature verification
	headers: z.object({
		'stripe-signature': z.string().min(1, 'Stripe signature is required'),
	}),
});

// Export types
export type GetStorageStatsInput = z.infer<typeof getStorageStatsSchema>;
export type GetPricingTiersInput = z.infer<typeof getPricingTiersSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>['body'];
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>;
export type ConfirmCheckoutInput = z.infer<typeof confirmCheckoutSchema>['body'];
