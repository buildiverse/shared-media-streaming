import { Media } from '../../../src/domain/entities/media.entity';

describe('Media Entity', () => {
	it('creates media with valid data', () => {
		const media = new Media(
			'media123',
			'Test Video',
			'A test video file',
			'test.mp4',
			'original.mp4',
			'video/mp4',
			1024 * 1024, // 1MB
			120, // 2 minutes
			'https://s3.example.com/test.mp4',
			'uploads/test.mp4',
			'user123'
		);

		expect(media.title).toBe('Test Video');
		expect(media.filename).toBe('test.mp4');
		expect(media.size).toBe(1024 * 1024);
		expect(media.getFileSizeInMB()).toBe(1);
		expect(media.id).toBeDefined();
		expect(media.createdAt).toBeInstanceOf(Date);
	});

	it('has validation methods', () => {
		expect(Media.validateFileSize(1024 * 1024)).toBe(true);
		expect(Media.validateFileSize(1024 * 1024 * 1024 * 2)).toBe(false);
		expect(Media.validateMimeType('video/mp4')).toBe(true);
		expect(Media.validateMimeType('application/x-executable')).toBe(false);
	});
});
