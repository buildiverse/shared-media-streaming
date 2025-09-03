import * as fs from 'fs';
import * as path from 'path';
import { ILoggingService } from '../../domain/services/ilogging.service';
import {
	IStoragePricingService,
	StoragePricingData,
	StorageTier,
} from '../../domain/services/istorage-pricing.service';

export class StoragePricingService implements IStoragePricingService {
	private pricingData: StoragePricingData | null = null;

	constructor(private readonly loggingService: ILoggingService) {}

	private async loadPricingData(): Promise<StoragePricingData> {
		if (this.pricingData) {
			return this.pricingData;
		}

		try {
			const pricingFilePath = path.join(__dirname, '../data/storage-pricing.json');
			const fileContent = fs.readFileSync(pricingFilePath, 'utf-8');
			this.pricingData = JSON.parse(fileContent) as StoragePricingData;

			this.loggingService.info('Storage pricing data loaded successfully', {
				tierCount: this.pricingData.tiers.length,
				supportedCurrencies: this.pricingData.supportedCurrencies,
			});

			return this.pricingData;
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

			this.loggingService.info('Retrieved pricing tiers', {
				currency: targetCurrency,
				tierCount: data.tiers.length,
			});

			return data;
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

			this.loggingService.info('Retrieved storage tier', {
				tierId,
				currency: targetCurrency,
				tierName: tier.name,
			});

			return tier;
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
}
