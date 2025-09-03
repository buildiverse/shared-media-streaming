export interface StripeCheckoutSession {
	id: string;
	url: string;
	expiresAt: Date;
}

export interface CreateCheckoutSessionInput {
	priceId: string;
	userId: string;
	successUrl: string;
	cancelUrl: string;
	metadata?: Record<string, string>;
}

export interface IStripeService {
	/**
	 * Create a Stripe checkout session
	 * @param input - Checkout session configuration
	 * @returns Stripe checkout session
	 */
	createCheckoutSession(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession>;

	/**
	 * Verify a webhook signature
	 * @param payload - Raw webhook payload
	 * @param signature - Webhook signature
	 * @returns Parsed webhook event
	 */
	verifyWebhookSignature(payload: string, signature: string): Promise<any>;

	/**
	 * Handle successful payment
	 * @param sessionId - Stripe session ID
	 * @returns Payment details
	 */
	handleSuccessfulPayment(sessionId: string): Promise<{
		userId: string;
		priceId: string;
		amount: number;
		currency: string;
		metadata?: Record<string, string>;
	}>;

	/**
	 * Create a customer portal session
	 * @param userId - User ID
	 * @param returnUrl - URL to return to after portal session
	 * @returns Portal session URL
	 */
	createCustomerPortalSession(userId: string, returnUrl: string): Promise<string>;
}
