import { S3UploadService } from '../../../src/infrastructure/services/s3-upload.service';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
	S3: jest.fn().mockImplementation(() => ({
		upload: jest.fn().mockReturnValue({
			promise: jest.fn().mockResolvedValue({ Location: 'https://s3.amazonaws.com/bucket/key' }),
		}),
		deleteObject: jest.fn().mockReturnValue({
			promise: jest.fn().mockResolvedValue({}),
		}),
		getSignedUrl: jest.fn().mockReturnValue('https://s3.amazonaws.com/bucket/key?signature'),
	})),
}));

describe('S3UploadService', () => {
	const makeSut = () => {
		const sut = new S3UploadService();
		return { sut };
	};

	it('uploads file successfully', async () => {
		const { sut } = makeSut();
		const fileBuffer = Buffer.from('test file content');
		const filename = 'test.mp4';

		const result = await sut.uploadFile(fileBuffer, filename, 'video/mp4');

		expect(result.url).toBeDefined();
		expect(result.key).toBeDefined();
		expect(result.bucket).toBeDefined();
		expect(result.url).toContain('amazonaws.com');
	});

	it('deletes file successfully', async () => {
		const { sut } = makeSut();
		const s3Key = 'uploads/test.mp4';

		const result = await sut.deleteFile(s3Key);

		expect(result).toBe(true);
	});

	it('generates signed URL', async () => {
		const { sut } = makeSut();
		const s3Key = 'uploads/test.mp4';

		const url = await sut.getSignedUrl(s3Key);

		expect(url).toBeDefined();
		expect(typeof url).toBe('string');
		expect(url).toContain('s3.amazonaws.com');
	});
});
