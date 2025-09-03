import Stripe from 'stripe';
import { ILoggingService } from '../../domain/services/ilogging.service';
import {
	CreateCheckoutSessionInput,
	IStripeService,
	StripeCheckoutSession,
} from '../../domain/services/istripe.service';

export class StripeService implements IStripeService {
	private stripe: Stripe;

	constructor(
		private readonly loggingService: ILoggingService,
		stripeSecretKey: string,
		private readonly webhookSecret: string,
	) {
		this.stripe = new Stripe(stripeSecretKey, {
			apiVersion: '2025-08-27.basil',
		});
	}

	async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession> {
		try {
			this.loggingService.info('Creating Stripe checkout session', {
				userId: input.userId,
				priceId: input.priceId,
				successUrl: input.successUrl,
				cancelUrl: input.cancelUrl,
			});

			const session = await this.stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: [
					{
						price: input.priceId,
						quantity: 1,
					},
				],
				mode: 'subscription',
				success_url: input.successUrl,
				cancel_url: input.cancelUrl,
				customer_email: undefined, // We'll use metadata to identify the user
				metadata: {
					userId: input.userId,
					...(input.metadata || {}),
				},
				subscription_data: {
					metadata: {
						userId: input.userId,
						...(input.metadata || {}),
					},
				},
			});

			this.loggingService.info('Stripe checkout session created successfully', {
				sessionId: session.id,
				userId: input.userId,
				priceId: input.priceId,
			});

			return {
				id: session.id,
				url: session.url!,
				expiresAt: new Date(session.expires_at! * 1000),
			};
		} catch (error) {
			this.loggingService.error('Failed to create Stripe checkout session', {
				userId: input.userId,
				priceId: input.priceId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async verifyWebhookSignature(payload: string, signature: string): Promise<any> {
		try {
			const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

			this.loggingService.info('Stripe webhook signature verified', {
				eventType: event.type,
				eventId: event.id,
			});

			return event;
		} catch (error) {
			this.loggingService.error('Failed to verify Stripe webhook signature', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async handleSuccessfulPayment(sessionId: string): Promise<{
		userId: string;
		priceId: string;
		amount: number;
		currency: string;
		metadata?: Record<string, string>;
	}> {
		try {
			this.loggingService.info('Handling successful Stripe payment', {
				sessionId,
			});

			const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
				expand: ['subscription', 'line_items'],
			});

			if (!session.subscription) {
				throw new Error('No subscription found in session');
			}

			const subscription = session.subscription as Stripe.Subscription;
			const lineItems = await this.stripe.checkout.sessions.listLineItems(sessionId);

			if (lineItems.data.length === 0) {
				throw new Error('No line items found in session');
			}

			const lineItem = lineItems.data[0];
			const priceId = lineItem.price?.id;

			if (!priceId) {
				throw new Error('No price ID found in line item');
			}

			const amount = lineItem.amount_total || 0;
			const currency = session.currency || 'usd';
			const userId = session.metadata?.userId;

			if (!userId) {
				throw new Error('No user ID found in session metadata');
			}

			this.loggingService.info('Stripe payment processed successfully', {
				sessionId,
				userId,
				priceId,
				amount,
				currency,
				subscriptionId: subscription.id,
			});

			return {
				userId,
				priceId,
				amount,
				currency,
				metadata: session.metadata || undefined,
			};
		} catch (error) {
			this.loggingService.error('Failed to handle successful Stripe payment', {
				sessionId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async createCustomerPortalSession(userId: string, returnUrl: string): Promise<string> {
		try {
			this.loggingService.info('Creating Stripe customer portal session', {
				userId,
				returnUrl,
			});

			// For now, we'll create a simple portal session
			// In a real implementation, you'd need to create a Stripe customer first
			// and manage the customer ID in your user model
			const session = await this.stripe.billingPortal.sessions.create({
				customer: userId, // This should be the Stripe customer ID
				return_url: returnUrl,
			});

			this.loggingService.info('Stripe customer portal session created', {
				userId,
				sessionId: session.id,
			});

			return session.url;
		} catch (error) {
			this.loggingService.error('Failed to create Stripe customer portal session', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
