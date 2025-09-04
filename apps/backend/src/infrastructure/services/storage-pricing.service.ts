import * as fs from 'fs';
import * as path from 'path';
import { ILoggingService } from '../../domain/services/ilogging.service';
import {
	IStoragePricingService,
	StoragePricingData,
	StorageTier,
} from '../../domain/services/istorage-pricing.service';

// Raw JSON data interface (what's actually in the JSON file)
interface RawStorageTier {
	id: string;
	name: string;
	description: string;
	storage: string; // "100 GB", "2 TB", etc.
	features: string[];
	pricing: Record<string, { monthly: number; yearly: number }>;
	popular?: boolean;
	stripeProductId?: string | null;
	stripePriceId?: Record<string, { monthly: string | null; yearly: string | null }> | null;
}

interface RawStoragePricingData {
	tiers: RawStorageTier[];
	supportedCurrencies: string[];
	defaultCurrency: string;
}

export class StoragePricingService implements IStoragePricingService {
	constructor(private readonly loggingService: ILoggingService) {}

	private async loadPricingData(): Promise<RawStoragePricingData> {
		try {
			const pricingFilePath = path.join(__dirname, '../data/storage-pricing.json');
			const fileContent = fs.readFileSync(pricingFilePath, 'utf-8');
			const rawData = JSON.parse(fileContent) as RawStoragePricingData;

			this.loggingService.info('Storage pricing data loaded successfully', {
				tierCount: rawData.tiers.length,
				supportedCurrencies: rawData.supportedCurrencies,
			});

			return rawData;
		} catch (error) {
			this.loggingService.error('Failed to load storage pricing data', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error('Failed to load storage pricing data');
		}
	}

	async getPricingTiers(currency?: string): Promise<StoragePricingData> {
		try {
			const data = await this.loadPricingData();
			const targetCurrency = currency || data.defaultCurrency;

			// Validate currency
			if (!data.supportedCurrencies.includes(targetCurrency)) {
				this.loggingService.warn('Unsupported currency requested', {
					requestedCurrency: targetCurrency,
					supportedCurrencies: data.supportedCurrencies,
				});
				throw new Error(`Unsupported currency: ${targetCurrency}`);
			}

			// Transform all tiers to match the StorageTier interface
			const transformedTiers: StorageTier[] = data.tiers.map((tier) => ({
				id: tier.id,
				name: tier.name,
				storageGB: this.parseStorageToGB(tier.storage),
				features: tier.features,
				pricing: this.transformPricingData(tier.pricing),
				popular: tier.popular || false,
				stripeProductId: tier.stripeProductId || null,
				stripePriceId: this.transformStripePriceData(tier.stripePriceId),
			}));

			this.loggingService.info('Retrieved pricing tiers', {
				currency: targetCurrency,
				tierCount: transformedTiers.length,
			});

			return {
				tiers: transformedTiers,
				supportedCurrencies: data.supportedCurrencies,
				defaultCurrency: data.defaultCurrency,
				currencyRates: this.getCurrencyRates(),
			};
		} catch (error) {
			this.loggingService.error('Failed to get pricing tiers', {
				currency,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getTierById(tierId: string, currency?: string): Promise<StorageTier | null> {
		try {
			const data = await this.loadPricingData();
			const targetCurrency = currency || data.defaultCurrency;

			// Validate currency
			if (!data.supportedCurrencies.includes(targetCurrency)) {
				throw new Error(`Unsupported currency: ${targetCurrency}`);
			}

			const tier = data.tiers.find((t) => t.id === tierId);

			if (!tier) {
				this.loggingService.warn('Storage tier not found', {
					tierId,
					currency: targetCurrency,
				});
				return null;
			}

			// Transform the tier data to match the StorageTier interface
			const transformedTier: StorageTier = {
				id: tier.id,
				name: tier.name,
				storageGB: this.parseStorageToGB(tier.storage),
				features: tier.features,
				pricing: this.transformPricingData(tier.pricing),
				popular: tier.popular || false,
				stripeProductId: tier.stripeProductId || null,
				stripePriceId: this.transformStripePriceData(tier.stripePriceId),
			};

			this.loggingService.info('Retrieved storage tier', {
				tierId,
				currency: targetCurrency,
				tierName: tier.name,
			});

			return transformedTier;
		} catch (error) {
			this.loggingService.error('Failed to get storage tier', {
				tierId,
				currency,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getTierPricing(
		tierId: string,
		currency: string,
		billingCycle: 'monthly' | 'yearly',
	): Promise<{
		price: number;
		currency: string;
		symbol: string;
		stripePriceId: string | null;
	} | null> {
		try {
			const tier = await this.getTierById(tierId, currency);

			if (!tier) {
				return null;
			}

			const pricing = tier.pricing[currency];
			if (!pricing) {
				this.loggingService.warn('Pricing not available for currency', {
					tierId,
					currency,
					billingCycle,
				});
				return null;
			}

			const price = billingCycle === 'monthly' ? pricing.monthly : pricing.yearly;
			const stripePriceId = tier.stripePriceId[currency]?.[billingCycle] || null;

			this.loggingService.info('Retrieved tier pricing', {
				tierId,
				currency,
				billingCycle,
				price,
				stripePriceId,
			});

			return {
				price,
				currency: pricing.currency,
				symbol: pricing.symbol,
				stripePriceId,
			};
		} catch (error) {
			this.loggingService.error('Failed to get tier pricing', {
				tierId,
				currency,
				billingCycle,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getSupportedCurrencies(): Promise<string[]> {
		try {
			const data = await this.loadPricingData();
			return data.supportedCurrencies;
		} catch (error) {
			this.loggingService.error('Failed to get supported currencies', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getDefaultCurrency(): Promise<string> {
		try {
			const data = await this.loadPricingData();
			return data.defaultCurrency;
		} catch (error) {
			this.loggingService.error('Failed to get default currency', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	private parseStorageToGB(storage: string): number {
		// Parse storage string like "100 GB" or "2 TB" to GB
		const match = storage.match(/^(\d+(?:\.\d+)?)\s*(GB|TB)$/i);
		if (!match) {
			throw new Error(`Invalid storage format: ${storage}`);
		}

		const value = parseFloat(match[1]);
		const unit = match[2].toUpperCase();

		if (unit === 'TB') {
			return value * 1024; // Convert TB to GB
		} else if (unit === 'GB') {
			return value;
		}

		throw new Error(`Unsupported storage unit: ${unit}`);
	}

	private transformPricingData(
		pricing: Record<string, { monthly: number; yearly: number }>,
	): Record<string, { monthly: number; yearly: number; currency: string; symbol: string }> {
		const transformed: Record<
			string,
			{ monthly: number; yearly: number; currency: string; symbol: string }
		> = {};

		for (const [currency, data] of Object.entries(pricing)) {
			transformed[currency] = {
				monthly: data.monthly,
				yearly: data.yearly,
				currency,
				symbol: this.getCurrencySymbol(currency),
			};
		}

		return transformed;
	}

	private transformStripePriceData(
		stripePriceId:
			| Record<string, { monthly: string | null; yearly: string | null }>
			| null
			| undefined,
	): Record<string, { monthly: string | null; yearly: string | null }> {
		if (!stripePriceId) {
			return {};
		}

		const transformed: Record<string, { monthly: string | null; yearly: string | null }> = {};

		for (const [currency, data] of Object.entries(stripePriceId)) {
			transformed[currency] = {
				monthly: data.monthly || null,
				yearly: data.yearly || null,
			};
		}

		return transformed;
	}

	private getCurrencySymbol(currency: string): string {
		const symbols: Record<string, string> = {
			USD: '$',
			EUR: '€',
			GBP: '£',
			CAD: 'C$',
			AUD: 'A$',
		};
		return symbols[currency] || currency;
	}

	private getCurrencyRates(): Record<string, number> {
		// Simple currency rates (in a real app, these would come from an API)
		return {
			USD: 1.0,
			EUR: 0.85,
			GBP: 0.73,
			CAD: 1.25,
			AUD: 1.35,
		};
	}
}
