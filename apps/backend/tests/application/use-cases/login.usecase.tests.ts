import { LoginUseCase } from '../../../src/application/use-cases/login.usecase';
import { ITokenRepository } from '../../../src/domain/repositories/itoken.repository';
import { IUserRepository } from '../../../src/domain/repositories/iuser.repository';
import { IAuthService } from '../../../src/domain/services/iauth.service';

// Minimal password service shape used by LoginUseCase
interface MockPasswordService {
	comparePassword: (plain: string, hashed: string) => Promise<boolean>;
}

describe('LoginUseCase', () => {
	const makeSut = () => {
		const userRepository: jest.Mocked<IUserRepository> = {
			findByUsername: jest.fn(),
			findByEmail: jest.fn() as any,
			findById: jest.fn() as any,
			create: jest.fn() as any,
			update: jest.fn() as any,
			delete: jest.fn() as any,
			checkUsernameExists: jest.fn() as any,
			checkEmailExists: jest.fn() as any,
			updateLastActive: jest.fn(),
			getUserStats: jest.fn() as any,
		};

		const tokenRepository: jest.Mocked<ITokenRepository> = {
			create: jest.fn(),
			findByTokenId: jest.fn() as any,
			cleanupExpired: jest.fn() as any,
			findByUserId: jest.fn() as any,
			revoke: jest.fn() as any,
			revokeAllForUser: jest.fn() as any,
		};

		const passwordService: jest.Mocked<MockPasswordService> = {
			comparePassword: jest.fn(),
		} as any;

		const authService: jest.Mocked<IAuthService> = {
			generateAccessToken: jest.fn(),
			generateRefreshToken: jest.fn(),
			verifyAccessToken: jest.fn() as any,
			verifyRefreshToken: jest.fn() as any,
		};

		const sut = new LoginUseCase(
			userRepository,
			tokenRepository,
			passwordService as any,
			authService,
		);
		return { sut, userRepository, tokenRepository, passwordService, authService };
	};

	it('logs in successfully with valid credentials', async () => {
		const { sut, userRepository, passwordService, authService, tokenRepository } = makeSut();
		const user = {
			id: 'user-1',
			username: 'timo',
			email: 'timo@example.com',
			password: 'hashed',
			createdAt: new Date(),
		} as any;

		userRepository.findByUsername.mockResolvedValue(user);
		passwordService.comparePassword.mockResolvedValue(true);
		authService.generateAccessToken.mockReturnValue('access.jwt');
		authService.generateRefreshToken.mockReturnValue('refresh.jwt');
		tokenRepository.create.mockResolvedValue(undefined as any);

		const result = await sut.execute({
			username: 'timo',
			password: 'secret',
			userAgent: 'jest',
			ipAddress: '127.0.0.1',
		});

		expect(result.user).toEqual(user);
		expect(result.accessToken).toBe('access.jwt');
		expect(result.refreshToken).toBe('refresh.jwt');
		expect(userRepository.updateLastActive).toHaveBeenCalledWith('user-1');
		expect(tokenRepository.create).toHaveBeenCalled();
	});

	it('throws on invalid username', async () => {
		const { sut, userRepository } = makeSut();
		userRepository.findByUsername.mockResolvedValue(null);
		await expect(
			sut.execute({ username: 'nope', password: 'x', userAgent: 'jest', ipAddress: '127.0.0.1' }),
		).rejects.toThrow('Invalid credentials');
	});

	it('throws on invalid password', async () => {
		const { sut, userRepository, passwordService } = makeSut();
		userRepository.findByUsername.mockResolvedValue({
			id: 'u1',
			username: 'a',
			email: 'a@a.com',
			password: 'hashed',
		} as any);
		passwordService.comparePassword.mockResolvedValue(false);
		await expect(
			sut.execute({ username: 'a', password: 'wrong', userAgent: 'jest', ipAddress: '127.0.0.1' }),
		).rejects.toThrow('Invalid credentials');
	});
});

