import { SocketService } from '../../../src/infrastructure/services/socket.service';
import { ILoggingService } from '../../../src/domain/services/ilogging.service';
import { IAuthService } from '../../../src/domain/services/iauth.service';

// Mock Socket.IO

describe('SocketService', () => {
	const makeSut = () => {
		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn() as any,
			error: jest.fn(),
			fatal: jest.fn() as any,
		};

		const authService: jest.Mocked<IAuthService> = {
			verifyAccessToken: jest.fn() as any,
			generateAccessToken: jest.fn() as any,
			generateRefreshToken: jest.fn() as any,
			verifyRefreshToken: jest.fn() as any,
		};

		const sut = new SocketService(loggingService, authService);
		return { sut, loggingService, authService };
	};

	it('initializes socket service', () => {
		const { sut } = makeSut();

		expect(sut).toBeDefined();
		expect(sut['io']).toBeNull(); // Private property
	});

	it('initializes socket service', () => {
		const { sut } = makeSut();

		expect(sut).toBeDefined();
		expect(sut['io']).toBeNull(); // Private property
	});

	it('has logging service', () => {
		const { sut, loggingService } = makeSut();

		expect(sut).toBeDefined();
		expect(loggingService).toBeDefined();
	});
});
