import { UploadMediaUseCase } from '../../../src/application/use-cases/upload-media.usecase';
import { IMediaRepository } from '../../../src/domain/repositories/imedia.repository';
import { IFileUploadService } from '../../../src/domain/services/ifile-upload.service';
import { ILoggingService } from '../../../src/domain/services/ilogging.service';

const makeSut = () => {
	const mediaRepository: jest.Mocked<IMediaRepository> = {
		create: jest.fn(),
		findById: jest.fn() as any,
		findByUserId: jest.fn() as any,
		findByMimeType: jest.fn() as any,
		update: jest.fn() as any,
		delete: jest.fn() as any,
		search: jest.fn() as any,
		getUserMediaStats: jest.fn() as any,
	};
	const fileUploadService: jest.Mocked<IFileUploadService> = {
		uploadFile: jest.fn(),
		deleteFile: jest.fn() as any,
		getSignedUrl: jest.fn() as any,
	};
	const loggingService: jest.Mocked<ILoggingService> = {
		debug: jest.fn() as any,
		info: jest.fn() as any,
		warn: jest.fn() as any,
		error: jest.fn() as any,
		fatal: jest.fn() as any,
	};

	const sut = new UploadMediaUseCase(mediaRepository, fileUploadService, loggingService);
	return { sut, mediaRepository, fileUploadService, loggingService };
};

describe('UploadMediaUseCase', () => {
	it('uploads and creates media on valid input', async () => {
		const { sut, fileUploadService, mediaRepository } = makeSut();
		fileUploadService.uploadFile.mockResolvedValue({
			url: 'https://s3/url',
			key: 's3key',
			bucket: 'test-bucket',
		});
		mediaRepository.create.mockResolvedValue({
			id: 'm1',
			title: 't',
			description: '',
			filename: 'f',
			originalName: 'orig',
			mimeType: 'video/mp4',
			size: 10,
			duration: 0,
			url: 'https://s3/url',
			s3Key: 's3key',
			uploadedBy: 'u1',
			createdAt: new Date(),
			getFileSizeInMB() {
				return 0.01;
			},
		} as any);

		const result = await sut.execute({
			title: 't',
			description: '',
			filename: 'f',
			originalName: 'orig',
			mimeType: 'video/mp4',
			size: 10,
			buffer: Buffer.from('x'),
			uploadedBy: 'u1',
		});

		expect(fileUploadService.uploadFile).toHaveBeenCalled();
		expect(mediaRepository.create).toHaveBeenCalled();
		expect(result.media.id).toBe('m1');
	});

	it('rejects unsupported mime types', async () => {
		const { sut } = makeSut();
		await expect(
			sut.execute({
				title: 't',
				description: '',
				filename: 'f',
				originalName: 'orig',
				mimeType: 'application/pdf',
				size: 10,
				buffer: Buffer.from('x'),
				uploadedBy: 'u1',
			}),
		).rejects.toThrow('Unsupported file type');
	});
});
