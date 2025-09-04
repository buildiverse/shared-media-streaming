import { Request, Response } from 'express';
import { IncreaseStorageUseCase } from '../../../application/use-cases/increase-storage.usecase';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { IStoragePricingService } from '../../../domain/services/istorage-pricing.service';
import { IStorageService } from '../../../domain/services/istorage.service';
import { IStripeService } from '../../../domain/services/istripe.service';
import {
	confirmCheckoutSchema,
	createCheckoutSessionSchema,
	getPricingTiersSchema,
	getStorageStatsSchema,
	stripeWebhookSchema,
} from '../validators/storage.validation';

export class StorageController {
	constructor(
		private readonly storageService: IStorageService,
		private readonly storagePricingService: IStoragePricingService,
		private readonly stripeService: IStripeService,
		private readonly increaseStorageUseCase: IncreaseStorageUseCase,
		private readonly loggingService: ILoggingService,
	) {}

	async getUserStorageStats(req: Request, res: Response) {
		try {
			// Validate input
			const validation = getStorageStatsSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const userId = req.user?.userId;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			const stats = await this.storageService.getUserStorageStats(userId);

			this.loggingService.info('User storage stats retrieved', {
				userId,
				...stats,
			});

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			this.loggingService.error('Failed to get user storage stats', {
				userId: req.user?.userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			res.status(500).json({
				success: false,
				message: 'Failed to retrieve storage statistics',
			});
		}
	}

	async getPricingTiers(req: Request, res: Response) {
		try {
			// Validate input
			const validation = getPricingTiersSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const currency = validation.data.query?.currency;
			const pricingData = await this.storagePricingService.getPricingTiers(currency);

			this.loggingService.info('Pricing tiers retrieved', {
				currency: currency || 'default',
				tierCount: pricingData.tiers.length,
			});

			res.json({
				success: true,
				data: pricingData,
			});
		} catch (error) {
			this.loggingService.error('Failed to get pricing tiers', {
				currency: req.query.currency,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			res.status(500).json({
				success: false,
				message: 'Failed to retrieve pricing tiers',
			});
		}
	}

	async createCheckoutSession(req: Request, res: Response) {
		try {
			// Validate input
			const validation = createCheckoutSessionSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const userId = req.user?.userId;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			const { tierId, currency, billingCycle } = validation.data.body;

			// Get pricing information
			const targetCurrency = currency || (await this.storagePricingService.getDefaultCurrency());
			const targetBillingCycle = billingCycle || 'monthly';
			const pricing = await this.storagePricingService.getTierPricing(
				tierId,
				targetCurrency,
				targetBillingCycle,
			);

			if (!pricing || !pricing.stripePriceId) {
				return res.status(400).json({
					success: false,
					message: 'Pricing information not available for this tier',
				});
			}

			// Create checkout session
			// Get frontend URL from environment or construct from request
			const frontendUrl =
				process.env.FRONTEND_URL ||
				(req.get('origin')?.includes('localhost')
					? 'http://localhost:4173'
					: `${req.protocol}://${req.get('host')?.replace('3000', '4173')}`);

			const successUrl = `${frontendUrl}/storage/upgrade/success?session_id={CHECKOUT_SESSION_ID}`;
			const cancelUrl = `${frontendUrl}/storage/upgrade/cancel`;

			const session = await this.stripeService.createCheckoutSession({
				priceId: pricing.stripePriceId,
				userId,
				successUrl,
				cancelUrl,
				metadata: {
					tierId,
					currency: targetCurrency,
					billingCycle: targetBillingCycle,
				},
			});

			this.loggingService.info('Checkout session created', {
				userId,
				tierId,
				sessionId: session.id,
			});

			res.json({
				success: true,
				data: {
					sessionId: session.id,
					url: session.url,
					expiresAt: session.expiresAt,
				},
			});
		} catch (error) {
			this.loggingService.error('Failed to create checkout session', {
				userId: req.user?.userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			res.status(500).json({
				success: false,
				message: 'Failed to create checkout session',
			});
		}
	}

	async handleWebhook(req: Request, res: Response) {
		try {
			// Validate input
			const validation = stripeWebhookSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const signature = validation.data.headers['stripe-signature'];
			const payload = validation.data.body;

			const event = await this.stripeService.verifyWebhookSignature(payload, signature);

			// Handle the event
			switch (event.type) {
				case 'checkout.session.completed':
					const sessionData = await this.stripeService.handleSuccessfulPayment(
						event.data.object.id,
					);

					// Update user's storage limit
					const result = await this.increaseStorageUseCase.execute({
						userId: sessionData.userId,
						tierId: event.data.object.metadata?.tierId || '',
						currency: event.data.object.metadata?.currency,
						billingCycle: event.data.object.metadata?.billingCycle as 'monthly' | 'yearly',
					});

					this.loggingService.info('Storage upgrade completed via webhook', {
						userId: sessionData.userId,
						sessionId: event.data.object.id,
						success: result.success,
					});
					break;

				default:
					this.loggingService.info('Unhandled Stripe webhook event', {
						eventType: event.type,
						eventId: event.id,
					});
			}

			res.json({ received: true });
		} catch (error) {
			this.loggingService.error('Webhook handling failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			res.status(400).json({
				success: false,
				message: 'Webhook handling failed',
			});
		}
	}

	async confirmCheckout(req: Request, res: Response) {
		try {
			// Validate input
			const validation = confirmCheckoutSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const userId = req.user?.userId;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			const { sessionId } = validation.data.body;

			// Get session data from Stripe
			const sessionData = await this.stripeService.handleSuccessfulPayment(sessionId);

			// Verify the session belongs to the authenticated user
			if (sessionData.userId !== userId) {
				return res.status(403).json({
					success: false,
					message: 'Session does not belong to authenticated user',
				});
			}

			// Update user's storage limit
			const result = await this.increaseStorageUseCase.execute({
				userId: sessionData.userId,
				tierId: sessionData.metadata?.tierId || '',
				currency: sessionData.metadata?.currency,
				billingCycle: sessionData.metadata?.billingCycle as 'monthly' | 'yearly',
			});

			this.loggingService.info('Storage upgrade completed via confirm endpoint', {
				userId: sessionData.userId,
				sessionId,
				success: result.success,
			});

			res.json({
				success: true,
				message: 'Storage upgrade confirmed successfully',
				data: {
					upgraded: result.success,
				},
			});
		} catch (error) {
			this.loggingService.error('Failed to confirm checkout', {
				userId: req.user?.userId,
				sessionId: req.body?.sessionId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			res.status(500).json({
				success: false,
				message: 'Failed to confirm checkout',
			});
		}
	}
}
