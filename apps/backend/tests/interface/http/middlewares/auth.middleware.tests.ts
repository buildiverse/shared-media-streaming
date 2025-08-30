import { authMiddleware } from '../../../../src/interface/http/middlewares/auth.middleware';
import { IAuthService } from '../../../../src/domain/services/iauth.service';

describe('AuthMiddleware', () => {
	const makeSut = () => {
		const authService: jest.Mocked<IAuthService> = {
			verifyAccessToken: jest.fn(),
			generateAccessToken: jest.fn() as any,
			generateRefreshToken: jest.fn() as any,
			verifyRefreshToken: jest.fn() as any,
		};

		const sut = authMiddleware(authService);
		return { sut, authService };
	};

	it('authenticates valid token', async () => {
		const { sut, authService } = makeSut();
		const mockUser = { userId: 'user123', username: 'testuser' };
		authService.verifyAccessToken.mockReturnValue(mockUser);

		const req = {
			headers: { authorization: 'Bearer valid.jwt.token' },
			requestId: 'req123',
		} as any;

		const res = {} as any;
		const next = jest.fn();

		await sut(req, res, next);

		expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid.jwt.token');
		expect(req.user).toEqual(mockUser);
		expect(next).toHaveBeenCalled();
	});

	it('rejects missing authorization header', async () => {
		const { sut } = makeSut();

		const req = {
			headers: {},
			requestId: 'req123',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		const next = jest.fn();

		await sut(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: 'Access token required',
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('rejects invalid token format', async () => {
		const { sut } = makeSut();

		const req = {
			headers: { authorization: 'InvalidFormat' },
			requestId: 'req123',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		const next = jest.fn();

		await sut(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: 'Access token required',
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('rejects invalid token', async () => {
		const { sut, authService } = makeSut();
		authService.verifyAccessToken.mockImplementation(() => {
			throw new Error('Invalid token');
		});

		const req = {
			headers: { authorization: 'Bearer invalid.jwt.token' },
			requestId: 'req123',
		} as any;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as any;

		const next = jest.fn();

		await sut(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: 'Authentication failed',
		});
		expect(next).not.toHaveBeenCalled();
	});
});
