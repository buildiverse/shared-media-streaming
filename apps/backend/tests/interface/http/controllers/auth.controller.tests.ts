import { AuthController } from '../../../../src/interface/http/controllers/auth.controller';
import { LoginUseCase } from '../../../../src/application/use-cases/login.usecase';
import { ILoggingService } from '../../../../src/domain/services/ilogging.service';

describe('AuthController', () => {
	const makeSut = () => {
		const loginUseCase: jest.Mocked<LoginUseCase> = {
			execute: jest.fn(),
		} as any;

		const loggingService: jest.Mocked<ILoggingService> = {
			debug: jest.fn() as any,
			info: jest.fn(),
			warn: jest.fn() as any,
			error: jest.fn(),
			fatal: jest.fn() as any,
		};

		const sut = new AuthController(loginUseCase, loggingService);
		return { sut, loginUseCase, loggingService };
	};

	it('handles login request successfully', async () => {
		const { sut, loginUseCase } = makeSut();
		const mockResult = {
			user: { 
				id: 'user123', 
				username: 'testuser', 
				email: 'test@example.com', 
				password: 'hash',
				createdAt: new Date(),
				lastActiveAt: new Date(),
				updatedAt: new Date()
			} as any,
			accessToken: 'access.jwt',
			refreshToken: 'refresh.jwt',
		};
		loginUseCase.execute.mockResolvedValue(mockResult);

		const req = {
			body: { username: 'testuser', password: 'password123' },
			requestId: 'req123',
			get: jest.fn().mockReturnValue('jest-test-agent'),
			ip: '127.0.0.1',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		await sut.login(req, res);

		expect(loginUseCase.execute).toHaveBeenCalledWith({
			username: 'testuser',
			password: 'password123',
			userAgent: 'jest-test-agent',
			ipAddress: '127.0.0.1',
		});
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: 'Login successful',
			data: {
				user: {
					id: 'user123',
					username: 'testuser',
					email: 'test@example.com',
				},
				accessToken: 'access.jwt',
				refreshToken: 'refresh.jwt',
			},
		});
	});

	it('handles login validation errors', async () => {
		const { sut, loginUseCase } = makeSut();
		loginUseCase.execute.mockRejectedValue(new Error('Invalid credentials'));

		const req = {
			body: { username: '', password: '' },
			requestId: 'req123',
			ip: '127.0.0.1',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		await sut.login(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: 'Validation failed',
			errors: expect.arrayContaining([
				expect.objectContaining({
					code: 'too_small',
					message: 'Username is required',
				}),
				expect.objectContaining({
					code: 'too_small',
					message: 'Password is required',
				}),
			]),
		});
	});
});
