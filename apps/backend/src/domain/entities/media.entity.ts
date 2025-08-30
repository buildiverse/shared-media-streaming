export class Media {
	constructor(
		public readonly id: string,
		public readonly title: string,
		public readonly description: string,
		public readonly filename: string,
		public readonly originalName: string,
		public readonly mimeType: string,
		public readonly size: number,
		public readonly duration: number, // in seconds
		public readonly url: string,
		public readonly s3Key: string,
		public readonly uploadedBy: string, // userId
		public readonly thumbnails: string[] = [],
		public readonly createdAt: Date = new Date(),
		public readonly updatedAt: Date = new Date(),
	) {}

	// Business logic methods
	updateMetadata(title: string, description: string): Media {
		return new Media(
			this.id,
			title,
			description,
			this.filename,
			this.originalName,
			this.mimeType,
			this.size,
			this.duration,
			this.url,
			this.s3Key,
			this.uploadedBy,
			this.thumbnails,
			this.createdAt,
			new Date(),
		);
	}

	isVideo(): boolean {
		return this.mimeType.startsWith('video/');
	}

	isAudio(): boolean {
		return this.mimeType.startsWith('audio/');
	}

	getFileSizeInMB(): number {
		return Math.round((this.size / (1024 * 1024)) * 100) / 100;
	}

	// Validation methods
	static validateTitle(title: string): boolean {
		return title.length >= 1 && title.length <= 100;
	}

	static validateDescription(description: string): boolean {
		return description.length <= 500;
	}

	static validateFileSize(size: number): boolean {
		const maxSize = 500 * 1024 * 1024; // 500MB
		return size > 0 && size <= maxSize;
	}

	static validateMimeType(mimeType: string): boolean {
		const allowedTypes = [
			'video/mp4',
			'video/webm',
			'video/ogg',
			'audio/mp3',
			'audio/wav',
			'audio/ogg',
			'image/jpeg',
			'image/png',
			'image/gif',
		];
		return allowedTypes.includes(mimeType);
	}
}
