import { IMediaRepository } from '../../domain/repositories/imedia.repository';
import { IFileUploadService } from '../../domain/services/ifile-upload.service';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface DeleteMediaInput {
	mediaId: string;
	userId: string; // Required: for access control
}

export interface DeleteMediaResult {
	success: boolean;
	message: string;
}

export class DeleteMediaUseCase {
	constructor(
		private mediaRepository: IMediaRepository,
		private fileUploadService: IFileUploadService,
		private loggingService: ILoggingService,
	) {}

	async execute(input: DeleteMediaInput): Promise<DeleteMediaResult> {
		const { mediaId, userId } = input;

		try {
			// Get media to check ownership and get S3 key
			const media = await this.mediaRepository.findById(mediaId);

			if (!media) {
				this.loggingService.info('Media not found for deletion', {
					mediaId,
					userId,
				});

				return {
					success: false,
					message: 'Media not found',
				};
			}

			// Check ownership
			if (media.uploadedBy !== userId) {
				this.loggingService.warn('Unauthorized media deletion attempt', {
					mediaId,
					requestingUserId: userId,
					mediaOwnerId: media.uploadedBy,
				});

				return {
					success: false,
					message: 'You can only delete your own media',
				};
			}

			// Delete from S3 first
			await this.fileUploadService.deleteFile(media.s3Key);

			// Delete from database
			const deleted = await this.mediaRepository.delete(mediaId);

			if (!deleted) {
				this.loggingService.error('Failed to delete media from database', {
					mediaId,
					userId,
				});

				return {
					success: false,
					message: 'Failed to delete media',
				};
			}

			this.loggingService.info('Media deleted successfully', {
				mediaId,
				title: media.title,
				userId,
			});

			return {
				success: true,
				message: 'Media deleted successfully',
			};
		} catch (error) {
			this.loggingService.error('Failed to delete media', error, {
				mediaId,
				userId,
			});

			throw error;
		}
	}
}
