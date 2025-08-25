import { Media } from '../../domain/entities/media.entity';
import { IMediaRepository } from '../../domain/repositories/imedia.repository';
import { ILoggingService } from '../../domain/services/ilogging.service';

export interface GetUserMediaInput {
	userId: string;
	limit?: number;
	offset?: number;
	type?: 'video' | 'audio' | 'image' | 'all';
}

export interface GetUserMediaResult {
	media: Media[];
	total: number;
	hasMore: boolean;
}

export class GetUserMediaUseCase {
	constructor(
		private mediaRepository: IMediaRepository,
		private loggingService: ILoggingService,
	) {}

	async execute(input: GetUserMediaInput): Promise<GetUserMediaResult> {
		const { userId, limit = 20, offset = 0, type = 'all' } = input;

		// Get user media (repository doesn't support pagination yet)
		const allMedia = await this.mediaRepository.findByUserId(userId);

		// Filter by type if specified
		let filteredMedia = allMedia;
		if (type !== 'all') {
			filteredMedia = allMedia.filter((item) => {
				if (type === 'video') return item.mimeType.startsWith('video/');
				if (type === 'audio') return item.mimeType.startsWith('audio/');
				if (type === 'image') return item.mimeType.startsWith('image/');
				return true;
			});
		}

		// Apply pagination manually
		const media = filteredMedia.slice(offset, offset + limit);

		// Get total count for pagination
		const stats = await this.mediaRepository.getUserMediaStats(userId);
		const total = stats.totalFiles;

		this.loggingService.info('User media retrieved', {
			userId,
			count: media.length,
			total,
			limit,
			offset,
			type,
		});

		return {
			media,
			total,
			hasMore: offset + media.length < total,
		};
	}
}
