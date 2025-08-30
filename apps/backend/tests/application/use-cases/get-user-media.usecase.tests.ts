import { GetUserMediaUseCase } from '../../../src/application/use-cases/get-user-media.usecase';
import { IMediaRepository } from '../../../src/domain/repositories/imedia.repository';
import { ILoggingService } from '../../../src/domain/services/ilogging.service';

describe('GetUserMediaUseCase', () => {
	const makeSut = () => {
		const mediaRepository: jest.Mocked<IMediaRepository> = {
			findByUserId: jest.fn(),
			create: jest.fn() as any,
			findById: jest.fn() as any,
			findByMimeType: jest.fn() as any,
			update: jest.fn() as any,
			delete: jest.fn() as any,
			search: jest.fn() as any,
			getUserMediaStats: jest.fn(),
		};
		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn() as any,
			error: jest.fn() as any,
			fatal: jest.fn() as any,
		};

		const sut = new GetUserMediaUseCase(mediaRepository, loggingService);
		return { sut, mediaRepository, loggingService };
	};

	it('retrieves user media with pagination', async () => {
		const { sut, mediaRepository } = makeSut();
		const mockMedia = [{ id: '1', title: 'Test' }] as any;
		mediaRepository.findByUserId.mockResolvedValue(mockMedia);
		mediaRepository.getUserMediaStats.mockResolvedValue({
			totalFiles: 1,
			totalSize: 100,
			videoCount: 1,
			audioCount: 0,
			imageCount: 0,
		});

		const result = await sut.execute({ userId: 'user1', limit: 10, offset: 0 });

		expect(result.media).toEqual(mockMedia);
		expect(result.total).toBe(1);
		expect(result.hasMore).toBe(false);
	});
});
