import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { ILoggingService } from '../../domain/services/ilogging.service';
import { IStoragePricingService } from '../../domain/services/istorage-pricing.service';

export interface IncreaseStorageInput {
	userId: string;
	tierId: string;
	currency?: string;
	billingCycle?: 'monthly' | 'yearly';
}

export interface IncreaseStorageResult {
	success: boolean;
	newStorageLimit: number;
	tierName: string;
	price: number;
	currency: string;
	stripePriceId: string | null;
	message: string;
}

export class IncreaseStorageUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly storagePricingService: IStoragePricingService,
		private readonly loggingService: ILoggingService,
	) {}

	async execute(input: IncreaseStorageInput): Promise<IncreaseStorageResult> {
		try {
			this.loggingService.info('Starting storage upgrade process', {
				userId: input.userId,
				tierId: input.tierId,
				currency: input.currency,
				billingCycle: input.billingCycle,
			});

			// Get user
			const user = await this.userRepository.findById(input.userId);
			if (!user) {
				throw new Error('User not found');
			}

			// Get tier information
			const tier = await this.storagePricingService.getTierById(input.tierId, input.currency);
			if (!tier) {
				throw new Error('Storage tier not found');
			}

			// Get pricing information
			const currency = input.currency || (await this.storagePricingService.getDefaultCurrency());
			const billingCycle = input.billingCycle || 'monthly';
			const pricing = await this.storagePricingService.getTierPricing(
				input.tierId,
				currency,
				billingCycle,
			);

			if (!pricing) {
				throw new Error('Pricing information not available for this tier and currency');
			}

			// Calculate new storage limit (convert GB to bytes)
			const newStorageLimitGB = tier.storageGB;
			const newStorageLimitBytes = newStorageLimitGB * 1024 * 1024 * 1024;

			// Check if user is already at or above this tier
			if (user.maxUploadLimit >= newStorageLimitBytes) {
				this.loggingService.warn('User already has equal or higher storage limit', {
					userId: input.userId,
					currentLimit: user.maxUploadLimit,
					requestedLimit: newStorageLimitBytes,
					tierId: input.tierId,
				});
				return {
					success: false,
					newStorageLimit: user.maxUploadLimit,
					tierName: tier.name,
					price: pricing.price,
					currency: pricing.currency,
					stripePriceId: pricing.stripePriceId,
					message: 'You already have equal or higher storage capacity',
				};
			}

			// Update user's storage limit
			await this.userRepository.update(input.userId, {
				maxUploadLimit: newStorageLimitBytes,
			} as any); // Type assertion needed as repository interface doesn't include maxUploadLimit yet

			this.loggingService.info('Storage upgrade completed successfully', {
				userId: input.userId,
				oldLimit: user.maxUploadLimit,
				newLimit: newStorageLimitBytes,
				tierId: input.tierId,
				tierName: tier.name,
				price: pricing.price,
				currency: pricing.currency,
			});

			return {
				success: true,
				newStorageLimit: newStorageLimitBytes,
				tierName: tier.name,
				price: pricing.price,
				currency: pricing.currency,
				stripePriceId: pricing.stripePriceId,
				message: `Storage upgraded to ${tier.name} plan (${newStorageLimitGB}GB)`,
			};
		} catch (error) {
			this.loggingService.error('Storage upgrade failed', {
				userId: input.userId,
				tierId: input.tierId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
