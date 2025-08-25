import { Media } from '../../domain/entities/media.entity';
import { IMediaRepository } from '../../domain/repositories/imedia.repository';
import { IFileUploadService } from '../../domain/services/ifile-upload.service';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface UploadMediaInput {
	title: string;
	description?: string;
	filename: string;
	originalName: string;
	mimeType: string;
	size: number;
	buffer: Buffer;
	uploadedBy: string;
}

export interface UploadMediaResult {
	media: Media;
	uploadUrl: string;
}

export class UploadMediaUseCase {
	constructor(
		private mediaRepository: IMediaRepository,
		private fileUploadService: IFileUploadService,
		private loggingService: ILoggingService,
	) {}

	async execute(input: UploadMediaInput): Promise<UploadMediaResult> {
		// Validate media data
		if (!Media.validateTitle(input.title)) {
			throw new Error('Invalid title (1-100 characters)');
		}

		if (input.description && !Media.validateDescription(input.description)) {
			throw new Error('Description too long (max 500 characters)');
		}

		if (!Media.validateFileSize(input.size)) {
			throw new Error('File too large (max 500MB)');
		}

		if (!Media.validateMimeType(input.mimeType)) {
			throw new Error('Unsupported file type');
		}

		// Upload to S3
		const uploadResult = await this.fileUploadService.uploadFile(
			input.buffer,
			input.originalName,
			input.mimeType,
		);

		// Create media record
		const media = await this.mediaRepository.create({
			title: input.title,
			description: input.description || '',
			filename: input.filename,
			originalName: input.originalName,
			mimeType: input.mimeType,
			size: input.size,
			duration: 0, // TODO: Extract duration from media file
			url: uploadResult.url,
			s3Key: uploadResult.key,
			uploadedBy: input.uploadedBy,
		});

		this.loggingService.info('Media uploaded successfully', {
			mediaId: media.id,
			title: media.title,
			userId: input.uploadedBy,
			fileSize: media.getFileSizeInMB(),
		});

		return {
			media,
			uploadUrl: uploadResult.url,
		};
	}
}
