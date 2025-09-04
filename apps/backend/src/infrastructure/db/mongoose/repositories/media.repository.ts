import { Media } from '../../../../domain/entities/media.entity';
import { IMediaRepository } from '../../../../domain/repositories/imedia.repository';
import { MediaModel } from '../models/media.model';

export class MediaRepository implements IMediaRepository {
	async create(mediaData: Omit<Media, 'id' | 'createdAt' | 'updatedAt'>): Promise<Media> {
		const media = await MediaModel.create(mediaData);

		return new Media(
			(media._id as any).toString(),
			media.title,
			media.description,
			media.filename,
			media.originalName,
			media.mimeType,
			media.size,
			media.duration,
			media.url,
			media.s3Key,
			media.uploadedBy,
			media.thumbnails || [],
			media.createdAt,
			media.updatedAt,
		);
	}

	async findById(id: string): Promise<Media | null> {
		const media = await MediaModel.findById(id).exec();
		if (!media) return null;

		return new Media(
			(media._id as any).toString(),
			media.title,
			media.description,
			media.filename,
			media.originalName,
			media.mimeType,
			media.size,
			media.duration,
			media.url,
			media.s3Key,
			media.uploadedBy,
			media.thumbnails || [],
			media.createdAt,
			media.updatedAt,
		);
	}

	async findByUserId(userId: string): Promise<Media[]> {
		const media = await MediaModel.find({ uploadedBy: userId }).sort({ createdAt: -1 }).exec();

		return media.map(
			(m) =>
				new Media(
					(m._id as any).toString(),
					m.title,
					m.description,
					m.filename,
					m.originalName,
					m.mimeType,
					m.size,
					m.duration,
					m.url,
					m.s3Key,
					m.uploadedBy,
					m.thumbnails || [],
					m.createdAt,
					m.updatedAt,
				),
		);
	}

	async findByMimeType(mimeType: string): Promise<Media[]> {
		const media = await MediaModel.find({ mimeType }).exec();

		return media.map(
			(m) =>
				new Media(
					(m._id as any).toString(),
					m.title,
					m.description,
					m.filename,
					m.originalName,
					m.mimeType,
					m.size,
					m.duration,
					m.url,
					m.s3Key,
					m.uploadedBy,
					m.thumbnails || [],
					m.createdAt,
					m.updatedAt,
				),
		);
	}

	async update(id: string, updates: Partial<Media>): Promise<Media | null> {
		const media = await MediaModel.findByIdAndUpdate(
			id,
			{ ...updates, updatedAt: new Date() },
			{ new: true },
		).exec();

		if (!media) return null;

		return new Media(
			(media._id as any).toString(),
			media.title,
			media.description,
			media.filename,
			media.originalName,
			media.mimeType,
			media.size,
			media.duration,
			media.url,
			media.s3Key,
			media.uploadedBy,
			media.thumbnails || [],
			media.createdAt,
			media.updatedAt,
		);
	}

	async delete(id: string): Promise<boolean> {
		const result = await MediaModel.findByIdAndDelete(id).exec();
		return !!result;
	}

	async search(query: string): Promise<Media[]> {
		const media = await MediaModel.find(
			{ $text: { $search: query } },
			{ score: { $meta: 'textScore' } },
		)
			.sort({ score: { $meta: 'textScore' } })
			.exec();

		return media.map(
			(m) =>
				new Media(
					(m._id as any).toString(),
					m.title,
					m.description,
					m.filename,
					m.originalName,
					m.mimeType,
					m.size,
					m.duration,
					m.url,
					m.s3Key,
					m.uploadedBy,
					m.thumbnails || [],
					m.createdAt,
					m.updatedAt,
				),
		);
	}

	async getUserMediaStats(userId: string): Promise<{
		totalFiles: number;
		totalSize: number;
		videoCount: number;
		audioCount: number;
		imageCount: number;
	}> {
		const result = await MediaModel.aggregate([
			{ $match: { uploadedBy: userId } },
			{
				$group: {
					_id: null,
					totalFiles: { $sum: 1 },
					totalSize: { $sum: '$size' },
					videoCount: {
						$sum: { $cond: [{ $regexMatch: { input: '$mimeType', regex: /^video\// } }, 1, 0] }
					},
					audioCount: {
						$sum: { $cond: [{ $regexMatch: { input: '$mimeType', regex: /^audio\// } }, 1, 0] }
					},
					imageCount: {
						$sum: { $cond: [{ $regexMatch: { input: '$mimeType', regex: /^image\// } }, 1, 0] }
					}
				}
			}
		]).exec();

		const stats = result[0] || {
			totalFiles: 0,
			totalSize: 0,
			videoCount: 0,
			audioCount: 0,
			imageCount: 0
		};

		return {
			totalFiles: stats.totalFiles,
			totalSize: stats.totalSize,
			videoCount: stats.videoCount,
			audioCount: stats.audioCount,
			imageCount: stats.imageCount,
		};
	}
}
