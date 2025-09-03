import { Media } from '../../domain/entities/media.entity';
import { IMediaRepository } from '../../domain/repositories/imedia.repository';
import { IFileUploadService } from '../../domain/services/ifile-upload.service';
import { ILoggingService } from '../../domain/services/ilogging.service';
import { IStorageService } from '../../domain/services/istorage.service';
import { IThumbnailService } from '../../domain/services/ithumbnail.service';

export interface UploadMediaInput {
	title: string;
	description?: string;
	file: Buffer;
	originalName: string;
	mimeType: string;
	size: number;
	duration: number;
	uploadedBy: string;
	generateThumbnails?: boolean;
}

export interface UploadMediaResult {
	media: Media;
	thumbnails: string[];
}

export class UploadMediaUseCase {
	constructor(
		private readonly mediaRepository: IMediaRepository,
		private readonly fileUploadService: IFileUploadService,
		private readonly thumbnailService: IThumbnailService,
		private readonly storageService: IStorageService,
		private readonly loggingService: ILoggingService,
	) {}

	async execute(input: UploadMediaInput): Promise<UploadMediaResult> {
		try {
			this.loggingService.info('Starting media upload with thumbnails', {
				originalName: input.originalName,
				mimeType: input.mimeType,
				size: input.size,
				uploadedBy: input.uploadedBy,
				generateThumbnails: input.generateThumbnails,
			});

			// Check storage limits before upload
			const storageCheck = await this.storageService.canUserUpload(input.uploadedBy, input.size);
			if (!storageCheck.canUpload) {
				const errorMessage = `Storage limit exceeded. You have ${this.formatBytes(storageCheck.remainingSpace)} remaining, but this file is ${this.formatBytes(input.size)}. You would exceed your limit by ${this.formatBytes(storageCheck.wouldExceedBy!)}.`;
				this.loggingService.warn('Upload rejected due to storage limit', {
					userId: input.uploadedBy,
					fileSize: input.size,
					remainingSpace: storageCheck.remainingSpace,
					wouldExceedBy: storageCheck.wouldExceedBy,
				});
				throw new Error(errorMessage);
			}

			// Upload main file to S3
			const uploadResult = await this.fileUploadService.uploadFile(
				input.file,
				input.originalName,
				input.mimeType,
			);

			// Generate thumbnails for video files if requested
			let thumbnails: string[] = [];
			if (input.generateThumbnails !== false && input.mimeType.startsWith('video/')) {
				try {
					thumbnails = await this.thumbnailService.generateThumbnails(
						input.file,
						input.originalName,
						input.mimeType,
					);
					this.loggingService.info('Generated thumbnails successfully', {
						originalName: input.originalName,
						thumbnailCount: thumbnails.length,
					});
				} catch (thumbnailError) {
					this.loggingService.warn('Failed to generate thumbnails, continuing without them', {
						originalName: input.originalName,
						error: thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error',
					});
				}
			}

			// Create media entity
			const mediaData = {
				title: input.title,
				description: input.description || '',
				filename: uploadResult.key.split('/').pop() || input.originalName,
				originalName: input.originalName,
				mimeType: input.mimeType,
				size: input.size,
				duration: input.duration,
				url: uploadResult.url,
				s3Key: uploadResult.key,
				uploadedBy: input.uploadedBy,
				thumbnails,
			};

			const media = await this.mediaRepository.create(mediaData);

			this.loggingService.info('Media upload completed successfully', {
				mediaId: media.id,
				originalName: input.originalName,
				thumbnailCount: thumbnails.length,
			});

			return {
				media,
				thumbnails,
			};
		} catch (error) {
			this.loggingService.error('Media upload failed', {
				originalName: input.originalName,
				uploadedBy: input.uploadedBy,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}
