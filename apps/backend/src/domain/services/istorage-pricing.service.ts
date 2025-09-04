export interface StorageTier {
	id: string;
	name: string;
	storageGB: number;
	features: string[];
	pricing: Record<
		string,
		{
			monthly: number;
			yearly: number;
			currency: string;
			symbol: string;
		}
	>;
	popular: boolean;
	stripeProductId: string | null;
	stripePriceId: Record<
		string,
		{
			monthly: string | null;
			yearly: string | null;
		}
	>;
}

export interface StoragePricingData {
	tiers: StorageTier[];
	currencyRates: Record<string, number>;
	supportedCurrencies: string[];
	defaultCurrency: string;
}

export interface IStoragePricingService {
	/**
	 * Get all storage pricing tiers
	 * @param currency - Optional currency code (defaults to USD)
	 * @returns Storage pricing data
	 */
	getPricingTiers(currency?: string): Promise<StoragePricingData>;

	/**
	 * Get a specific storage tier by ID
	 * @param tierId - The tier ID
	 * @param currency - Optional currency code (defaults to USD)
	 * @returns Storage tier or null if not found
	 */
	getTierById(tierId: string, currency?: string): Promise<StorageTier | null>;

	/**
	 * Get pricing for a specific tier in a specific currency
	 * @param tierId - The tier ID
	 * @param currency - Currency code
	 * @param billingCycle - 'monthly' or 'yearly'
	 * @returns Pricing information
	 */
	getTierPricing(
		tierId: string,
		currency: string,
		billingCycle: 'monthly' | 'yearly',
	): Promise<{
		price: number;
		currency: string;
		symbol: string;
		stripePriceId: string | null;
	} | null>;

	/**
	 * Get supported currencies
	 * @returns Array of supported currency codes
	 */
	getSupportedCurrencies(): Promise<string[]>;

	/**
	 * Get default currency
	 * @returns Default currency code
	 */
	getDefaultCurrency(): Promise<string>;
}
