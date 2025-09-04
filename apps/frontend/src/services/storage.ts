import { ApiService } from './api';

export interface StorageStats {
	currentUsage: number;
	maxLimit: number;
	remainingSpace: number;
	usagePercentage: number;
	fileCount: number;
}

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

export interface CheckoutSession {
	sessionId: string;
	url: string;
	expiresAt: string;
}

class StorageService {
	private apiService: ApiService;

	constructor() {
		this.apiService = new ApiService();
	}

	/**
	 * Get user storage statistics
	 */
	async getStorageStats(): Promise<StorageStats> {
		const response = await this.apiService.get<{ success: boolean; data: StorageStats }>(
			'/api/v1/storage/stats',
		);
		return response.data;
	}

	/**
	 * Get storage pricing tiers
	 */
	async getPricingTiers(currency?: string): Promise<StoragePricingData> {
		const params = currency ? { currency } : {};
		const response = await this.apiService.get<{ success: boolean; data: StoragePricingData }>(
			'/api/v1/storage/pricing',
			{ params },
		);
		return response.data;
	}

	/**
	 * Create checkout session for storage upgrade
	 */
	async createCheckoutSession(
		tierId: string,
		currency?: string,
		billingCycle?: 'monthly' | 'yearly',
	): Promise<CheckoutSession> {
		console.log('StorageService: Creating checkout session with:', {
			tierId,
			currency,
			billingCycle,
		});
		const response = await this.apiService.post<{ success: boolean; data: CheckoutSession }>(
			'/api/v1/storage/checkout',
			{
				tierId,
				currency,
				billingCycle,
			},
		);
		console.log('StorageService: Raw API response:', response);
		console.log('StorageService: Extracted data:', response.data);
		return response.data;
	}

	/**
	 * Confirm checkout session and apply storage upgrade
	 */
	async confirmCheckout(
		sessionId: string,
	): Promise<{ success: boolean; message: string; data: { upgraded: boolean } }> {
		const response = await this.apiService.post<{
			success: boolean;
			message: string;
			data: { upgraded: boolean };
		}>('/api/v1/storage/confirm', { sessionId });
		return response;
	}

	/**
	 * Format bytes to human readable format
	 */
	formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Get storage usage percentage
	 */
	getUsagePercentage(currentUsage: number, maxLimit: number): number {
		if (maxLimit === 0) return 0;
		return Math.round((currentUsage / maxLimit) * 100);
	}

	/**
	 * Check if storage is nearly full (90% or more)
	 */
	isStorageNearlyFull(currentUsage: number, maxLimit: number): boolean {
		return this.getUsagePercentage(currentUsage, maxLimit) >= 90;
	}

	/**
	 * Get recommended tier based on current usage
	 */
	getRecommendedTier(currentUsage: number, tiers: StorageTier[]): StorageTier | null {
		const currentUsageGB = currentUsage / (1024 * 1024 * 1024);

		// Find the smallest tier that can accommodate current usage with some headroom
		const suitableTiers = tiers.filter((tier) => tier.storageGB > currentUsageGB * 1.2);

		if (suitableTiers.length === 0) {
			return tiers[tiers.length - 1]; // Return the largest tier
		}

		return suitableTiers[0]; // Return the smallest suitable tier
	}
}

export const storageService = new StorageService();
