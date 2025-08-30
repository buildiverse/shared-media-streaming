import { Media } from '../../domain/entities/media.entity';
import { IMediaRepository } from '../../domain/repositories/imedia.repository';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface GetMediaByIdInput {
	mediaId: string;
	userId?: string; // Optional: for access control
}

export interface GetMediaByIdResult {
	media: Media | null;
	success: boolean;
}

export class GetMediaByIdUseCase {
	constructor(
		private mediaRepository: IMediaRepository,
		private loggingService: ILoggingService,
	) {}

	async execute(input: GetMediaByIdInput): Promise<GetMediaByIdResult> {
		const { mediaId, userId } = input;

		try {
			const media = await this.mediaRepository.findById(mediaId);

			if (!media) {
				this.loggingService.info('Media not found', {
					mediaId,
					userId,
				});

				return {
					media: null,
					success: false,
				};
			}

			// TODO: Add access control logic here
			// - Check if user has permission to view this media
			// - Check if media is public/private
			// - Check if user owns the media

			this.loggingService.info('Media retrieved successfully', {
				mediaId,
				title: media.title,
				userId,
			});

			return {
				media,
				success: true,
			};
		} catch (error) {
			this.loggingService.error('Failed to get media by ID', error, {
				mediaId,
				userId,
			});

			throw error;
		}
	}
}
