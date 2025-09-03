export interface IStorageService {
	/**
	 * Calculate total storage used by a user
	 * @param userId - The user ID
	 * @returns Total storage used in bytes
	 */
	calculateUserStorageUsage(userId: string): Promise<number>;

	/**
	 * Check if a user can upload a file of given size
	 * @param userId - The user ID
	 * @param fileSize - Size of the file to upload in bytes
	 * @returns Object with canUpload boolean and details
	 */
	canUserUpload(
		userId: string,
		fileSize: number,
	): Promise<{
		canUpload: boolean;
		currentUsage: number;
		maxLimit: number;
		remainingSpace: number;
		wouldExceedBy?: number;
	}>;

	/**
	 * Get storage usage statistics for a user
	 * @param userId - The user ID
	 * @returns Storage usage statistics
	 */
	getUserStorageStats(userId: string): Promise<{
		currentUsage: number;
		maxLimit: number;
		remainingSpace: number;
		usagePercentage: number;
		fileCount: number;
	}>;
}
