import { Media } from '../entities/media.entity';

export interface IMediaRepository {
	create(media: {
		title: string;
		description: string;
		filename: string;
		originalName: string;
		mimeType: string;
		size: number;
		duration: number;
		url: string;
		s3Key: string;
		uploadedBy: string;
	}): Promise<Media>;
	findById(id: string): Promise<Media | null>;
	findByUserId(userId: string): Promise<Media[]>;
	findByMimeType(mimeType: string): Promise<Media[]>;
	update(id: string, updates: Partial<Media>): Promise<Media | null>;
	delete(id: string): Promise<boolean>;
	search(query: string): Promise<Media[]>;
	getUserMediaStats(userId: string): Promise<{
		totalFiles: number;
		totalSize: number;
		videoCount: number;
		audioCount: number;
		imageCount: number;
	}>;
}
