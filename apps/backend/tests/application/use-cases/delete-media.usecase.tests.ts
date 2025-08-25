import { DeleteMediaUseCase } from '../../../src/application/use-cases/delete-media.usecase';
import { IMediaRepository } from '../../../src/domain/repositories/imedia.repository';
import { IFileUploadService } from '../../../src/domain/services/ifile-upload.service';
import { ILoggingService } from '../../../src/domain/services/ilogging.service';

describe('DeleteMediaUseCase', () => {
	const makeSut = () => {
		const mediaRepository: jest.Mocked<IMediaRepository> = {
			findById: jest.fn(),
			delete: jest.fn(),
			create: jest.fn() as any,
			findByUserId: jest.fn() as any,
			findByMimeType: jest.fn() as any,
			update: jest.fn() as any,
			search: jest.fn() as any,
			getUserMediaStats: jest.fn() as any,
		};
		const fileUploadService: jest.Mocked<IFileUploadService> = {
			deleteFile: jest.fn(),
			uploadFile: jest.fn() as any,
			getSignedUrl: jest.fn() as any,
		};
		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			fatal: jest.fn() as any,
		};

		const sut = new DeleteMediaUseCase(mediaRepository, fileUploadService, loggingService);
		return { sut, mediaRepository, fileUploadService, loggingService };
	};

	it('deletes media successfully for owner', async () => {
		const { sut, mediaRepository, fileUploadService } = makeSut();
		const mockMedia = { id: '1', title: 'Test', s3Key: 's3key', uploadedBy: 'user1' } as any;
		mediaRepository.findById.mockResolvedValue(mockMedia);
		mediaRepository.delete.mockResolvedValue(true);
		fileUploadService.deleteFile.mockResolvedValue(true);

		const result = await sut.execute({ mediaId: '1', userId: 'user1' });

		expect(result.success).toBe(true);
		expect(fileUploadService.deleteFile).toHaveBeenCalledWith('s3key');
		expect(mediaRepository.delete).toHaveBeenCalledWith('1');
	});

	it('rejects deletion for non-owner', async () => {
		const { sut, mediaRepository } = makeSut();
		const mockMedia = { id: '1', title: 'Test', s3Key: 's3key', uploadedBy: 'user1' } as any;
		mediaRepository.findById.mockResolvedValue(mockMedia);

		const result = await sut.execute({ mediaId: '1', userId: 'user2' });

		expect(result.success).toBe(false);
		expect(result.message).toContain('own media');
	});
});
