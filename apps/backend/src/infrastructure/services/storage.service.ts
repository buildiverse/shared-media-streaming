import { IMediaRepository } from '../../domain/repositories/imedia.repository';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { ILoggingService } from '../../domain/services/ilogging.service';
import { IStorageService } from '../../domain/services/istorage.service';

export class StorageService implements IStorageService {
	constructor(
		private readonly mediaRepository: IMediaRepository,
		private readonly userRepository: IUserRepository,
		private readonly loggingService: ILoggingService,
	) {}

	async calculateUserStorageUsage(userId: string): Promise<number> {
		try {
			this.loggingService.info('Calculating user storage usage', { userId });

			const userMedia = await this.mediaRepository.findByUserId(userId);
			const totalSize = userMedia.reduce((sum, media) => sum + media.size, 0);

			this.loggingService.info('Storage usage calculated', {
				userId,
				totalSize,
				fileCount: userMedia.length,
			});

			return totalSize;
		} catch (error) {
			this.loggingService.error('Failed to calculate user storage usage', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async canUserUpload(
		userId: string,
		fileSize: number,
	): Promise<{
		canUpload: boolean;
		currentUsage: number;
		maxLimit: number;
		remainingSpace: number;
		wouldExceedBy?: number;
	}> {
		try {
			this.loggingService.info('Checking if user can upload file', {
				userId,
				fileSize,
			});

			// Get user's storage limit
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			// Calculate current usage
			const currentUsage = await this.calculateUserStorageUsage(userId);
			const maxLimit = user.maxUploadLimit;
			const remainingSpace = maxLimit - currentUsage;
			const wouldExceedBy = fileSize - remainingSpace;

			const canUpload = fileSize <= remainingSpace;

			this.loggingService.info('Upload capacity check completed', {
				userId,
				canUpload,
				currentUsage,
				maxLimit,
				remainingSpace,
				fileSize,
				wouldExceedBy: canUpload ? undefined : wouldExceedBy,
			});

			return {
				canUpload,
				currentUsage,
				maxLimit,
				remainingSpace,
				wouldExceedBy: canUpload ? undefined : wouldExceedBy,
			};
		} catch (error) {
			this.loggingService.error('Failed to check upload capacity', {
				userId,
				fileSize,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getUserStorageStats(userId: string): Promise<{
		currentUsage: number;
		maxLimit: number;
		remainingSpace: number;
		usagePercentage: number;
		fileCount: number;
	}> {
		try {
			this.loggingService.info('Getting user storage statistics', { userId });

			// Get user's storage limit
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			// Get user's media files
			const userMedia = await this.mediaRepository.findByUserId(userId);
			const currentUsage = userMedia.reduce((sum, media) => sum + media.size, 0);
			const maxLimit = user.maxUploadLimit;
			const remainingSpace = Math.max(0, maxLimit - currentUsage);
			const usagePercentage = maxLimit > 0 ? (currentUsage / maxLimit) * 100 : 0;
			const fileCount = userMedia.length;

			const stats = {
				currentUsage,
				maxLimit,
				remainingSpace,
				usagePercentage: Math.round(usagePercentage * 100) / 100, // Round to 2 decimal places
				fileCount,
			};

			this.loggingService.info('Storage statistics retrieved', {
				userId,
				...stats,
			});

			return stats;
		} catch (error) {
			this.loggingService.error('Failed to get user storage statistics', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
