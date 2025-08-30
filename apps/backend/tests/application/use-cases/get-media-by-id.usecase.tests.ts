import { GetMediaByIdUseCase } from '../../../src/application/use-cases/get-media-by-id.usecase';
import { IMediaRepository } from '../../../src/domain/repositories/imedia.repository';
import { ILoggingService } from '../../../src/domain/services/ilogging.service';

describe('GetMediaByIdUseCase', () => {
	const makeSut = () => {
		const mediaRepository: jest.Mocked<IMediaRepository> = {
			findById: jest.fn(),
			create: jest.fn() as any,
			findByUserId: jest.fn() as any,
			findByMimeType: jest.fn() as any,
			update: jest.fn() as any,
			delete: jest.fn() as any,
			search: jest.fn() as any,
			getUserMediaStats: jest.fn() as any,
		};
		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn() as any,
			error: jest.fn(),
			fatal: jest.fn() as any,
		};

		const sut = new GetMediaByIdUseCase(mediaRepository, loggingService);
		return { sut, mediaRepository, loggingService };
	};

	it('retrieves media by ID successfully', async () => {
		const { sut, mediaRepository } = makeSut();
		const mockMedia = { id: '1', title: 'Test Video' } as any;
		mediaRepository.findById.mockResolvedValue(mockMedia);

		const result = await sut.execute({ mediaId: '1', userId: 'user1' });

		expect(result.success).toBe(true);
		expect(result.media).toEqual(mockMedia);
	});

	it('returns null when media not found', async () => {
		const { sut, mediaRepository } = makeSut();
		mediaRepository.findById.mockResolvedValue(null);

		const result = await sut.execute({ mediaId: '999', userId: 'user1' });

		expect(result.success).toBe(false);
		expect(result.media).toBeNull();
	});
});

