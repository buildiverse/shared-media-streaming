import { MediaController } from '../../../../src/interface/http/controllers/media.controller';
import { UploadMediaUseCase } from '../../../../src/application/use-cases/upload-media.usecase';
import { GetUserMediaUseCase } from '../../../../src/application/use-cases/get-user-media.usecase';
import { GetMediaByIdUseCase } from '../../../../src/application/use-cases/get-media-by-id.usecase';
import { DeleteMediaUseCase } from '../../../../src/application/use-cases/delete-media.usecase';
import { ILoggingService } from '../../../../src/domain/services/ilogging.service';

describe('MediaController', () => {
	const makeSut = () => {
		const uploadMediaUseCase: jest.Mocked<UploadMediaUseCase> = {
			execute: jest.fn(),
		} as any;

		const getUserMediaUseCase: jest.Mocked<GetUserMediaUseCase> = {
			execute: jest.fn(),
		} as any;

		const getMediaByIdUseCase: jest.Mocked<GetMediaByIdUseCase> = {
			execute: jest.fn(),
		} as any;

		const deleteMediaUseCase: jest.Mocked<DeleteMediaUseCase> = {
			execute: jest.fn(),
		} as any;

		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn() as any,
			error: jest.fn(),
			fatal: jest.fn() as any,
		};

		const sut = new MediaController(
			uploadMediaUseCase,
			getUserMediaUseCase,
			getMediaByIdUseCase,
			deleteMediaUseCase,
			loggingService
		);

		return {
			sut,
			uploadMediaUseCase,
			getUserMediaUseCase,
			getMediaByIdUseCase,
			deleteMediaUseCase,
			loggingService,
		};
	};

	it('uploads media successfully', async () => {
		const { sut, uploadMediaUseCase } = makeSut();
		const mockResult = { 
			media: { 
				id: 'media123', 
				title: 'Test Video',
				description: 'Test',
				filename: 'test.mp4',
				originalName: 'test.mp4',
				mimeType: 'video/mp4',
				size: 1024,
				duration: 0,
				url: 'https://s3.example.com/test.mp4',
				s3Key: 'test.mp4',
				uploadedBy: 'user123',
				createdAt: new Date(),
				getFileSizeInMB: () => 0.001
			} as any, 
			uploadUrl: 'https://s3.example.com/test.mp4' 
		};
		uploadMediaUseCase.execute.mockResolvedValue(mockResult);

		const req = {
			file: { 
				buffer: Buffer.from('test'), 
				originalname: 'test.mp4',
				filename: 'test.mp4',
				mimetype: 'video/mp4',
				size: 1024
			},
			body: { title: 'Test Video', description: 'Test' },
			user: { userId: 'user123' },
			requestId: 'req123',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		await sut.uploadMedia(req, res);

		expect(uploadMediaUseCase.execute).toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: 'Media uploaded successfully',
			media: expect.objectContaining({
				id: 'media123',
				title: 'Test Video',
			}),
		});
	});

	it('gets user media with pagination', async () => {
		const { sut, getUserMediaUseCase } = makeSut();
		const mockResult = { media: [], total: 0, hasMore: false };
		getUserMediaUseCase.execute.mockResolvedValue(mockResult);

		const req = {
			user: { userId: 'user123' },
			query: { limit: '10', offset: '0' },
			requestId: 'req123',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		await sut.getUserMedia(req, res);

		expect(getUserMediaUseCase.execute).toHaveBeenCalledWith({
			userId: 'user123',
			limit: 10,
			offset: 0,
			type: 'all',
		});
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			media: [],
			pagination: {
				total: 0,
				hasMore: false,
				limit: 10,
				offset: 0,
			},
		});
	});

	it('deletes media successfully', async () => {
		const { sut, deleteMediaUseCase } = makeSut();
		const mockResult = { success: true, message: 'Media deleted successfully' };
		deleteMediaUseCase.execute.mockResolvedValue(mockResult);

		const req = {
			params: { id: 'media123' },
			user: { userId: 'user123' },
			requestId: 'req123',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		await sut.deleteMedia(req, res);

		expect(deleteMediaUseCase.execute).toHaveBeenCalledWith({
			mediaId: 'media123',
			userId: 'user123',
		});
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: 'Media deleted successfully',
		});
	});
});
