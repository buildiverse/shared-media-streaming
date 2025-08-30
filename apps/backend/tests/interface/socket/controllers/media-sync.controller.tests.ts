import { MediaSyncController } from '../../../../src/interface/socket/controllers/media-sync.controller';
import { JoinRoomUseCase } from '../../../../src/application/use-cases/join-room.usecase';
import { ILoggingService } from '../../../../src/domain/services/ilogging.service';

describe('MediaSyncController', () => {
	const makeSut = () => {
		const joinRoomUseCase: jest.Mocked<JoinRoomUseCase> = {
			execute: jest.fn(),
		} as any;

		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn() as any,
			error: jest.fn(),
			fatal: jest.fn() as any,
		};

		const sut = new MediaSyncController(loggingService, joinRoomUseCase);
		return { sut, joinRoomUseCase, loggingService };
	};

	it('handles join room request', async () => {
		const { sut, joinRoomUseCase } = makeSut();
		const mockResult = { success: true, roomId: 'room123', participantCount: 1 };
		joinRoomUseCase.execute.mockResolvedValue(mockResult);

		const socket = {
			id: 'socket123',
			join: jest.fn(),
			emit: jest.fn(),
			to: jest.fn().mockReturnValue({ emit: jest.fn() }),
			request: { requestId: 'req123' },
			user: { userId: 'user123' },
		} as any;

		const roomId = 'room123';

		await sut.handleJoinRoom(socket, roomId);

		expect(joinRoomUseCase.execute).toHaveBeenCalledWith({
			roomId: 'room123',
			userId: 'user123',
			socketId: 'socket123',
		});
		expect(socket.join).toHaveBeenCalledWith('room123');
		expect(joinRoomUseCase.execute).toHaveBeenCalledWith({
			roomId: 'room123',
			userId: 'user123',
			socketId: 'socket123',
		});
	});

	it('handles media play event', async () => {
		const { sut } = makeSut();

		const socket = {
			id: 'socket123',
			to: jest.fn().mockReturnValue({ emit: jest.fn() }),
			request: { requestId: 'req123' },
		} as any;

		const data = { roomId: 'room123', currentTime: 30 };

		await sut.handleMediaPlay(socket, data);

		expect(socket.to).toHaveBeenCalledWith('room123');
		expect(socket.to('room123').emit).toHaveBeenCalledWith('media-play', {
			roomId: 'room123',
			currentTime: 30,
			socketId: 'socket123',
			timestamp: expect.any(Date),
		});
	});

	it('handles media pause event', async () => {
		const { sut } = makeSut();

		const socket = {
			id: 'socket123',
			to: jest.fn().mockReturnValue({ emit: jest.fn() }),
			request: { requestId: 'req123' },
		} as any;

		const data = { roomId: 'room123', currentTime: 45 };

		await sut.handleMediaPause(socket, data);

		expect(socket.to).toHaveBeenCalledWith('room123');
		expect(socket.to('room123').emit).toHaveBeenCalledWith('media-pause', {
			roomId: 'room123',
			currentTime: 45,
			socketId: 'socket123',
			timestamp: expect.any(Date),
		});
	});
});
